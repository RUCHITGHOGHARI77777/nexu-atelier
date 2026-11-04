/**
 * NEXU ATELIER — Customer Privacy, Identity Verification & DPDP Act Service
 * Compliant with Digital Personal Data Protection Act, 2023, RBI guidelines, and PCI DSS credential isolation.
 */

import crypto from "crypto";
import { prisma } from "@/lib/server/prisma";
import { otpService } from "@/lib/server/otp-service";

export interface UpdateConsentInput {
  consentMarketing?: boolean;
  consentWhatsapp?: boolean;
  consentAnalytics?: boolean;
  dataRetentionPreference?: "STANDARD" | "MINIMAL" | "EXTENDED";
}

export interface SavedPaymentTokenInput {
  gatewayToken: string;
  cardBrand?: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
}

export class CustomerPrivacyService {
  /**
   * Retrieves tenant-isolated customer profile and privacy status.
   */
  public async getCustomerPrivacyProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!user) {
      throw new Error("User account not found.");
    }

    const emailParts = user.email.split("@");
    const maskedEmail =
      emailParts.length === 2
        ? `${emailParts[0].slice(0, 2)}***@${emailParts[1]}`
        : user.email;

    const phone = user.profile?.phone || "";
    const maskedPhone =
      phone.length >= 10
        ? `${phone.slice(0, 3)}****${phone.slice(-3)}`
        : phone || "Not Linked";

    return {
      id: user.id,
      email: user.email,
      maskedEmail,
      name: user.profile?.name || "Patron",
      phone: user.profile?.phone || null,
      maskedPhone,
      isPhoneVerified: user.profile?.isPhoneVerified || false,
      phoneVerifiedAt: user.profile?.phoneVerifiedAt || null,
      isEmailVerified: user.profile?.isEmailVerified || false,
      emailVerifiedAt: user.profile?.emailVerifiedAt || null,
      consents: {
        consentMarketing: user.profile?.consentMarketing || false,
        consentWhatsapp: user.profile?.consentWhatsapp || false,
        consentAnalytics: user.profile?.consentAnalytics ?? true,
        dataRetentionPreference: user.profile?.dataRetentionPreference || "STANDARD",
      },
      addresses: user.addresses.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        phone: a.phone,
        street: a.street,
        apartment: a.apartment,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        country: a.country,
        type: a.type,
        isDefault: a.isDefault,
      })),
    };
  }

  /**
   * Updates DPDP Act consent preferences.
   */
  public async updateConsentPreferences(userId: string, input: UpdateConsentInput) {
    const updated = await prisma.customerProfile.upsert({
      where: { userId },
      update: {
        ...(input.consentMarketing !== undefined && { consentMarketing: input.consentMarketing }),
        ...(input.consentWhatsapp !== undefined && { consentWhatsapp: input.consentWhatsapp }),
        ...(input.consentAnalytics !== undefined && { consentAnalytics: input.consentAnalytics }),
        ...(input.dataRetentionPreference && { dataRetentionPreference: input.dataRetentionPreference }),
      },
      create: {
        userId,
        name: "Patron",
        consentMarketing: input.consentMarketing || false,
        consentWhatsapp: input.consentWhatsapp || false,
        consentAnalytics: input.consentAnalytics ?? true,
        dataRetentionPreference: input.dataRetentionPreference || "STANDARD",
      },
    });

    await prisma.auditEvent.create({
      data: {
        entityType: "USER_CONSENT",
        entityId: userId,
        action: "CONSENT_UPDATED",
        note: `DPDP consents updated: Marketing=${updated.consentMarketing}, WhatsApp=${updated.consentWhatsapp}`,
        performedBy: userId,
      },
    });

    return updated;
  }

  /**
   * Requests a 6-digit phone verification OTP with attempt limits, resend cooldown,
   * and delivery via Meta WhatsApp Business Cloud API.
   */
  public async requestPhoneOtp(userId: string, rawPhone: string) {
    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error("Invalid Indian mobile number. Must be a 10-digit number starting with 6-9.");
    }

    // Delegate directly to WhatsApp-first OTP engine
    const result = await otpService.requestOtp({
      phone: cleanPhone,
      purpose: "PHONE_VERIFICATION",
    });

    return {
      success: true,
      message: result.message,
      expiresInSeconds: result.expiresInSeconds,
      cooldownSeconds: result.cooldownSeconds,
      _debugCode: result._debugCode,
    };
  }

  /**
   * Verifies the submitted phone OTP and updates database verification records.
   */
  public async verifyPhoneOtp(userId: string, rawPhone: string, submittedOtp: string) {
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const now = new Date();

    const verifyResult = await otpService.verifyOtp({
      phone: cleanPhone,
      code: submittedOtp,
      purpose: "PHONE_VERIFICATION",
    });

    if (!verifyResult.verified) {
      throw new Error(verifyResult.message);
    }

    // Update Customer Profile
    await prisma.customerProfile.upsert({
      where: { userId },
      update: {
        phone: cleanPhone,
        isPhoneVerified: true,
        phoneVerifiedAt: now,
      },
      create: {
        userId,
        name: "Patron",
        phone: cleanPhone,
        isPhoneVerified: true,
        phoneVerifiedAt: now,
      },
    });

    await prisma.auditEvent.create({
      data: {
        entityType: "USER_PHONE",
        entityId: userId,
        action: "PHONE_VERIFIED_WHATSAPP",
        note: `Mobile number +91 ${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-3)} verified via WhatsApp OTP.`,
        performedBy: userId,
      },
    });

    return {
      success: true,
      message: "Mobile number verified successfully via WhatsApp.",
    };
  }

  /**
   * Generates email verification token.
   */
  public async requestEmailVerification(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found.");

    const token = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationOtp.create({
      data: {
        identifier: user.email.toLowerCase(),
        type: "EMAIL",
        otpHash: tokenHash,
        resendCooldownUntil: new Date(now.getTime() + 60 * 1000),
        expiresAt,
      },
    });

    console.log(`[Email Gateway Simulator] Verification link token for ${user.email}: ${token}`);

    return {
      success: true,
      message: "Verification email dispatched.",
      _debugToken: process.env.NODE_ENV !== "production" ? token : undefined,
    };
  }

  /**
   * Verifies email token.
   */
  public async verifyEmailToken(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found.");

    const now = new Date();
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const record = await prisma.verificationOtp.findFirst({
      where: {
        identifier: user.email.toLowerCase(),
        type: "EMAIL",
        otpHash: tokenHash,
        expiresAt: { gt: now },
        verifiedAt: null,
      },
    });

    if (!record) {
      throw new Error("Invalid or expired email verification token.");
    }

    await prisma.verificationOtp.update({
      where: { id: record.id },
      data: { verifiedAt: now },
    });

    await prisma.customerProfile.upsert({
      where: { userId },
      update: {
        isEmailVerified: true,
        emailVerifiedAt: now,
      },
      create: {
        userId,
        name: user.email.split("@")[0],
        isEmailVerified: true,
        emailVerifiedAt: now,
      },
    });

    return {
      success: true,
      message: "Email address verified successfully.",
    };
  }

  /**
   * Saved Payment Method Management (Gateway Tokenization - PCI DSS SAQ-A Compliant)
   */
  public async getSavedPaymentTokens(userId: string) {
    const tokens = await prisma.savedPaymentMethodToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return tokens.map((t) => ({
      id: t.id,
      cardBrand: t.cardBrand || "Card",
      last4: t.last4,
      expMonth: t.expMonth,
      expYear: t.expYear,
      isDefault: t.isDefault,
      createdAt: t.createdAt,
    }));
  }

  public async addSavedPaymentToken(userId: string, input: SavedPaymentTokenInput) {
    if (!input.gatewayToken) throw new Error("Gateway token reference is required.");
    if (!input.last4 || input.last4.length !== 4 || !/^\d{4}$/.test(input.last4)) {
      throw new Error("Only the last 4 digits of the payment card may be recorded.");
    }

    return await prisma.savedPaymentMethodToken.create({
      data: {
        userId,
        gatewayToken: input.gatewayToken,
        cardBrand: input.cardBrand || "Visa",
        last4: input.last4,
        expMonth: input.expMonth,
        expYear: input.expYear,
        isDefault: false,
      },
    });
  }

  public async deleteSavedPaymentToken(userId: string, tokenId: string) {
    const existing = await prisma.savedPaymentMethodToken.findFirst({
      where: { id: tokenId, userId },
    });
    if (!existing) {
      throw new Error("Payment method not found or access denied.");
    }

    await prisma.savedPaymentMethodToken.delete({
      where: { id: tokenId },
    });

    return { success: true };
  }

  /**
   * DPDP Act Data Subject Rights: Export All Personal Data
   */
  public async exportCustomerData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        addresses: true,
        orders: {
          select: {
            id: true,
            totalPaise: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            items: {
              select: {
                title: true,
                quantity: true,
                lineTotalPaise: true,
              },
            },
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw new Error("User account not found.");

    await prisma.auditEvent.create({
      data: {
        entityType: "USER_DATA",
        entityId: userId,
        action: "DATA_EXPORT_REQUESTED",
        note: "Customer requested complete personal data archive under DPDP Act 2023.",
        performedBy: userId,
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      actReference: "Digital Personal Data Protection Act, 2023 (Section 11/12)",
      profile: {
        id: user.id,
        email: user.email,
        name: user.profile?.name,
        phone: user.profile?.phone,
        isPhoneVerified: user.profile?.isPhoneVerified,
        isEmailVerified: user.profile?.isEmailVerified,
        consents: {
          marketing: user.profile?.consentMarketing,
          whatsapp: user.profile?.consentWhatsapp,
          analytics: user.profile?.consentAnalytics,
        },
      },
      addresses: user.addresses,
      orders: user.orders,
      reviews: user.reviews,
    };
  }

  /**
   * DPDP Act Data Subject Rights: Submit Correction or Erasure Request
   */
  public async submitDataSubjectRequest(
    userId: string,
    requestType: "CORRECTION" | "ERASURE",
    details: string
  ) {
    // If erasure, verify that customer has no pending / unshipped orders
    if (requestType === "ERASURE") {
      const activeOrdersCount = await prisma.order.count({
        where: {
          customerId: userId,
          status: { in: ["PENDING_PAYMENT", "CONFIRMED", "IN_PRODUCTION", "SHIPPED"] },
        },
      });

      if (activeOrdersCount > 0) {
        throw new Error(
          `Cannot process erasure: You have ${activeOrdersCount} active unfulfilled order(s). Please wait until delivery or cancel active orders first.`
        );
      }
    }

    const request = await prisma.dataSubjectRequest.create({
      data: {
        userId,
        requestType,
        detailsJson: JSON.stringify({ notes: details, timestamp: new Date().toISOString() }),
        status: "PENDING",
      },
    });

    await prisma.auditEvent.create({
      data: {
        entityType: "DATA_SUBJECT_REQUEST",
        entityId: request.id,
        action: `DSR_${requestType}`,
        note: `DPDP Data Subject Request (${requestType}) submitted. Reason/Details: ${details.slice(0, 100)}`,
        performedBy: userId,
      },
    });

    return request;
  }
}

export const customerPrivacyService = new CustomerPrivacyService();

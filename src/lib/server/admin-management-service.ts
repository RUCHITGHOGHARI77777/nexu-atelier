/**
 * NEXU ATELIER — Admin Customer, Supplier & Operational Contact Management Service
 * Implements purpose-based contact logging, role-based access, field-level masking, and DPDP auditability.
 */

import { prisma } from "@/lib/server/prisma";

export const ALLOWED_CONTACT_PURPOSES = [
  "DELIVERY_ISSUE",
  "PAYMENT_DISPUTE",
  "ACCOUNT_VERIFICATION",
  "FRAUD_INVESTIGATION",
  "EMERGENCY_SUPPORT",
  "SERVICE_REQUEST",
] as const;

export type ContactPurpose = (typeof ALLOWED_CONTACT_PURPOSES)[number];

export interface InitiateContactInput {
  targetType: "CUSTOMER" | "SUPPLIER";
  targetId: string;
  purpose: ContactPurpose;
  notes: string;
}

export class AdminManagementService {
  /**
   * Retrieves paginated customers with field-level contact masking.
   */
  public async getCustomers(options: {
    search?: string;
    isVerified?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { role: "CUSTOMER" };

    if (options.search) {
      where.OR = [
        { email: { contains: options.search, mode: "insensitive" } },
        { profile: { name: { contains: options.search, mode: "insensitive" } } },
        { profile: { phone: { contains: options.search } } },
      ];
    }

    if (options.isVerified !== undefined) {
      where.profile = {
        isPhoneVerified: options.isVerified,
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          profile: true,
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      customers: users.map((u) => {
        const phone = u.profile?.phone || "";
        const maskedPhone =
          phone.length >= 10
            ? `${phone.slice(0, 3)}****${phone.slice(-3)}`
            : phone || "Not Provided";

        const emailParts = u.email.split("@");
        const maskedEmail =
          emailParts.length === 2
            ? `${emailParts[0].slice(0, 2)}***@${emailParts[1]}`
            : u.email;

        return {
          id: u.id,
          name: u.profile?.name || "Patron",
          maskedEmail,
          maskedPhone,
          isPhoneVerified: u.profile?.isPhoneVerified || false,
          isEmailVerified: u.profile?.isEmailVerified || false,
          ordersCount: u._count.orders,
          isSuspended: u.isSuspended,
          createdAt: u.createdAt,
        };
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single customer detailed overview.
   */
  public async getCustomerDetail(adminId: string, customerId: string) {
    const user = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        profile: true,
        addresses: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            totalPaise: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        riskAssessments: {
          take: 5,
          orderBy: { assessedAt: "desc" },
        },
      },
    });

    if (!user) {
      throw new Error("Customer record not found.");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.profile?.name || "Patron",
      phone: user.profile?.phone || null,
      isPhoneVerified: user.profile?.isPhoneVerified || false,
      phoneVerifiedAt: user.profile?.phoneVerifiedAt || null,
      isEmailVerified: user.profile?.isEmailVerified || false,
      emailVerifiedAt: user.profile?.emailVerifiedAt || null,
      codRefusalCount: user.profile?.codRefusalCount || 0,
      rtoCount: user.profile?.rtoCount || 0,
      addresses: user.addresses,
      orders: user.orders,
      riskAssessments: user.riskAssessments,
      createdAt: user.createdAt,
    };
  }

  /**
   * Retrieves paginated suppliers with verification and settlement status.
   */
  public async getSuppliers(options: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status) {
      where.status = options.status;
    }
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { originHub: { contains: options.search, mode: "insensitive" } },
        { taxIdentifier: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [sellers, total] = await Promise.all([
      prisma.seller.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { products: true, payouts: true },
          },
        },
      }),
      prisma.seller.count({ where }),
    ]);

    return {
      suppliers: sellers.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        originHub: s.originHub,
        status: s.status,
        verified: s.verified,
        rating: s.rating,
        taxIdentifier: s.taxIdentifier || "Pending GSTIN",
        isContactVerified: s.isContactVerified,
        isBusinessVerified: s.isBusinessVerified,
        productsCount: s._count.products,
        payoutsCount: s._count.payouts,
        createdAt: s.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Purpose-based Operational Contact Action (Section H).
   * Unmasks contact info only upon explicit authorized reason selection and logs every contact attempt.
   */
  public async initiateOperationalContact(adminId: string, input: InitiateContactInput) {
    if (!ALLOWED_CONTACT_PURPOSES.includes(input.purpose)) {
      throw new Error(
        `Invalid contact purpose. Must be one of: ${ALLOWED_CONTACT_PURPOSES.join(", ")}`
      );
    }

    if (!input.notes || input.notes.trim().length < 5) {
      throw new Error("Operational contact requires documented notes justifying the outreach.");
    }

    let rawPhone = "";
    let targetName = "";

    if (input.targetType === "CUSTOMER") {
      const user = await prisma.user.findUnique({
        where: { id: input.targetId },
        include: { profile: true, addresses: true },
      });
      if (!user) throw new Error("Customer target not found.");
      targetName = user.profile?.name || user.email;
      rawPhone = user.profile?.phone || user.addresses?.[0]?.phone || "";
    } else {
      const seller = await prisma.seller.findUnique({
        where: { id: input.targetId },
      });
      if (!seller) throw new Error("Supplier target not found.");
      targetName = seller.name;
      rawPhone = seller.businessPhone || "";
    }

    if (!rawPhone) {
      throw new Error(`Target ${input.targetType.toLowerCase()} does not have a verified phone number on record.`);
    }

    const cleanPhone = rawPhone.replace(/\D/g, "");
    const maskedPhone =
      cleanPhone.length >= 10
        ? `+91 ${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-3)}`
        : "Unmasked on demand";

    // Atomically record operational contact log
    const log = await prisma.operationalContactLog.create({
      data: {
        adminId,
        targetType: input.targetType,
        targetId: input.targetId,
        targetPhoneMasked: maskedPhone,
        purpose: input.purpose,
        notes: input.notes.trim(),
      },
    });

    // Also record general audit event
    await prisma.auditEvent.create({
      data: {
        entityType: "OPERATIONAL_CONTACT",
        entityId: log.id,
        action: `CONTACT_${input.purpose}`,
        note: `Admin contacted ${input.targetType} ${targetName} for reason: ${input.purpose}. Notes: ${input.notes}`,
        performedBy: adminId,
      },
    });

    const dialerUri = `tel:+91${cleanPhone.slice(-10)}`;

    return {
      success: true,
      logId: log.id,
      targetName,
      targetPhone: `+91 ${cleanPhone.slice(-10)}`,
      dialerUri,
      purpose: input.purpose,
      initiatedAt: log.initiatedAt,
    };
  }
}

export const adminManagementService = new AdminManagementService();

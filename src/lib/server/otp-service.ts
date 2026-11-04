import crypto from "crypto";
import { prisma } from "./prisma";
import { whatsappService } from "./whatsapp-service";

export type OtpPurpose =
  | "LOGIN"
  | "REGISTRATION"
  | "PHONE_VERIFICATION"
  | "PASSWORD_RESET"
  | "COD_CONFIRMATION";

export interface RequestOtpParams {
  phone: string;
  purpose: OtpPurpose;
  clientIp?: string;
}

export interface VerifyOtpParams {
  phone: string;
  code: string;
  purpose: OtpPurpose;
  consumeOnSuccess?: boolean; // Default true (deletes or marks verified so code cannot be replayed)
}

export interface OtpRequestResult {
  success: boolean;
  message: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
  maskedPhone: string;
  _debugCode?: string; // Only returned in non-production for test automation
}

export interface OtpVerifyResult {
  success: boolean;
  message: string;
  verified: boolean;
  remainingAttempts?: number;
}

export class OtpService {
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly RESEND_COOLDOWN_SECONDS = 60;
  private readonly MAX_ATTEMPTS = 3;
  private readonly MAX_REQUESTS_PER_HOUR = 5;

  /**
   * Hashes the raw 6-digit OTP code using SHA-256 with an optional pepper.
   */
  private hashOtp(code: string): string {
    return crypto.createHash("sha256").update(code.trim()).digest("hex");
  }

  /**
   * Cleans and normalizes phone number for DB indexing and WhatsApp delivery.
   */
  public normalizePhone(rawPhone: string): string {
    return whatsappService.normalizePhone(rawPhone);
  }

  /**
   * Requests a new 6-digit OTP delivered via WhatsApp.
   * Enforces:
   * 1. Resend cooldown (60 seconds)
   * 2. Abuse rate limit (max 5 requests per hour per phone)
   * 3. Cryptographic randomness
   * 4. SHA-256 storage hash
   */
  public async requestOtp(params: RequestOtpParams): Promise<OtpRequestResult> {
    const normalizedPhone = this.normalizePhone(params.phone);

    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      throw new Error("Invalid phone number. Must be a valid mobile number (10 to 15 digits).");
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 1. Hourly Abuse Prevention Check
    const hourlyRequests = await prisma.verificationOtp.count({
      where: {
        identifier: normalizedPhone,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourlyRequests >= this.MAX_REQUESTS_PER_HOUR) {
      throw new Error(
        `Too many verification requests for this number. Maximum ${this.MAX_REQUESTS_PER_HOUR} requests per hour allowed. Please try again later.`
      );
    }

    // 2. Active Cooldown Check
    const latestActive = await prisma.verificationOtp.findFirst({
      where: {
        identifier: normalizedPhone,
        type: params.purpose,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (latestActive && latestActive.resendCooldownUntil > now) {
      const waitSeconds = Math.ceil((latestActive.resendCooldownUntil.getTime() - now.getTime()) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new WhatsApp verification code.`);
    }

    // 3. Cryptographically secure 6-digit generation
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = this.hashOtp(otpCode);

    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
    const resendCooldownUntil = new Date(now.getTime() + this.RESEND_COOLDOWN_SECONDS * 1000);

    // 4. Save to Database
    await prisma.verificationOtp.create({
      data: {
        identifier: normalizedPhone,
        type: params.purpose,
        otpHash,
        attemptsCount: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        resendCooldownUntil,
        expiresAt,
      },
    });

    // 5. Dispatch via WhatsApp Cloud API
    const sendResult = await whatsappService.sendOtp({
      recipientPhone: normalizedPhone,
      otpCode,
      purpose: params.purpose,
      expiryMinutes: this.OTP_EXPIRY_MINUTES,
    });

    if (!sendResult.success) {
      throw new Error(sendResult.error || "Failed to dispatch verification code via WhatsApp.");
    }

    const masked = whatsappService.maskPhone(normalizedPhone);

    return {
      success: true,
      message: `Verification code sent to WhatsApp on ${masked}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`,
      cooldownSeconds: this.RESEND_COOLDOWN_SECONDS,
      expiresInSeconds: this.OTP_EXPIRY_MINUTES * 60,
      maskedPhone: masked,
      _debugCode: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    };
  }

  /**
   * Verifies the user-submitted OTP code.
   * Checks expiration, attempt exhaustion, and matching hash.
   */
  public async verifyOtp(params: VerifyOtpParams): Promise<OtpVerifyResult> {
    const normalizedPhone = this.normalizePhone(params.phone);
    const now = new Date();

    const otpRecord = await prisma.verificationOtp.findFirst({
      where: {
        identifier: normalizedPhone,
        type: params.purpose,
        expiresAt: { gt: now },
        verifiedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return {
        success: false,
        verified: false,
        message: "No active verification code found or the code has expired. Please request a new WhatsApp code.",
      };
    }

    // Check maximum failed attempts
    if (otpRecord.attemptsCount >= otpRecord.maxAttempts) {
      return {
        success: false,
        verified: false,
        message: "Maximum verification attempts exceeded. Code has been locked for security. Please request a new code.",
      };
    }

    const submittedHash = this.hashOtp(params.code);

    // Constant-time comparison to prevent timing attacks
    const isMatch =
      submittedHash.length === otpRecord.otpHash.length &&
      crypto.timingSafeEqual(Buffer.from(submittedHash), Buffer.from(otpRecord.otpHash));

    if (!isMatch) {
      const newAttempts = otpRecord.attemptsCount + 1;
      await prisma.verificationOtp.update({
        where: { id: otpRecord.id },
        data: { attemptsCount: newAttempts },
      });

      const remaining = Math.max(0, otpRecord.maxAttempts - newAttempts);
      return {
        success: false,
        verified: false,
        remainingAttempts: remaining,
        message:
          remaining > 0
            ? `Incorrect verification code. ${remaining} attempts remaining.`
            : "Maximum verification attempts exceeded. Code locked. Please request a new code.",
      };
    }

    // Successfully verified!
    const consume = params.consumeOnSuccess !== false;
    if (consume) {
      await prisma.verificationOtp.update({
        where: { id: otpRecord.id },
        data: { verifiedAt: now },
      });
    }

    return {
      success: true,
      verified: true,
      message: "Phone number successfully verified via WhatsApp.",
    };
  }
}

export const otpService = new OtpService();


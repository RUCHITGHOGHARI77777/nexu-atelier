import { NextRequest, NextResponse } from "next/server";
import { otpService, OtpPurpose } from "@/lib/server/otp-service";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const body = await req.json();
    const { phone, purpose = "PHONE_VERIFICATION", _hp_company_website } = body;

    if (_hp_company_website) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: "BOT_TRAP",
          action: "HONEYPOT_BOT_TRIGGERED",
          performedBy: clientIp,
          note: "Automated bot submitted WhatsApp OTP request with filled honeypot field.",
        },
      });
      return NextResponse.json({
        success: true,
        message: "Verification code sent to WhatsApp.",
        cooldownSeconds: 60,
        expiresInSeconds: 300,
      });
    }

    const rateCheck = await checkRateLimit(clientIp, "AUTH_OTP_REQUEST", {
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid mobile phone number is required." },
        { status: 400 }
      );
    }

    const validPurposes: OtpPurpose[] = [
      "LOGIN",
      "REGISTRATION",
      "PHONE_VERIFICATION",
      "PASSWORD_RESET",
      "COD_CONFIRMATION",
    ];

    const cleanPurpose: OtpPurpose = validPurposes.includes(purpose)
      ? purpose
      : "PHONE_VERIFICATION";

    const result = await otpService.requestOtp({
      phone,
      purpose: cleanPurpose,
      clientIp,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      expiresInSeconds: result.expiresInSeconds,
      maskedPhone: result.maskedPhone,
      _debugCode: result._debugCode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dispatch WhatsApp OTP." },
      { status: 400 }
    );
  }
}

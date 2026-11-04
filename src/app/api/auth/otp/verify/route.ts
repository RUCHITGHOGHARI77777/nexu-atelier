import { NextRequest, NextResponse } from "next/server";
import { otpService, OtpPurpose } from "@/lib/server/otp-service";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const body = await req.json();
    const { phone, code, purpose = "PHONE_VERIFICATION" } = body;

    // IP Rate Limit Protection against OTP guessing
    const rateCheck = await checkRateLimit(clientIp, "AUTH_OTP_VERIFY", {
      limit: 10,
      windowSeconds: 60,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: "A valid 6-digit WhatsApp verification code is required." },
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

    const result = await otpService.verifyOtp({
      phone,
      code,
      purpose: cleanPurpose,
    });

    if (!result.verified) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: result.message,
          remainingAttempts: result.remainingAttempts,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify WhatsApp code." },
      { status: 400 }
    );
  }
}

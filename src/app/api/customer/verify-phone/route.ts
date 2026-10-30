import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { customerPrivacyService } from "@/lib/server/customer-privacy-service";

export const dynamic = "force-dynamic";

/**
 * Real Phone OTP Verification Endpoint
 * Uses SHA-256 cryptographic hashing, 5-minute expiry, 60-second cooldown, and 3-attempt limit.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, phone, otp } = body;

    if (action === "send") {
      if (!phone || typeof phone !== "string") {
        return NextResponse.json(
          { success: false, error: "Valid 10-digit mobile number is required." },
          { status: 400 }
        );
      }

      const result = await customerPrivacyService.requestPhoneOtp(user.id, phone);
      return NextResponse.json({
        success: true,
        expiresInSeconds: result.expiresInSeconds,
        cooldownSeconds: result.cooldownSeconds,
        message: result.message,
      });
    }

    if (action === "verify") {
      if (!phone || !otp) {
        return NextResponse.json(
          { success: false, error: "Both phone number and OTP code are required." },
          { status: 400 }
        );
      }

      const verifyResult = await customerPrivacyService.verifyPhoneOtp(user.id, phone, otp);
      return NextResponse.json({
        success: true,
        message: verifyResult.message,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Supported actions: 'send', 'verify'." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process phone verification." },
      { status: 400 }
    );
  }
}

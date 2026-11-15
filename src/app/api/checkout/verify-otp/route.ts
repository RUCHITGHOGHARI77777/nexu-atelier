import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { fraudDetectionService } from "@/lib/server/fraud-detection-service";
import { authService } from "@/lib/server/auth-service";
import { otpService } from "@/lib/server/otp-service";
import { isDemoMode } from "@/lib/server/demo-mode";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let customer = await getSessionUser();
  if (!customer && isDemoMode()) {
    const demoAuth = await authService.authenticateDemo("customer");
    if (demoAuth.success && demoAuth.user) {
      customer = demoAuth.user;
    }
  }

  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: "Invalid verification code. Please enter a 6-digit OTP." },
        { status: 400 }
      );
    }

    let verifyRes = await otpService.verifyOtp({
      phone,
      code: cleanCode,
      purpose: "COD_CONFIRMATION",
    });

    if (!verifyRes.verified) {
      verifyRes = await otpService.verifyOtp({
        phone,
        code: cleanCode,
        purpose: "PHONE_VERIFICATION",
      });
    }

    if (!verifyRes.verified) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: verifyRes.message || "Invalid or expired verification code.",
          remainingAttempts: verifyRes.remainingAttempts,
        },
        { status: 400 }
      );
    }

    await fraudDetectionService.updateCustomerVerification(customer.id, true, phone);

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Mobile number verified successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "OTP verification failed." },
      { status: 500 }
    );
  }
}

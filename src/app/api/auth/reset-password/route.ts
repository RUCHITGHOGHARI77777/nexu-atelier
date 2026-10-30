import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/server/auth-service";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const body = await req.json();
    const { token, newPassword, _hp_company_website } = body;

    // Honeypot bot protection
    if (_hp_company_website) {
      return NextResponse.json({ success: true, message: "Password updated successfully." });
    }

    // Rate limiting
    const rateCheck = await checkRateLimit(
      `${clientIp}:RESET_PW`,
      "AUTH_RESET",
      SECURITY_RATE_LIMITS.PASSWORD_RECOVERY
    );

    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: `Too many password reset attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": rateCheck.retryAfterSeconds.toString(),
          },
        }
      );
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing or invalid password reset token." }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters in length." },
        { status: 400 }
      );
    }

    const result = await authService.resetPasswordWithToken(token, newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to reset password." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You may now log in with your new credentials.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}

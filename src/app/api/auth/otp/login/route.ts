import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, authService } from "@/lib/server/auth-service";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const body = await req.json();
    const { phone, code } = body;

    // Rate Limit Protection
    const rateCheck = await checkRateLimit(clientIp, "AUTH_OTP_LOGIN", {
      limit: 8,
      windowSeconds: 60,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
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

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: "A valid 6-digit WhatsApp verification code is required." },
        { status: 400 }
      );
    }

    const authResult = await authService.authenticateWhatsAppOtp(phone, code);

    if (!authResult.success || !authResult.user || !authResult.token) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Authentication failed." },
        { status: 401 }
      );
    }

    // Set secure HTTP-only session cookie
    cookies().set(AUTH_COOKIE_NAME, authResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: authResult.user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to authenticate via WhatsApp OTP." },
      { status: 500 }
    );
  }
}

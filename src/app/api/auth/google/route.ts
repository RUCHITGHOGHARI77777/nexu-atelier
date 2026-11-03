import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, authService } from "@/lib/server/auth-service";
import { checkRateLimit, resetRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const { email, name, photoURL, uid, idToken } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required for Google Sign-In." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Brute force & flood rate limit protection
    const rateCheck = await checkRateLimit(
      `${clientIp}:${cleanEmail}`,
      "AUTH_GOOGLE",
      SECURITY_RATE_LIMITS.LOGIN
    );

    if (!rateCheck.allowed) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: cleanEmail || clientIp,
          action: "RATE_LIMIT_EXCEEDED",
          performedBy: clientIp,
          note: `Google auth rate limit exceeded for ${cleanEmail} from IP ${clientIp}.`,
        },
      });

      return new NextResponse(
        JSON.stringify({
          error: `Too many sign-in attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
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

    const result = await authService.authenticateGoogle({
      email: cleanEmail,
      name: typeof name === "string" ? name : undefined,
      photoURL: typeof photoURL === "string" ? photoURL : undefined,
      uid: typeof uid === "string" ? uid : undefined,
      idToken: typeof idToken === "string" ? idToken : undefined,
    });

    if (!result.success || !result.user || !result.token) {
      return NextResponse.json(
        { error: result.error || "Google authentication failed." },
        { status: 401 }
      );
    }

    // Reset rate limiter bucket on success
    resetRateLimit(`${clientIp}:${cleanEmail}`, "AUTH_GOOGLE");

    // Establish official server-side HTTP-only session cookie
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: result.user,
      message: `Signed in as ${result.user.name} (${result.user.email}).`,
    });
  } catch (error) {
    console.error("Google auth route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during Google authentication." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, authService } from "@/lib/server/auth-service";
import { checkRateLimit, resetRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { sanitizeText } from "@/lib/server/sanitizer";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const { email, password, _hp_company_website } = body;

    if (_hp_company_website) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: "BOT_TRAP",
          action: "HONEYPOT_BOT_TRIGGERED",
          performedBy: clientIp,
          note: "Automated bot submitted login request with filled honeypot field.",
        },
      });
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const cleanEmail = sanitizeText(typeof email === "string" ? email : "", 120).toLowerCase();

    const rateCheck = await checkRateLimit(
      `${clientIp}:${cleanEmail}`,
      "AUTH_LOGIN",
      SECURITY_RATE_LIMITS.LOGIN
    );

    if (!rateCheck.allowed) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: cleanEmail || clientIp,
          action: "RATE_LIMIT_EXCEEDED",
          performedBy: clientIp,
          note: `Login rate limit exceeded for ${cleanEmail} from IP ${clientIp}. Retry after ${rateCheck.retryAfterSeconds}s.`,
        },
      });

      return new NextResponse(
        JSON.stringify({
          error: `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before retrying.`,
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

    if (!cleanEmail || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await authService.login(cleanEmail, password);

    if (!result.success || !result.user || !result.token) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: cleanEmail,
          action: "LOGIN_FAILED",
          performedBy: clientIp,
          note: `Failed login attempt for user ${cleanEmail} from IP ${clientIp}.`,
        },
      });

      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    resetRateLimit(`${clientIp}:${cleanEmail}`, "AUTH_LOGIN");

    await prisma.auditEvent.create({
      data: {
        entityType: "USER",
        entityId: result.user.id,
        action: "LOGIN_SUCCEEDED",
        performedBy: cleanEmail,
        note: `Patron logged in successfully from IP ${clientIp}.`,
      },
    });

    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}

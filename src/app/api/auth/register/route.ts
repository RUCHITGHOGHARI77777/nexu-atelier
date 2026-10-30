import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, authService } from "@/lib/server/auth-service";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { sanitizeText } from "@/lib/server/sanitizer";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const { name, email, password, phone, _hp_company_website } = body;

    // 1. Honeypot automated bot trap
    if (_hp_company_website) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: "BOT_TRAP",
          action: "HONEYPOT_BOT_TRIGGERED",
          performedBy: clientIp,
          note: "Automated bot submitted registration request with filled honeypot field.",
        },
      });
      return NextResponse.json({ error: "Failed to create account." }, { status: 400 });
    }

    // 2. Rate Limiting Protection (Anti-Mass-Account-Creation)
    const rateCheck = await checkRateLimit(clientIp, "AUTH_REGISTER", SECURITY_RATE_LIMITS.REGISTER);
    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: `Registration rate limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
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

    const cleanName = sanitizeText(typeof name === "string" ? name : "", 100);
    const cleanEmail = sanitizeText(typeof email === "string" ? email : "", 120).toLowerCase();
    const cleanPhone = sanitizeText(typeof phone === "string" ? phone : "", 30);

    // 3. Password Complexity Verification
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const result = await authService.register(cleanName, cleanEmail, password, cleanPhone);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || "Failed to create account." },
        { status: 400 }
      );
    }

    // 4. Audit Log
    await prisma.auditEvent.create({
      data: {
        entityType: "USER",
        entityId: result.user.id,
        action: "REGISTRATION_SUCCEEDED",
        performedBy: cleanEmail,
        note: `New patron account registered from IP ${clientIp}.`,
      },
    });

    // 5. Secure Session Login
    const loginResult = await authService.login(cleanEmail, password);
    if (loginResult.token) {
      cookies().set(AUTH_COOKIE_NAME, loginResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected server error occurred during registration." },
      { status: 500 }
    );
  }
}

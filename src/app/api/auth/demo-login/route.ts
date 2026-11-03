import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, authService } from "@/lib/server/auth-service";
import { getClientIp } from "@/lib/server/rate-limiter";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !["customer", "seller", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid demo role. Allowed roles are: customer, seller, admin." },
        { status: 400 }
      );
    }

    const result = await authService.authenticateDemo(role as "customer" | "seller" | "admin");

    if (!result.success || !result.user || !result.token) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: `DEMO_${role.toUpperCase()}`,
          action: "DEMO_LOGIN_FAILED",
          performedBy: clientIp,
          note: `Demo login failed for requested role '${role}': ${result.error}`,
        },
      });

      return NextResponse.json(
        { error: result.error || "Failed to authenticate demo account." },
        { status: 401 }
      );
    }

    // Set official server-side HTTP-only session cookie
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
      isDemo: true,
      user: result.user,
      message: `Signed in as Demo ${role.toUpperCase()} (${result.user.email}).`,
    });
  } catch (error) {
    console.error("Demo login route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during demo authentication." },
      { status: 500 }
    );
  }
}


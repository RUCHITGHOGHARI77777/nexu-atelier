import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { authService } from "@/lib/server/auth-service";
import { notificationService } from "@/lib/server/notification-service";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { sanitizeText } from "@/lib/server/sanitizer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const body = await req.json();
    const { email, _hp_company_website } = body;

    // 1. Honeypot check
    if (_hp_company_website) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: "BOT_TRAP",
          action: "HONEYPOT_BOT_TRIGGERED",
          performedBy: clientIp,
          note: "Automated bot triggered account recovery honeypot.",
        },
      });
      return NextResponse.json({
        success: true,
        message: "If an account is associated with this email address, password recovery instructions have been dispatched.",
      });
    }

    const cleanEmail = sanitizeText(typeof email === "string" ? email : "", 120).toLowerCase();

    // 2. Rate Limiting Protection (Anti-Spam / Anti-Bombing)
    const rateCheck = await checkRateLimit(
      `${clientIp}:${cleanEmail}`,
      "AUTH_RECOVERY",
      SECURITY_RATE_LIMITS.PASSWORD_RECOVERY
    );

    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: `Too many password reset requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
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

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { profile: true },
    });

    if (user) {
      const tokenRes = await authService.generatePasswordResetToken(cleanEmail);
      const resetToken = tokenRes.token || `rec_${Date.now()}`;

      // Queue transactional notification
      await notificationService.queueNotification({
        channel: "EMAIL",
        recipient: cleanEmail,
        template: "ACCOUNT_RECOVERY",
        payload: {
          name: user.profile?.name || "Valued Patron",
          resetToken,
          resetUrl: `/reset-password?token=${encodeURIComponent(resetToken)}`,
          supportEmail: "concierge@nexu.studio",
        },
      });

      // Record audit event
      await prisma.auditEvent.create({
        data: {
          action: "ACCOUNT_RECOVERY_REQUESTED",
          entityType: "USER",
          entityId: user.id,
          performedBy: cleanEmail,
          note: `Patron requested password recovery instructions for ${cleanEmail} from IP ${clientIp}.`,
        },
      });
    }

    // Always respond with generic success to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: "If an account is associated with this email address, password recovery instructions have been dispatched.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during account recovery." },
      { status: 500 }
    );
  }
}

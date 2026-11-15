import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { sanitizeText } from "@/lib/server/sanitizer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const body = await req.json();
    const { name, email, subject, message, orderId, _hp_company_website } = body;

    if (_hp_company_website) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: "BOT_TRAP",
          action: "HONEYPOT_BOT_TRIGGERED",
          performedBy: clientIp,
          note: "Automated spam bot triggered contact form honeypot.",
        },
      });
      return NextResponse.json({
        success: true,
        ticketId: `TKT-${Date.now().toString().slice(-6)}`,
        message: "Your message has been delivered to our concierge team.",
      });
    }

    const rateCheck = await checkRateLimit(
      clientIp,
      "CONTACT_FORM",
      SECURITY_RATE_LIMITS.CONTACT_FORM
    );

    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: `Support inquiry rate limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds before submitting again.`,
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
    const cleanSubject = sanitizeText(typeof subject === "string" ? subject : "General Inquiry", 150);
    const cleanMessage = sanitizeText(typeof message === "string" ? message : "", 3000);
    const cleanOrderId = orderId ? sanitizeText(String(orderId), 50) : null;

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!cleanMessage || cleanMessage.length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters long." }, { status: 400 });
    }

    const ticketId = `TKT-${Date.now().toString().slice(-6)}`;

    await prisma.auditEvent.create({
      data: {
        entityType: "SUPPORT_CONTACT",
        entityId: ticketId,
        action: "INQUIRY_RECEIVED",
        note: `Contact inquiry from ${cleanName} (${cleanEmail}). Subject: ${cleanSubject}. Order: ${cleanOrderId || "N/A"}`,
        performedBy: cleanEmail,
        orderId: cleanOrderId,
      },
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Your message has been delivered to our concierge team. Expect a response within 12 hours.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process contact inquiry." },
      { status: 500 }
    );
  }
}

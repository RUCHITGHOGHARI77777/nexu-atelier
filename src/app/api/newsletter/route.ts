import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limiter";
import { sanitizeText } from "@/lib/server/sanitizer";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(clientIp, "NEWSLETTER_SUBSCRIBE", {
      limit: 5,
      windowSeconds: 900,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many subscription attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const cleanEmail = sanitizeText(rawEmail).toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Record subscription as immutable audit event for marketing consent tracking
    await prisma.auditEvent.create({
      data: {
        entityType: "MARKETING",
        entityId: cleanEmail,
        action: "NEWSLETTER_SUBSCRIBED",
        performedBy: cleanEmail,
        note: `Studio Dispatch newsletter subscription recorded from IP ${clientIp}. Explicit consent granted.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing to The Studio Dispatch.",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process newsletter subscription." },
      { status: 500 }
    );
  }
}

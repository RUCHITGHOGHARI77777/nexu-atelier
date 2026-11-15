import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { prisma } from "@/lib/server/prisma";
import { sanitizeText } from "@/lib/server/sanitizer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to submit erasure request." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawReason = typeof body.reason === "string" ? body.reason : "No reason provided";
    const cleanReason = sanitizeText(rawReason, 500);

    await prisma.auditEvent.create({
      data: {
        entityType: "USER",
        entityId: user.id,
        action: "PATRON_ERASURE_REQUESTED",
        performedBy: user.email,
        note: `Account erasure requested by patron. Reason: ${cleanReason}. Under compliance policy, active order records will be retained for tax/warranty statutory period and PII pseudonymized after 30 days.`,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Account erasure request logged. Under statutory requirements, an email confirmation has been queued and your profile will be scheduled for pseudonymization following the 30-day grace period.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process erasure request." },
      { status: 500 }
    );
  }
}

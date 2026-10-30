import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getClientIp } from "@/lib/server/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * Isolated honeypot decoy route designed to trap and log automated vulnerability scanners.
 * Contains ZERO real customer data or business logic.
 */
export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    await prisma.auditEvent.create({
      data: {
        entityType: "SECURITY",
        entityId: "DECOY_PROBE",
        action: "DECOY_ENDPOINT_PROBED",
        performedBy: clientIp,
        note: `Automated vulnerability scanner probed decoy endpoint from ${clientIp}. User-Agent: ${userAgent.slice(0, 150)}`,
      },
    });
  } catch {
    // Fail silently without exposing database state
  }

  return NextResponse.json({ error: "Endpoint not found." }, { status: 404 });
}

export async function POST(req: NextRequest) {
  return GET(req);
}

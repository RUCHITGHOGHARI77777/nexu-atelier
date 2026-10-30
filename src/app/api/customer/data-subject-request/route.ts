import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { customerPrivacyService } from "@/lib/server/customer-privacy-service";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

/**
 * DPDP Act 2023 / Digital Personal Data Protection Data Subject Rights API
 * Handles rectification and erasure requests with active order checks.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const requests = await prisma.dataSubjectRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load data subject requests." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { requestType = "ERASURE", reason = "" } = body;

    const validTypes = ["ERASURE", "CORRECTION"];
    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { success: false, error: "Invalid requestType. Allowed: 'ERASURE', 'CORRECTION'." },
        { status: 400 }
      );
    }

    const request = await customerPrivacyService.submitDataSubjectRequest(
      user.id,
      requestType as "ERASURE" | "CORRECTION",
      reason || "Customer submitted request under DPDP Act 2023."
    );

    return NextResponse.json({
      success: true,
      request,
      message: `${requestType === "ERASURE" ? "Erasure" : "Correction"} request registered. Statutory review period initiated.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit request." },
      { status: 400 }
    );
  }
}

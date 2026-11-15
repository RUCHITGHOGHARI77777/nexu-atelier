import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { fraudDetectionService } from "@/lib/server/fraud-detection-service";
import { RiskReviewStatus } from "@/types/payment-fraud";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminAuth = await requireAdminApi();
  if (!adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { decision, overrideReason, isFalsePositive } = body;

    if (!decision || !overrideReason) {
      return NextResponse.json(
        { error: "Decision and a mandatory explanatory reason are required." },
        { status: 400 }
      );
    }

    const updated = await fraudDetectionService.reviewRiskAssessment(params.id, {
      adminId: adminAuth.context.user.id,
      decision: decision as RiskReviewStatus,
      overrideReason,
      isFalsePositive: Boolean(isFalsePositive),
    });

    return NextResponse.json({ success: true, assessment: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update risk assessment." },
      { status: 500 }
    );
  }
}

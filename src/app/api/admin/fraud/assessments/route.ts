import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { fraudDetectionService } from "@/lib/server/fraud-detection-service";
import { RiskLevel, RiskReviewStatus } from "@/types/payment-fraud";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (!adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const riskLevel = (searchParams.get("riskLevel") as RiskLevel) || undefined;
  const reviewStatus = (searchParams.get("reviewStatus") as RiskReviewStatus) || undefined;
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const data = await fraudDetectionService.getRiskAssessments({
      riskLevel,
      reviewStatus,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve risk assessments." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { reviewSlaService } from "@/lib/server/review-sla-service";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const result = await reviewSlaService.processPendingReviewSlas();
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process review SLA scan." },
      { status: 500 }
    );
  }
}

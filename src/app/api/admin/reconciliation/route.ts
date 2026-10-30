import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { reconciliationService } from "@/lib/server/reconciliation-service";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const history = await reconciliationService.getReconciliationHistory();
    return NextResponse.json({ success: true, history });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch reconciliation history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const { startDate, endDate, provider } = body;

    const report = await reconciliationService.runReconciliation({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      provider: provider || "RAZORPAY",
      adminUserId: auth.context.user.id,
    });

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to execute reconciliation" }, { status: 500 });
  }
}

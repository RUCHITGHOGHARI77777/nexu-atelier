import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";
import { billingInvoiceService } from "@/lib/server/billing-invoice-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const [finances, statutoryAccounting] = await Promise.all([
      adminService.getFinancialLedger(),
      billingInvoiceService.getPlatformFinancialOverview(),
    ]);

    return NextResponse.json({
      success: true,
      finances,
      statutoryAccounting,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve financial ledger." },
      { status: 500 }
    );
  }
}

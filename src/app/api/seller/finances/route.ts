import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { supplierPrivacyService } from "@/lib/server/supplier-privacy-service";

export const dynamic = "force-dynamic";

/**
 * Supplier Isolated Financial Ledger & Payable Balances API
 * Enforces strict vendor data isolation: Supplier only ever sees their own sales and payouts.
 */
export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized access: Supplier profile required." }, { status: 401 });
  }

  try {
    const summary = await supplierPrivacyService.getSupplierFinances(auth.user.id);
    return NextResponse.json({
      success: true,
      summary: {
        grossSales: summary.grossSalesPaise / 100,
        platformCommission: summary.commissionPaise / 100,
        netPayable: summary.pendingPayableBalancePaise / 100,
        settledPayouts: summary.settledPayoutsPaise / 100,
        currency: summary.currency,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve supplier financial ledger." },
      { status: 500 }
    );
  }
}

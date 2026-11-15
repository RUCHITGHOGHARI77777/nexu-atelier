import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { billingInvoiceService, getFinancialYear } from "@/lib/server/billing-invoice-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const financialYear = searchParams.get("financialYear") || getFinancialYear();
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString(), 10);

  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month. Expected 1-12." }, { status: 400 });
  }

  try {
    const caPackage = await billingInvoiceService.generateMonthlyCaPackage(
      auth.seller.id,
      { financialYear, month }
    );

    return NextResponse.json({
      success: true,
      report: caPackage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate monthly CA report." },
      { status: 500 }
    );
  }
}


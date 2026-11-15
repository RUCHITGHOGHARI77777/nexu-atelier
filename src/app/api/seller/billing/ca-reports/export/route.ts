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
  const registerType = searchParams.get("type") || "sales"; // sales, invoices, creditNotes, taxHsn, commissions, settlements

  try {
    const caPackage = await billingInvoiceService.generateMonthlyCaPackage(
      auth.seller.id,
      { financialYear, month }
    );

    let rows: Record<string, any>[] = [];
    let filename = `NEXU_${auth.seller.slug}_${financialYear}_M${month}_${registerType}.csv`;

    switch (registerType) {
      case "sales":
        rows = caPackage.salesRegister;
        break;
      case "invoices":
        rows = caPackage.invoiceRegister;
        break;
      case "creditNotes":
        rows = caPackage.creditNotesRegister;
        break;
      case "taxHsn":
        rows = caPackage.taxSummaryHsn;
        break;
      case "commissions":
        rows = caPackage.commissionStatements;
        break;
      case "settlements":
        rows = caPackage.settlementsRegister;
        break;
      default:
        rows = caPackage.salesRegister;
    }

    const csvContent = billingInvoiceService.exportToCsv(rows);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to export CA register." },
      { status: 500 }
    );
  }
}


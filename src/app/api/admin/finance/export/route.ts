import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { financialReportingService } from "@/lib/server/financial-reporting-service";

export const dynamic = "force-dynamic";

/**
 * Admin Financial Ledger CSV Export API
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
    const status = searchParams.get("status") || undefined;
    const method = searchParams.get("method") || undefined;

    const csvContent = await financialReportingService.generateCsvReport({
      startDate,
      endDate,
      status,
      method,
    });

    const filename = `nexu_financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to export financial transactions." },
      { status: 500 }
    );
  }
}

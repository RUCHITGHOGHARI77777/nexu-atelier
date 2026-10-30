import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { financialReportingService } from "@/lib/server/financial-reporting-service";

export const dynamic = "force-dynamic";

/**
 * Consolidated Admin Financial Reporting Engine API
 * Distinguishes true GMV vs net marketplace commission vs vendor payable liabilities.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const rawPeriod = (searchParams.get("period") || "monthly").toUpperCase();
    const period = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"].includes(rawPeriod)
      ? (rawPeriod as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM")
      : "MONTHLY";

    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
    const status = searchParams.get("status") || undefined;
    const method = searchParams.get("method") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const report = await financialReportingService.getFinancialReport({
      period,
      startDate,
      endDate,
      status,
      method,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      report: {
        summary: {
          grossVolume: report.summary.grossCollectionsPaise / 100,
          netRevenue: report.summary.marketplaceCommissionPaise / 100,
          supplierPayable: report.summary.supplierPayableBalancePaise / 100,
          totalRefunds: report.summary.totalRefundsPaise / 100,
          successfulCount: report.summary.transactionCounts.successful,
          failedCount: report.summary.transactionCounts.failed,
          refundedCount: report.summary.transactionCounts.refunded,
          reconciliationDifferences: report.summary.reconciliationDifferencePaise / 100,
        },
        methodBreakdown: [
          { method: "UPI", volume: report.summary.byMethod.upiPaise / 100, count: report.transactions.filter((t) => (t.method || "").toUpperCase().includes("UPI")).length },
          { method: "CARD", volume: report.summary.byMethod.cardPaise / 100, count: report.transactions.filter((t) => (t.method || "").toUpperCase().includes("CARD")).length },
          { method: "NET_BANKING", volume: report.summary.byMethod.netBankingPaise / 100, count: report.transactions.filter((t) => (t.method || "").toUpperCase().includes("NET")).length },
          { method: "COD", volume: report.summary.byMethod.codPaise / 100, count: report.transactions.filter((t) => (t.method || "").toUpperCase().includes("COD")).length },
        ],
        transactions: report.transactions.map((t) => ({
          id: t.id,
          orderId: t.orderId,
          customerId: t.customerName,
          amount: t.amountPaise / 100,
          method: t.method,
          maskedDetails: t.maskedDetails,
          transactionRef: t.transactionRef,
          status: t.status,
          reconciliationStatus: t.reconciliationStatus,
          createdAt: t.createdAt,
          order: {
            customer: {
              name: t.customerName,
            },
          },
        })),
        pagination: {
          currentPage: report.pagination.page,
          totalPages: report.pagination.totalPages,
          totalRecords: report.pagination.total,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate financial reports." },
      { status: 500 }
    );
  }
}

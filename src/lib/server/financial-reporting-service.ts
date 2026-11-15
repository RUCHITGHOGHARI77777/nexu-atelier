/**
 * NEXU ATELIER — Database-Authoritative Financial Reporting Engine
 * Computes verifiable aggregations, commissions, refunds, and supplier balances strictly from PostgreSQL.
 */

import { prisma } from "@/lib/server/prisma";
import { PaymentStatus, PayoutStatus } from "@prisma/client";

export interface FinancialReportFilters {
  period?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  startDate?: Date;
  endDate?: Date;
  status?: string; // "ALL", "CAPTURED", "PENDING", "FAILED", "REFUNDED"
  method?: string; // "ALL", "UPI", "CARD", "NET_BANKING", "COD"
  customerId?: string;
  sellerId?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "amountPaise";
  sortOrder?: "asc" | "desc";
}

export interface FinancialSummaryMetrics {
  grossCollectionsPaise: number;
  totalRefundsPaise: number;
  netCollectionsPaise: number;
  marketplaceCommissionPaise: number;
  supplierPayableBalancePaise: number;
  shippingAdjustmentsPaise: number;
  reconciliationDifferencePaise: number;
  transactionCounts: {
    total: number;
    successful: number;
    pending: number;
    failed: number;
    refunded: number;
  };
  byMethod: {
    upiPaise: number;
    cardPaise: number;
    netBankingPaise: number;
    codPaise: number;
    otherPaise: number;
  };
  generatedAt: string;
}

export class FinancialReportingService {
  /**
   * Resolves date bounds based on period type.
   */
  public resolveDateRange(
    period: string = "MONTHLY",
    customStart?: Date,
    customEnd?: Date
  ): { start: Date; end: Date; label: string } {
    const now = new Date();

    if (period === "DAILY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end, label: `Daily — ${start.toISOString().split("T")[0]}` };
    }

    if (period === "WEEKLY") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: `Weekly — ${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}` };
    }

    if (period === "YEARLY") {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end, label: `Yearly — ${now.getFullYear()}` };
    }

    if (period === "CUSTOM" && customStart && customEnd) {
      return {
        start: customStart,
        end: customEnd,
        label: `Custom — ${customStart.toISOString().split("T")[0]} to ${customEnd.toISOString().split("T")[0]}`,
      };
    }

    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      start,
      end,
      label: `Monthly — ${now.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
    };
  }

  /**
   * Generates consolidated financial reports and metrics derived strictly from DB transactions.
   */
  public async getFinancialReport(filters: FinancialReportFilters = {}) {
    const { start, end, label } = this.resolveDateRange(
      filters.period,
      filters.startDate,
      filters.endDate
    );

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const paymentWhere: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (filters.status && filters.status !== "ALL") {
      paymentWhere.status = filters.status as PaymentStatus;
    }

    if (filters.method && filters.method !== "ALL") {
      paymentWhere.method = filters.method;
    }

    if (filters.customerId) {
      paymentWhere.customerId = filters.customerId;
    }

    if (filters.sellerId) {
      paymentWhere.order = {
        items: {
          some: {
            vendorId: filters.sellerId,
          },
        },
      };
    }

    const [transactions, totalTransactionsCount, allPaymentsInPeriod, allRefundsInPeriod, allPayoutsInPeriod, reconciliationRecord] =
      await Promise.all([
        prisma.paymentRecord.findMany({
          where: paymentWhere,
          orderBy: {
            [filters.sortBy || "createdAt"]: filters.sortOrder || "desc",
          },
          skip,
          take: limit,
          include: {
            order: {
              select: {
                id: true,
                customerName: true,
                customerEmail: true,
                totalPaise: true,
                shippingFeePaise: true,
                refundedPaise: true,
                status: true,
              },
            },
          },
        }),
        prisma.paymentRecord.count({ where: paymentWhere }),
        prisma.paymentRecord.findMany({
          where: {
            createdAt: { gte: start, lte: end },
            ...(filters.sellerId
              ? { order: { items: { some: { vendorId: filters.sellerId } } } }
              : {}),
          },
          select: {
            amountPaise: true,
            status: true,
            method: true,
          },
        }),
        prisma.refundRecord.findMany({
          where: {
            createdAt: { gte: start, lte: end },
            status: "SUCCEEDED",
          },
          select: {
            amountPaise: true,
          },
        }),
        prisma.vendorPayout.findMany({
          where: {
            createdAt: { gte: start, lte: end },
            ...(filters.sellerId ? { sellerId: filters.sellerId } : {}),
          },
          select: {
            grossAmountPaise: true,
            commissionPaise: true,
            netPayoutPaise: true,
            status: true,
          },
        }),
        prisma.financialReconciliation.findFirst({
          where: {
            periodStart: { lte: end },
            periodEnd: { gte: start },
          },
          orderBy: { reconciledAt: "desc" },
        }),
      ]);

    let grossCollectionsPaise = 0;
    let upiPaise = 0;
    let cardPaise = 0;
    let netBankingPaise = 0;
    let codPaise = 0;
    let otherPaise = 0;

    let successfulCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let refundedCount = 0;

    for (const p of allPaymentsInPeriod) {
      if (p.status === PaymentStatus.CAPTURED) {
        grossCollectionsPaise += p.amountPaise;
        successfulCount++;

        const m = (p.method || "").toUpperCase();
        if (m.includes("UPI")) upiPaise += p.amountPaise;
        else if (m.includes("CARD")) cardPaise += p.amountPaise;
        else if (m.includes("NET_BANKING") || m.includes("NETBANKING")) netBankingPaise += p.amountPaise;
        else if (m.includes("COD")) codPaise += p.amountPaise;
        else otherPaise += p.amountPaise;
      } else if (p.status === PaymentStatus.ESCROW_HOLD || p.status === PaymentStatus.PENDING) {
        pendingCount++;
      } else if (p.status === PaymentStatus.FAILED) {
        failedCount++;
      } else if (p.status === PaymentStatus.REFUNDED || p.status === PaymentStatus.PARTIALLY_REFUNDED) {
        refundedCount++;
      }
    }

    const totalRefundsPaise = allRefundsInPeriod.reduce((sum, r) => sum + r.amountPaise, 0);
    const netCollectionsPaise = Math.max(0, grossCollectionsPaise - totalRefundsPaise);

    let marketplaceCommissionPaise = 0;
    let supplierPayableBalancePaise = 0;

    for (const po of allPayoutsInPeriod) {
      marketplaceCommissionPaise += po.commissionPaise;
      if (po.status === PayoutStatus.ESCROW_HOLD || po.status === PayoutStatus.ELIGIBLE_FOR_PAYOUT) {
        supplierPayableBalancePaise += po.netPayoutPaise;
      }
    }

    const summary: FinancialSummaryMetrics = {
      grossCollectionsPaise,
      totalRefundsPaise,
      netCollectionsPaise,
      marketplaceCommissionPaise,
      supplierPayableBalancePaise,
      shippingAdjustmentsPaise: 0,
      reconciliationDifferencePaise: reconciliationRecord?.totalDiscrepancyPaise || 0,
      transactionCounts: {
        total: allPaymentsInPeriod.length,
        successful: successfulCount,
        pending: pendingCount,
        failed: failedCount,
        refunded: refundedCount,
      },
      byMethod: {
        upiPaise,
        cardPaise,
        netBankingPaise,
        codPaise,
        otherPaise,
      },
      generatedAt: new Date().toISOString(),
    };

    return {
      periodLabel: label,
      summary,
      transactions: transactions.map((t) => ({
        id: t.id,
        orderId: t.orderId,
        customerName: t.order?.customerName || "Patron",
        customerEmail: t.order?.customerEmail ? `${t.order.customerEmail[0]}***@${t.order.customerEmail.split("@")[1]}` : "—",
        amountPaise: t.amountPaise,
        currency: t.currency,
        status: t.status,
        method: t.method || "ONLINE",
        maskedDetails: t.maskedDetails || "Verified Gateway Transaction",
        transactionRef: t.transactionRef,
        createdAt: t.createdAt,
        reconciliationStatus: t.reconciliationStatus,
      })),
      pagination: {
        page,
        limit,
        total: totalTransactionsCount,
        totalPages: Math.ceil(totalTransactionsCount / limit),
      },
    };
  }

  /**
   * Generates a standard CSV report string of verified transactions.
   */
  public async generateCsvReport(filters: FinancialReportFilters = {}): Promise<string> {
    const reportData = await this.getFinancialReport({
      ...filters,
      limit: 10000, // Export all records in the period
    });

    const headers = [
      "Transaction ID",
      "Order ID",
      "Customer",
      "Amount (INR)",
      "Payment Method",
      "Status",
      "Masked Details",
      "Provider Reference",
      "Transaction Date",
      "Reconciliation",
    ];

    const rows = reportData.transactions.map((t) => [
      `"${t.id}"`,
      `"${t.orderId}"`,
      `"${t.customerName}"`,
      (t.amountPaise / 100).toFixed(2),
      `"${t.method}"`,
      `"${t.status}"`,
      `"${t.maskedDetails}"`,
      `"${t.transactionRef}"`,
      `"${new Date(t.createdAt).toISOString()}"`,
      `"${t.reconciliationStatus}"`,
    ]);

    const summaryBlock = [
      `# NEXU ATELIER FINANCIAL STATEMENT — ${reportData.periodLabel}`,
      `# Generated At: ${reportData.summary.generatedAt}`,
      `# Gross Collections (INR): ${(reportData.summary.grossCollectionsPaise / 100).toFixed(2)}`,
      `# Total Refunds (INR): ${(reportData.summary.totalRefundsPaise / 100).toFixed(2)}`,
      `# Net Marketplace Revenue / Commission (INR): ${(reportData.summary.marketplaceCommissionPaise / 100).toFixed(2)}`,
      `# Supplier Payable Balance (INR): ${(reportData.summary.supplierPayableBalancePaise / 100).toFixed(2)}`,
      `#`,
    ];

    return [...summaryBlock, headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}

export const financialReportingService = new FinancialReportingService();

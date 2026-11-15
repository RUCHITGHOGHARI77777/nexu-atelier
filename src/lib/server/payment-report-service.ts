/**
 * NEXU ATELIER — Database-Backed Payment & Financial Reporting Service
 * Computes verifiable aggregations directly from PostgreSQL records.
 */

import { prisma } from "@/lib/server/prisma";
import { PaymentReportSummary } from "@/types/payment-fraud";

export class PaymentReportService {
  /**
   * Generates a monthly payment report from actual database records
   */
  public async getMonthlyPaymentReport(targetDate: Date = new Date()): Promise<PaymentReportSummary> {
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        payments: true,
        refunds: true,
        shipments: true,
      },
    });

    let totalVolumePaise = 0;
    let capturedPaise = 0;
    let refundedPaise = 0;

    let upiPaise = 0;
    let upiCount = 0;
    let cardPaise = 0;
    let cardCount = 0;
    let netBankingPaise = 0;
    let netBankingCount = 0;
    let codPaise = 0;
    let codCount = 0;

    let codOrderedPaise = 0;
    let codCollectedPaise = 0;
    let codRemittedPaise = 0;
    let codPendingRemittancePaise = 0;
    let codRtoCount = 0;
    let codRtoPaise = 0;

    for (const order of orders) {
      totalVolumePaise += order.totalPaise;
      refundedPaise += order.refundedPaise;

      if (order.paymentStatus === "CAPTURED") {
        capturedPaise += order.totalPaise;
      }

      if (order.isCod) {
        codCount++;
        codPaise += order.totalPaise;
        codOrderedPaise += order.totalPaise;

        const codStatus = order.codCollectionStatus || "PENDING";
        if (codStatus === "COLLECTED") {
          codCollectedPaise += order.totalPaise;
          codPendingRemittancePaise += order.totalPaise;
        } else if (codStatus === "REMITTED") {
          codCollectedPaise += order.totalPaise;
          codRemittedPaise += order.totalPaise;
        } else if (codStatus === "RTO" || codStatus === "FAILED") {
          codRtoCount++;
          codRtoPaise += order.totalPaise;
        }
      } else {
        const mainPayment = order.payments[0];
        const method = (mainPayment as any)?.method || "CARD";

        if (method === "UPI") {
          upiCount++;
          upiPaise += order.totalPaise;
        } else if (method === "NET_BANKING") {
          netBankingCount++;
          netBankingPaise += order.totalPaise;
        } else {
          cardCount++;
          cardPaise += order.totalPaise;
        }
      }
    }

    const failedTransactionsCount = await prisma.paymentRecord.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: "FAILED",
      },
    });

    return {
      periodMonth: monthStr,
      totalTransactionsCount: orders.length,
      totalVolumePaise,
      capturedPaise,
      refundedPaise,
      byMethod: {
        upiPaise,
        upiCount,
        cardPaise,
        cardCount,
        netBankingPaise,
        netBankingCount,
        codPaise,
        codCount,
      },
      codCollection: {
        orderedPaise: codOrderedPaise,
        collectedPaise: codCollectedPaise,
        remittedPaise: codRemittedPaise,
        pendingRemittancePaise: codPendingRemittancePaise,
        rtoCount: codRtoCount,
        rtoPaise: codRtoPaise,
      },
      failedTransactionsCount,
    };
  }
}

export const paymentReportService = new PaymentReportService();

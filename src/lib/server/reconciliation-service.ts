import { prisma } from "./prisma";
import { PaymentStatus, OrderStatus as PrismaOrderStatus } from "@prisma/client";

export interface ReconciliationReport {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  provider: string;
  totalOrders: number;
  totalInternalGMVPaise: number;
  totalCapturedPaise: number;
  totalRefundedPaise: number;
  totalDiscrepancyPaise: number;
  discrepancies: {
    orderId: string;
    issue: string;
    amountPaiseDelta: number;
  }[];
  status: "BALANCED" | "DISCREPANCY_DETECTED";
  reconciledBy: string;
  reconciledAt: Date;
}

export class ReconciliationService {
  /**
   * Executes authoritative financial ledger reconciliation between internal orders,
   * payment records, and provider references. Discrepancies are logged without mutating records.
   */
  public async runReconciliation(params: {
    startDate?: Date;
    endDate?: Date;
    provider?: string;
    adminUserId: string;
  }): Promise<ReconciliationReport> {
    const periodStart = params.startDate || new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // Last 30 days
    const periodEnd = params.endDate || new Date();
    const provider = params.provider || "RAZORPAY";

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        payments: true,
      },
    });

    let totalInternalGMVPaise = 0;
    let totalCapturedPaise = 0;
    let totalRefundedPaise = 0;
    const discrepancies: { orderId: string; issue: string; amountPaiseDelta: number }[] = [];

    for (const order of orders) {
      if (order.status !== PrismaOrderStatus.CANCELLED) {
        totalInternalGMVPaise += order.totalPaise;
      }
      totalRefundedPaise += order.refundedPaise || 0;

      const positivePayments = order.payments.filter((p) => p.amountPaise > 0);
      const totalPaidForOrder = positivePayments.reduce((sum, p) => sum + p.amountPaise, 0);

      if (order.status !== PrismaOrderStatus.CANCELLED) {
        totalCapturedPaise += totalPaidForOrder;
      }

      // Discrepancy checks:
      // 1. Confirmed order without captured payment record
      if (
        order.status !== PrismaOrderStatus.CANCELLED &&
        order.paymentStatus === PaymentStatus.CAPTURED &&
        positivePayments.length === 0
      ) {
        discrepancies.push({
          orderId: order.id,
          issue: "Order marked CAPTURED but missing verified PaymentRecord.",
          amountPaiseDelta: order.totalPaise,
        });
      }

      // 2. Mismatch between order total and captured payment amount
      if (
        order.status !== PrismaOrderStatus.CANCELLED &&
        order.paymentStatus === PaymentStatus.CAPTURED &&
        totalPaidForOrder !== order.totalPaise
      ) {
        discrepancies.push({
          orderId: order.id,
          issue: `Payment amount mismatch: Order total is ₹${order.totalPaise / 100} but captured payments sum to ₹${totalPaidForOrder / 100}.`,
          amountPaiseDelta: Math.abs(order.totalPaise - totalPaidForOrder),
        });
      }
    }

    const totalDiscrepancyPaise = discrepancies.reduce((sum, d) => sum + d.amountPaiseDelta, 0);
    const status = discrepancies.length === 0 ? "BALANCED" : "DISCREPANCY_DETECTED";

    const record = await prisma.financialReconciliation.create({
      data: {
        periodStart,
        periodEnd,
        provider,
        totalInternalGMVPaise,
        totalCapturedPaise,
        totalRefundedPaise,
        totalDiscrepancyPaise,
        discrepancyDetails: JSON.stringify(discrepancies),
        status,
        reconciledBy: params.adminUserId,
      },
    });

    return {
      id: record.id,
      periodStart,
      periodEnd,
      provider,
      totalOrders: orders.length,
      totalInternalGMVPaise,
      totalCapturedPaise,
      totalRefundedPaise,
      totalDiscrepancyPaise,
      discrepancies,
      status,
      reconciledBy: params.adminUserId,
      reconciledAt: record.reconciledAt,
    };
  }

  public async getReconciliationHistory(limit = 20) {
    return prisma.financialReconciliation.findMany({
      orderBy: { reconciledAt: "desc" },
      take: limit,
    });
  }
}

export const reconciliationService = new ReconciliationService();

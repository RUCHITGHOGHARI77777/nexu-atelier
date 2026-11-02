import { prisma } from "./prisma";
import { RefundStatus, PaymentStatus } from "@prisma/client";
import { paymentService } from "./payment/payment-service";
import { notificationService } from "./notification-service";
import { platformAuditService } from "./platform-audit-service";

export interface InitiateRefundParams {
  orderId: string;
  amountPaise: number;
  reason: string;
  adminUserId: string;
  idempotencyKey?: string;
}

export interface RefundExecutionResult {
  success: boolean;
  refundRecordId?: string;
  providerRefundId?: string;
  status: RefundStatus;
  amountPaise: number;
  error?: string;
}

export class RefundService {
  /**
   * Authorizes and executes an exact minor-unit refund through the payment gateway adapter.
   * Enforces idempotency and guarantees that total refunds never exceed order net captured amount.
   */
  public async processRefund(params: InitiateRefundParams): Promise<RefundExecutionResult> {
    const { orderId, amountPaise, reason, adminUserId } = params;
    const idempotencyKey = params.idempotencyKey || `ref_req_${orderId}_${Date.now()}`;

    if (amountPaise <= 0) {
      return {
        success: false,
        status: RefundStatus.FAILED,
        amountPaise: 0,
        error: "Refund amount must be greater than zero.",
      };
    }

    // Check for existing idempotent refund request
    const existing = await prisma.refundRecord.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      return {
        success: existing.status === RefundStatus.SUCCEEDED,
        refundRecordId: existing.id,
        providerRefundId: existing.providerReference || undefined,
        status: existing.status,
        amountPaise: existing.amountPaise,
        error: existing.failureReason || undefined,
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: { where: { status: PaymentStatus.CAPTURED } },
      },
    });

    if (!order) {
      return {
        success: false,
        status: RefundStatus.FAILED,
        amountPaise,
        error: "Order not found.",
      };
    }

    const alreadyRefunded = order.refundedPaise || 0;
    const maxRefundable = order.totalPaise - alreadyRefunded;

    if (amountPaise > maxRefundable) {
      return {
        success: false,
        status: RefundStatus.FAILED,
        amountPaise,
        error: `Requested refund of ₹${Math.round(amountPaise / 100)} exceeds maximum refundable balance of ₹${Math.round(maxRefundable / 100)}.`,
      };
    }

    const capturedPayment = order.payments[0];
    const providerPaymentId = capturedPayment?.transactionRef;

    const refundId = `REF-${orderId.replace("ORD-", "")}-${Date.now().toString().slice(-4)}`;

    // Create pending refund record
    const refundRecord = await prisma.refundRecord.create({
      data: {
        id: refundId,
        orderId: order.id,
        paymentRecordId: capturedPayment?.id || null,
        amountPaise,
        reason,
        status: RefundStatus.PROCESSING,
        idempotencyKey,
        requestedBy: adminUserId,
      },
    });

    // Call payment provider adapter
    const adapter = paymentService.getAdapter(capturedPayment?.provider || undefined);
    const providerRes = await adapter.refundPayment({
      orderId: order.id,
      providerPaymentId,
      amountPaise,
      reason,
      idempotencyKey,
    });

    if (!providerRes.success || providerRes.status === "FAILED") {
      await prisma.refundRecord.update({
        where: { id: refundRecord.id },
        data: {
          status: RefundStatus.FAILED,
          failureReason: providerRes.error || "Provider declined refund execution.",
        },
      });

      return {
        success: false,
        refundRecordId: refundRecord.id,
        status: RefundStatus.FAILED,
        amountPaise,
        error: providerRes.error || "Provider declined refund execution.",
      };
    }

    // Atomic update of internal ledger and order balance
    const newRefundTotal = alreadyRefunded + amountPaise;
    const isFullRefund = newRefundTotal >= order.totalPaise;

    await prisma.$transaction(async (tx) => {
      await tx.refundRecord.update({
        where: { id: refundRecord.id },
        data: {
          status: RefundStatus.SUCCEEDED,
          providerReference: providerRes.providerRefundId,
          processedAt: new Date(),
        },
      });

      // Insert negative payment record
      await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          provider: capturedPayment?.provider || "ESCROW_INTERNAL",
          transactionRef: providerRes.providerRefundId || `REF-TXN-${refundId}`,
          amountPaise: -amountPaise,
          currency: "INR",
          status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
          rawGatewayResponse: providerRes.rawResponse || JSON.stringify({ mode: "refund_authorized", refundId }),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          refundedPaise: newRefundTotal,
          paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });

      await tx.auditEvent.create({
        data: {
          orderId: order.id,
          entityType: "REFUND",
          entityId: refundId,
          action: "REFUND_EXECUTED",
          note: `Authorized refund of ₹${Math.round(amountPaise / 100)} executed via ${adapter.provider}. Ref: ${providerRes.providerRefundId}`,
          performedBy: adminUserId,
        },
      });
    });

    // Record Immutable Platform Audit Log for high-privilege action
    await platformAuditService.recordAudit({
      action: "Return Refund",
      entityType: "REFUND",
      entityId: refundId,
      performedBy: adminUserId,
      details: {
        orderId: order.id,
        amountINR: amountPaise / 100,
        amountPaise,
        reason,
        provider: adapter.provider,
        providerRefundId: providerRes.providerRefundId,
      },
    });

    // Send transactional notification
    await notificationService.queueNotification({
      recipient: order.customerEmail,
      template: "REFUND_ISSUED",
      orderId: order.id,
      payload: {
        orderId: order.id,
        amountINR: Math.round(amountPaise / 100),
        reason,
        refundId: providerRes.providerRefundId || refundId,
      },
    });

    return {
      success: true,
      refundRecordId: refundRecord.id,
      providerRefundId: providerRes.providerRefundId,
      status: RefundStatus.SUCCEEDED,
      amountPaise,
    };
  }

  public async getOrderRefunds(orderId: string) {
    return prisma.refundRecord.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const refundService = new RefundService();

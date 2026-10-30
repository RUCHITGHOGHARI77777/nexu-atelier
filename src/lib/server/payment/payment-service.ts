import { prisma } from "../prisma";
import {
  PaymentStatus,
  PaymentProvider,
  OrderStatus as PrismaOrderStatus,
} from "@prisma/client";
import { IPaymentAdapter, PaymentOrderResult, VerifySignatureParams } from "./types";
import { SandboxPaymentAdapter } from "./sandbox-adapter";
import { RazorpayPaymentAdapter } from "./razorpay-adapter";
import { notificationService } from "../notification-service";

export class PaymentService {
  private razorpayAdapter: RazorpayPaymentAdapter;
  private sandboxAdapter: SandboxPaymentAdapter;

  constructor() {
    this.razorpayAdapter = new RazorpayPaymentAdapter();
    this.sandboxAdapter = new SandboxPaymentAdapter();
  }

  public getAdapter(preferredProvider?: string): IPaymentAdapter {
    if (preferredProvider === "RAZORPAY" && this.razorpayAdapter.isConfigured()) {
      return this.razorpayAdapter;
    }
    if (process.env.PAYMENT_PROVIDER === "RAZORPAY" && this.razorpayAdapter.isConfigured()) {
      return this.razorpayAdapter;
    }
    // Default to deterministic sandbox adapter for test/dev safety
    return this.sandboxAdapter;
  }

  public getSandboxAdapter(): SandboxPaymentAdapter {
    return this.sandboxAdapter;
  }

  public getRazorpayAdapter(): RazorpayPaymentAdapter {
    return this.razorpayAdapter;
  }

  /**
   * Initiates payment order on server with authoritative order total from database.
   * Client-submitted amounts are strictly ignored.
   */
  public async initiateOrderPayment(
    orderId: string,
    customerId: string,
    preferredProvider?: string
  ): Promise<PaymentOrderResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return {
        success: false,
        provider: "SANDBOX",
        providerOrderId: "",
        amountPaise: 0,
        currency: "INR",
        error: "Order not found.",
      };
    }

    if (order.customerId !== customerId) {
      return {
        success: false,
        provider: "SANDBOX",
        providerOrderId: "",
        amountPaise: 0,
        currency: "INR",
        error: "Unauthorized access to order.",
      };
    }

    if (order.status === PrismaOrderStatus.CANCELLED) {
      return {
        success: false,
        provider: "SANDBOX",
        providerOrderId: "",
        amountPaise: 0,
        currency: "INR",
        error: "Cannot initiate payment for a cancelled order.",
      };
    }

    const adapter = this.getAdapter(preferredProvider);
    const amountPaise = order.totalPaise;

    const res = await adapter.createPaymentOrder({
      orderId: order.id,
      amountPaise,
      currency: "INR",
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      notes: { orderId: order.id, customerId },
    });

    if (res.success) {
      // Create or update payment record
      await prisma.paymentRecord.upsert({
        where: { transactionRef: res.providerOrderId },
        create: {
          orderId: order.id,
          provider: adapter.provider === "RAZORPAY" ? PaymentProvider.RAZORPAY : PaymentProvider.ESCROW_INTERNAL,
          transactionRef: res.providerOrderId,
          amountPaise,
          currency: "INR",
          status: PaymentStatus.PENDING,
          rawGatewayResponse: JSON.stringify({
            mode: "payment_initiated",
            provider: adapter.provider,
            providerOrderId: res.providerOrderId,
            initiatedAt: new Date().toISOString(),
          }),
        },
        update: {
          amountPaise,
          status: PaymentStatus.PENDING,
        },
      });
    }

    return res;
  }

  /**
   * Verifies cryptographic provider signature and atomically captures payment.
   */
  public async verifyAndCapturePayment(
    params: VerifySignatureParams,
    customerId: string,
    preferredProvider?: string
  ): Promise<{ success: boolean; error?: string }> {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: { payments: true },
    });

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (order.customerId !== customerId) {
      return { success: false, error: "Unauthorized access to order." };
    }

    const adapter = this.getAdapter(preferredProvider);
    const isValid = await adapter.verifyPaymentSignature(params);

    if (!isValid) {
      // Record failure audit
      await prisma.auditEvent.create({
        data: {
          orderId: order.id,
          entityType: "PAYMENT",
          entityId: params.providerPaymentId,
          action: "PAYMENT_SIGNATURE_VERIFICATION_FAILED",
          note: `Cryptographic signature verification failed for provider order ${params.providerOrderId}`,
          performedBy: customerId,
        },
      });

      return { success: false, error: "Invalid payment signature. Payment verification rejected." };
    }

    // Atomic transaction: capture payment and confirm order
    await prisma.$transaction(async (tx) => {
      // Update or create captured PaymentRecord
      await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          provider: adapter.provider === "RAZORPAY" ? PaymentProvider.RAZORPAY : PaymentProvider.ESCROW_INTERNAL,
          transactionRef: params.providerPaymentId,
          amountPaise: order.totalPaise,
          currency: "INR",
          status: PaymentStatus.CAPTURED,
          rawGatewayResponse: JSON.stringify({
            mode: "signature_verified",
            providerOrderId: params.providerOrderId,
            providerPaymentId: params.providerPaymentId,
            verifiedAt: new Date().toISOString(),
          }),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.CAPTURED,
          status: PrismaOrderStatus.CONFIRMED,
        },
      });

      await tx.auditEvent.create({
        data: {
          orderId: order.id,
          entityType: "PAYMENT",
          entityId: params.providerPaymentId,
          action: "PAYMENT_CAPTURED",
          note: `Payment captured and verified via ${adapter.provider}. Ref: ${params.providerPaymentId}`,
          performedBy: customerId,
        },
      });
    });

    // Queue transactional notification
    await notificationService.queueNotification({
      recipient: order.customerEmail,
      template: "PAYMENT_VERIFIED",
      orderId: order.id,
      payload: {
        orderId: order.id,
        customerName: order.customerName,
        totalINR: Math.round(order.totalPaise / 100),
        transactionRef: params.providerPaymentId,
      },
    });

    return { success: true };
  }

  /**
   * Handles payment failure from webhook or client callback.
   */
  public async handlePaymentFailure(
    orderId: string,
    reason: string,
    providerRef?: string
  ): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: PaymentStatus.FAILED },
      });

      if (providerRef) {
        await tx.paymentRecord.create({
          data: {
            orderId,
            provider: PaymentProvider.ESCROW_INTERNAL,
            transactionRef: providerRef,
            amountPaise: 0,
            status: PaymentStatus.FAILED,
            rawGatewayResponse: JSON.stringify({ reason, failedAt: new Date().toISOString() }),
          },
        });
      }

      await tx.auditEvent.create({
        data: {
          orderId,
          entityType: "PAYMENT",
          entityId: providerRef || orderId,
          action: "PAYMENT_FAILED",
          note: `Payment failed: ${reason}`,
          performedBy: "system:gateway",
        },
      });
    });

    await notificationService.queueNotification({
      recipient: order.customerEmail,
      template: "PAYMENT_FAILED",
      orderId: order.id,
      payload: {
        orderId: order.id,
        customerName: order.customerName,
        reason,
      },
    });
  }
}

export const paymentService = new PaymentService();

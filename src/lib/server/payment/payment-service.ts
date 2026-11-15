import { prisma } from "../prisma";
import {
  PaymentStatus,
  PaymentProvider,
  OrderStatus as PrismaOrderStatus,
} from "@prisma/client";
import { IPaymentAdapter, PaymentOrderResult, VerifySignatureParams } from "./types";
import { SandboxPaymentAdapter, DemoPaymentSimulationOptions } from "./sandbox-adapter";
import { RazorpayPaymentAdapter } from "./razorpay-adapter";
import { notificationService } from "../notification-service";
import { securityAuditLedgerService } from "../security-audit-ledger-service";
import { isDemoMode } from "../demo-mode";

export class PaymentService {
  private razorpayAdapter: RazorpayPaymentAdapter;
  private sandboxAdapter: SandboxPaymentAdapter;

  constructor() {
    this.razorpayAdapter = new RazorpayPaymentAdapter();
    this.sandboxAdapter = new SandboxPaymentAdapter();
  }

  public getAdapter(preferredProvider?: string): IPaymentAdapter {
    if (preferredProvider === "RAZORPAY" || process.env.PAYMENT_PROVIDER === "RAZORPAY") {
      if (this.razorpayAdapter.isConfigured()) {
        return this.razorpayAdapter;
      }
      if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true") {
        throw new Error("Razorpay gateway credentials are not configured in production environment.");
      }
    }
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
    preferredProvider?: string,
    simulationOptions?: DemoPaymentSimulationOptions
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

    let adapter: IPaymentAdapter;
    try {
      adapter = this.getAdapter(preferredProvider);
    } catch (err: any) {
      return {
        success: false,
        provider: "RAZORPAY",
        providerOrderId: "",
        amountPaise: 0,
        currency: "INR",
        error: err.message || "Payment gateway configuration missing.",
      };
    }

    const result = adapter instanceof SandboxPaymentAdapter && simulationOptions
      ? await adapter.createPaymentOrder(
          {
            orderId: order.id,
            amountPaise: order.totalPaise,
            currency: "INR",
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: (order as any).customerPhone || undefined,
          },
          simulationOptions
        )
      : await adapter.createPaymentOrder({
          orderId: order.id,
          amountPaise: order.totalPaise,
          currency: "INR",
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: (order as any).customerPhone || undefined,
        });

    if (result.success) {
      await prisma.paymentRecord.upsert({
        where: { transactionRef: result.providerOrderId },
        update: {
          amountPaise: result.amountPaise,
          status: PaymentStatus.PENDING,
          customerId: order.customerId,
        },
        create: {
          orderId: order.id,
          customerId: order.customerId,
          provider: adapter.provider === "RAZORPAY" ? PaymentProvider.RAZORPAY : PaymentProvider.ESCROW_INTERNAL,
          transactionRef: result.providerOrderId,
          amountPaise: result.amountPaise,
          currency: result.currency,
          status: PaymentStatus.PENDING,
        },
      });

      await prisma.auditEvent.create({
        data: {
          orderId: order.id,
          entityType: "PAYMENT",
          entityId: result.providerOrderId,
          action: "PAYMENT_INITIATED",
          note: `Payment initiated via ${result.provider}. OrderId: ${result.providerOrderId}, Amount: ₹${(
            result.amountPaise / 100
          ).toFixed(2)}`,
          performedBy: customerId,
        },
      });

      await securityAuditLedgerService.recordEvent({
        action: isDemoMode() ? "DEMO_PAYMENT_INITIATED" : "PAYMENT_INITIATED",
        actorId: customerId,
        actorRole: "CUSTOMER",
        targetId: order.id,
        targetType: "ORDER",
        payload: {
          isDemo: isDemoMode(),
          provider: result.provider,
          providerOrderId: result.providerOrderId,
          amountPaise: result.amountPaise,
        },
      });
    }

    return result;
  }

  /**
   * Verifies cryptographic signature from gateway callback/webhook and transitions order state atomically.
   */
  public async verifyPaymentAndConfirmOrder(
    orderId: string,
    customerId: string,
    params: VerifySignatureParams,
    preferredProvider?: string
  ): Promise<{ success: boolean; error?: string }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (customerId && customerId !== "system" && order.customerId !== customerId) {
      return { success: false, error: "Unauthorized access to verify payment." };
    }

    if (order.paymentStatus === PaymentStatus.CAPTURED) {
      const alreadyCaptured = order.payments.some(
        (pr) => pr.transactionRef === params.providerPaymentId && pr.status === PaymentStatus.CAPTURED
      );
      if (alreadyCaptured) {
        return { success: true };
      }
    }

    let adapter: IPaymentAdapter;
    try {
      adapter = this.getAdapter(preferredProvider);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
    const isValid = await adapter.verifyPaymentSignature(params);

    if (!isValid) {
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

      await securityAuditLedgerService.recordEvent({
        action: "PAYMENT_SIGNATURE_FAILED",
        actorId: customerId,
        actorRole: "CUSTOMER",
        targetId: order.id,
        targetType: "ORDER",
        payload: {
          isDemo: isDemoMode(),
          providerOrderId: params.providerOrderId,
          providerPaymentId: params.providerPaymentId,
        },
      });

      return { success: false, error: "Invalid payment signature. Payment verification rejected." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentRecord.upsert({
        where: { transactionRef: params.providerPaymentId },
        update: {
          status: PaymentStatus.CAPTURED,
          amountPaise: order.totalPaise,
          rawGatewayResponse: JSON.stringify({
            mode: "signature_verified",
            providerOrderId: params.providerOrderId,
            providerPaymentId: params.providerPaymentId,
            verifiedAt: new Date().toISOString(),
            isDemo: isDemoMode(),
          }),
        },
        create: {
          orderId: order.id,
          customerId: order.customerId,
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
            isDemo: isDemoMode(),
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

    await securityAuditLedgerService.recordEvent({
      action: isDemoMode() ? "DEMO_PAYMENT_CAPTURED" : "PAYMENT_CAPTURED",
      actorId: customerId,
      actorRole: "CUSTOMER",
      targetId: order.id,
      targetType: "ORDER",
      payload: {
        isDemo: isDemoMode(),
        provider: adapter.provider,
        providerOrderId: params.providerOrderId,
        providerPaymentId: params.providerPaymentId,
        amountPaise: order.totalPaise,
      },
    });

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
   * Backward-compatible helper for verifying and capturing order payment.
   */
  public async verifyAndCapturePayment(
    params: VerifySignatureParams & { orderId?: string },
    customerId?: string,
    preferredProvider?: string
  ): Promise<{ success: boolean; error?: string }> {
    let orderId = params.orderId;
    if (!orderId && params.providerOrderId) {
      const match = params.providerOrderId.match(/order_(?:sbx|demo)_(.+?)_/);
      if (match) {
        const found = await prisma.order.findFirst({
          where: { OR: [{ id: match[1] }, { id: { contains: match[1] } }] },
        });
        if (found) orderId = found.id;
      }
    }
    if (!orderId) return { success: false, error: "Order ID is required." };
    return this.verifyPaymentAndConfirmOrder(orderId, customerId || "system", params, preferredProvider);
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
            rawGatewayResponse: JSON.stringify({
              reason,
              failedAt: new Date().toISOString(),
              isDemo: isDemoMode(),
            }),
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

    await securityAuditLedgerService.recordEvent({
      action: isDemoMode() ? "DEMO_PAYMENT_FAILED" : "PAYMENT_FAILED",
      actorId: "system:gateway",
      actorRole: "SYSTEM",
      targetId: orderId,
      targetType: "ORDER",
      payload: {
        isDemo: isDemoMode(),
        reason,
        providerRef: providerRef || null,
      },
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

  /**
   * Simulates a payment refund in demo mode with full database atomicity and audit ledger tracking.
   */
  public async simulateDemoRefund(
    orderId: string,
    amountPaise: number,
    reason: string = "Simulated Evaluator Refund",
    performedBy: string = "admin:demo"
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });

    if (!order) {
      return { success: false, error: "Order not found for refund simulation." };
    }

    if (amountPaise <= 0 || amountPaise > order.totalPaise) {
      return {
        success: false,
        error: `Invalid refund amount. Must be between 1 and ${order.totalPaise} paise.`,
      };
    }

    const refundRes = await this.sandboxAdapter.refundPayment({
      orderId: order.id,
      providerPaymentId: order.payments[0]?.transactionRef || `pay_demo_${order.id}`,
      amountPaise,
      reason,
      idempotencyKey: `ref_demo_${order.id}_${Date.now()}`,
    });

    if (!refundRes.success) {
      return { success: false, error: refundRes.error };
    }

    const refundId = refundRes.providerRefundId || `ref_demo_${order.id}_${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.ESCROW_INTERNAL,
          transactionRef: refundId,
          amountPaise: -amountPaise, // Negative to represent outflow
          currency: "INR",
          status: PaymentStatus.REFUNDED,
          rawGatewayResponse: refundRes.rawResponse || JSON.stringify({ mode: "demo_refund" }),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: PrismaOrderStatus.CANCELLED,
        },
      });

      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });

          if (item.vendorId) {
            await tx.stockMovement.create({
              data: {
                vendorId: item.vendorId,
                productId: item.productId,
                sku: item.selectedSku || `SKU-${item.productId.slice(-6).toUpperCase()}`,
                type: "RETURN_RESTORE",
                quantityDelta: item.quantity,
                previousStock: 0,
                updatedStock: item.quantity,
                referenceId: refundId,
                reason: `Demo refund stock restore (${order.id})`,
                performedBy,
              },
            });
          }
        }
      }

      await tx.auditEvent.create({
        data: {
          orderId: order.id,
          entityType: "PAYMENT",
          entityId: refundId,
          action: "DEMO_REFUND_PROCESSED",
          note: `Refund of ₹${(amountPaise / 100).toFixed(2)} processed in Demo Mode. Ref: ${refundId}`,
          performedBy,
        },
      });
    });

    await securityAuditLedgerService.recordEvent({
      action: "DEMO_PAYMENT_REFUNDED",
      actorId: performedBy,
      actorRole: "ADMIN",
      targetId: order.id,
      targetType: "ORDER",
      payload: {
        isDemo: true,
        orderId: order.id,
        refundId: refundRes.providerRefundId,
        amountPaise,
        reason,
      },
    });

    await notificationService.queueNotification({
      recipient: order.customerEmail,
      template: "REFUND_CONFIRMATION",
      orderId: order.id,
      payload: {
        orderId: order.id,
        customerName: order.customerName,
        refundAmountINR: Math.round(amountPaise / 100),
        refundRef: refundRes.providerRefundId,
        reason,
      },
    });

    return {
      success: true,
      refundId: refundRes.providerRefundId,
    };
  }

  /**
   * Simulates payment cancellation in checkout demo mode.
   */
  public async simulateDemoCancellation(
    orderId: string,
    reason: string = "Cancelled by patron during payment authorization",
    performedBy: string = "customer:demo"
  ): Promise<{ success: boolean; error?: string }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          status: PrismaOrderStatus.CANCELLED,
        },
      });

      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.auditEvent.create({
        data: {
          orderId: order.id,
          entityType: "PAYMENT",
          entityId: order.id,
          action: "DEMO_PAYMENT_CANCELLED",
          note: `Payment cancelled in demo mode: ${reason}`,
          performedBy,
        },
      });
    });

    await securityAuditLedgerService.recordEvent({
      action: "DEMO_PAYMENT_CANCELLED",
      actorId: performedBy,
      actorRole: "CUSTOMER",
      targetId: orderId,
      targetType: "ORDER",
      payload: {
        isDemo: true,
        orderId,
        reason,
      },
    });

    return { success: true };
  }
}

export const paymentService = new PaymentService();

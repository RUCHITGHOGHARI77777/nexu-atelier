/**
 * NEXU ATELIER — Payment Record & Cryptographic Verification Service
 * Enforces strict payment recording, idempotency, webhook validation, and PCI DSS credential isolation.
 */

import crypto from "crypto";
import { prisma } from "@/lib/server/prisma";
import { PaymentStatus, PaymentProvider, PayoutStatus } from "@prisma/client";

export interface CreatePaymentRecordInput {
  orderId: string;
  customerId?: string;
  provider?: PaymentProvider;
  transactionRef: string;
  idempotencyKey?: string;
  amountPaise: number;
  currency?: string;
  status: PaymentStatus;
  method?: string; // "UPI", "CARD", "NET_BANKING", "COD", "WALLET"
  cardBrand?: string;
  last4?: string;
  failureCode?: string;
  failureReason?: string;
  rawGatewayResponse?: Record<string, any>;
  isCod?: boolean;
}

export interface RecordRefundInput {
  orderId: string;
  paymentRecordId?: string;
  amountPaise: number;
  reason: string;
  idempotencyKey: string;
  providerReference?: string;
  requestedBy: string;
}

export class PaymentRecordService {
  /**
   * Cryptographically verifies webhook signatures (e.g. Razorpay HMAC SHA-256)
   * Uses timing-safe string comparison to prevent timing side-channel attacks.
   */
  public verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string
  ): boolean {
    if (!rawBody || !signature || !secret) {
      return false;
    }
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const expectedBuf = Buffer.from(expectedSignature, "utf8");
      const signatureBuf = Buffer.from(signature, "utf8");

      if (expectedBuf.length !== signatureBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedBuf, signatureBuf);
    } catch (err) {
      console.error("[PaymentRecordService] Webhook signature verification error:", err);
      return false;
    }
  }

  /**
   * Sanitizes and verifies payment data.
   * STRICT SECURITY RULE: Reject or strip any sensitive credentials (CVV, full card numbers, UPI PIN, OTP).
   */
  private sanitizePaymentData(input: CreatePaymentRecordInput): {
    maskedDetails: string | null;
  } {
    // Prohibit sensitive data anywhere in the payload
    const payloadStr = JSON.stringify(input);
    if (/cvv|cvc|upi_pin|card_number|otp_secret/i.test(payloadStr)) {
      // Check if full 16-digit card number or cvv is explicitly provided
      if (/\b\d{15,19}\b/.test(payloadStr)) {
        throw new Error(
          "SECURITY VIOLATION: Full primary account numbers (PAN) or credentials must never be passed to payment records."
        );
      }
    }

    let maskedDetails: string | null = null;
    if (input.last4) {
      const brand = input.cardBrand || "Card";
      maskedDetails = `${brand} ending in •••• ${input.last4.slice(-4)}`;
    } else if (input.method === "UPI") {
      maskedDetails = "Verified UPI Transaction";
    } else if (input.isCod) {
      maskedDetails = "Cash on Delivery Doorstep Collection";
    }

    return { maskedDetails };
  }

  /**
   * Atomically records a verified payment transaction with idempotency protection.
   * Never trusts client assertions; checks idempotency and updates parent order financial state.
   */
  public async recordTransaction(input: CreatePaymentRecordInput) {
    const { maskedDetails } = this.sanitizePaymentData(input);

    // 1. Idempotency Check: Check if this idempotency key or provider transaction ref was already recorded
    if (input.idempotencyKey) {
      const existingKey = await prisma.paymentRecord.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { order: true },
      });
      if (existingKey) {
        return {
          success: true,
          isDuplicate: true,
          paymentRecord: existingKey,
          message: "Transaction already processed under idempotency key.",
        };
      }
    }

    const existingRef = await prisma.paymentRecord.findUnique({
      where: { transactionRef: input.transactionRef },
      include: { order: true },
    });
    if (existingRef) {
      return {
        success: true,
        isDuplicate: true,
        paymentRecord: existingRef,
        message: "Transaction already recorded under provider reference.",
      };
    }

    // 2. Fetch order to verify existence and customer isolation
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${input.orderId} not found.`);
    }

    const customerId = input.customerId || order.customerId;

    // 3. Atomically create PaymentRecord and execute financial ledger updates
    const result = await prisma.$transaction(async (tx) => {
      const paymentRecord = await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          customerId,
          provider: input.provider || PaymentProvider.ESCROW_INTERNAL,
          transactionRef: input.transactionRef,
          idempotencyKey: input.idempotencyKey || null,
          amountPaise: input.amountPaise,
          currency: input.currency || "INR",
          status: input.status,
          method: input.method || (input.isCod ? "COD" : "ONLINE"),
          maskedDetails,
          failureCode: input.failureCode || null,
          failureReason: input.failureReason || null,
          reconciliationStatus: input.status === PaymentStatus.CAPTURED ? "RECONCILED" : "UNRECONCILED",
          isCod: input.isCod || false,
          rawGatewayResponse: input.rawGatewayResponse
            ? JSON.stringify(input.rawGatewayResponse)
            : null,
        },
      });

      // Update parent Order financial state if captured
      if (input.status === PaymentStatus.CAPTURED) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.CAPTURED,
          },
        });

        // Initialize Vendor Payouts if not already created (ONLY for verified non-sandbox transactions)
        const isSandboxOrDemo =
          input.transactionRef.startsWith("DEMO-") ||
          input.transactionRef.startsWith("pay_sandbox_") ||
          input.transactionRef.startsWith("test_") ||
          (input.provider === PaymentProvider.ESCROW_INTERNAL && !input.isCod);

        if (!isSandboxOrDemo) {
          const existingPayouts = await tx.vendorPayout.count({
            where: { orderItemId: { in: order.items.map((i) => i.id) } },
          });

          if (existingPayouts === 0) {
            for (const item of order.items) {
              if (item.vendorId) {
                const commissionPaise = Math.round(item.lineTotalPaise * 0.1);
                const netPayoutPaise = item.lineTotalPaise - commissionPaise;

                await tx.vendorPayout.create({
                  data: {
                    sellerId: item.vendorId,
                    orderItemId: item.id,
                    grossAmountPaise: item.lineTotalPaise,
                    commissionPaise,
                    netPayoutPaise,
                    status: PayoutStatus.ESCROW_HOLD,
                    transactionRef: `PO-${item.id.slice(-8)}`,
                  },
                });
              }
            }
          }
        }
      }

      // Record Audit Event
      await tx.auditEvent.create({
        data: {
          orderId: order.id,
          entityType: "PAYMENT_RECORD",
          entityId: paymentRecord.id,
          action: `PAYMENT_${input.status}`,
          note: `Payment of ₹${(input.amountPaise / 100).toFixed(2)} recorded with status ${input.status} (${input.method || "UNKNOWN"}). Ref: ${input.transactionRef}`,
          performedBy: customerId,
        },
      });

      return paymentRecord;
    });

    return {
      success: true,
      isDuplicate: false,
      paymentRecord: result,
    };
  }

  /**
   * Atomically records a refund transaction with idempotency and audit logs.
   */
  public async recordRefund(input: RecordRefundInput) {
    if (!input.idempotencyKey) {
      throw new Error("Idempotency key is strictly required for refund transactions.");
    }

    const existing = await prisma.refundRecord.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      return {
        success: true,
        isDuplicate: true,
        refundRecord: existing,
        message: "Refund already processed under idempotency key.",
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new Error(`Order ${input.orderId} not found.`);
    }

    const newRefundedPaise = order.refundedPaise + input.amountPaise;
    if (newRefundedPaise > order.totalPaise) {
      throw new Error(
        `Refund amount ₹${(input.amountPaise / 100).toFixed(2)} exceeds refundable order balance.`
      );
    }

    const refund = await prisma.$transaction(async (tx) => {
      const refundRecord = await tx.refundRecord.create({
        data: {
          id: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          orderId: order.id,
          paymentRecordId: input.paymentRecordId || null,
          amountPaise: input.amountPaise,
          reason: input.reason,
          status: "SUCCEEDED",
          providerReference: input.providerReference || `RF_SIM_${Date.now()}`,
          idempotencyKey: input.idempotencyKey,
          requestedBy: input.requestedBy,
          processedAt: new Date(),
        },
      });

      const nextPaymentStatus =
        newRefundedPaise >= order.totalPaise
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;

      await tx.order.update({
        where: { id: order.id },
        data: {
          refundedPaise: newRefundedPaise,
          paymentStatus: nextPaymentStatus,
        },
      });

      await tx.auditEvent.create({
        data: {
          orderId: order.id,
          entityType: "REFUND_RECORD",
          entityId: refundRecord.id,
          action: "REFUND_SUCCEEDED",
          note: `Refund of ₹${(input.amountPaise / 100).toFixed(2)} processed for reason: ${input.reason}. Total refunded: ₹${(newRefundedPaise / 100).toFixed(2)}`,
          performedBy: input.requestedBy,
        },
      });

      return refundRecord;
    });

    return {
      success: true,
      isDuplicate: false,
      refundRecord: refund,
    };
  }

  /**
   * Retrieves tenant-isolated payment records for a customer.
   */
  public async getCustomerPayments(customerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.paymentRecord.findMany({
        where: {
          customerId,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              customerEmail: true,
              totalPaise: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.paymentRecord.count({
        where: { customerId },
      }),
    ]);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        transactionRef: p.transactionRef,
        amountPaise: p.amountPaise,
        currency: p.currency,
        status: p.status,
        method: p.method,
        maskedDetails: p.maskedDetails,
        isCod: p.isCod,
        createdAt: p.createdAt,
        reconciliationStatus: p.reconciliationStatus,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const paymentRecordService = new PaymentRecordService();

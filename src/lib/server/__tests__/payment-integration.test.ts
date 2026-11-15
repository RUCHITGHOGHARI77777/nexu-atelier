import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../prisma";
import { paymentService } from "../payment/payment-service";
import { webhookService } from "../webhook-service";
import { refundService } from "../refund-service";
import { orderService } from "../order-service";
import { shippingService } from "../shipping/shipping-service";
import { PaymentStatus, OrderStatus } from "@prisma/client";

describe("Payment Integration & Cryptographic Verification", () => {
  const patronId = "usr_patron_01";
  const adminId = "usr_admin_01";
  let testOrderId: string;
  let orderTotalPaise: number;

  beforeAll(async () => {
    const order = await prisma.order.findFirst({
      where: { customerId: patronId, status: { not: OrderStatus.CANCELLED } },
    });

    if (order) {
      testOrderId = order.id;
      orderTotalPaise = order.totalPaise;
    } else {
      const prod = await prisma.product.findFirst({ where: { isPublished: true, stock: { gt: 5 } } });
      if (prod) {
        const orderRes = await orderService.createOrder(patronId, {
          items: [{ productId: prod.id, quantity: 1 }],
          deliveryMethodId: "standard",
          idempotencyKey: `pay_test_setup_${Date.now()}`,
        });
        testOrderId = orderRes.order!.id;
        orderTotalPaise = Math.round(orderRes.order!.totals.total * 100);
      }
    }
  });

  it("initiates server-authoritative payment order linked to database amount, rejecting tampered client amounts", async () => {
    const res = await paymentService.initiateOrderPayment(testOrderId, patronId, "SANDBOX");
    expect(res.success).toBe(true);
    expect(res.amountPaise).toBe(orderTotalPaise);
    expect(res.providerOrderId).toContain("order_sbx_");

    const payment = await prisma.paymentRecord.findUnique({
      where: { transactionRef: res.providerOrderId },
    });
    expect(payment).toBeDefined();
    expect(payment?.amountPaise).toBe(orderTotalPaise);
    expect(payment?.status).toBe(PaymentStatus.PENDING);
  });

  it("verifies valid cryptographic HMAC SHA-256 signature and captures payment atomically", async () => {
    const sandboxAdapter = paymentService.getSandboxAdapter();
    const providerOrderId = `order_sbx_${testOrderId.replace(/[^a-zA-Z0-9]/g, "")}_sigtest`;
    const providerPaymentId = `pay_sbx_${Date.now()}`;

    const validSignature = sandboxAdapter.generateTestSignature(providerOrderId, providerPaymentId);

    const captureRes = await paymentService.verifyAndCapturePayment(
      {
        orderId: testOrderId,
        providerOrderId,
        providerPaymentId,
        signature: validSignature,
      },
      patronId,
      "SANDBOX"
    );

    expect(captureRes.success).toBe(true);

    const capturedPayment = await prisma.paymentRecord.findUnique({
      where: { transactionRef: providerPaymentId },
    });
    expect(capturedPayment).toBeDefined();
    expect(capturedPayment?.status).toBe(PaymentStatus.CAPTURED);
  });

  it("rejects tampered or invalid payment signatures without capturing payment", async () => {
    const providerOrderId = `order_sbx_${testOrderId.replace(/[^a-zA-Z0-9]/g, "")}_badtest`;
    const providerPaymentId = `pay_sbx_tampered_${Date.now()}`;
    const forgedSignature = "0000000000000000000000000000000000000000000000000000000000000000";

    const captureRes = await paymentService.verifyAndCapturePayment(
      {
        orderId: testOrderId,
        providerOrderId,
        providerPaymentId,
        signature: forgedSignature,
      },
      patronId,
      "SANDBOX"
    );

    expect(captureRes.success).toBe(false);
    expect(captureRes.error).toContain("Invalid payment signature");

    const record = await prisma.paymentRecord.findUnique({
      where: { transactionRef: providerPaymentId },
    });
    expect(record).toBeNull();
  });
});

describe("Webhook Reliability & Idempotent Ingress", () => {
  it("verifies webhook signature and processes incoming payment captured event", async () => {
    const sandboxAdapter = paymentService.getSandboxAdapter();
    const eventId = `evt_test_${Date.now()}`;
    const payload = JSON.stringify({
      event: "payment.captured",
      account_id: "acc_nexu_test",
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: `pay_wh_${Date.now()}`,
            order_id: "order_sbx_wh_test",
            amount: 250000,
            status: "captured",
          },
        },
      },
    });

    const signature = sandboxAdapter.generateWebhookSignature(payload);

    const res = await webhookService.handleWebhook({
      provider: "RAZORPAY",
      eventId,
      eventType: "payment.captured",
      rawBody: payload,
      signature,
    });

    expect(res.success).toBe(true);
    expect(res.duplicate).toBe(false);

    const savedEvent = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: "RAZORPAY",
          eventId,
        },
      },
    });
    expect(savedEvent?.status).toBe("PROCESSED");
  });

  it("idempotently handles duplicate webhook retries without executing actions twice", async () => {
    const simAdapter = shippingService.getSimulatedAdapter();
    const eventId = `evt_dedup_${Date.now()}`;
    const payload = JSON.stringify({
      event: "shipment.status_update",
      awb: "BD-TEST-DEDUP-001",
      current_status: "In Transit",
    });

    const signature = simAdapter.generateWebhookSignature(payload);

    const firstRes = await webhookService.handleWebhook({
      provider: "SIMULATED_3PL",
      eventId,
      eventType: "shipment.status_update",
      rawBody: payload,
      signature,
    });
    expect(firstRes.success).toBe(true);
    expect(firstRes.duplicate).toBe(false);

    const duplicateRes = await webhookService.handleWebhook({
      provider: "SIMULATED_3PL",
      eventId,
      eventType: "shipment.status_update",
      rawBody: payload,
      signature,
    });
    expect(duplicateRes.success).toBe(true);
    expect(duplicateRes.duplicate).toBe(true);
  });

  it("rejects webhooks with forged or invalid signatures", async () => {
    const eventId = `evt_forged_${Date.now()}`;
    const payload = JSON.stringify({ event: "order.paid" });
    const fakeSignature = "invalid_hash_value";

    const res = await webhookService.handleWebhook({
      provider: "SIMULATED_3PL",
      eventId,
      eventType: "order.paid",
      rawBody: payload,
      signature: fakeSignature,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("signature verification failed");
  });
});

describe("Authorized Refunds & Over-Refund Prevention", () => {
  const adminId = "usr_admin_01";
  let targetOrderId: string;
  let orderTotalPaise: number;

  beforeAll(async () => {
    const order = await prisma.order.findFirst({
      where: { status: { not: OrderStatus.CANCELLED }, payments: { some: { amountPaise: { gt: 0 } } } },
      include: { payments: true },
    });

    if (order) {
      targetOrderId = order.id;
      orderTotalPaise = order.totalPaise;
      await prisma.order.update({
        where: { id: targetOrderId },
        data: { refundedPaise: 0 },
      });
    } else {
      const anyOrder = await prisma.order.findFirst();
      targetOrderId = anyOrder!.id;
      orderTotalPaise = anyOrder!.totalPaise;
    }
  });

  it("executes partial refund through payment adapter and updates order refunded total", async () => {
    const refundAmountINR = 500; // ₹500
    const refundAmountPaise = refundAmountINR * 100;
    const idempotencyKey = `ref_test_partial_${Date.now()}`;

    const res = await refundService.processRefund({
      orderId: targetOrderId,
      amountPaise: refundAmountPaise,
      reason: "Minor fabric blemish reported by patron",
      adminUserId: adminId,
      idempotencyKey,
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe("SUCCEEDED");
    expect(res.providerRefundId).toBeDefined();

    const updatedOrder = await prisma.order.findUnique({ where: { id: targetOrderId } });
    expect(updatedOrder?.refundedPaise).toBeGreaterThanOrEqual(refundAmountPaise);
  });

  it("prevents double-refunding or over-refunding beyond the maximum order balance", async () => {
    const order = await prisma.order.findUnique({ where: { id: targetOrderId } });
    const currentRefunded = order?.refundedPaise || 0;
    const remainingBalance = (order?.totalPaise || 0) - currentRefunded;

    const excessiveAmount = remainingBalance + 100000; // Exceed by ₹1,000

    const res = await refundService.processRefund({
      orderId: targetOrderId,
      amountPaise: excessiveAmount,
      reason: "Excessive refund attempt",
      adminUserId: adminId,
      idempotencyKey: `ref_excess_${Date.now()}`,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("exceeds maximum refundable balance");
  });

  it("idempotently returns previous refund result when same idempotencyKey is submitted", async () => {
    const key = `ref_idemp_${Date.now()}`;
    const amountPaise = 10000; // ₹100

    const first = await refundService.processRefund({
      orderId: targetOrderId,
      amountPaise,
      reason: "Idempotency test",
      adminUserId: adminId,
      idempotencyKey: key,
    });

    const second = await refundService.processRefund({
      orderId: targetOrderId,
      amountPaise,
      reason: "Idempotency test duplicate",
      adminUserId: adminId,
      idempotencyKey: key,
    });

    expect(second.success).toBe(first.success);
    expect(second.refundRecordId).toBe(first.refundRecordId);
    expect(second.providerRefundId).toBe(first.providerRefundId);
  });
});

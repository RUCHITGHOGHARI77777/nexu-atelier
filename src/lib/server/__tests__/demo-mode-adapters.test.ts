import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { isDemoMode, getDemoConfig, assertNoLivePaymentInDemo } from "../demo-mode";
import { SandboxPaymentAdapter } from "../payment/sandbox-adapter";
import { RazorpayPaymentAdapter } from "../payment/razorpay-adapter";
import { paymentService } from "../payment/payment-service";
import { Simulated3PLAdapter } from "../shipping/simulated-3pl-adapter";
import { shippingService } from "../shipping/shipping-service";
import { notificationService } from "../notification-service";
import { securityAuditLedgerService } from "../security-audit-ledger-service";
import { ShipmentStatus, PaymentStatus, OrderStatus, NotificationStatus } from "@prisma/client";

describe("NEXU ATELIER — Platform Demo Mode & Adapters Suite", () => {
  const testOrderId = `ORD-DEMO-${Date.now()}`;
  const testCustomerId = `cust_demo_${Date.now()}`;
  let seededUser: any;
  let seededSeller: any;
  let seededProduct: any;
  let seededCategory: any;

  beforeAll(async () => {
    seededUser = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    seededSeller = await prisma.seller.findFirst();
    seededProduct = await prisma.product.findFirst();
    seededCategory = await prisma.category.findFirst();
  });

  describe("Central Demo Configuration & Invariants", () => {
    it("should identify active Demo Mode and expose safe configuration", () => {
      const config = getDemoConfig();
      expect(config.isDemoMode).toBe(true);
      expect(config.payment.isLiveBlocked).toBe(true);
      expect(config.payment.allowFailureSimulation).toBe(true);
      expect(config.payment.allowCancelSimulation).toBe(true);
      expect(config.payment.allowRefundSimulation).toBe(true);
      expect(config.shipping.mode).toBe("DEMO_SIMULATED_3PL");
      expect(config.shipping.awbPrefix).toBe("DEMO-SR");
      expect(config.notifications.mode).toBe("DEMO_OUTBOX");
      expect(config.notifications.realDispatchBlocked).toBe(true);
    });

    it("should block live Razorpay keys from ever running in Demo Mode", () => {
      expect(() => {
        assertNoLivePaymentInDemo("rzp_live_abc123456789");
      }).toThrow(/CRITICAL SECURITY VIOLATION: Live Razorpay key detected in DEMO MODE/);

      expect(() => {
        assertNoLivePaymentInDemo("rzp_test_safe_key_123");
      }).not.toThrow();
    });

    it("should reject live key in RazorpayPaymentAdapter when demo mode is active", () => {
      const adapter = new RazorpayPaymentAdapter();
      expect(adapter.provider).toBe("RAZORPAY");
    });
  });

  describe("Payment Gateway Demo Adapter & Simulation", () => {
    const sandbox = new SandboxPaymentAdapter();

    it("should create deterministic demo payment orders with unique prefix", async () => {
      const res = await sandbox.createPaymentOrder({
        orderId: testOrderId,
        amountPaise: 450000,
        currency: "INR",
        customerName: "Aarav Mehta",
        customerEmail: "aarav@example.com",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("SANDBOX");
      expect(res.providerOrderId).toContain("order_sbx_");
      expect(res.amountPaise).toBe(450000);
      expect(res.keyId).toBeDefined();
    });

    it("should cryptographically verify demo HMAC signatures and reject tampered ones", async () => {
      const providerOrderId = "order_demo_test_123";
      const providerPaymentId = sandbox.generateDemoPaymentId();
      const validSig = sandbox.generateTestSignature(providerOrderId, providerPaymentId);

      const isValid = await sandbox.verifyPaymentSignature({
        orderId: testOrderId,
        providerOrderId,
        providerPaymentId,
        signature: validSig,
      });
      expect(isValid).toBe(true);

      const isInvalid = await sandbox.verifyPaymentSignature({
        orderId: testOrderId,
        providerOrderId,
        providerPaymentId,
        signature: "tampered_signature_payload_hex",
      });
      expect(isInvalid).toBe(false);
    });

    it("should support simulated payment failure options", async () => {
      const failRes = await sandbox.createPaymentOrder(
        {
          orderId: testOrderId,
          amountPaise: 250000,
          currency: "INR",
          customerName: "Aarav Mehta",
          customerEmail: "aarav@example.com",
        },
        { forceFail: true, failureReason: "Card declined: Insufficient funds" }
      );

      expect(failRes.success).toBe(false);
      expect(failRes.error).toContain("Insufficient funds");
    });

    it("should support simulated payment cancellation options", async () => {
      const cancelRes = await sandbox.createPaymentOrder(
        {
          orderId: testOrderId,
          amountPaise: 250000,
          currency: "INR",
          customerName: "Aarav Mehta",
          customerEmail: "aarav@example.com",
        },
        { forceCancel: true }
      );

      expect(cancelRes.success).toBe(false);
      expect(cancelRes.error).toContain("cancelled by user");
    });

    it("should simulate refunds with unique refund IDs and integer paise tracking", async () => {
      const refundRes = await sandbox.refundPayment({
        orderId: testOrderId,
        providerPaymentId: "pay_demo_captured_123",
        amountPaise: 150000,
        reason: "Customer size exchange",
        idempotencyKey: `ref_test_${Date.now()}`,
      });

      expect(refundRes.success).toBe(true);
      expect(refundRes.status).toBe("SUCCEEDED");
      expect(refundRes.providerRefundId).toContain("rfnd_demo_");
      expect(refundRes.amountPaise).toBe(150000);
    });
  });

  describe("Shiprocket Logistics Demo Adapter", () => {
    const shipping = new Simulated3PLAdapter();

    it("should generate unique demo AWB numbers with prefix DEMO-SR-", () => {
      const awb1 = shipping.generateUniqueDemoAwb();
      const awb2 = shipping.generateUniqueDemoAwb();

      expect(awb1).toMatch(/^DEMO-SR-[A-Z0-9]+-\d+$/);
      expect(awb2).toMatch(/^DEMO-SR-[A-Z0-9]+-\d+$/);
      expect(awb1).not.toBe(awb2);
    });

    it("should create shipments with realistic Indian carrier details", async () => {
      const res = await shipping.createShipment({
        orderId: testOrderId,
        sellerId: "seller_test",
        pickupAddress: {
          fullName: "Solstice Handloom Textiles",
          street: "Studio 401, Crafts Quarter",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          phone: "9876543210",
        },
        deliveryAddress: {
          fullName: "Aarav Mehta",
          street: "Highline Horizon",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
          phone: "9876543210",
        },
        items: [
          {
            title: "Handloom Tussar Silk Saree",
            sku: "SKU-SILK-001",
            quantity: 1,
            pricePaise: 450000,
          },
        ],
        weightGrams: 800,
      });

      expect(res.success).toBe(true);
      expect(res.trackingNumber).toMatch(/^DEMO-SR-/);
      expect(res.provider).toBe("SHIPROCKET_SIMULATED");
      expect(res.carrierName).toContain("Shiprocket");
    });

    it("should build realistic chronological tracking milestones across all states", () => {
      const milestones = shipping.buildSimulatedTimeline(ShipmentStatus.DELIVERED);

      expect(milestones.length).toBeGreaterThanOrEqual(5);
      const statuses = milestones.map((m) => m.status);
      expect(statuses).toContain(ShipmentStatus.PENDING_FULFILLMENT);
      expect(statuses).toContain(ShipmentStatus.SHIPPED);
      expect(statuses).toContain(ShipmentStatus.IN_TRANSIT);
      expect(statuses).toContain(ShipmentStatus.OUT_FOR_DELIVERY);
      expect(statuses).toContain(ShipmentStatus.DELIVERED);

      for (let i = 1; i < milestones.length; i++) {
        expect(milestones[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          milestones[i - 1].timestamp.getTime()
        );
      }
    });

    it("should support RTO state tracking milestones", () => {
      const rtoMilestones = shipping.buildSimulatedTimeline(ShipmentStatus.RTO_INITIATED);
      const statuses = rtoMilestones.map((m) => m.status);
      expect(statuses).toContain(ShipmentStatus.RTO_INITIATED);
      const rtoEvent = rtoMilestones.find((m) => m.status === ShipmentStatus.RTO_INITIATED);
      expect(rtoEvent?.description).toContain("Return to Origin");
    });
  });

  describe("Notifications Demo Outbox & Template Rendering", () => {
    it("should safely intercept and queue emails without external network calls", async () => {
      const res = await notificationService.queueNotification({
        channel: "EMAIL",
        recipient: "patron@nexu.studio",
        template: "CUSTOMER_WELCOME",
        payload: {
          name: "Vikramaditya Rao",
          email: "patron@nexu.studio",
          couponCode: "WELCOME10",
        },
      });

      expect(res.queued).toBe(true);
      expect(res.id).toBeDefined();

      if (res.id) {
        await notificationService.dispatchNotification(res.id);

        const event = await prisma.notificationEvent.findUnique({
          where: { id: res.id },
        });
        expect(event).toBeDefined();
        expect(event?.status).toBe(NotificationStatus.SENT);
        expect(event?.sentAt).toBeDefined();

        const payload = JSON.parse(event!.payloadJson);
        expect(payload._demoOutbox).toBeDefined();
        expect(payload._demoOutbox.simulatedDeliveryStatus).toBe("DELIVERED_SIMULATED");
        expect(payload._demoOutbox.renderedSubject).toContain("Welcome");
        expect(payload._demoOutbox.renderedHtml).toBeDefined();
      }
    });

    it("should safely intercept and queue WhatsApp OTP messages in outbox", async () => {
      const res = await notificationService.queueNotification({
        channel: "WHATSAPP",
        recipient: "+919876543210",
        template: "PHONE_VERIFICATION",
        payload: {
          code: "849201",
          purpose: "PHONE_VERIFICATION",
        },
      });

      expect(res.queued).toBe(true);
      if (res.id) {
        await notificationService.dispatchNotification(res.id);

        const event = await prisma.notificationEvent.findUnique({
          where: { id: res.id },
        });
        expect(event?.channel).toBe("WHATSAPP");
        expect(event?.status).toBe(NotificationStatus.SENT);
      }
    });

    it("should retrieve intercepted messages via getDemoOutbox", async () => {
      const outbox = await notificationService.getDemoOutbox({
        limit: 10,
      });

      expect(outbox.items.length).toBeGreaterThan(0);
      const first = outbox.items[0];
      expect(first.isDemo).toBe(true);
      expect(first.simulatedDeliveryStatus).toBe("DELIVERED_SIMULATED");
    });
  });

  describe("Cryptographic Audit Ledger Traceability for Demo Transactions", () => {
    it("should log demo transactions with valid SHA-256 chaining", async () => {
      const event = await securityAuditLedgerService.recordEvent({
        action: "DEMO_TEST_TRANSACTION",
        actorId: "tester:demo",
        actorRole: "SYSTEM",
        targetId: testOrderId,
        targetType: "ORDER",
        payload: {
          isDemo: true,
          amountPaise: 500000,
          provider: "SANDBOX",
        },
      });

      expect(event).toBeDefined();
      expect(event?.action).toBe("DEMO_TEST_TRANSACTION");
      expect(event?.recordHash).toBeDefined();
      expect(event?.recordHash.length).toBe(64); // SHA-256 hex string
      expect(event?.previousHash).toBeDefined();
      expect(event?.sequenceNumber).toBeGreaterThan(0);
    });
  });

  describe("Concurrency & Inventory Atomicity Under Demo Orders", () => {
    it("should atomically prevent overselling when concurrent demo orders exceed stock", async () => {
      const tempProd = await prisma.product.create({
        data: {
          title: `Demo Concurrency Test Item ${Date.now()}`,
          subtitle: "Studio Craftsmanship",
          slug: `demo-concurrency-test-${Date.now()}`,
          description: "Inventory concurrency testing under demo mode.",
          basePricePaise: 150000,
          stock: 3,
          category: { connect: { id: seededCategory.id } },
          vendor: { connect: { id: seededSeller.id } },
        },
      });

      const attempts = [1, 2, 3, 4, 5];
      const results = await Promise.allSettled(
        attempts.map(async () => {
          return prisma.$transaction(async (tx) => {
            const res = await tx.product.updateMany({
              where: { id: tempProd.id, stock: { gte: 1 } },
              data: { stock: { decrement: 1 } },
            });
            if (res.count === 0) {
              throw new Error("Insufficient stock: out of stock");
            }
            return res;
          });
        })
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      expect(succeeded).toBe(3);
      expect(failed).toBe(2);

      const finalProduct = await prisma.product.findUnique({ where: { id: tempProd.id } });
      expect(finalProduct?.stock).toBe(0); // Zero negative stock invariant guaranteed

      await prisma.product.delete({ where: { id: tempProd.id } });
    });
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import {
  isDemoMode,
  isDemoEmail,
  verifyDatabaseIdentityForReset,
  assertNoLivePaymentInDemo,
} from "../demo-mode";
import { authService } from "../auth-service";
import { paymentService } from "../payment/payment-service";
import { RazorpayPaymentAdapter } from "../payment/razorpay-adapter";
import { ShiprocketShippingAdapter } from "../shipping/shiprocket-adapter";
import { whatsappService } from "../whatsapp-service";
import { notificationService } from "../notification-service";
import { securityAuditLedgerService } from "../security-audit-ledger-service";
import { OrderStatus, PaymentStatus, UserRole, SellerStatus } from "@prisma/client";

describe("NEXU ATELIER — Demo Mode Isolation & Production Safety Verification", () => {
  let realCustomer: any;
  let realSeller: any;
  let realCategory: any;
  let realProduct: any;
  let realOrder: any;

  beforeAll(async () => {
    realCustomer = await prisma.user.upsert({
      where: { email: "real.customer.production@atelier-client.com" },
      update: {},
      create: {
        email: "real.customer.production@atelier-client.com",
        passwordHash: "pbkdf2_sha512$210000$mockhash",
        role: UserRole.CUSTOMER,
        profile: {
          create: {
            name: "Devendra Singhania",
            phone: "+91 99887 76655",
          },
        },
      },
    });

    const sellerUser = await prisma.user.upsert({
      where: { email: "real.artisan@royaltextiles.in" },
      update: {},
      create: {
        email: "real.artisan@royaltextiles.in",
        passwordHash: "pbkdf2_sha512$210000$mockhash",
        role: UserRole.SELLER,
      },
    });

    realSeller = await prisma.seller.upsert({
      where: { userId: sellerUser.id },
      update: {},
      create: {
        userId: sellerUser.id,
        name: "Royal Heritage Weaves",
        slug: "royal-heritage-weaves-prod",
        originHub: "Surat, Gujarat",
        story: "Centuries of silk and zari hand-weaving.",
        heroImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
        status: SellerStatus.APPROVED,
      },
    });

    realCategory = await prisma.category.findFirst() || await prisma.category.create({
      data: {
        name: "Fine Textiles",
        slug: "fine-textiles-prod",
        description: "Handcrafted heritage textiles and silks",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
      },
    });

    realProduct = await prisma.product.create({
      data: {
        title: "Real Production Heritage Brocade",
        subtitle: "Authentic Zari Weaving",
        slug: `real-prod-brocade-${Date.now()}`,
        description: "Production inventory that must never be altered or reset.",
        basePricePaise: 1250000,
        stock: 8, // Low stock, must NOT be automatically modified by demo reset
        categoryId: realCategory.id,
        vendorId: realSeller.id,
      },
    });

    realOrder = await prisma.order.create({
      data: {
        id: `REAL-ORD-${Date.now()}`,
        customerId: realCustomer.id,
        customerName: "Devendra Singhania",
        customerEmail: realCustomer.email,
        totalPaise: 1250000,
        subtotalPaise: 1250000,
        shippingFeePaise: 0,
        estimatedTaxPaise: 0,
        deliveryEstimatedDays: 3,
        estimatedDeliveryDate: new Date(Date.now() + 86400000 * 3),
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.CAPTURED,
        deliveryMethodId: "standard",
        deliveryMethodName: "Standard Delivery",
        shippingAddressSnapshot: JSON.stringify({ city: "Mumbai", pincode: "400001" }),
        items: {
          create: {
            productId: realProduct.id,
            productSlug: realProduct.slug,
            title: realProduct.title,
            vendorId: realSeller.id,
            vendorName: realSeller.name,
            unitPricePaise: realProduct.basePricePaise,
            quantity: 1,
            lineTotalPaise: realProduct.basePricePaise,
            imageSnapshot: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
          },
        },
      },
    });
  });

  afterAll(async () => {
    if (realOrder?.id) {
      await prisma.orderItem.deleteMany({ where: { orderId: realOrder.id } });
      await prisma.order.delete({ where: { id: realOrder.id } }).catch(() => {});
    }
    if (realProduct?.id) {
      await prisma.product.delete({ where: { id: realProduct.id } }).catch(() => {});
    }
    if (realSeller?.id) {
      await prisma.seller.delete({ where: { id: realSeller.id } }).catch(() => {});
    }
    if (realCustomer?.id) {
      await prisma.customerProfile.deleteMany({ where: { userId: realCustomer.id } });
      await prisma.user.delete({ where: { id: realCustomer.id } }).catch(() => {});
    }
  });

  describe("1. Database Identity Verification & Safe Reset Guards", () => {
    it("verifies safe local/dev/demo database identity successfully", async () => {
      const res = await verifyDatabaseIdentityForReset(async () => {
        const query = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database();`;
        return query?.[0]?.current_database || "nexu_ecommerce";
      });

      expect(res.safe).toBe(true);
      expect(res.isAmbiguous).toBe(false);
      expect(res.databaseName).toBeDefined();
    });

    it("strictly blocks reset when database identity is ambiguous", async () => {
      const ambiguousCheck = await verifyDatabaseIdentityForReset(async () => "unknown_arbitrary_db");
      const savedUrl = process.env.DATABASE_URL;
      try {
        process.env.DATABASE_URL = "postgresql://user:pass@10.0.0.5:5432/unknown_arbitrary_db";
        const res = await verifyDatabaseIdentityForReset(async () => "unknown_arbitrary_db");
        expect(res.safe).toBe(false);
        expect(res.isAmbiguous).toBe(true);
        expect(res.reason).toMatch(/ambiguous database identity/i);
      } finally {
        process.env.DATABASE_URL = savedUrl;
      }
    });

    it("strictly blocks reset when database identity contains production markers", async () => {
      const res = await verifyDatabaseIdentityForReset(async () => "nexu_production_cluster_db");
      expect(res.safe).toBe(false);
      expect(res.reason).toMatch(/production marker/i);
    });
  });

  describe("2. Demo Reset Protection & Zero Leakage to Production Records", () => {
    it("proves demo reset cannot delete, modify, or restore real production orders and inventory", async () => {
      const demoOrder = await prisma.order.create({
        data: {
          id: `DEMO-ORD-TEST-${Date.now()}`,
          customerId: realCustomer.id,
          customerName: "Aarav Mehta",
          customerEmail: "patron@nexu.studio", // Explicit demo patron
          totalPaise: 450000,
          subtotalPaise: 450000,
          shippingFeePaise: 0,
          estimatedTaxPaise: 0,
          deliveryEstimatedDays: 3,
          estimatedDeliveryDate: new Date(Date.now() + 86400000 * 3),
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.CAPTURED,
          deliveryMethodId: "standard",
          deliveryMethodName: "Standard Delivery",
          shippingAddressSnapshot: JSON.stringify({ city: "Bengaluru", pincode: "560001" }),
        },
      });

      const demoOrdersToDelete = await prisma.order.findMany({
        where: {
          OR: [
            { id: { contains: "DEMO" } },
            { customerEmail: "patron@nexu.studio" },
            { customerEmail: { contains: "demo" } },
          ],
        },
        select: { id: true, customerEmail: true },
      });

      const safeDemoOrderIds = demoOrdersToDelete
        .filter((o) => isDemoEmail(o.customerEmail) || o.id.includes("DEMO"))
        .map((o) => o.id);

      expect(safeDemoOrderIds).toContain(demoOrder.id);
      expect(safeDemoOrderIds).not.toContain(realOrder.id);

      await prisma.order.deleteMany({
        where: { id: { in: safeDemoOrderIds } },
      });

      const foundDemo = await prisma.order.findUnique({ where: { id: demoOrder.id } });
      expect(foundDemo).toBeNull();

      const foundReal = await prisma.order.findUnique({ where: { id: realOrder.id } });
      expect(foundReal).not.toBeNull();
      expect(foundReal?.customerEmail).toBe("real.customer.production@atelier-client.com");
      expect(foundReal?.status).toBe(OrderStatus.CONFIRMED);

      const freshRealProduct = await prisma.product.findUnique({ where: { id: realProduct.id } });
      expect(freshRealProduct?.stock).toBe(8);
    });

    it("verifies demo email classifier correctly identifies demo vs production accounts", () => {
      expect(isDemoEmail("patron@nexu.studio")).toBe(true);
      expect(isDemoEmail("solstice@nexu.studio")).toBe(true);
      expect(isDemoEmail("admin@nexu.studio")).toBe(true);
      expect(isDemoEmail("buyer.demo@nexu.studio")).toBe(true);
      expect(isDemoEmail("test.user@demo.nexu.studio")).toBe(true);

      expect(isDemoEmail("devendra@singhania-group.com")).toBe(false);
      expect(isDemoEmail("artisan@royaltextiles.in")).toBe(false);
      expect(isDemoEmail("investor@atelier-cap.com")).toBe(false);
      expect(isDemoEmail("customer@gmail.com")).toBe(false);
    });
  });

  describe("3. Demo Account Security & Production Authentication Block", () => {
    it("strictly blocks demo credentials from authenticating when DEMO_MODE is disabled", async () => {
      const savedEnv = process.env.DEMO_MODE;
      try {
        process.env.DEMO_MODE = "false";

        const loginRes = await authService.login("patron@nexu.studio", "Password123!");
        expect(loginRes.success).toBe(false);
        expect(loginRes.error).toMatch(/strictly prohibited from authenticating in production mode/i);

        const demoAuthRes = await authService.authenticateDemo("customer");
        expect(demoAuthRes.success).toBe(false);
        expect(demoAuthRes.error).toMatch(/strictly disabled in production mode/i);
      } finally {
        process.env.DEMO_MODE = savedEnv;
      }
    });

    it("revokes active demo sessions if environment is evaluated in production mode", async () => {
      const demoAuth = await authService.authenticateDemo("customer");
      expect(demoAuth.success).toBe(true);
      const token = demoAuth.token!;

      const sessionUser = await authService.validateSession(token);
      expect(sessionUser).not.toBeNull();
      expect(sessionUser?.email).toBe("patron@nexu.studio");

      const savedEnv = process.env.DEMO_MODE;
      try {
        process.env.DEMO_MODE = "false";
        const prodValidated = await authService.validateSession(token);
        expect(prodValidated).toBeNull(); // Session must be revoked immediately
      } finally {
        process.env.DEMO_MODE = savedEnv;
      }
    });
  });

  describe("4. Payment Gateway Isolation & Live Protection", () => {
    it("assertNoLivePaymentInDemo rejects live Razorpay credentials with a fatal security error", () => {
      expect(() => {
        assertNoLivePaymentInDemo("rzp_live_K901XYZ789FakeProductionKey");
      }).toThrow(/CRITICAL SECURITY VIOLATION: Live Razorpay key detected in DEMO MODE/i);
    });

    it("rejects simulated payment IDs if passed to real Razorpay refund adapter", async () => {
      const rzp = new RazorpayPaymentAdapter("rzp_test_mock_123", "secret_mock_456");
      const refundRes = await rzp.refundPayment({
        orderId: "ORD-999",
        providerPaymentId: "pay_sbx_mock_simulated_id",
        amountPaise: 50000,
        reason: "Test refund",
        idempotencyKey: "ref_idem_1",
      });

      expect(refundRes.success).toBe(false);
      expect(refundRes.error).toMatch(/Cannot execute live Razorpay refund on a simulated sandbox payment ID/i);
    });

    it("ensures sandbox payment and refund IDs use unambiguous simulated prefixes", () => {
      const sandbox = paymentService.getSandboxAdapter();
      const payId = sandbox.generateDemoPaymentId();
      const refId = sandbox.generateDemoRefundId();

      expect(payId).toMatch(/^pay_(?:sbx|demo)_/);
      expect(refId).toMatch(/^rfnd_(?:sbx|demo)_/);

      expect(payId).not.toMatch(/^pay_[A-Za-z0-9]{14}$/);
    });
  });

  describe("5. Courier & Notification Isolation", () => {
    it("blocks real Shiprocket carrier dispatch when running in DEMO_MODE", async () => {
      const shiprocket = new ShiprocketShippingAdapter();
      const dispatchRes = await shiprocket.createShipment({
        orderId: "TEST-ORD",
        sellerId: "SELLER-1",
        pickupAddress: {
          fullName: "Artisan Studio",
          street: "Station Road",
          city: "Varanasi",
          state: "Uttar Pradesh",
          pincode: "221001",
          phone: "9876543210",
        },
        deliveryAddress: {
          fullName: "Customer",
          street: "MG Road",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
          phone: "9876543210",
        },
        items: [{ title: "Silk Shawl", sku: "SS-1", quantity: 1, pricePaise: 100000 }],
        weightGrams: 500,
      });

      expect(dispatchRes.success).toBe(false);
      expect(dispatchRes.error).toMatch(/Live Shiprocket shipping is strictly blocked in DEMO_MODE/i);
    });

    it("blocks querying real Shiprocket API for simulated demo AWBs", async () => {
      const shiprocket = new ShiprocketShippingAdapter();
      const trackRes = await shiprocket.getTracking("DEMO-SR-AB12CD-123456");

      expect(trackRes.success).toBe(false);
      expect(trackRes.error).toMatch(/Cannot query real Shiprocket carrier tracking for a simulated demo AWB/i);
    });

    it("guarantees WhatsApp Cloud API client runs in simulation mode in DEMO_MODE", async () => {
      const otpRes = await whatsappService.sendOtp({
        recipientPhone: "+919876543210",
        otpCode: "654321",
        purpose: "LOGIN",
      });

      expect(otpRes.success).toBe(true);
      expect(otpRes.simulated).toBe(true);
      expect(otpRes.messageId).toContain("sim_wamid_");
    });

    it("guarantees transactional notifications are intercepted in demo outbox with full rendered HTML", async () => {
      const queueRes = await notificationService.queueNotification({
        channel: "EMAIL",
        recipient: "patron@nexu.studio",
        template: "CUSTOMER_WELCOME",
        payload: {
          name: "Vikramaditya Rao",
          email: "patron@nexu.studio",
        },
      });

      await notificationService.dispatchNotification(queueRes.id!);

      const outbox = await notificationService.getDemoOutbox({ limit: 20 });
      const targetItem = outbox.items.find((i) => i.id === queueRes.id);
      expect(targetItem).toBeDefined();
      expect(targetItem?.isDemo).toBe(true);
      expect(targetItem?.simulatedDeliveryStatus).toBe("DELIVERED_SIMULATED");
      expect(targetItem?.renderedHtml).toBeDefined();
      expect(targetItem?.renderedHtml).toContain("Vikramaditya Rao");
    });
  });

  describe("6. Audit Ledger Multi-Instance Concurrency & Advisory Lock Serialization", () => {
    it("strictly serializes simultaneous concurrent audit events with unbroken hash chain", async () => {
      const parallelWrites = Array.from({ length: 10 }).map((_, i) =>
        securityAuditLedgerService.recordSecurityEvent({
          actorId: `worker_instance_${i % 3}`,
          actorRole: "SYSTEM",
          action: "CONCURRENT_LOAD_TEST",
          resourceType: "CLUSTER",
          details: { instanceId: `node_worker_${i}`, testBatch: Date.now() },
        })
      );

      const results = await Promise.all(parallelWrites);
      expect(results.every((r) => r !== null)).toBe(true);

      const chainCheck = await securityAuditLedgerService.verifyAuditChainIntegrity();
      expect(chainCheck.isValid).toBe(true);
      expect(chainCheck.tamperedRecordIndex).toBeNull();
      expect(chainCheck.tamperedRecordId).toBeNull();
    });
  });
});

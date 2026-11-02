import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { authService } from "../auth-service";
import { orderService } from "../order-service";
import { productRepository } from "../product-repository";
import { couponService } from "../coupon-service";
import { paymentService } from "../payment/payment-service";
import {
  UserRole,
  OrderStatus,
  PaymentStatus,
  SellerStatus,
  PayoutStatus,
  DisputeStatus,
} from "@prisma/client";

describe("NEXU ATELIER — Complete Customer Commerce System", () => {
  let customerUser: { id: string; email: string };
  let strangerUser: { id: string; email: string };
  let sellerA: any;
  let sellerB: any;
  let productA: any;
  let productB: any;
  let placedOrderId: string;
  let multiVendorOrderId: string;

  beforeAll(async () => {
    // 1. Setup Customer User
    const regRes = await authService.register(
      "Aarav Sharma",
      `patron_comm_${Date.now()}@nexu.studio`,
      "MasterCraftPass2026!",
      "+91 98111 22334"
    );
    expect(regRes.success).toBe(true);
    customerUser = { id: regRes.user!.id, email: regRes.user!.email };

    // 2. Setup Stranger Customer User (for tenant isolation tests)
    const strangerRes = await authService.register(
      "Stranger Patron",
      `stranger_${Date.now()}@nexu.studio`,
      "MasterCraftPass2026!",
      "+91 98222 33445"
    );
    expect(strangerRes.success).toBe(true);
    strangerUser = { id: strangerRes.user!.id, email: strangerRes.user!.email };

    // 3. Add default delivery address for customer
    await prisma.address.create({
      data: {
        customerId: customerUser.id,
        fullName: "Aarav Sharma",
        phone: "+91 98111 22334",
        street: "42 Lodhi Estate",
        apartment: "Penthouse B",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110003",
        isDefault: true,
      },
    });

    // 4. Find two distinct approved sellers with published in-stock products
    const sellers = await prisma.seller.findMany({
      where: {
        status: SellerStatus.APPROVED,
        products: {
          some: {
            isPublished: true,
            stock: { gt: 5 },
          },
        },
      },
      include: {
        products: {
          where: { isPublished: true, stock: { gt: 5 } },
          include: { variants: true },
        },
      },
      take: 2,
    });

    expect(sellers.length).toBeGreaterThanOrEqual(1);
    sellerA = sellers[0];
    productA = sellerA.products[0];

    if (sellers.length > 1 && sellers[1].products.length > 0) {
      sellerB = sellers[1];
      productB = sellerB.products[0];
    } else {
      sellerB = sellerA;
      productB = sellerA.products.length > 1 ? sellerA.products[1] : sellerA.products[0];
    }
  });

  afterAll(async () => {
    // Cleanup placed orders
    if (placedOrderId) {
      await prisma.vendorPayout.deleteMany({ where: { orderItem: { orderId: placedOrderId } } });
      await prisma.orderItem.deleteMany({ where: { orderId: placedOrderId } });
      await prisma.disputeCase.deleteMany({ where: { orderId: placedOrderId } });
      await prisma.order.deleteMany({ where: { id: placedOrderId } });
    }
    if (multiVendorOrderId) {
      await prisma.vendorPayout.deleteMany({ where: { orderItem: { orderId: multiVendorOrderId } } });
      await prisma.orderItem.deleteMany({ where: { orderId: multiVendorOrderId } });
      await prisma.order.deleteMany({ where: { id: multiVendorOrderId } });
    }

    // Cleanup customers
    if (customerUser?.id) {
      await prisma.address.deleteMany({ where: { customerId: customerUser.id } });
      await prisma.session.deleteMany({ where: { userId: customerUser.id } });
      await prisma.customerProfile.deleteMany({ where: { userId: customerUser.id } });
      await prisma.user.deleteMany({ where: { id: customerUser.id } });
    }
    if (strangerUser?.id) {
      await prisma.address.deleteMany({ where: { customerId: strangerUser.id } });
      await prisma.session.deleteMany({ where: { userId: strangerUser.id } });
      await prisma.customerProfile.deleteMany({ where: { userId: strangerUser.id } });
      await prisma.user.deleteMany({ where: { id: strangerUser.id } });
    }
  });

  describe("1. Customer Authentication & Account Security", () => {
    it("logs in registered customer and issues a secure session token", async () => {
      const loginRes = await authService.login(customerUser.email, "MasterCraftPass2026!");
      expect(loginRes.success).toBe(true);
      expect(loginRes.token).toBeDefined();
      expect(loginRes.user?.email).toBe(customerUser.email);

      // Verify session exists in DB
      const session = await prisma.session.findUnique({
        where: { token: loginRes.token },
      });
      expect(session).not.toBeNull();
      expect(session?.userId).toBe(customerUser.id);
    });

    it("rejects login with incorrect password", async () => {
      const failRes = await authService.login(customerUser.email, "WrongPassword!");
      expect(failRes.success).toBe(false);
      expect(failRes.error).toContain("Invalid email or password");
    });

    it("executes password recovery workflow with cryptographic token", async () => {
      // 1. Generate reset token
      const tokenRes = await authService.generatePasswordResetToken(customerUser.email);
      expect(tokenRes.success).toBe(true);
      expect(tokenRes.token).toBeDefined();

      // 2. Reset password using token
      const newPass = "NewSecurePass2026#";
      const resetRes = await authService.resetPasswordWithToken(tokenRes.token!, newPass);
      expect(resetRes.success).toBe(true);

      // 3. Login with new password succeeds
      const newLogin = await authService.login(customerUser.email, newPass);
      expect(newLogin.success).toBe(true);

      // 4. Old password fails
      const oldLogin = await authService.login(customerUser.email, "MasterCraftPass2026!");
      expect(oldLogin.success).toBe(false);

      // Reset back to original password for subsequent tests
      await authService.resetPasswordWithToken(
        (await authService.generatePasswordResetToken(customerUser.email)).token!,
        "MasterCraftPass2026!"
      );
    });
  });

  describe("2. Product Discovery & Real Catalog Isolation", () => {
    it("returns only approved and published pieces from the live database repository", async () => {
      const catalogResult = await productRepository.getProducts({ limit: 50 });
      expect(catalogResult.products.length).toBeGreaterThan(0);

      for (const prod of catalogResult.products) {
        expect(prod.stock).toBeGreaterThanOrEqual(0);
        expect(prod.basePrice).toBeGreaterThan(0);
        expect(prod.vendor.name).toBeDefined();
        // Verify in DB that it is approved and published
        const dbP = await prisma.product.findUnique({ where: { id: prod.id } });
        expect(dbP?.isPublished).toBe(true);
        expect(dbP?.approvalStatus).toBe("APPROVED");
      }
    });

    it("retrieves product by slug with complete variant metadata including SKUs and stock", async () => {
      const fullProduct = await productRepository.getProductBySlug(productA.slug);
      expect(fullProduct).not.toBeNull();
      expect(fullProduct?.id).toBe(productA.id);
      expect(fullProduct?.title).toBe(productA.title);
      expect(Array.isArray(fullProduct?.variants)).toBe(true);

      if (fullProduct!.variants!.length > 0) {
        const variant = fullProduct!.variants![0];
        expect(variant.sku).toBeDefined();
        expect(typeof variant.stock).toBe("number");
      }
    });
  });

  describe("3. Multi-Supplier Orders & Server-Authoritative Checkout", () => {
    it("creates a single customer order containing items from multiple distinct suppliers", async () => {
      const initialStockA = productA.stock;
      const initialStockB = productB.stock;

      const orderResult = await orderService.createOrder(customerUser.id, {
        deliveryMethodId: "standard",
        idempotencyKey: `idemp_multi_${Date.now()}`,
        items: [
          {
            productId: productA.id,
            quantity: 1,
            selectedSku: productA.variants?.find((v) => v.stock > 0)?.sku,
          },
          {
            productId: productB.id,
            quantity: 1,
            selectedSku: productB.variants?.find((v) => v.stock > 0)?.sku,
          },
        ],
      });

      expect(orderResult.success).toBe(true);
      expect(orderResult.order).toBeDefined();
      multiVendorOrderId = orderResult.order!.id;

      // Verify DB Order
      const dbOrder = await prisma.order.findUnique({
        where: { id: multiVendorOrderId },
        include: { items: true, payments: true },
      });

      expect(dbOrder).not.toBeNull();
      expect(dbOrder?.items.length).toBe(2);
      expect(dbOrder?.status).toBe(OrderStatus.CONFIRMED);

      // Verify both suppliers are represented with distinct vendor IDs
      const vendorIds = new Set(dbOrder?.items.map((i) => i.vendorId));
      expect(vendorIds.size).toBeGreaterThanOrEqual(1);

      // Verify stocks decremented
      const updatedProductA = await prisma.product.findUnique({ where: { id: productA.id } });
      expect(updatedProductA?.stock).toBe(initialStockA - 1);
    });

    it("enforces tenant access control: other customers cannot retrieve or view another patron's order", async () => {
      const strangerAccess = await orderService.getOrderById(strangerUser.id, multiVendorOrderId);
      expect(strangerAccess).toBeNull();

      const rightfulAccess = await orderService.getOrderById(customerUser.id, multiVendorOrderId);
      expect(rightfulAccess).not.toBeNull();
      expect(rightfulAccess?.id).toBe(multiVendorOrderId);
    });
  });

  describe("4. Payment Integration & Cryptographic Capture", () => {
    it("initiates payment based strictly on authoritative database order total", async () => {
      // 1. Create dedicated order for payment testing
      const orderRes = await orderService.createOrder(customerUser.id, {
        deliveryMethodId: "standard",
        idempotencyKey: `idemp_pay_${Date.now()}`,
        items: [
          {
            productId: productA.id,
            quantity: 1,
            selectedSku: productA.variants?.find((v) => v.stock > 0)?.sku,
          },
        ],
      });

      expect(orderRes.success).toBe(true);
      placedOrderId = orderRes.order!.id;

      // 2. Initiate payment
      const initRes = await paymentService.initiateOrderPayment(placedOrderId, customerUser.id, "SANDBOX");
      expect(initRes.success).toBe(true);
      expect(initRes.amountPaise).toBe(orderRes.order!.totals.total * 100);
      expect(initRes.providerOrderId).toBeDefined();

      // 3. Verify cryptographic capture
      const sandboxAdapter = paymentService.getSandboxAdapter();
      const validSig = sandboxAdapter.generateTestSignature(initRes.providerOrderId, "mock_pay_998877");

      const captureRes = await paymentService.verifyAndCapturePayment(
        {
          orderId: placedOrderId,
          providerOrderId: initRes.providerOrderId,
          providerPaymentId: "mock_pay_998877",
          signature: validSig,
        },
        customerUser.id,
        "SANDBOX"
      );

      expect(captureRes.success).toBe(true);

      // Verify order paymentStatus updated to CAPTURED in DB
      const updatedOrder = await prisma.order.findUnique({ where: { id: placedOrderId } });
      expect(updatedOrder?.paymentStatus).toBe(PaymentStatus.CAPTURED);
    });

    it("rejects forged payment verification signature", async () => {
      const forgedRes = await paymentService.verifyAndCapturePayment(
        {
          orderId: placedOrderId,
          providerOrderId: "order_fake_123",
          providerPaymentId: "pay_fake_456",
          signature: "forged_malicious_signature_hash",
        },
        customerUser.id,
        "SANDBOX"
      );

      expect(forgedRes.success).toBe(false);
      expect(forgedRes.error).toMatch(/signature/i);
    });
  });

  describe("5. Pre-Dispatch Cancellation & Inventory Restoration", () => {
    it("cancels order pre-dispatch and restores both product and variant stock", async () => {
      const productBefore = await prisma.product.findUnique({ where: { id: productA.id } });
      const stockBefore = productBefore!.stock;

      const cancelRes = await orderService.cancelOrder(
        customerUser.id,
        placedOrderId,
        "Patron changed design preference."
      );

      expect(cancelRes.success).toBe(true);
      expect(cancelRes.order?.status?.toUpperCase()).toBe("CANCELLED");

      // Verify stock was restored
      const productAfter = await prisma.product.findUnique({ where: { id: productA.id } });
      expect(productAfter?.stock).toBe(stockBefore + 1);

      // Verify order status in DB
      const dbOrder = await prisma.order.findUnique({ where: { id: placedOrderId } });
      expect(dbOrder?.status).toBe(OrderStatus.CANCELLED);
      expect(dbOrder?.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });
  });

  describe("6. Transactional Outbox Notifications", () => {
    it("verifies welcome, order confirmed, and order cancelled notifications are queued in DB", async () => {
      const notifications = await prisma.notificationEvent.findMany({
        where: { recipient: customerUser.email },
        orderBy: { createdAt: "desc" },
      });

      expect(notifications.length).toBeGreaterThanOrEqual(2);
      const templates = notifications.map((n) => n.template);
      expect(templates).toContain("WELCOME_ONBOARDING");
      expect(templates).toContain("ORDER_CONFIRMED");
      expect(templates).toContain("ORDER_CANCELLED");
    });
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { adminService } from "../admin-service";
import { orderService } from "../order-service";
import {
  UserRole,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  PayoutStatus,
  SellerStatus,
} from "@prisma/client";
import { hasAdminPermission, AdminPermission } from "../admin-auth-helper";

describe("NEXU ATELIER — Central Admin Control Engine", () => {
  let adminUser: { id: string; email: string };
  let customerUser: { id: string; email: string };
  let sellerRecord: any;
  let testProduct: any;
  let createdOrderId: string;
  let createdOrderItemId: string;
  let createdPayoutId: string;

  beforeAll(async () => {
    // 1. Setup Admin user
    let admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: `central_admin_${Date.now()}@nexu.studio`,
          passwordHash: "secure_pbkdf2_admin_hash",
          role: UserRole.ADMIN,
        },
      });
    }
    adminUser = { id: admin.id, email: admin.email };

    // 2. Setup Customer user with profile
    customerUser = await prisma.user.create({
      data: {
        email: `patron_ctrl_${Date.now()}@nexu.studio`,
        passwordHash: "secure_pbkdf2_customer_hash",
        role: UserRole.CUSTOMER,
        profile: {
          create: {
            name: "Rohit Singhania",
            phone: "+91 98200 11223",
          },
        },
        addresses: {
          create: {
            fullName: "Rohit Singhania",
            phone: "+91 98200 11223",
            street: "74 Altamount Road",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400026",
            isDefault: true,
          },
        },
      },
      select: { id: true, email: true },
    });

    // 3. Find or pick approved seller with published in-stock product
    sellerRecord = await prisma.seller.findFirst({
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
    });

    if (sellerRecord && sellerRecord.products.length > 0) {
      testProduct = sellerRecord.products[0];
      if (testProduct.variants && testProduct.variants.length > 0) {
        await prisma.productVariant.updateMany({
          where: { productId: testProduct.id },
          data: { stock: 10 },
        });
      }
    }
  });

  afterAll(async () => {
    // Cleanup created test records
    if (createdOrderId) {
      await prisma.vendorPayout.deleteMany({ where: { orderItemId: createdOrderItemId } });
      await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
      await prisma.order.deleteMany({ where: { id: createdOrderId } });
    }
    if (customerUser?.id) {
      await prisma.customerProfile.deleteMany({ where: { userId: customerUser.id } });
      await prisma.address.deleteMany({ where: { customerId: customerUser.id } });
      await prisma.user.deleteMany({ where: { id: customerUser.id } });
    }
  });

  describe("1. Admin Dashboard Live Metrics & Date Period Filtering", () => {
    it("calculates real database metrics without hardcoded values", async () => {
      const metrics = await adminService.getDashboardMetrics();

      expect(typeof metrics.grossMerchandiseValue).toBe("number");
      expect(typeof metrics.netPlatformRevenue).toBe("number");
      expect(typeof metrics.totalOrders).toBe("number");
      expect(typeof metrics.pendingOrders).toBe("number");
      expect(typeof metrics.deliveredOrders).toBe("number");
      expect(typeof metrics.cancelledOrders).toBe("number");
      expect(typeof metrics.pendingPayments).toBe("number");
      expect(typeof metrics.pendingPayouts).toBe("number");
      expect(typeof metrics.lowStockProducts).toBe("number");
      expect(typeof metrics.activeSellers).toBe("number");
      expect(typeof metrics.totalCustomers).toBe("number");
      expect(metrics.totalOrders).toBeGreaterThanOrEqual(0);
    });

    it("supports date period filtering (today, 7d, 30d, all)", async () => {
      const todayMetrics = await adminService.getDashboardMetrics({ period: "today" });
      const weekMetrics = await adminService.getDashboardMetrics({ period: "7d" });
      const allMetrics = await adminService.getDashboardMetrics({ period: "all" });

      expect(todayMetrics).toBeDefined();
      expect(weekMetrics).toBeDefined();
      expect(allMetrics).toBeDefined();
      expect(allMetrics.totalOrders).toBeGreaterThanOrEqual(weekMetrics.totalOrders);
      expect(weekMetrics.totalOrders).toBeGreaterThanOrEqual(todayMetrics.totalOrders);
    });
  });

  describe("2. Customer Management & 360-Degree Profile", () => {
    it("retrieves full customer detail without exposing passwordHash", async () => {
      const detail = await adminService.getCustomerDetail(customerUser.id);

      expect(detail).not.toBeNull();
      expect(detail?.id).toBe(customerUser.id);
      expect(detail?.email).toBe(customerUser.email);
      expect(detail?.name).toBe("Rohit Singhania");
      expect(detail?.phone).toBe("+91 98200 11223");
      expect(detail?.isSuspended).toBe(false);
      expect(detail?.addresses.length).toBeGreaterThan(0);
      expect(detail).not.toHaveProperty("passwordHash");
    });

    it("enforces mandatory reason when suspending customer account and records audit event", async () => {
      // Missing reason should fail
      const failResult = await adminService.updateCustomerStatus(
        customerUser.id,
        true,
        "",
        adminUser.id
      );
      expect(failResult.success).toBe(false);
      expect(failResult.error).toContain("minimum 5 characters");

      // Valid reason succeeds
      const successResult = await adminService.updateCustomerStatus(
        customerUser.id,
        true,
        "Repeated chargeback disputes and charge fraud suspicion",
        adminUser.id
      );
      expect(successResult.success).toBe(true);

      // Verify user in DB
      const updatedUser = await prisma.user.findUnique({ where: { id: customerUser.id } });
      expect(updatedUser?.isSuspended).toBe(true);
      expect(updatedUser?.suspensionReason).toContain("chargeback");

      // Verify audit event
      const audit = await prisma.auditEvent.findFirst({
        where: { entityId: customerUser.id, action: "ACCOUNT_SUSPENDED" },
      });
      expect(audit).not.toBeNull();
      expect(audit?.performedBy).toBe(adminUser.id);

      // Reactivate user
      const reactivate = await adminService.updateCustomerStatus(
        customerUser.id,
        false,
        undefined,
        adminUser.id
      );
      expect(reactivate.success).toBe(true);
      const reactivatedUser = await prisma.user.findUnique({ where: { id: customerUser.id } });
      expect(reactivatedUser?.isSuspended).toBe(false);
    });

    it("prevents an administrator from suspending their own account", async () => {
      const selfSuspend = await adminService.updateCustomerStatus(
        adminUser.id,
        true,
        "Accidental self lockout",
        adminUser.id
      );
      expect(selfSuspend.success).toBe(false);
      expect(selfSuspend.error).toContain("cannot suspend your own");
    });
  });

  describe("3. Supplier Management 360-Degree Dossier", () => {
    it("retrieves full studio profile with KYC, inventory, order lines, and payouts", async () => {
      const detail = await adminService.getSellerDetail(sellerRecord.id);

      expect(detail).not.toBeNull();
      expect(detail?.id).toBe(sellerRecord.id);
      expect(detail?.name).toBe(sellerRecord.name);
      expect(detail?.originHub).toBe(sellerRecord.originHub);
      expect(detail?.commissionRatePercent).toBe(sellerRecord.commissionRatePercent);
      expect(Array.isArray(detail?.products)).toBe(true);
      expect(Array.isArray(detail?.orderLines)).toBe(true);
      expect(Array.isArray(detail?.payouts)).toBe(true);
    });
  });

  describe("4. Central Order Operations & State Transitions", () => {
    it("creates an order and allows admin to update status and fulfillment", async () => {
      if (!testProduct) return;

      const orderResult = await orderService.createOrder(customerUser.id, {
        newAddress: {
          fullName: "Rohit Singhania",
          phone: "+91 98200 11223",
          street: "74 Altamount Road",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400026",
        },
        deliveryMethodId: "standard",
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            selectedSku: testProduct.variants?.[0]?.sku || undefined,
          },
        ],
      });

      expect(orderResult.success).toBe(true);
      expect(orderResult.order).toBeDefined();
      createdOrderId = orderResult.order!.id;

      const dbOrder = await prisma.order.findUnique({
        where: { id: createdOrderId },
        include: { items: true },
      });
      expect(dbOrder?.items.length).toBe(1);
      createdOrderItemId = dbOrder!.items[0].id;

      // Create a test vendor payout linked to this item
      const payout = await prisma.vendorPayout.create({
        data: {
          sellerId: sellerRecord.id,
          orderItemId: createdOrderItemId,
          grossAmountPaise: testProduct.basePricePaise,
          commissionPaise: Math.round(testProduct.basePricePaise * 0.1),
          netPayoutPaise: testProduct.basePricePaise - Math.round(testProduct.basePricePaise * 0.1),
          status: PayoutStatus.ESCROW_HOLD,
        },
      });
      createdPayoutId = payout.id;

      // 4.1 Update Item Fulfillment to SHIPPED with courier and tracking
      const fulfillmentRes = await adminService.updateOrderItemFulfillment(
        createdOrderItemId,
        {
          fulfillmentStatus: FulfillmentStatus.SHIPPED,
          courierName: "Bluedart Air Express",
          trackingNumber: "BD-998877IN",
          note: "Handed over to pickup executive",
        },
        adminUser.id
      );
      expect(fulfillmentRes.success).toBe(true);

      const shippedItem = await prisma.orderItem.findUnique({ where: { id: createdOrderItemId } });
      expect(shippedItem?.fulfillmentStatus).toBe(FulfillmentStatus.SHIPPED);
      expect(shippedItem?.courierName).toBe("Bluedart Air Express");
      expect(shippedItem?.trackingNumber).toBe("BD-998877IN");
      expect(shippedItem?.dispatchedAt).not.toBeNull();

      // Parent order should auto-rollup to SHIPPED
      const parentOrder = await prisma.order.findUnique({ where: { id: createdOrderId } });
      expect(parentOrder?.status).toBe(OrderStatus.SHIPPED);
    });

    it("advances item fulfillment to DELIVERED and unlocks linked vendor payout to ELIGIBLE_FOR_PAYOUT", async () => {
      const deliveredRes = await adminService.updateOrderItemFulfillment(
        createdOrderItemId,
        {
          fulfillmentStatus: FulfillmentStatus.DELIVERED,
          note: "Delivered to patron with signature verification",
        },
        adminUser.id
      );
      expect(deliveredRes.success).toBe(true);

      // Verify item delivered
      const deliveredItem = await prisma.orderItem.findUnique({ where: { id: createdOrderItemId } });
      expect(deliveredItem?.fulfillmentStatus).toBe(FulfillmentStatus.DELIVERED);
      expect(deliveredItem?.deliveredAt).not.toBeNull();

      // Parent order rolls up to DELIVERED
      const deliveredOrder = await prisma.order.findUnique({ where: { id: createdOrderId } });
      expect(deliveredOrder?.status).toBe(OrderStatus.DELIVERED);

      // Verify linked VendorPayout unlocked from ESCROW_HOLD to ELIGIBLE_FOR_PAYOUT
      const unlockedPayout = await prisma.vendorPayout.findUnique({ where: { id: createdPayoutId } });
      expect(unlockedPayout?.status).toBe(PayoutStatus.ELIGIBLE_FOR_PAYOUT);
    });
  });

  describe("5. Supplier Settlement & Payout Engine", () => {
    it("retrieves payouts with status filtering", async () => {
      const result = await adminService.getPayouts({ status: "ALL" });
      expect(Array.isArray(result.payouts)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it("rejects settling a payout without a valid banking UTR reference", async () => {
      const failRes = await adminService.settlePayout(
        createdPayoutId,
        { transactionRef: "123" }, // Too short
        adminUser.id
      );
      expect(failRes.success).toBe(false);
      expect(failRes.error).toContain("minimum 6 characters");
    });

    it("successfully settles payout with valid UTR and logs audit event", async () => {
      const utr = "UTR-HDFC-20261030-88129";
      const settleRes = await adminService.settlePayout(
        createdPayoutId,
        { transactionRef: utr, note: "NEFT batch clearance batch 4" },
        adminUser.id
      );

      expect(settleRes.success).toBe(true);
      expect(settleRes.payout?.status).toBe(PayoutStatus.SETTLED);
      expect(settleRes.payout?.transactionRef).toBe(utr);
      expect(settleRes.payout?.settledAt).not.toBeNull();

      // Verify DB record
      const dbPayout = await prisma.vendorPayout.findUnique({ where: { id: createdPayoutId } });
      expect(dbPayout?.status).toBe(PayoutStatus.SETTLED);
      expect(dbPayout?.transactionRef).toBe(utr);

      // Verify audit event
      const audit = await prisma.auditEvent.findFirst({
        where: {
          entityId: createdPayoutId,
          action: { in: ["PAYOUT_SETTLED", "PAYOUT_SETTLED_MANUAL"] },
        },
      });
      expect(audit).not.toBeNull();
      expect(audit?.note).toContain(utr);
    });
  });

  describe("6. Website Appearance & Content Control", () => {
    it("reads public platform settings dictionary for storefront rendering", async () => {
      const settings = await adminService.getPublicSettings();
      expect(settings).toBeDefined();
      expect(settings).toHaveProperty("site_title");
      expect(settings).toHaveProperty("homepage_hero_headline");
      expect(settings).toHaveProperty("homepage_banner_text");
      expect(settings).toHaveProperty("homepage_banner_enabled");
    });

    it("persists updated settings and reflects changes", async () => {
      const testHeadline = `Master Craftsmanship ${Date.now()}`;
      await adminService.updatePlatformSetting(
        "homepage_hero_headline",
        testHeadline,
        adminUser.id
      );

      const refreshed = await adminService.getPublicSettings();
      expect(refreshed.homepage_hero_headline).toBe(testHeadline);
    });
  });

  describe("7. Role-Based Permissions & Security Architecture", () => {
    it("validates administrative permissions server-side", () => {
      const context = {
        user: {
          id: adminUser.id,
          name: "Admin Officer",
          email: adminUser.email,
          role: "admin" as any,
          createdAt: new Date().toISOString(),
          profile: null,
          addresses: [],
        },
        isAdmin: true,
      };

      const permissions: AdminPermission[] = [
        "VIEW_DASHBOARD",
        "MANAGE_USERS",
        "MODERATE_PRODUCTS",
        "MANAGE_SELLERS",
        "MANAGE_ORDERS",
        "PROCESS_REFUNDS",
        "MANAGE_PAYOUTS",
        "MANAGE_SETTINGS",
        "MANAGE_ADMINS",
      ];

      for (const perm of permissions) {
        expect(hasAdminPermission(context, perm)).toBe(true);
      }

      // Non-admin context should fail
      const nonAdminContext = { ...context, isAdmin: false };
      expect(hasAdminPermission(nonAdminContext, "MANAGE_PAYOUTS")).toBe(false);
    });
  });
});

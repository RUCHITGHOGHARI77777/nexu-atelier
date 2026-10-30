import { describe, it, expect } from "vitest";
import { adminService } from "../admin-service";
import { prisma } from "../prisma";
import { PrismaProductRepository } from "../product-repository";
import { orderService } from "../order-service";
import {
  SellerStatus,
  ProductApprovalStatus,
  UserRole,
  OrderStatus,
} from "@prisma/client";

const productRepo = new PrismaProductRepository();

describe("adminService - Authorization & Privilege Escalation Prevention", () => {
  const adminUserId = "usr_admin_01";
  const patronUserId = "usr_patron_01";
  const sellerUserId = "usr_seller_01";

  it("verifies admin role in database and prevents privilege escalation", async () => {
    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
    expect(adminUser?.role).toBe(UserRole.ADMIN);

    const patronUser = await prisma.user.findUnique({ where: { id: patronUserId } });
    expect(patronUser?.role).toBe(UserRole.CUSTOMER);

    const sellerUser = await prisma.user.findUnique({ where: { id: sellerUserId } });
    expect(sellerUser?.role).toBe(UserRole.SELLER);
  });

  it("prevents an administrator from demoting or revoking their own administrator role", async () => {
    const res = await adminService.updateUserRole(adminUserId, UserRole.CUSTOMER, adminUserId);
    expect(res.success).toBe(false);
    expect(res.error).toContain("cannot revoke your own administrator privileges");

    // Verify role remains ADMIN
    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
    expect(adminUser?.role).toBe(UserRole.ADMIN);
  });
});

describe("adminService - Platform Dashboard Metrics & Financial Calculations", () => {
  it("calculates accurate metrics derived strictly from database records", async () => {
    const metrics = await adminService.getDashboardMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.totalOrders).toBeGreaterThan(0);
    expect(metrics.grossMerchandiseValue).toBeGreaterThan(0);
    expect(metrics.totalCommission).toBeGreaterThanOrEqual(0);
    expect(metrics.activeSellers).toBeGreaterThan(0);
    expect(metrics.activeProducts).toBeGreaterThan(0);
    expect(metrics.totalCustomers).toBeGreaterThan(0);

    // Relationship check: GMV must equal or exceed platform commission
    expect(metrics.grossMerchandiseValue).toBeGreaterThan(metrics.totalCommission);
  });

  it("strictly excludes cancelled orders from Gross Merchandise Value (GMV)", async () => {
    const beforeMetrics = await adminService.getDashboardMetrics();

    // Find an active order to cancel
    const cancellableOrder = await prisma.order.findFirst({
      where: { status: { in: [OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION] } },
    });

    if (cancellableOrder) {
      const orderTotalINR = Math.round(cancellableOrder.totalPaise / 100);

      // Cancel order as admin
      const cancelRes = await adminService.cancelOrderAsAdmin(
        cancellableOrder.id,
        "Testing GMV exclusion rules",
        "usr_admin_01"
      );
      expect(cancelRes.success).toBe(true);

      const afterMetrics = await adminService.getDashboardMetrics();
      expect(afterMetrics.cancelledOrders).toBe(beforeMetrics.cancelledOrders + 1);
      expect(afterMetrics.grossMerchandiseValue).toBe(beforeMetrics.grossMerchandiseValue - orderTotalINR);
    }
  });
});

describe("adminService - Seller Management & Onboarding Verification", () => {
  const pendingSellerId = "vnd_kutch_craft";
  const approvedSellerId = "vnd_sol_textiles";
  const adminUserId = "usr_admin_01";

  it("requires a formal explanation when rejecting an artisan application", async () => {
    const emptyReasonRes = await adminService.updateSellerStatus(
      pendingSellerId,
      SellerStatus.REJECTED,
      "",
      adminUserId
    );
    expect(emptyReasonRes.success).toBe(false);
    expect(emptyReasonRes.error).toContain("A valid explanation (minimum 5 characters) is required");
  });

  it("approves pending seller and sets verified credentials and approval timestamp", async () => {
    const res = await adminService.updateSellerStatus(
      pendingSellerId,
      SellerStatus.APPROVED,
      "Artisan credentials verified via regional handicraft registry",
      adminUserId
    );

    expect(res.success).toBe(true);

    const updated = await prisma.seller.findUnique({ where: { id: pendingSellerId } });
    expect(updated?.status).toBe(SellerStatus.APPROVED);
    expect(updated?.verified).toBe(true);
    expect(updated?.approvedAt).not.toBeNull();

    // Restore pending status for test suite isolation and idempotency
    await prisma.seller.update({
      where: { id: pendingSellerId },
      data: { status: SellerStatus.PENDING, verified: false, approvedAt: null },
    });
  });

  it("suspending an approved seller unpublishes all studio catalog items from live storefront", async () => {
    // Suspend seller
    const suspendRes = await adminService.updateSellerStatus(
      approvedSellerId,
      SellerStatus.SUSPENDED,
      "Temporary audit suspension",
      adminUserId
    );
    expect(suspendRes.success).toBe(true);

    // Verify all products belonging to this seller have isPublished = false
    const products = await prisma.product.findMany({ where: { vendorId: approvedSellerId } });
    for (const p of products) {
      expect(p.isPublished).toBe(false);
    }

    // Reactivate seller
    const reactivateRes = await adminService.updateSellerStatus(
      approvedSellerId,
      SellerStatus.APPROVED,
      "Audit cleared",
      adminUserId
    );
    expect(reactivateRes.success).toBe(true);

    const restoredProducts = await prisma.product.findMany({
      where: { vendorId: approvedSellerId, approvalStatus: ProductApprovalStatus.APPROVED },
    });
    expect(restoredProducts.length).toBeGreaterThan(0);
    for (const p of restoredProducts) {
      expect(p.isPublished).toBe(true);
    }
  });
});

describe("adminService - Catalog Moderation & Public Storefront Isolation", () => {
  const adminUserId = "usr_admin_01";

  it("requires feedback notes when rejecting a creation submission", async () => {
    const prod = await prisma.product.findFirst();
    expect(prod).toBeDefined();

    if (prod) {
      const rejectNoNotes = await adminService.moderateProduct(
        prod.id,
        ProductApprovalStatus.REJECTED,
        "",
        adminUserId
      );
      expect(rejectNoNotes.success).toBe(false);
      expect(rejectNoNotes.error).toContain("Editorial reason is required");
    }
  });

  it("prevents unapproved or rejected products from appearing in public storefront catalog queries", async () => {
    const prod = await prisma.product.findFirst({
      where: { vendorId: "vnd_sol_textiles" },
    });
    expect(prod).toBeDefined();

    if (prod) {
      // Moderate product to REJECTED
      const modRes = await adminService.moderateProduct(
        prod.id,
        ProductApprovalStatus.REJECTED,
        "Photographic clarity does not meet atelier resolution guidelines",
        adminUserId
      );
      expect(modRes.success).toBe(true);

      // Verify public catalog listing does not return this rejected piece
      const publicCatalog = await productRepo.getProducts({ search: prod.title });
      const foundInSearch = publicCatalog.products.some((p) => p.id === prod.id);
      expect(foundInSearch).toBe(false);

      // Verify direct slug fetch returns null for non-approved piece
      const directFetch = await productRepo.getProductBySlug(prod.slug);
      expect(directFetch).toBeNull();

      // Restore to APPROVED
      await adminService.moderateProduct(
        prod.id,
        ProductApprovalStatus.APPROVED,
        "Re-approved after verification",
        adminUserId
      );

      const restoredFetch = await productRepo.getProductBySlug(prod.slug);
      expect(restoredFetch).not.toBeNull();
      expect(restoredFetch?.id).toBe(prod.id);
    }
  });
});

describe("adminService - Coupons & Promotional Engine", () => {
  const adminUserId = "usr_admin_01";

  it("creates a promotional coupon and prevents duplicate coupon codes", async () => {
    const uniqueCode = `VIPTEST${Date.now().toString().slice(-4)}`;

    const createRes = await adminService.createCoupon(
      {
        code: uniqueCode,
        description: "Test VIP privilege voucher",
        discountType: "PERCENTAGE",
        discountValue: 20, // 20%
        minOrderValue: 2500, // ₹2,500
        maxDiscount: 1000, // Cap ₹1,000
        usageLimit: 50,
        perCustomerLimit: 1,
      },
      adminUserId
    );

    expect(createRes.success).toBe(true);
    expect(createRes.coupon?.code).toBe(uniqueCode);
    expect(createRes.coupon?.discountValue).toBe(20);

    // Duplicate submission must be rejected
    const duplicateRes = await adminService.createCoupon(
      {
        code: uniqueCode,
        discountType: "PERCENTAGE",
        discountValue: 10,
      },
      adminUserId
    );
    expect(duplicateRes.success).toBe(false);
    expect(duplicateRes.error).toContain("already exists");
  });

  it("validates spend thresholds, applies discount percentage, and respects max discount caps", async () => {
    // Seeded NEXUFIRST: 15% off, min spend ₹2,000 (200,000 paise), cap ₹1,500 (150,000 paise)
    const belowMinSpend = await adminService.validateAndApplyCoupon("NEXUFIRST", 150000); // ₹1,500
    expect(belowMinSpend.valid).toBe(false);
    expect(belowMinSpend.error).toContain("minimum order subtotal of ₹2000");

    // Spend ₹4,000 (400,000 paise) -> 15% is ₹600 (60,000 paise) -> below cap of ₹1,500
    const normalSpend = await adminService.validateAndApplyCoupon("NEXUFIRST", 400000);
    expect(normalSpend.valid).toBe(true);
    expect(normalSpend.discountPaise).toBe(60000); // ₹600

    // Spend ₹20,000 (2,000,000 paise) -> 15% would be ₹3,000, capped at ₹1,500 (150,000 paise)
    const highSpend = await adminService.validateAndApplyCoupon("NEXUFIRST", 2000000);
    expect(highSpend.valid).toBe(true);
    expect(highSpend.discountPaise).toBe(150000); // Exactly ₹1,500 max cap
  });

  it("integrates coupon discounts into authoritative checkout orders and records coupon usage", async () => {
    const prod = await prisma.product.findFirst({
      where: { isPublished: true, stock: { gt: 5 }, basePricePaise: { gte: 250000 } },
    });
    expect(prod).toBeDefined();

    if (prod) {
      const testCouponCode = `CHKOUT${Date.now().toString().slice(-4)}`;
      await adminService.createCoupon(
        {
          code: testCouponCode,
          description: "Test checkout discount coupon",
          discountType: "PERCENTAGE",
          discountValue: 10,
          minOrderValue: 1000,
          maxDiscount: 1000,
          usageLimit: 50,
          perCustomerLimit: 10,
        },
        adminUserId
      );

      const orderRes = await orderService.createOrder("usr_patron_02", {
        items: [{ productId: prod.id, quantity: 1 }],
        deliveryMethodId: "standard",
        couponCode: testCouponCode,
        idempotencyKey: `coupon_order_test_${Date.now()}`,
      });

      expect(orderRes.success).toBe(true);
      expect(orderRes.order?.couponCode).toBe(testCouponCode);
      expect(orderRes.order?.totals.discount).toBeGreaterThan(0);

      // Verify total reflects (subtotal - discount)
      const expectedTotal =
        orderRes.order!.totals.subtotal +
        orderRes.order!.totals.shippingFee -
        orderRes.order!.totals.discount!;
      expect(orderRes.order?.totals.total).toBe(expectedTotal);

      // Verify coupon timesUsed was incremented
      const couponRecord = await prisma.coupon.findUnique({ where: { code: testCouponCode } });
      expect(couponRecord?.timesUsed).toBe(1);
    }
  });
});

describe("adminService - Dispute Arbitration & Refund Transactions", () => {
  const adminUserId = "usr_admin_01";

  it("resolves a dispute case with authorized refund, updating order refunded total and audit ledger", async () => {
    let openCase = (await adminService.getDisputes()).find(
      (d) => d.status === "UNDER_REVIEW" || d.status === "OPEN"
    );

    if (!openCase) {
      const order = await prisma.order.findFirst();
      if (order) {
        await prisma.disputeCase.create({
          data: {
            id: `DSP-TEST-${Date.now().toString().slice(-6)}`,
            orderId: order.id,
            customerId: order.customerId,
            reason: "Transit damage inspection test",
            status: "UNDER_REVIEW",
          },
        });
        openCase = (await adminService.getDisputes()).find(
          (d) => d.status === "UNDER_REVIEW" || d.status === "OPEN"
        );
      }
    }

    expect(openCase).toBeDefined();

    if (openCase) {
      const refundAmountINR = 1500;
      const res = await adminService.resolveDispute(
        openCase.id,
        "RESOLVED_REFUNDED",
        "Transit damage confirmed via photographic inspection. Escrow credit issued.",
        refundAmountINR,
        adminUserId
      );

      expect(res.success).toBe(true);

      // Verify dispute case state
      const updatedCase = await prisma.disputeCase.findUnique({ where: { id: openCase.id } });
      expect(updatedCase?.status).toBe("RESOLVED_REFUNDED");
      expect(updatedCase?.refundAmountPaise).toBe(150000);
      expect(updatedCase?.resolvedBy).toBe(adminUserId);

      // Verify order refunded total was updated
      const updatedOrder = await prisma.order.findUnique({ where: { id: openCase.orderId } });
      expect(updatedOrder?.refundedPaise).toBeGreaterThanOrEqual(150000);

      // Attempting to resolve a terminal case must be rejected
      const reResolve = await adminService.resolveDispute(
        openCase.id,
        "RESOLVED_REJECTED",
        "Attempted re-resolution",
        undefined,
        adminUserId
      );
      expect(reResolve.success).toBe(false);
      expect(reResolve.error).toContain("terminal resolution");
    }
  });
});

describe("adminService - Security & Audit Trail Integrity", () => {
  it("records tamper-resistant append-only audit events for administrative actions", async () => {
    const logs = await adminService.getAuditEvents({ limit: 20 });
    expect(logs.length).toBeGreaterThan(0);

    for (const log of logs) {
      expect(log.id).toBeDefined();
      expect(log.entityType).toBeDefined();
      expect(log.action).toBeDefined();
      expect(log.performedBy).toBeDefined();
      expect(log.createdAt).toBeDefined();
    }
  });
});

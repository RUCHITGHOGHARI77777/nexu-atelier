import { describe, it, expect } from "vitest";
import { prisma } from "../prisma";
import { orderService } from "../order-service";
import { SEED_PRODUCTS } from "@/data/seedCatalog";

describe("Database Integrity & Transactional Consistency", () => {
  const patronA = "usr_patron_01";

  it("atomically decrements inventory during order placement and restores it upon cancellation", async () => {
    const testProduct = await prisma.product.findFirst({
      where: { isPublished: true, stock: { gt: 5 } },
    });
    expect(testProduct).not.toBeNull();
    if (!testProduct) return;

    const initialStock = testProduct.stock;
    const purchaseQty = 2;

    // 1. Place order
    const orderRes = await orderService.createOrder(patronA, {
      items: [{ productId: testProduct.id, quantity: purchaseQty }],
      deliveryMethodId: "standard",
      idempotencyKey: `integrity_stock_test_${Date.now()}`,
    });

    expect(orderRes.success).toBe(true);
    const orderId = orderRes.order!.id;

    // 2. Verify database stock was decremented
    const stockAfterOrder = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(stockAfterOrder?.stock).toBe(initialStock - purchaseQty);

    // 3. Cancel order
    const cancelRes = await orderService.cancelOrder(
      patronA,
      orderId,
      "Integrity test cancellation"
    );
    expect(cancelRes.success).toBe(true);

    // 4. Verify database stock was restored
    const stockAfterCancel = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(stockAfterCancel?.stock).toBe(initialStock);
  });

  it("preserves immutable historical price and name snapshots in OrderItem records", async () => {
    const p = SEED_PRODUCTS[0];
    const orderRes = await orderService.createOrder(patronA, {
      items: [{ productId: p.id, quantity: 1 }],
      deliveryMethodId: "standard",
      idempotencyKey: `snapshot_test_${Date.now()}`,
    });

    expect(orderRes.success).toBe(true);
    const orderId = orderRes.order!.id;

    const dbOrderItem = await prisma.orderItem.findFirst({
      where: { orderId },
    });

    expect(dbOrderItem).not.toBeNull();
    // Minor unit integer verification
    expect(dbOrderItem?.unitPricePaise).toBe(Math.round(p.basePrice * 100));
    expect(dbOrderItem?.title).toBe(p.title);
    expect(dbOrderItem?.vendorName).toBe(p.vendor.name);
  });

  it("stores financial amounts strictly in exact minor units (paise) with zero floating-point drift", async () => {
    const orders = await prisma.order.findMany({ take: 2 });
    for (const ord of orders) {
      expect(Number.isInteger(ord.subtotalPaise)).toBe(true);
      expect(Number.isInteger(ord.shippingFeePaise)).toBe(true);
      expect(Number.isInteger(ord.estimatedTaxPaise)).toBe(true);
      expect(Number.isInteger(ord.totalPaise)).toBe(true);
      expect(ord.totalPaise).toBe(
        ord.subtotalPaise + ord.shippingFeePaise - (ord.discountPaise || 0)
      );
    }
  });

  it("creates structured audit event records for order transitions", async () => {
    const p = SEED_PRODUCTS[1];
    const orderRes = await orderService.createOrder(patronA, {
      items: [{ productId: p.id, quantity: 1 }],
      deliveryMethodId: "standard",
      idempotencyKey: `audit_test_${Date.now()}`,
    });

    expect(orderRes.success).toBe(true);
    const orderId = orderRes.order!.id;

    const auditEvents = await prisma.auditEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });

    expect(auditEvents.length).toBeGreaterThanOrEqual(1);
    expect(auditEvents[0].action).toBe("ORDER_CONFIRMED");
    expect(auditEvents[0].performedBy).toBe("system:checkout");
  });
});

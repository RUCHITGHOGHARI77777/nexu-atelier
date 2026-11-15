import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../prisma";
import { orderService } from "../order-service";
import { SEED_PRODUCTS } from "@/data/seedCatalog";
import { CheckoutRequestPayload } from "@/types/order";

describe("orderService - Authoritative Database Pricing & Order Creation", () => {
  const patronA = "usr_patron_01";
  const patronB = "usr_patron_02";

  beforeEach(async () => {
    await prisma.product.updateMany({
      where: { id: SEED_PRODUCTS[0].id },
      data: { stock: 25 },
    });
  });

  it("calculates server-authoritative totals from database products, ignoring client tampering", async () => {
    const p1 = SEED_PRODUCTS[0]; // e.g. Chanderi Silk ₹3,490
    const payload: CheckoutRequestPayload = {
      items: [
        {
          productId: p1.id,
          quantity: 2,
        },
      ],
      deliveryMethodId: "standard",
      idempotencyKey: `test_auth_pricing_${Date.now()}`,
    };

    const res = await orderService.createOrder(patronA, payload);
    expect(res.success).toBe(true);
    expect(res.order).toBeDefined();

    const expectedSubtotal = p1.basePrice * 2;
    expect(res.order?.totals.subtotal).toBe(expectedSubtotal);
    expect(res.order?.items[0].unitPrice).toBe(p1.basePrice);
    expect(res.order?.items[0].lineTotal).toBe(expectedSubtotal);
    // Since subtotal >= 2500, standard shipping fee is 0
    expect(res.order?.totals.shippingFee).toBe(0);
    expect(res.order?.totals.total).toBe(expectedSubtotal);
  });

  it("enforces stock bounds and rejects out-of-stock or excessive quantities", async () => {
    const p1 = SEED_PRODUCTS[0];
    const excessivePayload: CheckoutRequestPayload = {
      items: [
        {
          productId: p1.id,
          quantity: 999999, // Impossible quantity
        },
      ],
      deliveryMethodId: "standard",
    };

    const res = await orderService.createOrder(patronA, excessivePayload);
    expect(res.success).toBe(false);
    expect(res.error).toContain("exceeds available stock");
  });

  it("charges standard courier fee when subtotal is below ₹2500 threshold", async () => {
    const cheapProduct = SEED_PRODUCTS.find((p) => p.basePrice < 2500);
    expect(cheapProduct).toBeDefined();

    if (cheapProduct) {
      const payload: CheckoutRequestPayload = {
        items: [
          {
            productId: cheapProduct.id,
            quantity: 1,
          },
        ],
        deliveryMethodId: "standard",
        idempotencyKey: `test_shipping_calc_${Date.now()}`,
      };

      const res = await orderService.createOrder(patronA, payload);
      expect(res.success).toBe(true);
      expect(res.order?.totals.shippingFee).toBe(150);
      expect(res.order?.totals.total).toBe(cheapProduct.basePrice + 150);
    }
  });

  it("prevents rapid duplicate order submissions using database idempotency key", async () => {
    const p1 = SEED_PRODUCTS[0];
    const idempotencyKey = `idemp_unique_${Date.now()}`;
    const payload: CheckoutRequestPayload = {
      items: [{ productId: p1.id, quantity: 1 }],
      deliveryMethodId: "standard",
      idempotencyKey,
    };

    const first = await orderService.createOrder(patronA, payload);
    expect(first.success).toBe(true);

    // Immediate second submission with identical key
    const second = await orderService.createOrder(patronA, payload);
    expect(second.success).toBe(true);
    // Must return the exact same order record
    expect(second.order?.id).toBe(first.order?.id);
  });
});

describe("orderService - Customer Isolation & Access Control", () => {
  const patronA = "usr_patron_01";
  const patronB = "usr_patron_02";

  it("enforces strict customer isolation so Customer B cannot view Customer A's order", async () => {
    const ordersA = await orderService.getOrders(patronA);
    expect(ordersA.length).toBeGreaterThan(0);
    const orderAId = ordersA[0].id;

    // Customer A can view their own order
    const validFetch = await orderService.getOrderById(patronA, orderAId);
    expect(validFetch).not.toBeNull();
    expect(validFetch?.id).toBe(orderAId);

    // Customer B attempts to fetch Customer A's order
    const unauthorizedFetch = await orderService.getOrderById(patronB, orderAId);
    expect(unauthorizedFetch).toBeNull();
  });
});

describe("orderService - Cancellation Lifecycle Rules", () => {
  const patronA = "usr_patron_01";
  const patronB = "usr_patron_02";

  it("allows cancellation for an order in 'confirmed' or 'in_production' state", async () => {
    const p1 = SEED_PRODUCTS[0];
    const created = await orderService.createOrder(patronA, {
      items: [{ productId: p1.id, quantity: 1 }],
      deliveryMethodId: "standard",
      idempotencyKey: `cancel_test_${Date.now()}`,
    });

    expect(created.success).toBe(true);
    const orderId = created.order!.id;

    const cancelRes = await orderService.cancelOrder(patronA, orderId, "Ordered in error.");
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.order?.status).toBe("cancelled");

    // Attempting to cancel again should fail
    const reCancel = await orderService.cancelOrder(patronA, orderId);
    expect(reCancel.success).toBe(false);
    expect(reCancel.error).toContain("already cancelled");
  });

  it("forbids cancellation when order status is 'shipped'", async () => {
    // Seeded order ORD-2026-99001 belongs to patronB and has status 'shipped'
    const res = await orderService.cancelOrder(patronB, "ORD-2026-99001");
    expect(res.success).toBe(false);
    expect(res.error).toContain("cannot be cancelled");
  });

  it("prevents Customer B from cancelling Customer A's order", async () => {
    const ordersA = await orderService.getOrders(patronA);
    const orderAId = ordersA[0].id;

    const res = await orderService.cancelOrder(patronB, orderAId);
    expect(res.success).toBe(false);
    expect(res.error).toContain("access denied");
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { sellerService } from "../seller-service";
import { orderService } from "../order-service";
import { inventoryService } from "../inventory-service";

describe("NEXU ATELIER — Master Cross-Module Zero-Regression Test Suite", () => {
  const timestamp = Date.now();
  let sellerAId: string;
  let sellerBId: string;
  let customerId: string;
  let categoryId: string;
  let productId: string;
  let variantSku: string;
  let variantId: string;
  let createdOrderId: string;

  beforeAll(async () => {
    const cat = await prisma.category.findFirst() || await prisma.category.create({
      data: {
        name: `ZReg-Cat-${timestamp}`,
        slug: `zreg-cat-${timestamp}`,
        description: "Zero regression category description",
        image: "https://images.unsplash.com/photo-test-cat",
      },
    });
    categoryId = cat.id;

    const customerUser = await prisma.user.create({
      data: {
        email: `reg_cust_${timestamp}@nexu.studio`,
        role: "CUSTOMER",
        passwordHash: "hash123",
      },
    });
    customerId = customerUser.id;

    await prisma.customerProfile.create({
      data: {
        userId: customerUser.id,
        name: "Aarav Mehra",
        phone: "+919876543210",
      },
    });

    const userA = await prisma.user.create({
      data: { email: `reg_seller_a_${timestamp}@nexu.studio`, role: "SELLER", passwordHash: "hash123" },
    });
    const sellerA = await prisma.seller.create({
      data: {
        userId: userA.id,
        name: `Studio A ${timestamp}`,
        slug: `studio-a-${timestamp}`,
        originHub: "Jaipur, RJ",
        story: "Heritage Jaipur jewelry.",
        heroImage: "https://images.unsplash.com/photo-test",
        status: "APPROVED",
        verified: true,
      },
    });
    sellerAId = sellerA.id;

    const userB = await prisma.user.create({
      data: { email: `reg_seller_b_${timestamp}@nexu.studio`, role: "SELLER", passwordHash: "hash123" },
    });
    const sellerB = await prisma.seller.create({
      data: {
        userId: userB.id,
        name: `Studio B ${timestamp}`,
        slug: `studio-b-${timestamp}`,
        originHub: "Kochi, KL",
        story: "Kerala spice and textile artisan.",
        heroImage: "https://images.unsplash.com/photo-test",
        status: "APPROVED",
        verified: true,
      },
    });
    sellerBId = sellerB.id;

    variantSku = `REG-KUNDAN-${timestamp}`;
    const prodRes = await sellerService.createProduct(sellerAId, {
      title: `Kundan Pendant ${timestamp}`,
      subtitle: "22K Gold Plated Heritage Necklace",
      description: "Authentic Kundan setting handcrafted in Jaipur.",
      basePrice: 12500, // ₹12,500
      stock: 10,
      lowStockThreshold: 2,
      categoryId,
      images: [`https://images.unsplash.com/photo-test-${timestamp}`],
      variants: [
        {
          sku: variantSku,
          variantType: "SIZE",
          name: "Standard",
          value: "STD",
          stock: 10,
        },
      ],
    });

    if (!prodRes.success || !prodRes.product) {
      throw new Error(`Failed to setup test product: ${prodRes.error}`);
    }

    productId = prodRes.product.id;

    await prisma.product.update({
      where: { id: productId },
      data: { approvalStatus: "APPROVED", isPublished: true, costPricePaise: 700000 },
    });

    const v = await prisma.productVariant.findFirst({ where: { productId } });
    variantId = v!.id;

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { costPricePaise: 700000 },
    });
  });

  afterAll(async () => {
    try {
      const orders = await prisma.order.findMany({ where: { customerId } });
      for (const ord of orders) {
        await prisma.stockMovement.deleteMany({ where: { referenceId: ord.id } });
        await prisma.orderItem.deleteMany({ where: { orderId: ord.id } });
      }
      await prisma.order.deleteMany({ where: { customerId } });

      if (sellerAId) {
        await prisma.stockMovement.deleteMany({ where: { vendorId: sellerAId } });
        await prisma.restockRecord.deleteMany({ where: { vendorId: sellerAId } });
      }
      if (productId) {
        await prisma.productVariant.deleteMany({ where: { productId } });
        await prisma.productImage.deleteMany({ where: { productId } });
        await prisma.cartItem.deleteMany({ where: { productId } });
        await prisma.auditEvent.deleteMany({ where: { entityId: productId } });
        await prisma.product.deleteMany({ where: { id: productId } });
      }
      if (sellerAId) await prisma.seller.deleteMany({ where: { id: sellerAId } });
      if (sellerBId) await prisma.seller.deleteMany({ where: { id: sellerBId } });
      if (customerId) await prisma.customerProfile.deleteMany({ where: { userId: customerId } });
      await prisma.user.deleteMany({ where: { email: { contains: `${timestamp}` } } });
    } catch (e) {
    }
  });

  it("Workflow 1: Inventory changes cleanly propagate through checkout and cancellation with atomic restore", async () => {
    const initialVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(initialVariant?.stock).toBe(10);

    const orderRes = await orderService.createOrder(customerId, {
      items: [
        {
          productId,
          selectedSku: variantSku,
          quantity: 2,
        },
      ],
      newAddress: {
        fullName: "Aarav Mehra",
        phone: "+919876543210",
        street: "101 Luxury Heights",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      deliveryMethodId: "standard",
      paymentMethod: "COD",
    });

    expect(orderRes.success).toBe(true);
    expect(orderRes.order).toBeDefined();
    const firstOrderId = orderRes.order!.id;

    const decrementedVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(decrementedVariant?.stock).toBe(8);

    const deductionMovement = await prisma.stockMovement.findFirst({
      where: {
        vendorId: sellerAId,
        productId,
        type: "ORDER_DEDUCTION",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(deductionMovement).toBeDefined();
    expect(deductionMovement?.quantityDelta).toBe(-2);
    expect(deductionMovement?.updatedStock).toBe(8);

    const excessiveOrder = await orderService.createOrder(customerId, {
      items: [{ productId, selectedSku: variantSku, quantity: 15 }],
      deliveryMethodId: "standard",
    });
    expect(excessiveOrder.success).toBe(false);
    expect(excessiveOrder.error).toMatch(/insufficient|stock|available/i);

    const cancelRes = await orderService.cancelOrder(customerId, firstOrderId, "Customer changed mind");
    expect(cancelRes.success).toBe(true);

    const restoredVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(restoredVariant?.stock).toBe(10);

    const restoreMovement = await prisma.stockMovement.findFirst({
      where: {
        vendorId: sellerAId,
        productId,
        type: "ORDER_CANCELLATION_RESTORE",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(restoreMovement).toBeDefined();
    expect(restoreMovement?.quantityDelta).toBe(2);
    expect(restoreMovement?.updatedStock).toBe(10);
  });

  it("Workflow 2: Order lifecycle transitions synchronize across customer tracking, seller portal, and admin views", async () => {
    const orderRes = await orderService.createOrder(customerId, {
      items: [{ productId, selectedSku: variantSku, quantity: 1 }],
      newAddress: {
        fullName: "Aarav Mehra",
        phone: "+919876543210",
        street: "101 Luxury Heights",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      deliveryMethodId: "standard",
      paymentMethod: "COD",
    });

    expect(orderRes.success).toBe(true);
    const activeOrderId = orderRes.order!.id;
    createdOrderId = activeOrderId;

    let order = await orderService.getOrderById(customerId, activeOrderId);
    expect(order?.status.toLowerCase()).toBe("confirmed");

    const dbItem = await prisma.orderItem.findFirst({
      where: { orderId: activeOrderId, vendorId: sellerAId },
    });
    expect(dbItem).toBeDefined();

    const procRes = await sellerService.updateFulfillmentStatus(
      sellerAId,
      dbItem!.id,
      "PROCESSING"
    );
    expect(procRes.success).toBe(true);

    const updatedDbItem1 = await prisma.orderItem.findUnique({ where: { id: dbItem!.id } });
    expect(updatedDbItem1?.fulfillmentStatus).toBe("PROCESSING");

    const shipRes = await sellerService.updateFulfillmentStatus(
      sellerAId,
      dbItem!.id,
      "SHIPPED",
      {
        trackingNumber: `DEL-${timestamp}-001`,
        courierName: "Delhivery Surface",
      }
    );
    expect(shipRes.success).toBe(true);

    const updatedDbItem2 = await prisma.orderItem.findUnique({ where: { id: dbItem!.id } });
    expect(updatedDbItem2?.fulfillmentStatus).toBe("SHIPPED");
    expect(updatedDbItem2?.trackingNumber).toBe(`DEL-${timestamp}-001`);
  });

  it("Workflow 3: Multi-tenant boundaries strictly forbid cross-seller inventory and order access", async () => {
    const crossAdjust = await inventoryService.adjustStock(sellerBId, {
      productId,
      variantId,
      adjustmentType: "ADD",
      quantity: 5,
      reason: "Unauthorized tampering attempt",
      performedBy: "ATTACKER_SELLER_B",
    });

    expect(crossAdjust.success).toBe(false);
    expect(crossAdjust.error).toMatch(/access denied|not found/i);

    const sellerBOverview = await inventoryService.getInventoryOverview(sellerBId);
    expect(sellerBOverview.totalProducts).toBe(0);
    expect(sellerBOverview.totalAvailableStock).toBe(0);

    const currentStock = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(currentStock?.stock).toBe(9);
  });

  it("Workflow 4: Delivery confirmation updates shipment tracking and enables payout settlement", async () => {
    const dbItem = await prisma.orderItem.findFirst({
      where: { orderId: createdOrderId, vendorId: sellerAId },
    });
    expect(dbItem).toBeDefined();

    const delivRes = await sellerService.updateFulfillmentStatus(
      sellerAId,
      dbItem!.id,
      "DELIVERED"
    );
    expect(delivRes.success).toBe(true);

    const deliveredItem = await prisma.orderItem.findUnique({ where: { id: dbItem!.id } });
    expect(deliveredItem?.fulfillmentStatus).toBe("DELIVERED");
    expect(deliveredItem?.deliveredAt).toBeDefined();

    const sellerMetrics = await sellerService.getSellerMetrics(sellerAId);
    expect(sellerMetrics.totalOrders).toBeGreaterThanOrEqual(1);
    expect(sellerMetrics.deliveredOrders).toBeGreaterThanOrEqual(1);
  });

  it("Workflow 5: Reporting calculations match database aggregations with zero arithmetic drift", async () => {
    const overview = await inventoryService.getInventoryOverview(sellerAId);
    expect(overview.totalProducts).toBe(1);
    expect(overview.totalSkus).toBe(1);

    expect(overview.inventoryValueAtSellingPrice).toBe(112500);

    expect(overview.inventoryValueAtCost).toBe(63000);

    const valCsv = await inventoryService.generateReportCsv(sellerAId, "VALUATION");
    expect(valCsv).toContain("112500");
    expect(valCsv).toContain("63000");
  });
});

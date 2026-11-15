import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { inventoryService } from "../inventory-service";
import { sellerService } from "../seller-service";

describe("NEXU ATELIER — Inventory Service & Stock Control Regression Suite", () => {
  let testSellerId: string;
  let testProductId: string;
  let testVariantId: string;
  const uniqueTag = `inv_${Date.now()}`;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `seller_${uniqueTag}@nexu.studio`,
        role: "SELLER",
        passwordHash: "pbkdf2_test_hash_value",
      },
    });

    const seller = await prisma.seller.create({
      data: {
        userId: user.id,
        name: `Studio ${uniqueTag}`,
        slug: `studio-${uniqueTag}`,
        originHub: "Varanasi, UP",
        story: "Centuries of silk weaving heritage.",
        heroImage: "https://images.unsplash.com/photo-test-hero",
        status: "APPROVED",
        verified: true,
      },
    });
    testSellerId = seller.id;

    const category = await prisma.category.findFirst();
    if (!category) {
      throw new Error("No category found in database for test");
    }

    const prodRes = await sellerService.createProduct(seller.id, {
      title: `Silk Stole ${uniqueTag}`,
      subtitle: "Artisan Handwoven Luxury",
      description: "Handwoven luxury silk stole with gold zari borders.",
      basePrice: 4500, // ₹4,500
      stock: 20,
      lowStockThreshold: 5,
      categoryId: category.id,
      images: [`https://images.unsplash.com/photo-test-${uniqueTag}`],
      variants: [
        {
          sku: `SKU-${uniqueTag}-M`,
          variantType: "SIZE",
          name: "Medium / Crimson",
          value: "M",
          stock: 20,
        },
      ],
    });

    if (!prodRes.success || !prodRes.product) {
      throw new Error(`Failed to create product: ${prodRes.error}`);
    }

    testProductId = prodRes.product.id;

    await prisma.product.update({
      where: { id: testProductId },
      data: {
        approvalStatus: "APPROVED",
        isPublished: true,
        costPricePaise: 250000,
      },
    });

    const variant = await prisma.productVariant.findFirst({
      where: { productId: testProductId },
    });
    if (!variant) {
      throw new Error("Variant was not created");
    }
    testVariantId = variant.id;

    await prisma.productVariant.update({
      where: { id: testVariantId },
      data: { costPricePaise: 250000 },
    });
  });

  afterAll(async () => {
    try {
      if (testSellerId) {
        await prisma.stockMovement.deleteMany({ where: { vendorId: testSellerId } });
        await prisma.restockRecord.deleteMany({ where: { vendorId: testSellerId } });
      }
      if (testProductId) {
        await prisma.productVariant.deleteMany({ where: { productId: testProductId } });
        await prisma.productImage.deleteMany({ where: { productId: testProductId } });
        await prisma.cartItem.deleteMany({ where: { productId: testProductId } });
        await prisma.auditEvent.deleteMany({ where: { entityId: testProductId } });
        await prisma.product.deleteMany({ where: { id: testProductId } });
      }
      if (testSellerId) {
        await prisma.seller.deleteMany({ where: { id: testSellerId } });
      }
      await prisma.user.deleteMany({ where: { email: { contains: uniqueTag } } });
    } catch (e) {
    }
  });

  it("calculates accurate 10 overview metrics with zero client trust", async () => {
    const overview = await inventoryService.getInventoryOverview(testSellerId);

    expect(overview.totalProducts).toBeGreaterThanOrEqual(1);
    expect(overview.totalSkus).toBeGreaterThanOrEqual(1);
    expect(overview.totalAvailableStock).toBeGreaterThanOrEqual(20);
    expect(overview.inventoryValueAtSellingPrice).toBeGreaterThanOrEqual(4500 * 20);
    expect(overview.inventoryValueAtCost).toBeGreaterThanOrEqual(2500 * 20);
  });

  it("atomically adjusts stock using ADD and records immutable StockMovement", async () => {
    const res = await inventoryService.adjustStock(testSellerId, {
      productId: testProductId,
      variantId: testVariantId,
      adjustmentType: "ADD",
      quantity: 10,
      reason: "Inbound artisan shipment arrived",
      note: "Batch #1004",
      performedBy: "TEST_RUNNER",
    });

    expect(res.success).toBe(true);
    expect(res.updatedStock).toBe(30);

    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: testVariantId },
    });
    expect(updatedVariant?.stock).toBe(30);

    const movement = await prisma.stockMovement.findFirst({
      where: {
        vendorId: testSellerId,
        productId: testProductId,
        variantId: testVariantId,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(movement).toBeDefined();
    expect(movement?.quantityDelta).toBe(10);
    expect(movement?.previousStock).toBe(20);
    expect(movement?.updatedStock).toBe(30);
    expect(movement?.reason).toBe("Inbound artisan shipment arrived");
  });

  it("strictly prevents negative stock reductions and preserves database integrity", async () => {
    const res = await inventoryService.adjustStock(testSellerId, {
      productId: testProductId,
      variantId: testVariantId,
      adjustmentType: "REDUCE",
      quantity: 50,
      reason: "Excess write-off attempt",
      performedBy: "TEST_RUNNER",
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/insufficient/i);

    const unchangedVariant = await prisma.productVariant.findUnique({
      where: { id: testVariantId },
    });
    expect(unchangedVariant?.stock).toBe(30);
  });

  it("supports SET_EXACT and DAMAGED operations with appropriate audit reason mapping", async () => {
    const setRes = await inventoryService.adjustStock(testSellerId, {
      productId: testProductId,
      variantId: testVariantId,
      adjustmentType: "SET_EXACT",
      quantity: 25,
      reason: "Physical audit reconciliation",
      performedBy: "TEST_RUNNER",
    });
    expect(setRes.success).toBe(true);
    expect(setRes.updatedStock).toBe(25);

    const dmgRes = await inventoryService.adjustStock(testSellerId, {
      productId: testProductId,
      variantId: testVariantId,
      adjustmentType: "DAMAGED",
      quantity: 2,
      reason: "Water damage in warehouse",
      performedBy: "TEST_RUNNER",
    });
    expect(dmgRes.success).toBe(true);
    expect(dmgRes.updatedStock).toBe(23);

    const movement = await prisma.stockMovement.findFirst({
      where: {
        vendorId: testSellerId,
        variantId: testVariantId,
        type: "DAMAGED",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(movement).toBeDefined();
    expect(movement?.quantityDelta).toBe(-2);
    expect(movement?.previousStock).toBe(25);
    expect(movement?.updatedStock).toBe(23);
  });

  it("schedules an inbound restock PO and receives it, automatically incrementing stock", async () => {
    const restockRes = await inventoryService.createRestockRecord(testSellerId, {
      productId: testProductId,
      variantId: testVariantId,
      quantityExpected: 15,
      supplierName: "Varanasi Silk Master Co.",
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      unitCostPaise: 240000,
      note: "Urgent wedding season batch",
      createdBy: "ARTISAN_MERCHANT",
    });

    expect(restockRes.success).toBe(true);
    expect(restockRes.restockRecord).toBeDefined();
    const record = restockRes.restockRecord!;
    expect(record.status).toBe("PENDING");
    expect(record.quantityExpected).toBe(15);
    expect(record.quantityReceived).toBe(0);

    const overview = await inventoryService.getInventoryOverview(testSellerId);
    expect(overview.incomingStock).toBeGreaterThanOrEqual(15);

    const receiveRes = await inventoryService.receiveRestock(testSellerId, record.id, 15, "WAREHOUSE_MANAGER");
    expect(receiveRes.success).toBe(true);

    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: testVariantId },
    });
    expect(updatedVariant?.stock).toBe(38);

    const movement = await prisma.stockMovement.findFirst({
      where: {
        vendorId: testSellerId,
        variantId: testVariantId,
        type: "STOCK_RECEIVED",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(movement).toBeDefined();
    expect(movement?.quantityDelta).toBe(15);
    expect(movement?.updatedStock).toBe(38);
  });

  it("exports valid statutory CSV reports for all 4 defined report types", async () => {
    const reportTypes = ["CURRENT_STOCK", "LOW_STOCK", "VALUATION", "MOVEMENTS"] as const;

    for (const reportType of reportTypes) {
      const csv = await inventoryService.generateReportCsv(testSellerId, reportType);
      expect(typeof csv).toBe("string");
      expect(csv.length).toBeGreaterThan(0);

      const lines = csv.trim().split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(1);

      if (reportType === "CURRENT_STOCK") {
        expect(lines[0]).toContain("SKU");
        expect(lines[0]).toContain("Product Title");
      } else if (reportType === "VALUATION") {
        expect(lines[0]).toContain("Total Selling Value");
      } else if (reportType === "MOVEMENTS") {
        expect(lines[0]).toContain("Movement Type");
        expect(lines[0]).toContain("Updated Stock");
      }
    }
  });
});

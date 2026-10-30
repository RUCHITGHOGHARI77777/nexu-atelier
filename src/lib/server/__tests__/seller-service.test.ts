import { describe, it, expect } from "vitest";
import { sellerService } from "../seller-service";
import { prisma } from "../prisma";
import { SellerProductInput } from "@/types/seller";

describe("sellerService - Multi-Tenant Isolation & Access Control", () => {
  const sellerAId = "vnd_sol_textiles"; // Solstice Textiles (Approved)
  const sellerBId = "vnd_voxel_audio"; // Voxel Audio (Approved)
  const pendingSellerId = "vnd_kutch_craft"; // Pending artisan
  const rejectedSellerId = "vnd_rejected_craft"; // Rejected artisan

  it("ensures Seller A cannot view or retrieve Seller B's catalog", async () => {
    const resA = await sellerService.getProducts(sellerAId);
    expect(resA.products.length).toBeGreaterThan(0);

    // Verify all returned products strictly belong to Seller A
    for (const p of resA.products) {
      expect(p.vendor.id).toBe(sellerAId);
      expect(p.vendor.id).not.toBe(sellerBId);
    }
  });

  it("prevents Seller A from updating or modifying a product owned by Seller B", async () => {
    const resB = await sellerService.getProducts(sellerBId);
    expect(resB.products.length).toBeGreaterThan(0);
    const sellerBProduct = resB.products[0];

    const updateAttempt = await sellerService.updateProduct(sellerAId, sellerBProduct.id, {
      title: "Malicious Tampering Attempt",
    });

    expect(updateAttempt.success).toBe(false);
    expect(updateAttempt.error).toContain("access denied");

    // Verify product was not altered in DB
    const unchanged = await prisma.product.findUnique({ where: { id: sellerBProduct.id } });
    expect(unchanged?.title).toBe(sellerBProduct.title);
  });

  it("prevents Seller A from archiving a product owned by Seller B", async () => {
    const resB = await sellerService.getProducts(sellerBId);
    const sellerBProduct = resB.products[0];

    const archiveAttempt = await sellerService.archiveProduct(sellerAId, sellerBProduct.id);
    expect(archiveAttempt.success).toBe(false);
    expect(archiveAttempt.error).toContain("access denied");
  });

  it("prevents Seller A from viewing or accessing Seller B's order fulfillment lines", async () => {
    const ordersA = await sellerService.getOrderLines(sellerAId);
    const ordersB = await sellerService.getOrderLines(sellerBId);

    // If Seller B has orders, verify Seller A cannot access Seller B's order item
    if (ordersB.orderLines.length > 0) {
      const orderBLine = ordersB.orderLines[0];

      // Seller A tries to advance Seller B's order item status
      const unauthorizedUpdate = await sellerService.updateFulfillmentStatus(
        sellerAId,
        orderBLine.id,
        "PROCESSING"
      );

      expect(unauthorizedUpdate.success).toBe(false);
      expect(unauthorizedUpdate.error).toContain("access denied");
    }
  });
});

describe("sellerService - Onboarding & Studio Approval Enforcement", () => {
  const pendingSellerId = "vnd_kutch_craft";
  const rejectedSellerId = "vnd_rejected_craft";
  const approvedSellerId = "vnd_sol_textiles";

  it("blocks unapproved (PENDING) sellers from publishing new products", async () => {
    const payload: SellerProductInput = {
      title: "Unauthorized Heritage Shawl",
      subtitle: "Pending verification piece",
      description: "Handcrafted unapproved item intended for catalog testing.",
      categoryId: "cat_apparel",
      basePrice: 5000,
      stock: 10,
      images: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80"],
    };

    const res = await sellerService.createProduct(pendingSellerId, payload);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Only approved studios can publish new pieces");
  });

  it("blocks rejected sellers from publishing new products", async () => {
    const payload: SellerProductInput = {
      title: "Rejected Factory Item",
      subtitle: "Unverified merchandise",
      description: "Low quality unverified batch intended for catalog testing.",
      categoryId: "cat_apparel",
      basePrice: 1200,
      stock: 50,
      images: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80"],
    };

    const res = await sellerService.createProduct(rejectedSellerId, payload);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Only approved studios can publish new pieces");
  });

  it("allows verified and APPROVED sellers to publish new products", async () => {
    const uniqueTitle = `Botanical Silk Scarf ${Date.now()}`;
    const payload: SellerProductInput = {
      title: uniqueTitle,
      subtitle: "Natural dye collection",
      description: "Hand-spun silk scarf using natural pomegranate rind dyes.",
      categoryId: "cat_apparel",
      basePrice: 3800,
      compareAtPrice: 4500,
      stock: 12,
      images: [
        "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          sku: `SLS-BOT-${Date.now()}-S`,
          variantType: "SIZE",
          name: "Standard",
          value: "S",
          stock: 6,
        },
        {
          sku: `SLS-BOT-${Date.now()}-M`,
          variantType: "SIZE",
          name: "Large",
          value: "M",
          stock: 6,
        },
      ],
    };

    const res = await sellerService.createProduct(approvedSellerId, payload);
    expect(res.success).toBe(true);
    expect(res.product).toBeDefined();
    expect(res.product?.title).toBe(uniqueTitle);
    expect(res.product?.basePrice).toBe(3800);
    expect(res.product?.availableSizes).toEqual(["S", "M"]);

    // Clean up created product to keep test environment hermetic
    if (res.product?.id) {
      await prisma.productVariant.deleteMany({ where: { productId: res.product.id } });
      await prisma.productImage.deleteMany({ where: { productId: res.product.id } });
      await prisma.auditEvent.deleteMany({ where: { entityId: res.product.id } });
      await prisma.product.delete({ where: { id: res.product.id } });
    }
  });
});

describe("sellerService - Product Validation & SKU Integrity", () => {
  const approvedSellerId = "vnd_sol_textiles";

  it("rejects product creation when base price is zero or negative", async () => {
    const invalidPayload: SellerProductInput = {
      title: "Free Silk Sample",
      subtitle: "Test",
      description: "Valid description over 10 chars.",
      categoryId: "cat_apparel",
      basePrice: 0,
      stock: 5,
      images: ["https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80"],
    };

    const res = await sellerService.createProduct(approvedSellerId, invalidPayload);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Base price must be greater than zero");
  });

  it("rejects product creation when stock is negative", async () => {
    const invalidPayload: SellerProductInput = {
      title: "Negative Stock Sample",
      subtitle: "Test",
      description: "Valid description over 10 chars.",
      categoryId: "cat_apparel",
      basePrice: 1500,
      stock: -5,
      images: ["https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80"],
    };

    const res = await sellerService.createProduct(approvedSellerId, invalidPayload);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Stock cannot be negative");
  });

  it("detects and rejects duplicate variant SKUs within the same product submission", async () => {
    const duplicateSku = `DUP-SKU-${Date.now()}`;
    const payload: SellerProductInput = {
      title: "Duplicate SKU Tester",
      subtitle: "Validation test",
      description: "Testing duplicate SKU detection in variant array.",
      categoryId: "cat_apparel",
      basePrice: 2000,
      stock: 10,
      images: ["https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80"],
      variants: [
        {
          sku: duplicateSku,
          variantType: "SIZE",
          name: "Small",
          value: "S",
          stock: 5,
        },
        {
          sku: duplicateSku, // Duplicate!
          variantType: "SIZE",
          name: "Medium",
          value: "M",
          stock: 5,
        },
      ],
    };

    const res = await sellerService.createProduct(approvedSellerId, payload);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Duplicate variant SKU");
  });
});

describe("sellerService - Inventory Batch Updates & Boundaries", () => {
  const sellerId = "vnd_sol_textiles";

  it("atomically updates inventory levels for authorized products", async () => {
    const prods = await sellerService.getProducts(sellerId);
    const targetProduct = prods.products[0];
    const newTargetStock = 42;

    const res = await sellerService.updateInventoryBatch(sellerId, [
      {
        productId: targetProduct.id,
        newStock: newTargetStock,
      },
    ]);

    expect(res.success).toBe(true);
    expect(res.updatedCount).toBe(1);

    // Verify database state matches
    const updated = await prisma.product.findUnique({ where: { id: targetProduct.id } });
    expect(updated?.stock).toBe(newTargetStock);
  });

  it("rejects negative stock in batch updates", async () => {
    const prods = await sellerService.getProducts(sellerId);
    const targetProduct = prods.products[0];

    const res = await sellerService.updateInventoryBatch(sellerId, [
      {
        productId: targetProduct.id,
        newStock: -10,
      },
    ]);

    expect(res.success).toBe(false);
    expect(res.error).toContain("negative");
  });

  it("rejects batch updates when attempting to modify another seller's product", async () => {
    const sellerBProds = await sellerService.getProducts("vnd_voxel_audio");
    const foreignProduct = sellerBProds.products[0];

    const res = await sellerService.updateInventoryBatch(sellerId, [
      {
        productId: foreignProduct.id,
        newStock: 99,
      },
    ]);

    expect(res.success).toBe(false);
    expect(res.error).toContain("access denied");
  });
});

describe("sellerService - CSV Inventory Import Engine", () => {
  const sellerId = "vnd_sol_textiles";

  it("parses valid CSV rows and applies stock updates", async () => {
    const validCsv = `sku,stock
prod_kroma_01-SZ-S,18
prod_kroma_01-SZ-M,28
prod_kroma_01-SZ-L,12`;

    const res = await sellerService.importInventoryCsv(sellerId, validCsv);
    expect(res.totalRows).toBe(3);
    expect(res.successfulRows).toBe(3);
    expect(res.failedRows).toBe(0);
  });

  it("reports structured row-level errors for malformed columns or non-numeric stock without crashing", async () => {
    const malformedCsv = `sku,stock
prod_kroma_01-SZ-S,twenty
MISSING_COLUMNS
prod_kroma_01-SZ-L,-10`;

    const res = await sellerService.importInventoryCsv(sellerId, malformedCsv);
    expect(res.failedRows).toBe(3);
    expect(res.errors.length).toBe(3);

    // Row 2: non-numeric
    expect(res.errors[0].error).toContain("Invalid numeric quantity");
    // Row 3: missing quantity column
    expect(res.errors[1].error).toContain("Invalid numeric quantity");
    // Row 4: negative stock
    expect(res.errors[2].error).toContain("Target stock cannot be negative");
  });

  it("detects and flags duplicate SKUs within the same CSV upload", async () => {
    const duplicateCsv = `sku,stock
prod_kroma_01-SZ-S,15
prod_kroma_01-SZ-S,20`;

    const res = await sellerService.importInventoryCsv(sellerId, duplicateCsv);
    expect(res.errors.some((e) => e.error.includes("Duplicate SKU"))).toBe(true);
  });
});

describe("sellerService - Fulfillment State Machine & Courier Validation", () => {
  const sellerId = "vnd_sol_textiles";

  it("enforces mandatory courier and tracking number when transitioning to SHIPPED", async () => {
    const orders = await sellerService.getOrderLines(sellerId);
    const line = orders.orderLines.find((l) => ["NEW", "PROCESSING", "PACKED"].includes(l.fulfillmentStatus));

    if (line) {
      // First advance to PACKED if NEW
      if (line.fulfillmentStatus === "NEW") {
        await sellerService.updateFulfillmentStatus(sellerId, line.id, "PROCESSING");
        await sellerService.updateFulfillmentStatus(sellerId, line.id, "PACKED");
      } else if (line.fulfillmentStatus === "PROCESSING") {
        await sellerService.updateFulfillmentStatus(sellerId, line.id, "PACKED");
      }

      // Try shipping WITHOUT tracking details
      const missingDetails = await sellerService.updateFulfillmentStatus(sellerId, line.id, "SHIPPED");
      expect(missingDetails.success).toBe(false);
      expect(missingDetails.error).toContain("Courier name and tracking number are mandatory");

      // Now ship WITH valid tracking details
      const validShip = await sellerService.updateFulfillmentStatus(sellerId, line.id, "SHIPPED", {
        courierName: "Blue Dart Express",
        trackingNumber: "BLUEDART-8899124",
      });

      expect(validShip.success).toBe(true);
      expect(validShip.orderLine?.fulfillmentStatus).toBe("SHIPPED");
      expect(validShip.orderLine?.courierName).toBe("Blue Dart Express");
      expect(validShip.orderLine?.trackingNumber).toBe("BLUEDART-8899124");
    }
  });

  it("rejects illegal state jumps (e.g. jumping from NEW directly to DELIVERED)", async () => {
    const orders = await sellerService.getOrderLines(sellerId);
    const newLine = orders.orderLines.find((l) => l.fulfillmentStatus === "NEW");

    if (newLine) {
      const invalidJump = await sellerService.updateFulfillmentStatus(
        sellerId,
        newLine.id,
        "DELIVERED"
      );
      expect(invalidJump.success).toBe(false);
      expect(invalidJump.error).toContain("Invalid status transition");
    }
  });

  it("atomically restocks inventory when an item is cancelled prior to shipment", async () => {
    const orders = await sellerService.getOrderLines(sellerId);
    const cancellable = orders.orderLines.find(
      (l) => ["NEW", "PROCESSING", "PACKED"].includes(l.fulfillmentStatus) && l.productId
    );

    if (cancellable && cancellable.productId) {
      // Get current product stock
      const prodBefore = await prisma.product.findUnique({
        where: { id: cancellable.productId },
      });
      const stockBefore = prodBefore?.stock || 0;

      const cancelRes = await sellerService.updateFulfillmentStatus(
        sellerId,
        cancellable.id,
        "CANCELLED",
        { cancellationReason: "Patron requested size alteration" }
      );

      expect(cancelRes.success).toBe(true);
      expect(cancelRes.orderLine?.fulfillmentStatus).toBe("CANCELLED");
      expect(cancelRes.orderLine?.cancellationReason).toBe("Patron requested size alteration");

      // Verify stock was incremented atomically by line quantity
      const prodAfter = await prisma.product.findUnique({
        where: { id: cancellable.productId },
      });
      expect(prodAfter?.stock).toBe(stockBefore + cancellable.quantity);

      // Verify cancelled items cannot be modified again
      const postCancelAttempt = await sellerService.updateFulfillmentStatus(
        sellerId,
        cancellable.id,
        "PROCESSING"
      );
      expect(postCancelAttempt.success).toBe(false);
      expect(postCancelAttempt.error).toContain("Cancelled items cannot be updated");
    }
  });
});

describe("sellerService - Financial Calculations & Commission Ledger", () => {
  const sellerId = "vnd_sol_textiles";

  it("calculates exactly 10% platform commission with integer minor unit precision", async () => {
    const payouts = await sellerService.getPayouts(sellerId);
    expect(payouts.length).toBeGreaterThan(0);

    for (const p of payouts) {
      // Commission must be exactly 10% (gross * 0.10)
      const expectedCommission = Math.round(p.grossAmount * 0.1);
      const expectedNet = p.grossAmount - expectedCommission;

      expect(p.commission).toBe(expectedCommission);
      expect(p.netPayout).toBe(expectedNet);
      expect(p.grossAmount).toBe(p.netPayout + p.commission);
    }
  });

  it("computes accurate studio metrics for gross sales, net proceeds, and orders", async () => {
    const m = await sellerService.getMetrics(sellerId);
    expect(m.grossSales).toBeGreaterThanOrEqual(0);
    expect(m.netProceeds).toBeGreaterThanOrEqual(0);
    expect(m.grossSales).toBe(m.netProceeds + m.commissionDeducted);
    expect(m.activeProducts).toBeGreaterThan(0);
  });
});

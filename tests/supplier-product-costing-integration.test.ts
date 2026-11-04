import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/server/prisma";
import { sellerService } from "@/lib/server/seller-service";
import { calculateSupplierProfitAndLoss, SupplierCostInputs } from "@/lib/supplier-costing";
import { lookupHsn, suggestGstRateForHsn } from "@/lib/tax-hsn-directory";
import { ProductApprovalStatus, SellerStatus } from "@prisma/client";

describe("NEXU ATELIER — Supplier Product Costing, GST & Multi-Tenant Integration Suite", () => {
  let sellerA: any;
  let sellerB: any;
  let testCategory: any;

  beforeAll(async () => {
    // 1. Create Seller A
    sellerA = await prisma.seller.create({
      data: {
        name: "Solstice Silk Studio",
        slug: `solstice-silk-${Date.now()}`,
        originHub: "Varanasi, Uttar Pradesh",
        story: "Centuries of silk weaving heritage.",
        heroImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        status: SellerStatus.APPROVED,
        businessEmail: `solstice_${Date.now()}@studio.com`,
        verified: true,
        commissionRatePercent: 10.0,
      },
    });

    // 2. Create Seller B for tenant isolation testing
    sellerB = await prisma.seller.create({
      data: {
        name: "Loom Heritage Studio",
        slug: `loom-heritage-${Date.now()}`,
        originHub: "Maheshwar, Madhya Pradesh",
        story: "Handloom cotton and zari craft.",
        heroImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        status: SellerStatus.APPROVED,
        businessEmail: `loom_${Date.now()}@studio.com`,
        verified: true,
        commissionRatePercent: 12.0,
      },
    });

    // 3. Create test category
    testCategory = await prisma.category.create({
      data: {
        name: "Heritage Textiles & Sarees",
        slug: `textiles-sarees-${Date.now()}`,
        description: "Artisanal handwoven fabrics and garments.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
      },
    });
  });

  afterAll(async () => {
    // Cleanup test records
    await prisma.productVariant.deleteMany({
      where: { product: { vendorId: { in: [sellerA.id, sellerB.id] } } },
    });
    await prisma.productImage.deleteMany({
      where: { product: { vendorId: { in: [sellerA.id, sellerB.id] } } },
    });
    await prisma.product.deleteMany({
      where: { vendorId: { in: [sellerA.id, sellerB.id] } },
    });
    await prisma.category.delete({
      where: { id: testCategory.id },
    });
    await prisma.seller.deleteMany({
      where: { id: { in: [sellerA.id, sellerB.id] } },
    });
  });

  describe("Product Creation with Comprehensive Costing & HSN", () => {
    it("creates a product with complete costing breakdown and mapped HSN 5007 (5% GST)", async () => {
      const costInputs: SupplierCostInputs = {
        purchaseCostINR: 1200,
        manufacturingCostINR: 300,
        rawMaterialCostINR: 200,
        labourCostINR: 150,
        packagingMaterialINR: 80,
        labellingINR: 20,
        handlingINR: 30,
        qualityInspectionINR: 20,
        warehouseExpensesINR: 50,
        inwardTransportINR: 60,
        supplierToWarehouseShippingINR: 40,
        outwardCourierCostINR: 140,
        transitInsuranceINR: 20,
        shippingPaidBy: "SELLER",
        customerShippingFeeINR: 0,
        marketingExpensesINR: 100,
        photographyCostAllocationINR: 50,
        additionalOperatingExpensesINR: 50,
        customExpenses: [{ id: "c1", name: "Guild Tag", amountINR: 40, allocation: "PER_UNIT" }],
        priceMode: "EXCLUSIVE",
        sellingPriceINR: 4500,
        discountPercent: 0,
        taxRatePercent: 5.0,
        supplyType: "INTRA_STATE",
        hsnCode: "5007",
        platformCommissionPercent: 10.0,
        paymentProcessingPercent: 2.0,
      };

      const pnl = calculateSupplierProfitAndLoss(costInputs);

      const productPayload = {
        title: "Varanasi Pure Katan Silk Handloom Saree",
        subtitle: "Woven on traditional pit looms with unbleached gold zari",
        description: "Authentic Katan silk piece certified with Silk Mark India.",
        categoryId: testCategory.id,
        basePrice: pnl.taxableSellingPricePaise / 100,
        compareAtPrice: 6500,
        stock: 15,
        lowStockThreshold: 3,
        action: "SUBMIT" as const,
        brand: "Solstice Silk",
        sku: "SOLSTICE-KATAN-001",
        taxRatePercent: 5.0,
        material: "100% Pure Mulberry Silk",
        images: [
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80",
        ],
        variants: [
          {
            sku: "SOLSTICE-KATAN-001-GOLD",
            variantType: "COLOR",
            name: "Royal Gold Zari",
            value: "Gold",
            stock: 8,
            additionalPrice: 0,
          },
          {
            sku: "SOLSTICE-KATAN-001-SILVER",
            variantType: "COLOR",
            name: "Antique Silver Zari",
            value: "Silver",
            stock: 7,
            additionalPrice: 200,
          },
        ],
        attributes: {
          hsnCode: "5007",
          priceMode: "EXCLUSIVE",
          supplyType: "INTRA_STATE",
          directProductCostPaise: pnl.directProductCostPaise,
          estimatedContributionProfitPaise: pnl.estimatedContributionProfitPaise,
          profitMarginPercent: pnl.profitMarginPercent,
          breakEvenPricePaise: pnl.breakEvenPricePaise,
          minRecommendedPricePaise: pnl.minRecommendedPricePaise,
        },
      };

      const res = await sellerService.createProduct(sellerA.id, productPayload as any);

      expect(res.success).toBe(true);
      expect(res.product).toBeDefined();
      expect(res.product?.title).toBe("Varanasi Pure Katan Silk Handloom Saree");
      expect(res.product?.taxRatePercent).toBe(5.0);
      expect(res.product?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
      expect(res.product?.isPublished).toBe(false); // Must not be falsely published before admin review

      // Verify persisted attributes in PostgreSQL
      const dbProduct = await prisma.product.findUnique({
        where: { id: res.product?.id },
      });
      expect(dbProduct).toBeDefined();
      const attributes = JSON.parse(dbProduct?.attributesJson || "{}");
      expect(attributes.hsnCode).toBe("5007");
      expect(attributes.directProductCostPaise).toBe(pnl.directProductCostPaise);
      expect(attributes.breakEvenPricePaise).toBe(pnl.breakEvenPricePaise);
      expect(attributes.profitMarginPercent).toBe(pnl.profitMarginPercent);

      // Verify variants
      const savedVariants = await prisma.productVariant.findMany({
        where: { productId: res.product?.id },
      });
      expect(savedVariants.length).toBe(2);
      expect(savedVariants.map((v) => v.sku)).toContain("SOLSTICE-KATAN-001-GOLD");
      expect(savedVariants.map((v) => v.sku)).toContain("SOLSTICE-KATAN-001-SILVER");
    });
  });

  describe("Multi-Vendor Tenant Boundary Isolation", () => {
    it("ensures Seller B cannot query or manage Seller A's products", async () => {
      // Query products for Seller B
      const resultB = await sellerService.getSellerProducts(sellerB.id, {});
      const productsForB = resultB.products || [];

      // Seller A's product should NOT be in Seller B's list
      const hasSellerAProduct = productsForB.some(
        (p: any) => p.title === "Varanasi Pure Katan Silk Handloom Saree"
      );
      expect(hasSellerAProduct).toBe(false);
    });
  });

  describe("Statutory HSN Suggestion & Notification 13/2025-CT(R)", () => {
    it("correctly identifies handicraft eligibility for brass urli (HSN 7418)", () => {
      const rec = lookupHsn("7418");
      expect(rec).toBeDefined();
      expect(rec?.notificationRef).toBe("Notification 13/2025-Central Tax (Rate), dated 17 September 2025");
      expect(rec?.isHandicraftEligible).toBe(true);
      expect(rec?.defaultRatePercent).toBe(12.0);
    });

    it("suggests 18% for high-fidelity audio equipment (HSN 8518)", () => {
      const rec = lookupHsn("8518");
      expect(rec).toBeDefined();
      expect(rec?.defaultRatePercent).toBe(18.0);
      expect(rec?.isHandicraftEligible).toBe(false);
    });
  });
});

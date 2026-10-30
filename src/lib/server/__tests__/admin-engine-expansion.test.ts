import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { adminService } from "../admin-service";
import { ProductApprovalStatus, UserRole } from "@prisma/client";

describe("Admin Control Center Engine Expansion", () => {
  let testAdminId: string;
  let createdCategoryId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Find or create test admin
    let admin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: `admin_test_${Date.now()}@nexu.studio`,
          passwordHash: "pbkdf2_test_hash",
          role: UserRole.ADMIN,
        },
      });
    }
    testAdminId = admin.id;

    // Pick an existing product for test
    const product = await prisma.product.findFirst();
    if (product) {
      testProductId = product.id;
    }
  });

  afterAll(async () => {
    if (createdCategoryId) {
      await prisma.category.deleteMany({
        where: { id: createdCategoryId },
      });
    }
  });

  describe("Category & Taxonomy Engine", () => {
    it("retrieves all categories with product counts", async () => {
      const categories = await adminService.getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty("id");
      expect(categories[0]).toHaveProperty("name");
      expect(categories[0]).toHaveProperty("slug");
      expect(categories[0]).toHaveProperty("productCount");
      expect(typeof categories[0].productCount).toBe("number");
    });

    it("creates a new category taxonomy and logs audit event", async () => {
      const testName = `Artisan Ceramics ${Date.now()}`;
      const result = await adminService.createCategory(
        {
          name: testName,
          description: "Studio wheel-thrown stoneware and ash glaze vessels.",
          image: "/images/categories/living.jpg",
        },
        testAdminId
      );

      expect(result.success).toBe(true);
      expect(result.category).toBeDefined();
      expect(result.category?.name).toBe(testName);
      expect(result.category?.productCount).toBe(0);

      createdCategoryId = result.category!.id;

      // Verify audit event
      const audit = await prisma.auditEvent.findFirst({
        where: {
          entityType: "CATEGORY",
          entityId: createdCategoryId,
          action: "CATEGORY_CREATED",
        },
      });
      expect(audit).not.toBeNull();
      expect(audit?.performedBy).toBe(testAdminId);
    });

    it("updates existing category metadata", async () => {
      expect(createdCategoryId).toBeDefined();
      const updatedDesc = "Updated ash glaze and terracota vessels.";
      const updateResult = await adminService.updateCategory(
        createdCategoryId,
        { description: updatedDesc },
        testAdminId
      );

      expect(updateResult.success).toBe(true);

      const cat = await prisma.category.findUnique({
        where: { id: createdCategoryId },
      });
      expect(cat?.description).toBe(updatedDesc);
    });

    it("prevents deleting a category that has active products", async () => {
      // Find category with products
      const catWithProducts = await prisma.category.findFirst({
        where: { products: { some: {} } },
      });

      if (catWithProducts) {
        const deleteResult = await adminService.deleteCategory(
          catWithProducts.id,
          testAdminId
        );
        expect(deleteResult.success).toBe(false);
        expect(deleteResult.error).toContain("associated with it");
      }
    });

    it("successfully deletes empty category", async () => {
      expect(createdCategoryId).toBeDefined();
      const deleteResult = await adminService.deleteCategory(
        createdCategoryId,
        testAdminId
      );
      expect(deleteResult.success).toBe(true);

      const cat = await prisma.category.findUnique({
        where: { id: createdCategoryId },
      });
      expect(cat).toBeNull();
      createdCategoryId = ""; // cleared
    });
  });

  describe("Product Moderation & Homepage Spotlight", () => {
    it("toggles product homepage featured status with audit trail", async () => {
      if (!testProductId) return;

      const initialProduct = await prisma.product.findUnique({
        where: { id: testProductId },
      });
      const initialFeatured = initialProduct?.isFeatured || false;

      // Toggle to opposite
      const toggleResult = await adminService.toggleProductFeatured(
        testProductId,
        !initialFeatured,
        testAdminId
      );
      expect(toggleResult.success).toBe(true);

      const updated = await prisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(updated?.isFeatured).toBe(!initialFeatured);

      // Verify audit event
      const audit = await prisma.auditEvent.findFirst({
        where: {
          entityType: "PRODUCT",
          entityId: testProductId,
          action: !initialFeatured ? "PRODUCT_FEATURED_ON_HOMEPAGE" : "PRODUCT_UNFEATURED_FROM_HOMEPAGE",
        },
      });
      expect(audit).not.toBeNull();

      // Reset back to initial state
      await adminService.toggleProductFeatured(testProductId, initialFeatured, testAdminId);
    });

    it("moderates product with request changes feedback", async () => {
      if (!testProductId) return;

      const notes = "[CHANGES_REQUESTED]: Please provide macro close-up of textile weave.";
      const modResult = await adminService.moderateProduct(
        testProductId,
        ProductApprovalStatus.DRAFT,
        notes,
        testAdminId
      );
      expect(modResult.success).toBe(true);

      const updated = await prisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(updated?.approvalStatus).toBe(ProductApprovalStatus.DRAFT);
      expect(updated?.moderationNotes).toContain("[CHANGES_REQUESTED]");
      expect(updated?.isPublished).toBe(false);

      // Restore to APPROVED
      await adminService.moderateProduct(
        testProductId,
        ProductApprovalStatus.APPROVED,
        "Re-approved after verification",
        testAdminId
      );
    });
  });

  describe("Automations & Background Tasks", () => {
    it("returns comprehensive automations and outbox health stats", async () => {
      const automations = await adminService.getAutomationsOverview();
      expect(automations).toHaveProperty("notifications");
      expect(automations).toHaveProperty("recentOutbox");
      expect(automations).toHaveProperty("webhooks");
      expect(automations).toHaveProperty("lowStockAlertsCount");
      expect(typeof automations.lowStockAlertsCount).toBe("number");
      expect(Array.isArray(automations.recentOutbox)).toBe(true);
    });

    it("triggers low stock audit scan and records audit log", async () => {
      const scanResult = await adminService.triggerLowStockScan(testAdminId);
      expect(scanResult.success).toBe(true);
      expect(typeof scanResult.alertedCount).toBe("number");
      expect(Array.isArray(scanResult.products)).toBe(true);

      const audit = await prisma.auditEvent.findFirst({
        where: {
          entityType: "AUTOMATION",
          action: "LOW_STOCK_AUDITED",
        },
      });
      expect(audit).not.toBeNull();
    });

    it("requeues failed notifications safely", async () => {
      const retryResult = await adminService.retryFailedNotifications(testAdminId);
      expect(retryResult.success).toBe(true);
      expect(typeof retryResult.retriedCount).toBe("number");
    });
  });

  describe("Financial Reports & CSV Generation", () => {
    it("compiles authoritative financial reports from live orders", async () => {
      const report = await adminService.getFinancialReports();
      expect(report).toHaveProperty("summary");
      expect(report).toHaveProperty("vendorSettlements");
      expect(report.summary.totalOrders).toBeGreaterThan(0);
      expect(report.summary.grossMerchandiseValue).toBeGreaterThan(0);
      expect(report.summary.platformCommissionRevenue).toBeGreaterThan(0);
      expect(report.summary.estimatedGstPayable).toBeGreaterThan(0);
      expect(Array.isArray(report.vendorSettlements)).toBe(true);
    });

    it("generates sales CSV with valid RFC headers", async () => {
      const csv = await adminService.generateReportsCsv("sales");
      expect(typeof csv).toBe("string");
      expect(csv).toContain("Order ID,Customer Email,Status,Payment,Total (INR),Date");
    });

    it("generates vendor settlement CSV with workshop names", async () => {
      const csv = await adminService.generateReportsCsv("vendors");
      expect(typeof csv).toBe("string");
      expect(csv).toContain("Seller ID,Workshop Name,Slug,Orders Fulfilled,Gross Sales (INR),Commission Paid (INR),Net Earnings (INR)");
    });

    it("generates tax liability CSV with 12% composite rate", async () => {
      const csv = await adminService.generateReportsCsv("taxes");
      expect(typeof csv).toBe("string");
      expect(csv).toContain("Gross Merchandise Value");
      expect(csv).toContain("Estimated Output GST (12%)");
    });
  });
});

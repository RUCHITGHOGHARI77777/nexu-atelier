import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { categoryAttributeService } from "../category-attribute-service";
import { smartListingQualityChecker } from "../listing-quality-checker";
import { supplierDraftService } from "../supplier-draft-service";
import { reviewSlaService } from "../review-sla-service";
import { productRevisionService } from "../product-revision-service";
import { sellerService } from "../seller-service";
import { adminService } from "../admin-service";
import { ProductApprovalStatus, SellerStatus } from "@prisma/client";

describe("NEXU ATELIER — Smart Listing, Auto-Draft, Dynamic Attributes & Product Quality Engine", () => {
  let testSeller: any;
  let testCategory: any;
  let adminUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: "admin_listing_test@nexu.studio",
          passwordHash: "hash_test",
          role: "ADMIN",
        },
      });
    }

    testSeller = await prisma.seller.create({
      data: {
        name: "Aura Weaves Studio",
        slug: `aura-weaves-${Date.now()}`,
        originHub: "Chanderi, Madhya Pradesh",
        story: "Centuries-old heritage weaving techniques preserved across generations.",
        heroImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        status: SellerStatus.APPROVED,
        businessEmail: `aura_listing_${Date.now()}@nexu.studio`,
        verified: true,
        commissionRatePercent: 10.0,
      },
    });

    testCategory = await prisma.category.create({
      data: {
        slug: `heritage-silk-${Date.now()}`,
        name: "Heritage Silk Textiles",
        description: "Pure handcrafted silk textiles and weaves.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
      },
    });
  });

  afterAll(async () => {
    await prisma.productRevision.deleteMany({
      where: { product: { vendorId: testSeller.id } },
    });
    await prisma.supplierDraft.deleteMany({
      where: { sellerId: testSeller.id },
    });
    await prisma.productVariant.deleteMany({
      where: { product: { vendorId: testSeller.id } },
    });
    await prisma.productImage.deleteMany({
      where: { product: { vendorId: testSeller.id } },
    });
    await prisma.product.deleteMany({
      where: { vendorId: testSeller.id },
    });
    await (prisma as any).categoryAttribute.deleteMany({
      where: { categoryId: testCategory.id },
    });
    await prisma.category.delete({
      where: { id: testCategory.id },
    });
    await prisma.seller.delete({
      where: { id: testSeller.id },
    });
    await prisma.$disconnect();
  });

  describe("1. Category-Based Dynamic Attribute Engine", () => {
    let createdAttrId: string;

    it("allows Admin to configure tailored category attributes with allowed values and units", async () => {
      const res = await categoryAttributeService.createAttribute(adminUser.email, {
        categoryId: testCategory.id,
        name: "Weave Technique",
        slug: "weave_technique",
        dataType: "DROPDOWN",
        isRequired: true,
        allowedValues: ["Chanderi Zari", "Jamdani Handloom", "Ikat Double Weave"],
        defaultUnit: null,
        isCustomerVisible: true,
        isVariantAttribute: false,
        displayOrder: 1,
      });

      expect(res.success).toBe(true);
      expect(res.attribute?.slug).toBe("weave_technique");
      expect(res.attribute?.allowedValues).toContain("Chanderi Zari");
      createdAttrId = res.attribute!.id;
    });

    it("configures custom measurement units (e.g. g, kg, inch, cm)", async () => {
      const res = await categoryAttributeService.createAttribute(adminUser.email, {
        categoryId: testCategory.id,
        name: "Fabric Density / Weight",
        slug: "fabric_density",
        dataType: "MEASUREMENT",
        isRequired: true,
        defaultUnit: "g",
        allowedUnits: ["g", "kg"],
        validationRules: { min: 50, max: 2000 },
        displayOrder: 2,
      });

      expect(res.success).toBe(true);
      expect(res.attribute?.allowedUnits).toEqual(["g", "kg"]);
      expect(res.attribute?.defaultUnit).toBe("g");
    });

    it("retrieves only attributes tailored to the selected category", async () => {
      const attrs = await categoryAttributeService.getAttributesForCategory(testCategory.id);
      expect(attrs.length).toBe(2);
      expect(attrs[0].slug).toBe("weave_technique");
      expect(attrs[1].slug).toBe("fabric_density");
    });

    it("prevents duplicate attribute slugs within the same category", async () => {
      const res = await categoryAttributeService.createAttribute(adminUser.email, {
        categoryId: testCategory.id,
        name: "Duplicate Weave",
        slug: "weave_technique",
        dataType: "TEXT",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("already exists in this category");
    });
  });

  describe("2. Smart Listing Quality Checker Engine", () => {
    let categoryAttrs: any[];

    beforeAll(async () => {
      categoryAttrs = await categoryAttributeService.getAttributesForCategory(testCategory.id);
    });

    it("detects missing title, missing description, and negative pricing as hard blockers", () => {
      const evaluation = smartListingQualityChecker.evaluate(
        {
          title: "",
          description: "",
          basePrice: -500,
          categoryId: testCategory.id,
          images: [],
        },
        categoryAttrs
      );

      expect(evaluation.canSubmit).toBe(false);
      expect(evaluation.errors.some((e) => e.field === "title")).toBe(true);
      expect(evaluation.errors.some((e) => e.field === "description")).toBe(true);
      expect(evaluation.errors.some((e) => e.field === "basePrice")).toBe(true);
      expect(evaluation.errors.some((e) => e.field === "images")).toBe(true);
      expect(evaluation.score).toBeLessThan(30);
    });

    it("detects ALL CAPS title, spam buzzwords, and suspicious deep discounts", () => {
      const evaluation = smartListingQualityChecker.evaluate(
        {
          title: "CHEAP SILK SAREE BUY NOW FREE SHIPPING!!!",
          description: "This is a brief description of the saree.",
          basePrice: 100,
          compareAtPrice: 5000, // 98% discount!
          categoryId: testCategory.id,
          images: ["https://example.com/saree1.jpg"],
        },
        categoryAttrs
      );

      expect(evaluation.warnings.some((w) => w.message.includes("ALL CAPS"))).toBe(true);
      expect(evaluation.warnings.some((w) => w.message.includes("CHEAP"))).toBe(true);
      expect(evaluation.warnings.some((w) => w.message.includes("unusually steep"))).toBe(true);
    });

    it("enforces required dynamic category attributes and valid units", () => {
      const evaluation = smartListingQualityChecker.evaluate(
        {
          title: "Handwoven Royal Chanderi Silk Saree",
          description: "Meticulously hand-spun pure mulberry silk woven on generational pit looms with real gold zari.",
          basePrice: 12500,
          compareAtPrice: 15000,
          categoryId: testCategory.id,
          images: [
            "https://example.com/s1.jpg",
            "https://example.com/s2.jpg",
            "https://example.com/s3.jpg",
          ],
          attributes: {
            weave_technique: { value: "Invalid Fake Weave" }, // Not in allowedValues!
            fabric_density: { value: 350, unit: "liters" }, // "liters" not in allowedUnits ["g", "kg"]!
          },
        },
        categoryAttrs
      );

      expect(evaluation.canSubmit).toBe(false);
      expect(evaluation.errors.some((e) => e.message.includes("weave_technique") || e.message.includes("Weave Technique"))).toBe(true);
      expect(evaluation.errors.some((e) => e.message.includes("unit for Fabric Density"))).toBe(true);
    });

    it("flags prohibited therapeutic and miracle claims", () => {
      const evaluation = smartListingQualityChecker.evaluate(
        {
          title: "Organic Silk Shawl with 100% Miracle Cure for Arthritis",
          description: "Guaranteed wealth and complete pain eradication using cosmic electromagnetic threads.",
          basePrice: 5000,
          categoryId: testCategory.id,
          images: ["https://example.com/1.jpg"],
        },
        categoryAttrs
      );

      expect(evaluation.canSubmit).toBe(false);
      expect(evaluation.errors.some((e) => e.message.includes("therapeutic claim"))).toBe(true);
    });

    it("calculates high completeness score for exemplary listing with disclaimers", () => {
      const evaluation = smartListingQualityChecker.evaluate(
        {
          title: "Royal Blue Chanderi Silk Saree with Fine Gold Zari",
          description: "Exquisite handloom creation directly from the master weavers of Chanderi. Features organic mulberry silk warp with delicate floral buti motifs woven by hand over twenty-four days.",
          brand: "Aura Weaves",
          sku: "AUR-CHAN-001",
          basePrice: 14500,
          compareAtPrice: 18000,
          stock: 8,
          categoryId: testCategory.id,
          images: [
            "https://example.com/saree_hero.jpg",
            "https://example.com/saree_texture.jpg",
            "https://example.com/saree_pallu.jpg",
          ],
          attributes: {
            weave_technique: { value: "Chanderi Zari" },
            fabric_density: { value: 420, unit: "g" },
          },
          variants: [
            { sku: "AUR-CHAN-001-BLU", variantType: "COLOR", name: "Royal Blue", value: "Royal Blue", stock: 8, additionalPrice: 0 },
          ],
        },
        categoryAttrs
      );

      expect(evaluation.canSubmit).toBe(true);
      expect(evaluation.score).toBeGreaterThanOrEqual(85);
      expect(evaluation.summary).toContain("does not guarantee sales volume or ranking");
    });
  });

  describe("3. Auto-Draft and Conflict Resolution Engine", () => {
    it("persists draft in PostgreSQL and recovers it", async () => {
      const saveRes = await supplierDraftService.saveDraft(testSeller.id, {
        draftKey: "new_piece_wip",
        title: "Experimental Khadi Linen Kurta",
        categoryId: testCategory.id,
        draftData: {
          title: "Experimental Khadi Linen Kurta",
          basePrice: 3200,
          stock: 12,
        },
        clientVersion: 1,
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.draft?.version).toBe(1);

      const recovered = await supplierDraftService.getDraft(testSeller.id, "new_piece_wip");
      expect(recovered).not.toBeNull();
      expect(recovered?.draftData.title).toBe("Experimental Khadi Linen Kurta");
      expect(recovered?.draftData.basePrice).toBe(3200);
    });

    it("detects conflicting edits when client version is stale", async () => {
      await supplierDraftService.saveDraft(testSeller.id, {
        draftKey: "new_piece_wip",
        draftData: { title: "Server Updated Title", basePrice: 3500 },
        clientVersion: 1,
      });

      const conflictRes = await supplierDraftService.saveDraft(testSeller.id, {
        draftKey: "new_piece_wip",
        draftData: { title: "Stale Offline Client Title", basePrice: 2800 },
        clientVersion: 1, // Stale! Server is at version 2
      });

      expect(conflictRes.success).toBe(false);
      expect(conflictRes.conflict).toBe(true);
      expect(conflictRes.serverDraft?.version).toBe(2);
    });

    it("discards draft safely upon request", async () => {
      const discarded = await supplierDraftService.discardDraft(testSeller.id, "new_piece_wip");
      expect(discarded).toBe(true);

      const check = await supplierDraftService.getDraft(testSeller.id, "new_piece_wip");
      expect(check).toBeNull();
    });
  });

  describe("4. Admin Review SLA Engine & Escalation Workflow", () => {
    let pendingProduct: any;

    beforeAll(async () => {
      const res = await sellerService.createProduct(testSeller.id, {
        title: "Heritage Chanderi Dupatta with Antique Borders",
        subtitle: "Artisan Studio Creation",
        description: "Handwoven pure silk dupatta crafted over two weeks.",
        categoryId: testCategory.id,
        basePrice: 4200,
        stock: 5,
        images: ["https://example.com/dupatta.jpg"],
        action: "SUBMIT",
      });

      expect(res.success).toBe(true);
      pendingProduct = res.product!;

      const seventyFiveMinsAgo = new Date(Date.now() - 75 * 60 * 1000);
      await prisma.product.update({
        where: { id: pendingProduct.id },
        data: {
          submittedForReviewAt: seventyFiveMinsAgo,
          reviewSlaMinutes: 60,
          isReviewOverdue: false,
        },
      });
    });

    it("calculates accurate SLA status and detects breach", () => {
      const seventyFiveMinsAgo = new Date(Date.now() - 75 * 60 * 1000);
      const status = reviewSlaService.calculateProductSlaStatus(
        {
          id: pendingProduct.id,
          title: pendingProduct.title,
          approvalStatus: ProductApprovalStatus.PENDING_REVIEW,
          submittedForReviewAt: seventyFiveMinsAgo,
          reviewSlaMinutes: 60,
        },
        60,
        new Date()
      );

      expect(status.isOverdue).toBe(true);
      expect(status.elapsedMinutes).toBeGreaterThanOrEqual(74);
      expect(status.remainingMinutes).toBe(0);
    });

    it("marks review as overdue during scan without auto-approving", async () => {
      const scanResult = await reviewSlaService.processPendingReviewSlas();
      expect(scanResult.overdueProductIds).toContain(pendingProduct.id);
      expect(scanResult.breachesRecorded).toBeGreaterThanOrEqual(1);

      const dbProd = await prisma.product.findUnique({
        where: { id: pendingProduct.id },
      });

      expect(dbProd?.isReviewOverdue).toBe(true);
      expect(dbProd?.reviewOverdueAt).not.toBeNull();
      expect(dbProd?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
      expect(dbProd?.isPublished).toBe(false);
    });

    it("moderation immediately stops pending SLA timers and resets overdue flags", async () => {
      const modRes = await adminService.moderateProduct(
        pendingProduct.id,
        ProductApprovalStatus.APPROVED,
        "Exquisite piece meeting all curated heritage criteria.",
        adminUser.id
      );

      expect(modRes.success).toBe(true);

      const dbProd = await prisma.product.findUnique({
        where: { id: pendingProduct.id },
      });

      expect(dbProd?.approvalStatus).toBe(ProductApprovalStatus.APPROVED);
      expect(dbProd?.isPublished).toBe(true);
      expect(dbProd?.isReviewOverdue).toBe(false);
      expect(dbProd?.reviewOverdueAt).toBeNull();
    });
  });

  describe("5. Supplier Correction Assistant & Revision History", () => {
    let correctionProduct: any;

    beforeAll(async () => {
      const res = await sellerService.createProduct(testSeller.id, {
        title: "Raw Mulberry Silk Stole",
        subtitle: "Handloom Weave",
        description: "Pure raw silk stole.",
        categoryId: testCategory.id,
        basePrice: 2800,
        stock: 10,
        images: ["https://example.com/stole.jpg"],
        action: "SUBMIT",
      });
      correctionProduct = res.product!;
    });

    it("records field-specific feedback and suggested corrections when Admin requests changes", async () => {
      const modRes = await adminService.moderateProduct(
        correctionProduct.id,
        ProductApprovalStatus.CHANGES_REQUESTED,
        "Please provide detailed fiber origin and add at least two additional photographs showing the hand-rolled hem.",
        adminUser.id,
        {
          rejectedFields: ["description", "images"],
          suggestedCorrections: "Elaborate on mulberry silkworm cocoon provenance and add texture close-up.",
        }
      );

      expect(modRes.success).toBe(true);

      const dbProd = await prisma.product.findUnique({
        where: { id: correctionProduct.id },
      });

      expect(dbProd?.approvalStatus).toBe(ProductApprovalStatus.CHANGES_REQUESTED);
      expect(dbProd?.isPublished).toBe(false);
      expect(dbProd?.rejectedFieldsJson).toContain("description");
      expect(dbProd?.suggestedCorrectionsJson).toContain("mulberry silkworm");
    });

    it("preserves immutable revision history snapshots", async () => {
      const revisions = await productRevisionService.getRevisions(correctionProduct.id);
      expect(revisions.length).toBeGreaterThanOrEqual(1);
      expect(revisions[0].adminFeedback).toContain("fiber origin");
      expect(revisions[0].changedFields).toContain("description");
    });

    it("resubmits corrected piece for review, creating new revision snapshot and clearing flags", async () => {
      const updateRes = await sellerService.updateProduct(testSeller.id, correctionProduct.id, {
        description: "Certified organically grown Ahimsa Mulberry Silk from Assam, hand-rolled with fine silk threads.",
        images: [
          "https://example.com/stole.jpg",
          "https://example.com/stole_hem.jpg",
          "https://example.com/stole_texture.jpg",
        ],
        action: "SUBMIT",
      });

      expect(updateRes.success).toBe(true);

      const dbProd = await prisma.product.findUnique({
        where: { id: correctionProduct.id },
      });

      expect(dbProd?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
      expect(dbProd?.rejectedFieldsJson).toBeNull();
      expect(dbProd?.suggestedCorrectionsJson).toBeNull();
      expect(dbProd?.isReviewOverdue).toBe(false);

      const revisionsAfter = await productRevisionService.getRevisions(correctionProduct.id);
      expect(revisionsAfter.length).toBeGreaterThanOrEqual(2);
    });
  });
});

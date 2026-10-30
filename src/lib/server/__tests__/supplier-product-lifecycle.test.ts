import { describe, it, expect, afterAll } from "vitest";
import { sellerService } from "../seller-service";
import { adminService } from "../admin-service";
import { prisma } from "../prisma";
import { ProductApprovalStatus } from "@prisma/client";
import { SellerProductInput } from "@/types/seller";

describe("Supplier Product Management Lifecycle & Security Integration", () => {
  const sellerAId = "vnd_sol_textiles"; // Approved studio: Solstice Textiles
  const sellerBId = "vnd_voxel_audio";  // Approved studio: Voxel Audio
  const adminUserId = "usr_super_admin"; // Admin user

  const testProductIds: string[] = [];

  afterAll(async () => {
    // Clean up test products created during tests
    if (testProductIds.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { productId: { in: testProductIds } },
      });
      await prisma.productImage.deleteMany({
        where: { productId: { in: testProductIds } },
      });
      await prisma.auditEvent.deleteMany({
        where: { entityId: { in: testProductIds } },
      });
      await prisma.product.deleteMany({
        where: { id: { in: testProductIds } },
      });
    }
  });

  it("1. Supplier creates a piece as DRAFT - persists all specifications and never auto-publishes", async () => {
    const timestamp = Date.now();
    const payload: SellerProductInput = {
      title: `Artisan Linen Tunic ${timestamp}`,
      subtitle: "Hand-spun organic linen",
      description: "Breathable organic linen tunic crafted using indigenous heritage handloom techniques.",
      categoryId: "cat_apparel",
      basePrice: 4200,
      compareAtPrice: 5500,
      stock: 15,
      brand: "Solstice Studio",
      dispatchEstimate: "Ships in 2-3 business days",
      material: "100% Organic Belgian Flax Linen",
      dimensions: "Chest 42in, Length 29in",
      weight: "350g",
      careInstructions: "Hand wash cold with gentle detergent. Line dry in shade.",
      action: "DRAFT",
      images: [
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          sku: `SLS-TUNIC-${timestamp}-S`,
          variantType: "SIZE",
          name: "Small",
          value: "S",
          stock: 5,
        },
        {
          sku: `SLS-TUNIC-${timestamp}-M`,
          variantType: "SIZE",
          name: "Medium",
          value: "M",
          stock: 10,
        },
      ],
    };

    const res = await sellerService.createProduct(sellerAId, payload);
    expect(res.success).toBe(true);
    expect(res.product).toBeDefined();

    const productId = res.product!.id;
    testProductIds.push(productId);

    // Verify in DB directly
    const dbRecord = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true, images: true },
    });

    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.approvalStatus).toBe(ProductApprovalStatus.DRAFT);
    expect(dbRecord?.isPublished).toBe(false);
    expect(dbRecord?.vendorId).toBe(sellerAId);
    expect(dbRecord?.material).toBe("100% Organic Belgian Flax Linen");
    expect(dbRecord?.dimensions).toBe("Chest 42in, Length 29in");
    expect(dbRecord?.weight).toBe("350g");
    expect(dbRecord?.careInstructions).toContain("Hand wash cold");
    expect(dbRecord?.images.length).toBe(2);
    expect(dbRecord?.variants.length).toBe(2);
  });

  it("2. Owner fetches full product details via getProductById", async () => {
    const productId = testProductIds[0];
    const detail = await sellerService.getProductById(sellerAId, productId);

    expect(detail.success).toBe(true);
    expect(detail.product).toBeDefined();
    expect(detail.product?.id).toBe(productId);
    expect(detail.product?.approvalStatus).toBe("DRAFT");
    expect(detail.product?.isPublished).toBe(false);
    expect(detail.product?.material).toBe("100% Organic Belgian Flax Linen");
    expect(detail.product?.images.length).toBe(2);
    expect(detail.product?.variants.length).toBe(2);
  });

  it("3. Multi-tenant isolation: non-owner Supplier B cannot read or modify Supplier A's piece", async () => {
    const productId = testProductIds[0];

    // Read attempt by Supplier B
    const readAttempt = await sellerService.getProductById(sellerBId, productId);
    expect(readAttempt.success).toBe(false);
    expect(readAttempt.error).toContain("access denied");

    // Update attempt by Supplier B
    const updateAttempt = await sellerService.updateProduct(sellerBId, productId, {
      title: "Hacked by Tenant B",
      basePrice: 100,
    });

    expect(updateAttempt.success).toBe(false);
    expect(updateAttempt.error).toContain("access denied");

    // Verify database was NOT modified
    const dbRecord = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbRecord?.title).not.toBe("Hacked by Tenant B");
    expect(dbRecord?.basePricePaise).toBe(420000);
  });

  it("4. Supplier edits draft and submits it for Admin Review", async () => {
    const productId = testProductIds[0];

    // Supplier updates price and submits for review
    const updateRes = await sellerService.updateProduct(sellerAId, productId, {
      title: "Artisan Linen Tunic - Revised Fit",
      basePrice: 4500,
      compareAtPrice: 5800,
      action: "SUBMIT",
    });

    expect(updateRes.success).toBe(true);

    const updatedDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(updatedDb?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
    expect(updatedDb?.isPublished).toBe(false);
    expect(updatedDb?.basePricePaise).toBe(450000);
    expect(updatedDb?.title).toBe("Artisan Linen Tunic - Revised Fit");
  });

  it("5. Admin reviews and approves the product - piece becomes live on storefront", async () => {
    const productId = testProductIds[0];

    const modResult = await adminService.moderateProduct(
      productId,
      ProductApprovalStatus.APPROVED,
      "Excellent photography and complete craft heritage specifications.",
      adminUserId
    );

    expect(modResult.success).toBe(true);

    const approvedDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(approvedDb?.approvalStatus).toBe(ProductApprovalStatus.APPROVED);
    expect(approvedDb?.isPublished).toBe(true);
    expect(approvedDb?.moderationNotes).toContain("Excellent photography");
  });

  it("6. Re-moderation security gate: supplier edits an APPROVED product -> automatically reverts to PENDING_REVIEW & isPublished: false", async () => {
    const productId = testProductIds[0];

    // Supplier modifies price or title on live product
    const editRes = await sellerService.updateProduct(sellerAId, productId, {
      title: "Artisan Linen Tunic - New Limited Edition Colorway",
      basePrice: 4900,
      action: "SUBMIT",
    });

    expect(editRes.success).toBe(true);

    // Product must be revoked from live storefront and placed back in PENDING_REVIEW
    const revertedDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(revertedDb?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
    expect(revertedDb?.isPublished).toBe(false);
    expect(revertedDb?.title).toBe("Artisan Linen Tunic - New Limited Edition Colorway");

    // Verify audit event was logged
    const auditEvent = await prisma.auditEvent.findFirst({
      where: {
        entityId: productId,
        action: "PRODUCT_EDITED_REMODERATION_TRIGGERED",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(auditEvent).not.toBeNull();
    expect(auditEvent?.note).toContain("Re-moderation triggered");
  });

  it("7. Admin requests changes with feedback -> Supplier sees feedback, fixes piece, and resubmits", async () => {
    const productId = testProductIds[0];

    // Admin rejects with feedback notes
    const rejectRes = await adminService.moderateProduct(
      productId,
      ProductApprovalStatus.REJECTED,
      "Please provide clear care instructions regarding dry cleaning vs hand washing.",
      adminUserId
    );
    expect(rejectRes.success).toBe(true);

    // Verify status is REJECTED with notes
    const rejectedDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(rejectedDb?.approvalStatus).toBe(ProductApprovalStatus.REJECTED);
    expect(rejectedDb?.isPublished).toBe(false);
    expect(rejectedDb?.moderationNotes).toContain("Please provide clear care instructions");

    // Supplier retrieves details and sees feedback
    const sellerView = await sellerService.getProductById(sellerAId, productId);
    expect(sellerView.success).toBe(true);
    expect(sellerView.product?.approvalStatus).toBe("REJECTED");
    expect(sellerView.product?.moderationNotes).toContain("care instructions");

    // Supplier updates care instructions and resubmits
    const resubmitRes = await sellerService.updateProduct(sellerAId, productId, {
      careInstructions: "Strictly dry clean only for first 2 cycles, or hand wash with mild wool-silk detergent.",
      action: "SUBMIT",
    });
    expect(resubmitRes.success).toBe(true);

    // Verify re-submitted state
    const resubmittedDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(resubmittedDb?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
    expect(resubmittedDb?.isPublished).toBe(false);
    expect(resubmittedDb?.careInstructions).toContain("Strictly dry clean only");
  });

  it("8. Direct submission on creation: Supplier creates with action SUBMIT enters PENDING_REVIEW immediately", async () => {
    const timestamp = Date.now();
    const payload: SellerProductInput = {
      title: `Handcrafted Indigo Throw ${timestamp}`,
      subtitle: "Natural fermented indigo",
      description: "Pure cotton throw dyed using 100% natural fermented indigo vats in Kachchh.",
      categoryId: "cat_apparel",
      basePrice: 3200,
      stock: 8,
      action: "SUBMIT",
      images: [
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      ],
    };

    const res = await sellerService.createProduct(sellerAId, payload);
    expect(res.success).toBe(true);
    expect(res.product).toBeDefined();

    const productId = res.product!.id;
    testProductIds.push(productId);

    const dbRecord = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbRecord?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
    expect(dbRecord?.isPublished).toBe(false);
  });
});

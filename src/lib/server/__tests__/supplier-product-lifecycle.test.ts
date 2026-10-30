import { describe, it, expect, afterAll } from "vitest";
import { sellerService } from "../seller-service";
import { adminService } from "../admin-service";
import { productRepository } from "../product-repository";
import { orderService } from "../order-service";
import { prisma } from "../prisma";
import { ProductApprovalStatus } from "@prisma/client";
import { SellerProductInput } from "@/types/seller";
import { CheckoutRequestPayload } from "@/types/order";

describe("Supplier Product Management Lifecycle & Security Integration", () => {
  const sellerAId = "vnd_sol_textiles"; // Approved studio: Solstice Textiles
  const sellerBId = "vnd_voxel_audio";  // Approved studio: Voxel Audio
  const adminUserId = "usr_super_admin"; // Admin user
  const customerId = "usr_patron_01";   // Patron customer

  const testProductIds: string[] = [];
  const testOrderIds: string[] = [];

  afterAll(async () => {
    // Clean up test orders created during tests
    if (testOrderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: testOrderIds } },
      });
      await prisma.auditEvent.deleteMany({
        where: { orderId: { in: testOrderIds } },
      });
      await prisma.order.deleteMany({
        where: { id: { in: testOrderIds } },
      });
    }

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

  // Scenario A & B: Product creation, drafting, specifications, and multiple images
  it("A & B. Product creation and draft saving with full specifications and multiple images", async () => {
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
      sku: `MST-TUNIC-${timestamp}`,
      productType: "Physical Craft",
      subcategory: "Handloom Tunics",
      searchKeywords: "linen, organic, handloom, breathable",
      dispatchEstimate: "Ships in 2-3 business days",
      packageDimensions: "30cm x 22cm x 4cm",
      taxRatePercent: 12.0,
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
    expect(dbRecord?.brand).toBe("Solstice Studio");
    expect(dbRecord?.sku).toBe(`MST-TUNIC-${timestamp}`);
    expect(dbRecord?.subcategory).toBe("Handloom Tunics");
    expect(dbRecord?.material).toBe("100% Organic Belgian Flax Linen");
    expect(dbRecord?.images.length).toBe(2);
    expect(dbRecord?.variants.length).toBe(2);
  });

  // Scenario D: IDOR and Tenant Ownership Verification
  it("D. Supplier ownership and IDOR protection: Tenant B cannot view or modify Tenant A's piece", async () => {
    const productId = testProductIds[0];

    // Read attempt by Tenant B
    const readAttempt = await sellerService.getProductById(sellerBId, productId);
    expect(readAttempt.success).toBe(false);
    expect(readAttempt.error).toContain("access denied");

    // Update attempt by Tenant B
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

  // Scenario C: Product editing and resubmission
  it("C. Product editing and resubmission: Draft updates to PENDING_REVIEW", async () => {
    const productId = testProductIds[0];

    const updateRes = await sellerService.updateProduct(sellerAId, productId, {
      title: "Artisan Linen Tunic - Revised Weave",
      basePrice: 4500,
      compareAtPrice: 5800,
      action: "SUBMIT",
    });

    expect(updateRes.success).toBe(true);

    const updatedDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(updatedDb?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
    expect(updatedDb?.isPublished).toBe(false);
    expect(updatedDb?.basePricePaise).toBe(450000);
  });

  // Scenario F: Pending product hidden from public storefront
  it("F. Pending product is strictly hidden from public storefront and slug lookups", async () => {
    const productId = testProductIds[0];
    const dbRecord = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbRecord).not.toBeNull();

    // Query repository slug lookup (used by /product/[slug])
    const publicPiece = await productRepository.getProductBySlug(dbRecord!.slug);
    expect(publicPiece).toBeNull();

    // Query catalog search
    const catalogSearch = await productRepository.getProducts({
      search: "Artisan Linen Tunic - Revised Weave",
    });
    const foundInSearch = catalogSearch.products.some((p) => p.id === productId);
    expect(foundInSearch).toBe(false);
  });

  // Scenario E: Admin approval & rejection
  it("E. Admin approval: Piece transitions to APPROVED and becomes live", async () => {
    const productId = testProductIds[0];

    const modResult = await adminService.moderateProduct(
      productId,
      ProductApprovalStatus.APPROVED,
      "Heritage handloom weave verified.",
      adminUserId
    );

    expect(modResult.success).toBe(true);

    const approvedDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(approvedDb?.approvalStatus).toBe(ProductApprovalStatus.APPROVED);
    expect(approvedDb?.isPublished).toBe(true);
  });

  // Scenario G: Approved product appearing in catalog and search
  it("G. Approved and published product appears in public catalog and search", async () => {
    const productId = testProductIds[0];
    const dbRecord = await prisma.product.findUnique({ where: { id: productId } });

    // Slug lookup
    const publicPiece = await productRepository.getProductBySlug(dbRecord!.slug);
    expect(publicPiece).not.toBeNull();
    expect(publicPiece?.id).toBe(productId);
    expect(publicPiece?.basePrice).toBe(4500);

    // Search query
    const catalogSearch = await productRepository.getProducts({
      search: "Linen Tunic",
    });
    const foundInSearch = catalogSearch.products.some((p) => p.id === productId);
    expect(foundInSearch).toBe(true);
  });

  // Scenario H & I: Featured product in homepage query vs non-featured
  it("H & I. Featured product toggle: Only Admin-featured pieces appear in featured queries", async () => {
    const productId = testProductIds[0];

    // Initially not featured
    let featuredList = await productRepository.getProducts({ featured: true });
    expect(featuredList.products.some((p) => p.id === productId)).toBe(false);

    // Admin marks as featured
    const toggleRes = await adminService.toggleProductFeatured(productId, true, adminUserId);
    expect(toggleRes.success).toBe(true);

    // Now appears in featured query
    featuredList = await productRepository.getProducts({ featured: true });
    expect(featuredList.products.some((p) => p.id === productId)).toBe(true);

    // Admin removes from featured
    await adminService.toggleProductFeatured(productId, false, adminUserId);
    featuredList = await productRepository.getProducts({ featured: true });
    expect(featuredList.products.some((p) => p.id === productId)).toBe(false);
  });

  // Scenario J: Variant stock validation and checkout
  it("J. Variant stock validation and checkout: atomic stock decrements", async () => {
    const productId = testProductIds[0];
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    expect(product).not.toBeNull();

    const smallVariant = product!.variants.find((v) => v.value === "S")!;
    expect(smallVariant).toBeDefined();
    const initialVariantStock = smallVariant.stock; // 5
    const initialProductStock = product!.stock;     // 15

    const orderPayload: CheckoutRequestPayload = {
      items: [
        {
          productId: product!.id,
          selectedSku: smallVariant.sku,
          selectedSize: "S",
          quantity: 2,
        },
      ],
      deliveryMethodId: "standard",
      idempotencyKey: `IDEM-VAR-TEST-${Date.now()}`,
    };

    const orderResult = await orderService.createOrder(customerId, orderPayload);
    expect(orderResult.success).toBe(true);
    expect(orderResult.order).toBeDefined();

    testOrderIds.push(orderResult.order!.id);

    // Verify stock decremented on both variant and product
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: smallVariant.id },
    });
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product!.id },
    });

    expect(updatedVariant?.stock).toBe(initialVariantStock - 2); // 5 - 2 = 3
    expect(updatedProduct?.stock).toBe(initialProductStock - 2); // 15 - 2 = 13
  });

  // Scenario K: Concurrent purchase protection & out-of-stock guard
  it("K. Out-of-stock and variant depletion guard: rejects orders exceeding variant stock", async () => {
    const productId = testProductIds[0];
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    const smallVariant = product!.variants.find((v) => v.value === "S")!;
    expect(smallVariant.stock).toBe(3); // Currently 3 remaining

    // Attempting to buy 10 units of small variant must fail
    const excessivePayload: CheckoutRequestPayload = {
      items: [
        {
          productId: product!.id,
          selectedSku: smallVariant.sku,
          selectedSize: "S",
          quantity: 10,
        },
      ],
      deliveryMethodId: "standard",
      idempotencyKey: `IDEM-OOS-TEST-${Date.now()}`,
    };

    const failResult = await orderService.createOrder(customerId, excessivePayload);
    expect(failResult.success).toBe(false);
    expect(failResult.error).toContain("exceeds available stock");

    // Stock must remain unchanged
    const unchangedVariant = await prisma.productVariant.findUnique({
      where: { id: smallVariant.id },
    });
    expect(unchangedVariant?.stock).toBe(3);
  });

  // Scenario L: Supplier order and inventory consistency on cancellation
  it("L. Inventory consistency: Cancelling order restores both product and variant stock", async () => {
    const productId = testProductIds[0];
    const lastOrderId = testOrderIds[testOrderIds.length - 1];

    const variantBefore = await prisma.productVariant.findFirst({
      where: { productId, value: "S" },
    });
    const productBefore = await prisma.product.findUnique({
      where: { id: productId },
    });

    // Admin cancels the order
    const cancelRes = await adminService.cancelOrderAsAdmin(
      lastOrderId,
      "Customer requested cancellation before shipment dispatch.",
      adminUserId
    );
    expect(cancelRes.success).toBe(true);

    // Verify stock restored
    const variantAfter = await prisma.productVariant.findFirst({
      where: { productId, value: "S" },
    });
    const productAfter = await prisma.product.findUnique({
      where: { id: productId },
    });

    expect(variantAfter?.stock).toBe(variantBefore!.stock + 2); // 3 + 2 = 5
    expect(productAfter?.stock).toBe(productBefore!.stock + 2); // 13 + 2 = 15
  });

  // Additional check: Re-moderation trigger when supplier edits an approved piece
  it("Re-moderation trigger: Editing live approved product automatically unpublishes and returns to PENDING_REVIEW", async () => {
    const productId = testProductIds[0];

    // Verify currently approved and live
    let currentDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(currentDb?.approvalStatus).toBe(ProductApprovalStatus.APPROVED);
    expect(currentDb?.isPublished).toBe(true);

    // Supplier updates price
    const editRes = await sellerService.updateProduct(sellerAId, productId, {
      basePrice: 4800,
    });
    expect(editRes.success).toBe(true);

    // Product must be un-published and moved back to PENDING_REVIEW
    currentDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(currentDb?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
    expect(currentDb?.isPublished).toBe(false);
  });
});

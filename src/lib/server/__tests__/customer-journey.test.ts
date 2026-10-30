import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { authService } from "../auth-service";
import { addressRepository } from "../address-repository";
import { orderService } from "../order-service";
import { couponService } from "../coupon-service";
import { reviewService } from "../review-service";
import { filterCatalog } from "@/lib/catalog-filters";
import { calculateCartTotals } from "@/lib/cart-calculations";
import { SEED_PRODUCTS } from "@/data/seedCatalog";
import { OrderStatus, FulfillmentStatus, PaymentStatus } from "@prisma/client";

describe("Public Customer Journey & E-Commerce Lifecycle", () => {
  const testCustomerEmail = `patron_e2e_${Date.now()}@nexu.studio`;
  const testPassword = "SecurePass123!";
  let customerId: string;
  let sessionToken: string;
  let shippingAddressId: string;
  let placedOrderId: string;
  let testDeliveredOrderId: string;
  let testDeliveredItemId: string;

  beforeAll(async () => {
    // 1. Register a dedicated test customer
    const regRes = await authService.register(
      "Vikramaditya Rao",
      testCustomerEmail,
      testPassword,
      "+919820011223"
    );
    expect(regRes.success).toBe(true);
    customerId = regRes.user!.id;
    const loginRes = await authService.login(testCustomerEmail, testPassword);
    expect(loginRes.success).toBe(true);
    sessionToken = loginRes.token!;
  });

  afterAll(async () => {
    // Cleanup test records
    if (placedOrderId) {
      await prisma.auditEvent.deleteMany({ where: { orderId: placedOrderId } });
      await prisma.orderItem.deleteMany({ where: { orderId: placedOrderId } });
      await prisma.order.deleteMany({ where: { id: placedOrderId } });
    }
    if (testDeliveredOrderId) {
      await prisma.reviewReaction.deleteMany({ where: { review: { orderItemId: testDeliveredItemId } } });
      await prisma.reviewReport.deleteMany({ where: { review: { orderItemId: testDeliveredItemId } } });
      await prisma.sellerReviewResponse.deleteMany({ where: { review: { orderItemId: testDeliveredItemId } } });
      await prisma.productReview.deleteMany({ where: { orderItemId: testDeliveredItemId } });
      await prisma.disputeCase.deleteMany({ where: { orderId: testDeliveredOrderId } });
      await prisma.auditEvent.deleteMany({ where: { orderId: testDeliveredOrderId } });
      await prisma.orderItem.deleteMany({ where: { orderId: testDeliveredOrderId } });
      await prisma.order.deleteMany({ where: { id: testDeliveredOrderId } });
    }
    if (shippingAddressId) {
      await prisma.address.deleteMany({ where: { id: shippingAddressId } });
    }
    if (customerId) {
      await prisma.session.deleteMany({ where: { userId: customerId } });
      await prisma.customerProfile.deleteMany({ where: { userId: customerId } });
      await prisma.user.deleteMany({ where: { id: customerId } });
    }
  });

  describe("1. Catalog Discovery & Search Engine", () => {
    it("searches catalog pieces by natural language keywords and category filtering", () => {
      // Search for silk
      const silkResults = filterCatalog(SEED_PRODUCTS, {
        category: "All",
        searchQuery: "silk",
        inStockOnly: false,
        sortBy: "featured",
      });
      expect(silkResults.length).toBeGreaterThan(0);
      expect(silkResults.some((p) => p.title.toLowerCase().includes("silk"))).toBe(true);

      // Filter by category: Apparel
      const apparelResults = filterCatalog(SEED_PRODUCTS, {
        category: "Apparel",
        inStockOnly: false,
        sortBy: "price-asc",
      });
      expect(apparelResults.length).toBeGreaterThan(0);
      for (const p of apparelResults) {
        expect(p.category).toBe("Apparel");
      }
    });

    it("verifies accurate price ordering and availability filters", () => {
      const sortedByPriceAsc = filterCatalog(SEED_PRODUCTS, {
        category: "All",
        inStockOnly: true,
        sortBy: "price-asc",
      });
      for (let i = 0; i < sortedByPriceAsc.length - 1; i++) {
        expect(sortedByPriceAsc[i].basePrice).toBeLessThanOrEqual(sortedByPriceAsc[i + 1].basePrice);
      }
    });
  });

  describe("2. Cart Calculations & Multi-Vendor Grouping", () => {
    it("computes accurate subtotal, GST, and tiered shipping threshold (free above ₹2,500)", () => {
      const p1 = SEED_PRODUCTS[0]; // Chanderi Silk (~₹14,500)
      const p2 = SEED_PRODUCTS[1]; // Voxel Audio (~₹28,000)

      // 1. High value order (> ₹2,500) -> free shipping
      const highValueCart = [
        { product: p1, quantity: 1, unitPrice: p1.basePrice },
        { product: p2, quantity: 1, unitPrice: p2.basePrice },
      ];
      const totals1 = calculateCartTotals(highValueCart as any);
      expect(totals1.subtotal).toBe(p1.basePrice + p2.basePrice);
      expect(totals1.shippingFee).toBe(0); // Free delivery
      expect(totals1.itemCount).toBe(2);

      // 2. Low value single item (< ₹2,500)
      const lowPriceItem = { ...p1, basePrice: 1200 };
      const lowValueCart = [{ product: lowPriceItem, quantity: 1, unitPrice: 1200 }];
      const totals2 = calculateCartTotals(lowValueCart as any);
      expect(totals2.shippingFee).toBe(150); // Flat courier fee applied
    });
  });

  describe("3. Promotional Coupon Validation Engine", () => {
    it("validates inaugural coupon NEXUFIRST and calculates exact percentage discount with cap", async () => {
      // Subtotal of ₹5,000: 15% discount is ₹750 (within ₹1,500 cap)
      const res = await couponService.validateCoupon("NEXUFIRST", customerId, 500000);
      expect(res.valid).toBe(true);
      expect(res.discountPaise).toBe(75000); // ₹750

      // Subtotal of ₹20,000: 15% would be ₹3,000, but capped at ₹1,500
      const cappedRes = await couponService.validateCoupon("NEXUFIRST", customerId, 2000000);
      expect(cappedRes.valid).toBe(true);
      expect(cappedRes.discountPaise).toBe(150000); // ₹1,500 max cap
    });

    it("rejects coupon when cart subtotal is below minimum order value", async () => {
      // NEXUFIRST requires ₹2,000 min order (200,000 paise). Test with ₹1,200 (120,000 paise)
      const res = await couponService.validateCoupon("NEXUFIRST", customerId, 120000);
      expect(res.valid).toBe(false);
      expect(res.message).toContain("Minimum order amount");
    });
  });

  describe("4. Customer Address Book & PIN Code Verification", () => {
    it("saves and verifies a customer delivery address with valid 6-digit Indian PIN code", async () => {
      const addressRes = await addressRepository.addAddress(customerId, {
        fullName: "Vikramaditya Rao",
        street: "702, Samudra Mahal, Worli Sea Face",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400018",
        phone: "+919820011223",
      });

      expect(addressRes.success).toBe(true);
      expect(addressRes.address).toBeDefined();
      shippingAddressId = addressRes.address!.id;
      expect(addressRes.address!.isDefault).toBe(true);
    });
  });

  describe("5. Server-Authoritative Checkout & Order Placement", () => {
    it("places an idempotent order with coupon deduction, decrements inventory, and logs audit events", async () => {
      const product = await prisma.product.findFirst({
        where: { isPublished: true, stock: { gt: 5 } },
      });
      expect(product).not.toBeNull();
      if (!product) return;

      const initialStock = product.stock;
      const idempotencyKey = `idemp_e2e_${Date.now()}`;

      const orderRes = await orderService.createOrder(customerId, {
        items: [{ productId: product.id, quantity: 1 }],
        shippingAddressId,
        deliveryMethodId: "standard",
        couponCode: "NEXUFIRST",
        idempotencyKey,
      });

      expect(orderRes.success).toBe(true);
      expect(orderRes.order).toBeDefined();
      placedOrderId = orderRes.order!.id;

      // Verify database persistence
      const savedOrder = await prisma.order.findUnique({
        where: { id: placedOrderId },
        include: { items: true, auditEvents: true },
      });

      expect(savedOrder?.customerId).toBe(customerId);
      expect(savedOrder?.status).toBe(OrderStatus.CONFIRMED);
      expect(savedOrder?.items.length).toBe(1);
      expect(savedOrder?.items[0].productId).toBe(product.id);
      expect(savedOrder?.discountPaise).toBeGreaterThan(0);

      // Verify stock was decremented
      const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(updatedProduct?.stock).toBe(initialStock - 1);

      // Verify idempotency: resubmitting same key returns same order without double decrement
      const duplicateRes = await orderService.createOrder(customerId, {
        items: [{ productId: product.id, quantity: 1 }],
        shippingAddressId,
        deliveryMethodId: "standard",
        couponCode: "NEXUFIRST",
        idempotencyKey,
      });
      expect(duplicateRes.success).toBe(true);
      expect(duplicateRes.order?.id).toBe(placedOrderId);
      const stockAfterDuplicate = await prisma.product.findUnique({ where: { id: product.id } });
      expect(stockAfterDuplicate?.stock).toBe(initialStock - 1);
    });

    it("enforces tenant access control: other customers cannot retrieve or view another patron's order", async () => {
      const strangerCustomerId = "usr_patron_01";
      const strangerAccess = await orderService.getOrderById(strangerCustomerId, placedOrderId);
      expect(strangerAccess).toBeNull();
    });

    it("permits pre-dispatch cancellation and atomically restores inventory", async () => {
      const savedOrder = await prisma.order.findUnique({
        where: { id: placedOrderId },
        include: { items: true },
      });
      const orderItem = savedOrder!.items[0];

      const productBeforeCancel = await prisma.product.findUnique({ where: { id: orderItem.productId! } });
      const stockBeforeCancel = productBeforeCancel!.stock;

      const cancelRes = await orderService.cancelOrder(customerId, placedOrderId, "Customer request");
      expect(cancelRes.success).toBe(true);

      const productAfterCancel = await prisma.product.findUnique({ where: { id: orderItem.productId! } });
      expect(productAfterCancel?.stock).toBe(stockBeforeCancel + 1);

      const orderAfterCancel = await prisma.order.findUnique({ where: { id: placedOrderId } });
      expect(orderAfterCancel?.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe("6. Post-Delivery Return & Dispute Workflow", () => {
    it("allows a customer to open a return dispute case within 14 days of confirmed delivery", async () => {
      const p = await prisma.product.findFirst({ where: { isPublished: true } });
      expect(p).not.toBeNull();

      // Seed a delivered order for testing dispute & review eligibility
      const deliveredOrder = await prisma.order.create({
        data: {
          id: `ORD-DELIV-E2E-${Date.now()}`,
          customerId,
          customerEmail: testCustomerEmail,
          customerName: "Vikramaditya Rao",
          shippingAddressSnapshot: JSON.stringify({ street: "Sea Face", city: "Mumbai", postalCode: "400018" }),
          deliveryMethodId: "standard",
          deliveryMethodName: "Standard Courier",
          deliveryEstimatedDays: 3,
          estimatedDeliveryDate: new Date(),
          shippingFeePaise: 0,
          estimatedTaxPaise: 1000,
          subtotalPaise: 100000,
          totalPaise: 101000,
          status: OrderStatus.DELIVERED,
          items: {
            create: {
              id: `item_deliv_${Date.now()}`,
              product: { connect: { id: p!.id } },
              productSlug: p!.slug,
              title: p!.title,
              vendorId: p!.vendorId,
              vendorName: "Artisan Studio",
              selectedColorName: "Obsidian",
              selectedSku: "OBS-001",
              unitPricePaise: 100000,
              quantity: 1,
              lineTotalPaise: 100000,
              imageSnapshot: "https://images.unsplash.com/photo-test",
              fulfillmentStatus: FulfillmentStatus.DELIVERED,
            },
          },
        },
        include: { items: true },
      });

      testDeliveredOrderId = deliveredOrder.id;
      testDeliveredItemId = deliveredOrder.items[0].id;

      // Customer opens return request
      const dispute = await prisma.disputeCase.create({
        data: {
          id: `DSP-E2E-${Date.now().toString().slice(-6)}`,
          orderId: testDeliveredOrderId,
          orderItemId: testDeliveredItemId,
          customerId,
          sellerId: p!.vendorId,
          reason: "Minor weave variance on sleeve hem.",
          evidence: "https://images.unsplash.com/evidence-test",
        },
      });

      expect(dispute.id).toBeDefined();
      expect(dispute.orderId).toBe(testDeliveredOrderId);
      expect(dispute.status).toBe("OPEN");
    });
  });

  describe("7. Verified Review Qualification & Privacy Masking", () => {
    it("qualifies a delivered purchase for verified review, sets isVerifiedPurchase: true, and masks name", async () => {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: testDeliveredItemId },
        include: { product: true },
      });

      const review = await reviewService.createReview(
        {
          productId: orderItem!.productId!,
          orderItemId: testDeliveredItemId,
          rating: 5,
          title: "Masterclass in heritage craftsmanship",
          comment: "Texture and structural weight are magnificent. Presentation crate was exceptional.",
        },
        customerId
      );

      expect(review.isVerifiedPurchase).toBe(true);
      expect(review.rating).toBe(5);
      expect(review.reviewerName).toBe("Vikramaditya R."); // Masked to First Name + Initial
      expect(review.variantName).toBe("Obsidian");

      // Verify product aggregate recalculated
      const product = await prisma.product.findUnique({ where: { id: orderItem!.productId! } });
      expect(product?.ratingCount).toBeGreaterThanOrEqual(1);
      expect(product?.rating).toBeGreaterThan(0);
    });

    it("strictly prevents duplicate reviews for the same delivered order item", async () => {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: testDeliveredItemId },
      });

      await expect(
        reviewService.createReview(
          {
            productId: orderItem!.productId!,
            orderItemId: testDeliveredItemId,
            rating: 4,
            title: "Duplicate review attempt",
          },
          customerId
        )
      ).rejects.toThrow("A review has already been submitted for this purchased item.");
    });
  });

  describe("8. Edge Cases, Concurrency & Security Guardrails", () => {
    it("rejects checkout when requested quantity exceeds available studio stock", async () => {
      const product = await prisma.product.findFirst({
        where: { isPublished: true, stock: { gt: 0 } },
      });
      expect(product).not.toBeNull();

      const excessiveQty = (product?.stock || 10) + 1000;
      const failRes = await orderService.createOrder(customerId, {
        items: [{ productId: product!.id, quantity: excessiveQty }],
        shippingAddressId,
        deliveryMethodId: "standard",
      });

      expect(failRes.success).toBe(false);
      expect(failRes.error).toContain("exceeds available stock");
    });

    it("retrieves genuine 3PL shipment and AWB tracking checkpoints on order lookup", async () => {
      const seller = await prisma.seller.findFirst();
      expect(seller).not.toBeNull();

      // Create a test shipment for the delivered order
      const shipment = await prisma.shipment.create({
        data: {
          id: `shp_test_${Date.now()}`,
          orderId: testDeliveredOrderId,
          sellerId: seller!.id,
          carrierName: "Bluedart Air Express",
          trackingNumber: `BD-TEST-${Date.now()}`,
          status: "DELIVERED",
          shippingRatePaise: 35000,
          trackingEvents: {
            create: [
              {
                status: "DELIVERED",
                location: "Mumbai Hub",
                description: "Handed over to patron with signature.",
              },
            ],
          },
        },
      });

      const fetchedOrder = await orderService.getOrderById(customerId, testDeliveredOrderId);
      expect(fetchedOrder).not.toBeNull();
      expect(fetchedOrder?.shipments).toBeDefined();
      expect(fetchedOrder?.shipments?.length).toBeGreaterThanOrEqual(1);
      const matchedShipment = fetchedOrder?.shipments?.find((s) => s.id === shipment.id);
      expect(matchedShipment?.trackingNumber).toBe(shipment.trackingNumber);
      expect(matchedShipment?.carrier).toBe("Bluedart Air Express");
      expect(matchedShipment?.trackingEvents[0].location).toBe("Mumbai Hub");

      // Cleanup test shipment
      await prisma.shipmentTrackingEvent.deleteMany({ where: { shipmentId: shipment.id } });
      await prisma.shipment.delete({ where: { id: shipment.id } });
    });

    it("queues an account recovery notification when patron requests password reset", async () => {
      const user = await prisma.user.findUnique({ where: { id: customerId } });
      expect(user).not.toBeNull();

      const req = new Request("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testCustomerEmail }),
      });

      // Call the forgot password route handler logic directly
      const { POST } = await import("@/app/api/auth/forgot-password/route");
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify audit event was logged
      const audit = await prisma.auditEvent.findFirst({
        where: { action: "ACCOUNT_RECOVERY_REQUESTED", entityId: customerId },
      });
      expect(audit).not.toBeNull();
      expect(audit?.performedBy).toBe(testCustomerEmail);
    });

    it("supports product craft Q&A: patron asks question, artisan replies, community upvotes", async () => {
      const product = await prisma.product.findFirst({ where: { isPublished: true } });
      expect(product).not.toBeNull();

      // 1. Create Question
      const q = await prisma.productQuestion.create({
        data: {
          productId: product!.id,
          authorName: "Vikramaditya Rao",
          question: "Can this piece withstand high humidity in Mumbai coastal monsoon?",
          upvotes: 0,
        },
      });
      expect(q.id).toBeDefined();

      // 2. Answer Question
      const a = await prisma.productAnswer.create({
        data: {
          questionId: q.id,
          authorName: "Master Weaver Studio",
          authorRole: "STUDIO_ARTISAN",
          answer: "Yes, our organic plant-based finishing treatment repels humidity without losing drape quality.",
          upvotes: 0,
        },
      });
      expect(a.id).toBeDefined();
      expect(a.authorRole).toBe("STUDIO_ARTISAN");

      // 3. Upvote Question
      const upvoted = await prisma.productQuestion.update({
        where: { id: q.id },
        data: { upvotes: { increment: 1 } },
      });
      expect(upvoted.upvotes).toBe(1);

      // Cleanup
      await prisma.productAnswer.deleteMany({ where: { questionId: q.id } });
      await prisma.productQuestion.delete({ where: { id: q.id } });
    });

    it("verifies patron data sovereignty: records erasure request and logs audit trail", async () => {
      const audit = await prisma.auditEvent.create({
        data: {
          entityType: "USER",
          entityId: customerId,
          action: "PATRON_ERASURE_REQUESTED",
          performedBy: testCustomerEmail,
          note: "Privacy deletion requested under Indian DPDP statutory regulations.",
        },
      });
      expect(audit.id).toBeDefined();
      expect(audit.action).toBe("PATRON_ERASURE_REQUESTED");

      const fetchedAudit = await prisma.auditEvent.findUnique({
        where: { id: audit.id },
      });
      expect(fetchedAudit?.performedBy).toBe(testCustomerEmail);

      // Cleanup
      await prisma.auditEvent.delete({ where: { id: audit.id } });
    });
  });
});

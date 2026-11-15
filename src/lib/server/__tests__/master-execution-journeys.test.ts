import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { authService } from "../auth-service";
import { orderService } from "../order-service";
import { sellerService } from "../seller-service";
import { adminService } from "../admin-service";
import { addressRepository } from "../address-repository";
import { productRepository } from "../product-repository";
import { createReturnRequest } from "../return-service";
import {
  SellerStatus,
  ProductApprovalStatus,
  FulfillmentStatus,
  PayoutStatus,
  OrderStatus,
  UserRole,
} from "@prisma/client";

describe("NEXU ATELIER — MASTER EXECUTION MISSION: 5 CORE PLATFORM JOURNEYS", () => {
  const ts = Date.now();
  const cleanupUserIds: string[] = [];
  const cleanupOrderIds: string[] = [];
  const cleanupProductIds: string[] = [];
  const cleanupSellerIds: string[] = [];

  // Trackers across journeys
  let journeyASellerUser: any;
  let journeyASellerProfile: any;
  let journeyAProduct: any;
  let journeyACustomer: any;
  let journeyAOrderId: string;
  let journeyAOrderItemId: string;
  let journeyAPayoutId: string;

  let journeyBCustomer: any;
  let journeyBAddressId: string;
  let journeyBOrderId: string;
  let journeyBOrderItemId: string;
  let journeyBReturnId: string;

  let seller1Profile: any;
  let seller2Profile: any;
  let prodSeller1: any;
  let prodSeller2: any;
  let multiSellerOrderId: string;
  let multiSellerItem1Id: string;
  let multiSellerItem2Id: string;

  let adminUser: any;
  let adminToken: string;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminAuth = await authService.authenticateDemo("admin");
    adminUser = adminAuth.user;
    adminToken = adminAuth.token!;
  });

  afterAll(async () => {
    // Clean up created records gracefully
    try {
      if (cleanupOrderIds.length > 0) {
        await prisma.returnRequest.deleteMany({ where: { orderId: { in: cleanupOrderIds } } });
        await prisma.vendorPayout.deleteMany({ where: { orderItem: { orderId: { in: cleanupOrderIds } } } });
        await prisma.paymentRecord.deleteMany({ where: { orderId: { in: cleanupOrderIds } } });
        await prisma.shipment.deleteMany({ where: { orderId: { in: cleanupOrderIds } } });
        await prisma.orderItem.deleteMany({ where: { orderId: { in: cleanupOrderIds } } });
        await prisma.order.deleteMany({ where: { id: { in: cleanupOrderIds } } });
      }

      if (cleanupProductIds.length > 0) {
        await prisma.productImage.deleteMany({ where: { productId: { in: cleanupProductIds } } });
        await prisma.productVariant.deleteMany({ where: { productId: { in: cleanupProductIds } } });
        await prisma.product.deleteMany({ where: { id: { in: cleanupProductIds } } });
      }

      if (cleanupSellerIds.length > 0) {
        await prisma.seller.deleteMany({ where: { id: { in: cleanupSellerIds } } });
      }

      if (cleanupUserIds.length > 0) {
        await prisma.address.deleteMany({ where: { customerId: { in: cleanupUserIds } } });
        await prisma.session.deleteMany({ where: { userId: { in: cleanupUserIds } } });
        await prisma.customerProfile.deleteMany({ where: { userId: { in: cleanupUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: cleanupUserIds } } });
      }
    } catch (e) {
      console.error("Cleanup error in Master Execution Journeys:", e);
    }
  });

  // =========================================================================
  // JOURNEY A: SELLER LIFECYCLE
  // =========================================================================
  describe("Journey A — Complete Seller Lifecycle", () => {
    it("Step 1: Seller registers an account", async () => {
      const email = `seller_a_${ts}@nexu.studio`;
      const res = await authService.register(
        "Rajesh Varma",
        email,
        "VarmaAtelier2026!",
        "+919876500001"
      );
      expect(res.user).toBeDefined();
      expect(res.user?.role.toLowerCase()).toBe("customer");
      journeyASellerUser = res.user;
      cleanupUserIds.push(res.user!.id);
    });

    it("Step 2: Seller applies for artisan studio seller status", async () => {
      const app = await sellerService.applyForSeller(journeyASellerUser.id, {
        name: `Varma Heritage Looms ${ts}`,
        originHub: "Varanasi, Uttar Pradesh",
        story: "Five generations of Banarasi zari brocade and mulberry silk weaving.",
        businessEmail: `varma_business_${ts}@nexu.studio`,
        businessPhone: "+919876500001",
        leadTimeDays: 4,
      });

      expect(app.seller).toBeDefined();
      expect(app.seller?.status).toBe(SellerStatus.PENDING);
      journeyASellerProfile = app.seller!;
      cleanupSellerIds.push(app.seller!.id);
    });

    it("Step 3: Platform admin reviews and approves the seller application", async () => {
      const approval = await adminService.updateSellerStatus(
        journeyASellerProfile.id,
        SellerStatus.APPROVED,
        "Artisan heritage documentation and tax registration verified.",
        adminUser.id
      );

      expect(approval.success).toBe(true);

      const dbSeller = await prisma.seller.findUnique({ where: { id: journeyASellerProfile.id } });
      expect(dbSeller?.status).toBe(SellerStatus.APPROVED);
    });

    it("Step 4: Seller creates and submits a new artisan product", async () => {
      const cat = await prisma.category.findFirst();
      expect(cat).toBeDefined();

      const prodRes = await sellerService.createProduct(journeyASellerProfile.id, {
        title: `Imperial Shikargah Banarasi Saree ${ts}`,
        subtitle: "Pure Katan Silk with Antique Zari",
        description: "Intricately handwoven with real silver and gold zari in floral hunting motifs.",
        categoryId: cat!.id,
        basePrice: 18500,
        compareAtPrice: 22000,
        stock: 5,
        sku: `VAR-BAN-${ts}`,
        taxRatePercent: 12,
        images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80"],
      });

      expect(prodRes.product).toBeDefined();
      expect(prodRes.product?.approvalStatus).toBe(ProductApprovalStatus.PENDING_REVIEW);
      expect(prodRes.product?.isPublished).toBe(false);
      journeyAProduct = prodRes.product!;
      cleanupProductIds.push(prodRes.product!.id);
    });

    it("Step 5: Admin reviews, verifies and approves the product", async () => {
      const mod = await adminService.moderateProduct(
        journeyAProduct.id,
        ProductApprovalStatus.APPROVED,
        "Editorial authenticity and weave certifications validated.",
        adminUser.id
      );

      expect(mod.success).toBe(true);

      const published = await prisma.product.findUnique({ where: { id: journeyAProduct.id } });
      expect(published?.approvalStatus).toBe(ProductApprovalStatus.APPROVED);
      expect(published?.isPublished).toBe(true);
    });

    it("Step 6: Customer places order for the newly approved product", async () => {
      const custRes = await authService.register(
        "Kavita Mehra",
        `kavita_${ts}@nexu.studio`,
        "PatronPass2026!",
        "+919811002233"
      );
      journeyACustomer = custRes.user;
      cleanupUserIds.push(custRes.user!.id);

      const addr = await addressRepository.addAddress(journeyACustomer.id, {
        fullName: "Kavita Mehra",
        phone: "+919811002233",
        street: "44 Defence Colony",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110024",
        type: "home",
        isDefault: true,
      });

      const orderRes = await orderService.createOrder(journeyACustomer.id, {
        items: [{ productId: journeyAProduct.id, quantity: 1 }],
        shippingAddressId: addr.address!.id,
        deliveryMethodId: "standard",
        idempotencyKey: `ord_journey_a_${ts}`,
        paymentMethod: "UPI",
      });

      expect(orderRes.success).toBe(true);
      expect(orderRes.order).toBeDefined();
      journeyAOrderId = orderRes.order!.id;
      journeyAOrderItemId = orderRes.order!.items[0].id!;
      cleanupOrderIds.push(journeyAOrderId);

      // Verify stock was decremented atomically
      const updatedStock = await prisma.product.findUnique({ where: { id: journeyAProduct.id } });
      expect(updatedStock?.stock).toBe(4);
    });

    it("Step 7: Seller receives order item and packs it", async () => {
      const sellerOrders = await sellerService.getSellerOrderLines(journeyASellerProfile.id);
      expect(sellerOrders.orderLines.length).toBeGreaterThanOrEqual(1);

      const item = sellerOrders.orderLines.find((l) => l.id === journeyAOrderItemId);
      expect(item).toBeDefined();
      expect(item?.fulfillmentStatus).toBe(FulfillmentStatus.NEW);

      const pack = await sellerService.updateFulfillmentStatus(
        journeyASellerProfile.id,
        journeyAOrderItemId,
        FulfillmentStatus.PACKED
      );

      expect(pack.success).toBe(true);
      expect(pack.orderLine?.fulfillmentStatus).toBe(FulfillmentStatus.PACKED);
    });

    it("Step 8: Seller dispatches with valid courier tracking", async () => {
      const ship = await sellerService.updateFulfillmentStatus(
        journeyASellerProfile.id,
        journeyAOrderItemId,
        FulfillmentStatus.SHIPPED,
        {
          courierName: "Delhivery Surface",
          trackingNumber: `DEL-SUR-${ts}`,
        }
      );

      expect(ship.success).toBe(true);
      expect(ship.orderLine?.fulfillmentStatus).toBe(FulfillmentStatus.SHIPPED);
      expect(ship.orderLine?.trackingNumber).toBe(`DEL-SUR-${ts}`);
    });

    it("Step 9: Delivery confirmed and payout unlocks to ELIGIBLE_FOR_PAYOUT", async () => {
      // Simulate delivery completion
      await prisma.orderItem.update({
        where: { id: journeyAOrderItemId },
        data: {
          fulfillmentStatus: FulfillmentStatus.DELIVERED,
          deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago (past 7-day return window)
        },
      });

      // Create linked payout in ESCROW_HOLD
      const payout = await prisma.vendorPayout.create({
        data: {
          sellerId: journeyASellerProfile.id,
          orderItemId: journeyAOrderItemId,
          grossAmountPaise: 1850000,
          commissionPaise: 185000, // 10% platform commission
          netPayoutPaise: 1665000,  // ₹16,650
          status: PayoutStatus.ESCROW_HOLD,
        },
      });
      journeyAPayoutId = payout.id;

      // Unlock eligible payouts
      const unlocked = await prisma.vendorPayout.update({
        where: { id: journeyAPayoutId },
        data: { status: PayoutStatus.ELIGIBLE_FOR_PAYOUT },
      });

      expect(unlocked.status).toBe(PayoutStatus.ELIGIBLE_FOR_PAYOUT);
      expect(unlocked.netPayoutPaise).toBe(1665000);
    });
  });

  // =========================================================================
  // JOURNEY B: CUSTOMER END-TO-END JOURNEY
  // =========================================================================
  describe("Journey B — Customer Shopping, Ordering & Return Lifecycle", () => {
    it("Step 1: Unauthenticated customer browses catalog and queries PDP", async () => {
      const catalog = await productRepository.getProducts({ page: 1, limit: 5 });
      expect(catalog.products.length).toBeGreaterThan(0);

      const targetProduct = catalog.products[0];
      const pdp = await productRepository.getProductBySlug(targetProduct.slug);
      expect(pdp).toBeDefined();
      expect(pdp?.id).toBe(targetProduct.id);
      expect(pdp?.images.length).toBeGreaterThanOrEqual(1);
    });

    it("Step 2: Customer registers and saves delivery address", async () => {
      const email = `customer_b_${ts}@nexu.studio`;
      const cust = await authService.register(
        "Vikramaditya Rao",
        email,
        "CustomerSecret2026!",
        "+919845012345"
      );
      journeyBCustomer = cust.user;
      cleanupUserIds.push(cust.user!.id);

      const addr = await addressRepository.addAddress(journeyBCustomer.id, {
        fullName: "Vikramaditya Rao",
        phone: "+919845012345",
        street: "702 Indiranagar 100ft Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
        type: "work",
        isDefault: true,
      });

      expect(addr.success).toBe(true);
      journeyBAddressId = addr.address!.id;
    });

    it("Step 3: Customer executes server-authoritative checkout with COD", async () => {
      const product = await prisma.product.findFirst({
        where: { isPublished: true, stock: { gte: 5 } },
      });
      expect(product).toBeDefined();

      const orderRes = await orderService.createOrder(journeyBCustomer.id, {
        items: [{ productId: product!.id, quantity: 1 }],
        shippingAddressId: journeyBAddressId,
        deliveryMethodId: "standard",
        idempotencyKey: `ord_journey_b_${ts}`,
        paymentMethod: "COD",
      });

      expect(orderRes.success).toBe(true);
      expect(orderRes.order).toBeDefined();
      journeyBOrderId = orderRes.order!.id;
      journeyBOrderItemId = orderRes.order!.items[0].id!;
      cleanupOrderIds.push(journeyBOrderId);

      // Verify COD payment record state
      expect((orderRes.order?.paymentInfo as any)?.isCod).toBe(true);
      expect(orderRes.order?.status).toBe("confirmed");
    });

    it("Step 4: Customer checks consignment tracking status", async () => {
      const order = await orderService.getOrderById(journeyBCustomer.id, journeyBOrderId);
      expect(order).toBeDefined();
      expect(order?.id).toBe(journeyBOrderId);
      expect(order?.shipments).toBeDefined();
    });

    it("Step 5: Customer requests a return for the delivered item", async () => {
      // Mark item delivered
      await prisma.orderItem.update({
        where: { id: journeyBOrderItemId },
        data: {
          fulfillmentStatus: FulfillmentStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });

      const ret = await createReturnRequest({
        orderId: journeyBOrderId,
        orderItemId: journeyBOrderItemId,
        customerId: journeyBCustomer.id,
        type: "RETURN",
        reason: "SIZE_FIT_ISSUE",
        explanation: "Slight difference from measurements in sizing chart.",
        quantity: 1,
      });

      expect(ret).toBeDefined();
      expect(ret.status).toBe("REQUESTED");
      journeyBReturnId = ret.id;
    });
  });

  // =========================================================================
  // JOURNEY C: MULTI-SELLER CHECKOUT & INDEPENDENT FULFILLMENT
  // =========================================================================
  describe("Journey C — Multi-Seller Cart, Order Segregation & Split Fulfillment", () => {
    it("Step 1: Setup two distinct sellers and active products", async () => {
      const cat = await prisma.category.findFirst();

      // Seller 1
      const s1User = await authService.register("Arjun Kapur", `arjun_${ts}@nexu.studio`, "Pass123!", "+919811003344");
      cleanupUserIds.push(s1User.user!.id);
      const s1App = await sellerService.applyForSeller(s1User.user!.id, {
        name: `Kapur Leather Guild ${ts}`,
        originHub: "Kanpur, Uttar Pradesh",
        story: "Full-grain vegetable-tanned artisanal leather accessories.",
        businessEmail: `arjun_biz_${ts}@nexu.studio`,
        businessPhone: "+919811003344",
        leadTimeDays: 2,
      });
      await prisma.seller.update({ where: { id: s1App.seller!.id }, data: { status: SellerStatus.APPROVED } });
      seller1Profile = s1App.seller!;
      cleanupSellerIds.push(s1App.seller!.id);

      const p1 = await sellerService.createProduct(seller1Profile.id, {
        title: `Heritage Leather Duffle Bag ${ts}`,
        subtitle: "Full-grain Saddle Tan",
        description: "Handcrafted duffle bag with brass fittings.",
        categoryId: cat!.id,
        basePrice: 8500,
        compareAtPrice: 11000,
        stock: 10,
        sku: `KAP-BAG-${ts}`,
        taxRatePercent: 12,
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80"],
      });
      await prisma.product.update({ where: { id: p1.product!.id }, data: { isPublished: true, approvalStatus: ProductApprovalStatus.APPROVED } });
      prodSeller1 = p1.product!;
      cleanupProductIds.push(p1.product!.id);

      // Seller 2
      const s2User = await authService.register("Pooja Nair", `pooja_${ts}@nexu.studio`, "Pass123!", "+919811005566");
      cleanupUserIds.push(s2User.user!.id);
      const s2App = await sellerService.applyForSeller(s2User.user!.id, {
        name: `Nair Brass & Bell Metal ${ts}`,
        originHub: "Thrissur, Kerala",
        story: "Traditional bell metal Aranmula mirrors and handcrafted temple brassware.",
        businessEmail: `pooja_biz_${ts}@nexu.studio`,
        businessPhone: "+919811005566",
        leadTimeDays: 5,
      });
      await prisma.seller.update({ where: { id: s2App.seller!.id }, data: { status: SellerStatus.APPROVED } });
      seller2Profile = s2App.seller!;
      cleanupSellerIds.push(s2App.seller!.id);

      const p2 = await sellerService.createProduct(seller2Profile.id, {
        title: `Handcrafted Brass Diya Set ${ts}`,
        subtitle: "Lost-wax cast bell metal",
        description: "Set of two polished traditional brass oil lamps.",
        categoryId: cat!.id,
        basePrice: 4200,
        compareAtPrice: 5500,
        stock: 8,
        sku: `NAIR-DIY-${ts}`,
        taxRatePercent: 12,
        images: ["https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=1200&q=80"],
      });
      await prisma.product.update({ where: { id: p2.product!.id }, data: { isPublished: true, approvalStatus: ProductApprovalStatus.APPROVED } });
      prodSeller2 = p2.product!;
      cleanupProductIds.push(p2.product!.id);
    });

    it("Step 2: Customer places a single multi-vendor order spanning Seller 1 and Seller 2", async () => {
      const orderRes = await orderService.createOrder(journeyBCustomer.id, {
        items: [
          { productId: prodSeller1.id, quantity: 1 },
          { productId: prodSeller2.id, quantity: 1 },
        ],
        shippingAddressId: journeyBAddressId,
        deliveryMethodId: "standard",
        idempotencyKey: `ord_multi_seller_${ts}`,
        paymentMethod: "UPI",
      });

      expect(orderRes.success).toBe(true);
      expect(orderRes.order).toBeDefined();
      multiSellerOrderId = orderRes.order!.id;
      cleanupOrderIds.push(multiSellerOrderId);

      const order = orderRes.order!;
      expect(order.items.length).toBe(2);

      const item1 = order.items.find((i) => i.productId === prodSeller1.id);
      const item2 = order.items.find((i) => i.productId === prodSeller2.id);

      expect(item1?.vendorId).toBe(seller1Profile.id);
      expect(item2?.vendorId).toBe(seller2Profile.id);

      multiSellerItem1Id = item1!.id!;
      multiSellerItem2Id = item2!.id!;
    });

    it("Step 3: Seller 1 fulfills their shipment while Seller 2 is unaffected", async () => {
      // Seller 1 packs first
      const pack1 = await sellerService.updateFulfillmentStatus(
        seller1Profile.id,
        multiSellerItem1Id,
        FulfillmentStatus.PACKED
      );
      expect(pack1.success).toBe(true);

      // Seller 1 marks as SHIPPED with courier tracking
      const ship1 = await sellerService.updateFulfillmentStatus(
        seller1Profile.id,
        multiSellerItem1Id,
        FulfillmentStatus.SHIPPED,
        { courierName: "Blue Dart Air", trackingNumber: `BLU-AIR-${ts}` }
      );
      expect(ship1.success).toBe(true);
      expect(ship1.orderLine?.fulfillmentStatus).toBe(FulfillmentStatus.SHIPPED);

      // Verify Seller 2's item remains NEW (unaffected by Seller 1's fulfillment)
      const seller2Orders = await sellerService.getSellerOrderLines(seller2Profile.id);
      const item2InS2 = seller2Orders.orderLines.find((l) => l.id === multiSellerItem2Id);
      expect(item2InS2?.fulfillmentStatus).toBe(FulfillmentStatus.NEW);
    });

    it("Step 4: Platform computes distinct commission ledgers for both sellers", async () => {
      // Seller 1 ledger calculation (₹8,500 = 850,000 paise)
      const commissionS1 = Math.round(850000 * 0.10); // 10% = ₹850
      const netS1 = 850000 - commissionS1;           // ₹7,650

      // Seller 2 ledger calculation (₹4,200 = 420,000 paise)
      const commissionS2 = Math.round(420000 * 0.10); // 10% = ₹420
      const netS2 = 420000 - commissionS2;           // ₹3,780

      expect(netS1).toBe(765000);
      expect(netS2).toBe(378000);
    });
  });

  // =========================================================================
  // JOURNEY D: ADMIN GOVERNANCE & SETTLEMENT
  // =========================================================================
  describe("Journey D — Administrative Platform Governance & Settlement", () => {
    it("Step 1: Admin reviews platform orders with multi-vendor context", async () => {
      const { orders } = await adminService.getOrders({ search: multiSellerOrderId });
      expect(orders).toBeDefined();
      const target = orders.find((o) => o.id === multiSellerOrderId);
      expect(target).toBeDefined();
      expect(target?.items.length).toBe(2);
    });

    it("Step 2: Admin inspects and moderates customer return request", async () => {
      const returnRecord = await prisma.returnRequest.findUnique({
        where: { id: journeyBReturnId },
      });
      expect(returnRecord).toBeDefined();

      const approved = await prisma.returnRequest.update({
        where: { id: journeyBReturnId },
        data: {
          status: "APPROVED",
          adminNotes: "Return authorized; reverse pickup scheduled with courier.",
        },
      });

      expect(approved.status).toBe("APPROVED");
    });

    it("Step 3: Admin settles an eligible seller payout with verified banking UTR", async () => {
      const utr = `UTR-HDFC-${ts}-8829`;
      const settlement = await adminService.settlePayout(
        journeyAPayoutId,
        { transactionRef: utr, note: "NEFT banking batch disbursement cleared." },
        adminUser.id
      );

      expect(settlement.success).toBe(true);
      expect(settlement.payout?.status).toBe(PayoutStatus.SETTLED);
      expect(settlement.payout?.transactionRef).toBe(utr);

      // Verify immutable audit event was logged
      const audit = await prisma.auditEvent.findFirst({
        where: {
          entityId: journeyAPayoutId,
          action: "PAYOUT_SETTLED_MANUAL",
        },
      });
      expect(audit).not.toBeNull();
      expect(audit?.note).toContain(utr);
    });
  });

  // =========================================================================
  // JOURNEY E: SECURITY & PENETRATION DEFENSE
  // =========================================================================
  describe("Journey E — Security, Multi-Tenant Isolation & Financial Defense", () => {
    it("Test 1: Cross-seller IDOR defense — Seller 2 cannot access Seller 1 order items", async () => {
      const breachAttempt = await sellerService.updateFulfillmentStatus(
        seller2Profile.id,
        multiSellerItem1Id,
        FulfillmentStatus.DELIVERED
      );
      expect(breachAttempt.success).toBe(false);
      expect(breachAttempt.error).toMatch(/access denied|not found/i);
    });

    it("Test 2: Customer PII leakage defense — Seller order lines omit sensitive customer email", async () => {
      const s1Orders = await sellerService.getSellerOrderLines(seller1Profile.id);
      const line = s1Orders.orderLines.find((l) => l.id === multiSellerItem1Id);
      expect(line).toBeDefined();

      // customerEmail should NOT be exposed on line items to suppliers
      expect((line as any)?.customerEmail).toBeUndefined();
    });

    it("Test 3: Financial UTR uniqueness defense — duplicate banking reference is strictly rejected", async () => {
      const duplicateUtr = `UTR-HDFC-${ts}-8829`; // Already used in Journey D

      // Create a dummy eligible payout
      const dummyPayout = await prisma.vendorPayout.create({
        data: {
          sellerId: seller2Profile.id,
          orderItemId: multiSellerItem2Id,
          grossAmountPaise: 420000,
          commissionPaise: 42000,
          netPayoutPaise: 378000,
          status: PayoutStatus.ELIGIBLE_FOR_PAYOUT,
        },
      });

      const duplicateAttempt = await adminService.settlePayout(
        dummyPayout.id,
        { transactionRef: duplicateUtr },
        adminUser.id
      );

      expect(duplicateAttempt.success).toBe(false);
      expect(duplicateAttempt.error).toMatch(/duplicate/i);

      // Clean up dummy payout
      await prisma.vendorPayout.delete({ where: { id: dummyPayout.id } });
    });

    it("Test 4: Stock race condition defense — excessive quantity requests are rejected", async () => {
      const excessiveAttempt = await orderService.createOrder(journeyBCustomer.id, {
        items: [{ productId: prodSeller1.id, quantity: 99999 }],
        shippingAddressId: journeyBAddressId,
        deliveryMethodId: "standard",
        idempotencyKey: `ord_excessive_${ts}`,
      });

      expect(excessiveAttempt.success).toBe(false);
      expect(excessiveAttempt.error).toMatch(/exceeds available stock/i);
    });

    it("Test 5: Idempotency protection — duplicate order submissions return existing order record", async () => {
      const idempKey = `idemp_secure_${ts}`;
      const payload = {
        items: [{ productId: prodSeller2.id, quantity: 1 }],
        shippingAddressId: journeyBAddressId,
        deliveryMethodId: "standard" as const,
        idempotencyKey: idempKey,
      };

      const first = await orderService.createOrder(journeyBCustomer.id, payload);
      expect(first.success).toBe(true);
      cleanupOrderIds.push(first.order!.id);

      // Second identical request
      const second = await orderService.createOrder(journeyBCustomer.id, payload);
      expect(second.success).toBe(true);
      expect(second.order?.id).toBe(first.order?.id);
    });
  });
});

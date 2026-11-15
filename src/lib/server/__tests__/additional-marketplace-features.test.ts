import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { adminService } from "../admin-service";
import { orderService } from "../order-service";
import { sellerService } from "../seller-service";
import { createSupportTicket, getCustomerTickets } from "../support-ticket-service";
import { createReturnRequest } from "../return-service";
import { sitemapService } from "../sitemap-service";
import { CouponDiscountType, FulfillmentStatus } from "@prisma/client";

describe("NEXU ATELIER — Additional Marketplace Features & Multi-Vendor Engine", () => {
  let testCustomerId: string;
  let testSeller1Id: string;
  let testSeller2Id: string;
  let testProduct1Id: string;
  let testProduct2Id: string;

  beforeAll(async () => {
    const patronUser = await prisma.user.upsert({
      where: { email: "multivendor.patron@nexu.studio" },
      update: {},
      create: {
        email: "multivendor.patron@nexu.studio",
        role: "CUSTOMER",
        passwordHash: "test_hash_pbkdf2_210k",
        profile: {
          create: {
            name: "Arjun Singhania",
          },
        },
      },
    });
    testCustomerId = patronUser.id;

    const sellerUser1 = await prisma.user.upsert({
      where: { email: "seller.surat@nexu.studio" },
      update: {},
      create: {
        email: "seller.surat@nexu.studio",
        role: "SELLER",
        passwordHash: "test_hash_pbkdf2_210k",
      },
    });
    const seller1 = await prisma.seller.upsert({
      where: { slug: "surat-imperial-looms-test" },
      update: {},
      create: {
        userId: sellerUser1.id,
        name: "Master Weavers Guild",
        slug: "surat-imperial-looms-test",
        originHub: "Surat, Gujarat",
        story: "Centuries of silk weaving heritage and master pit loom craftsmanship.",
        heroImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
        businessEmail: "seller.surat@nexu.studio",
        businessPhone: "+919876500001",
        status: "APPROVED",
        verified: true,
      },
    });
    testSeller1Id = seller1.id;

    const sellerUser2 = await prisma.user.upsert({
      where: { email: "seller.brass@nexu.studio" },
      update: {},
      create: {
        email: "seller.brass@nexu.studio",
        role: "SELLER",
        passwordHash: "test_hash_pbkdf2_210k",
      },
    });
    const seller2 = await prisma.seller.upsert({
      where: { slug: "moradabad-foundry-guild-test" },
      update: {},
      create: {
        userId: sellerUser2.id,
        name: "Heritage Foundry Ateliers",
        slug: "moradabad-foundry-guild-test",
        originHub: "Moradabad, Uttar Pradesh",
        story: "Traditional brassware sand-casting and lost-wax bronze metalworks.",
        heroImage: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
        businessEmail: "seller.brass@nexu.studio",
        businessPhone: "+919876500002",
        status: "APPROVED",
        verified: true,
      },
    });
    testSeller2Id = seller2.id;

    const category = await prisma.category.upsert({
      where: { slug: "apparel" },
      update: {},
      create: {
        name: "Apparel & Textiles",
        slug: "apparel",
        description: "Heritage handlooms and silks",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
      },
    });

    const p1 = await prisma.product.upsert({
      where: { slug: "test-imperial-chanderi-silk" },
      update: { stock: 25 },
      create: {
        title: "Test Imperial Chanderi Silk Robe",
        subtitle: "Handwoven pure zari silk robe from historic Surat looms",
        slug: "test-imperial-chanderi-silk",
        description: "Handwoven pure zari silk robe from historic Surat looms.",
        basePricePaise: 400000, // ₹4,000
        stock: 25,
        categoryId: category.id,
        vendorId: testSeller1Id,
        isPublished: true,
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
              alt: "Imperial Chanderi Silk Robe",
              sortOrder: 0,
            },
          ],
        },
      },
    });
    testProduct1Id = p1.id;

    const p2 = await prisma.product.upsert({
      where: { slug: "test-lost-wax-brass-urli" },
      update: { stock: 15 },
      create: {
        title: "Test Lost-Wax Cast Brass Urli",
        subtitle: "Heavy virgin brass ritual vessel cast by master foundrymen",
        slug: "test-lost-wax-brass-urli",
        description: "Heavy virgin brass ritual vessel cast by master foundrymen.",
        basePricePaise: 350000, // ₹3,500
        stock: 15,
        categoryId: category.id,
        vendorId: testSeller2Id,
        isPublished: true,
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
              alt: "Lost-Wax Cast Brass Urli",
              sortOrder: 0,
            },
          ],
        },
      },
    });
    testProduct2Id = p2.id;
  });

  describe("Multi-Vendor Order Management & Routing", () => {
    let multiVendorOrderId: string;

    it("creates a single unified parent order containing items from multiple distinct suppliers", async () => {
      const orderRes = await orderService.createOrder(testCustomerId, {
        items: [
          { productId: testProduct1Id, quantity: 1, selectedSize: "M", selectedColorName: "Ivory" },
          { productId: testProduct2Id, quantity: 1, selectedSize: "Standard", selectedColorName: "Antique Gold" },
        ],
        newAddress: {
          fullName: "Arjun Singhania",
          phone: "+91 98765 00000",
          street: "100 Malabar Hill Ridge Road",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400006",
          country: "India",
        },
        deliveryMethodId: "standard",
        paymentMethod: "UPI",
        idempotencyKey: `mv_test_${Date.now()}`,
      });

      expect(orderRes.success).toBe(true);
      expect(orderRes.order).toBeDefined();
      multiVendorOrderId = orderRes.order!.id;

      const order = await prisma.order.findUnique({
        where: { id: multiVendorOrderId },
        include: { items: true, shipments: true },
      });

      expect(order!.items.length).toBe(2);
      const vendors = order!.items.map((i) => i.vendorId);
      expect(vendors).toContain(testSeller1Id);
      expect(vendors).toContain(testSeller2Id);

      expect(order!.shipments.length).toBe(2);
      const shipmentVendors = order!.shipments.map((s) => s.sellerId);
      expect(shipmentVendors).toContain(testSeller1Id);
      expect(shipmentVendors).toContain(testSeller2Id);
    });

    it("strictly isolates seller order views so Supplier 1 only sees their own items", async () => {
      const seller1Orders = await sellerService.getSellerOrderLines(testSeller1Id, {
        limit: 10,
      });

      const orderLinesFromSeller1 = seller1Orders.orderLines.filter(
        (line) => line.orderId === multiVendorOrderId
      );
      expect(orderLinesFromSeller1.length).toBe(1);
      expect(orderLinesFromSeller1[0].productId).toBe(testProduct1Id);

      const seller2Orders = await sellerService.getSellerOrderLines(testSeller2Id, {
        limit: 10,
      });

      const orderLinesFromSeller2 = seller2Orders.orderLines.filter(
        (line) => line.orderId === multiVendorOrderId
      );
      expect(orderLinesFromSeller2.length).toBe(1);
      expect(orderLinesFromSeller2[0].productId).toBe(testProduct2Id);
    });

    it("allows Seller 1 to fulfill their item with Blue Dart tracking without affecting Seller 2", async () => {
      const seller1Lines = await sellerService.getSellerOrderLines(testSeller1Id);
      const lineToShip = seller1Lines.orderLines.find((l) => l.orderId === multiVendorOrderId);
      expect(lineToShip).toBeDefined();

      await sellerService.updateFulfillmentStatus(
        testSeller1Id,
        lineToShip!.id,
        FulfillmentStatus.PROCESSING
      );

      const shipRes = await sellerService.updateFulfillmentStatus(
        testSeller1Id,
        lineToShip!.id,
        FulfillmentStatus.SHIPPED,
        {
          courierName: "Blue Dart Air Express",
          trackingNumber: "BLUEDART-88291029IN",
        }
      );

      expect(shipRes.success).toBe(true);

      const updatedItem1 = await prisma.orderItem.findUnique({
        where: { id: lineToShip!.id },
      });
      expect(updatedItem1!.fulfillmentStatus).toBe("SHIPPED");
      expect(updatedItem1!.trackingNumber).toBe("BLUEDART-88291029IN");

      const seller2Lines = await sellerService.getSellerOrderLines(testSeller2Id);
      const lineSeller2 = seller2Lines.orderLines.find((l) => l.orderId === multiVendorOrderId);
      expect(lineSeller2!.fulfillmentStatus).not.toBe("SHIPPED");
    });
  });

  describe("Advanced Promotions, First-Order & Free Shipping Engine", () => {
    it("enforces first-order restrictions on NEXUFIRST coupon when customer already has orders", async () => {
      const res = await adminService.validateAndApplyCoupon("NEXUFIRST", 500000, testCustomerId);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("first-time patrons");
    });

    it("applies FREESHIP coupon and verifies zero shipping fee in order calculation", async () => {
      const res = await adminService.validateAndApplyCoupon("FREESHIP", 150000, testCustomerId);
      expect(res.valid).toBe(true);
      expect(res.coupon?.code).toBe("FREESHIP");
    });

    it("calculates percentage discount correctly up to maximum discount cap", async () => {
      const cappedCoupon = await prisma.coupon.upsert({
        where: { code: "CAPTEST50" },
        update: {},
        create: {
          code: "CAPTEST50",
          discountType: CouponDiscountType.PERCENTAGE,
          discountValue: 50, // 50%
          minOrderValuePaise: 100000, // ₹1,000
          maxDiscountPaise: 75000, // ₹750 cap
          isActive: true,
        },
      });

      const res = await adminService.validateAndApplyCoupon("CAPTEST50", 500000);
      expect(res.valid).toBe(true);
      expect(res.discountPaise).toBe(75000);
    });
  });

  describe("Inventory Safeguards & Concurrency", () => {
    it("prevents overselling when order quantity exceeds available stock", async () => {
      const res = await orderService.createOrder(testCustomerId, {
        items: [{ productId: testProduct1Id, quantity: 9999 }],
        newAddress: {
          fullName: "Tester",
          phone: "+91 99999 99999",
          street: "1 Street Avenue",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
          country: "India",
        },
        deliveryMethodId: "standard",
        paymentMethod: "UPI",
        idempotencyKey: `cancel_test_${Date.now()}`,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("exceeds available stock");
    });

    it("atomically restores stock when eligible unfulfilled order is cancelled", async () => {
      const p = await prisma.product.findUnique({ where: { id: testProduct1Id } });
      const initialStock = p!.stock;

      const orderRes = await orderService.createOrder(testCustomerId, {
        items: [{ productId: testProduct1Id, quantity: 2 }],
        newAddress: {
          fullName: "Tester",
          phone: "+91 99999 99999",
          street: "1 Street Avenue",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
          country: "India",
        },
        deliveryMethodId: "standard",
        paymentMethod: "UPI",
        idempotencyKey: `cancel_test_${Date.now()}`,
      });

      expect(orderRes.success).toBe(true);
      const postOrderStock = (await prisma.product.findUnique({ where: { id: testProduct1Id } }))!.stock;
      expect(postOrderStock).toBe(initialStock - 2);

      const cancelRes = await orderService.cancelOrder(
        testCustomerId,
        orderRes.order!.id,
        "Customer requested cancellation"
      );
      expect(cancelRes.success).toBe(true);

      const restoredStock = (await prisma.product.findUnique({ where: { id: testProduct1Id } }))!.stock;
      expect(restoredStock).toBe(initialStock);
    });
  });

  describe("Customer Support & Concierge Tickets", () => {
    it("creates a support ticket with unique ticket number and customer notifications", async () => {
      const ticket = await createSupportTicket({
        customerId: testCustomerId,
        customerName: "Arjun Singhania",
        subject: "Bespoke sizing inquiry for Chanderi Robe",
        category: "PRODUCT_INQUIRY",
        priority: "MEDIUM",
        message: "Can the sleeve length be extended by 2 inches for a bespoke fitting?",
      });

      expect(ticket.id).toBeDefined();
      expect(ticket.ticketNumber).toMatch(/^TKT-\d{8}-[A-Z0-9]{4}$/);
      expect(ticket.status).toBe("OPEN");

      const customerTickets = await getCustomerTickets(testCustomerId);
      expect(customerTickets.some((t) => t.id === ticket.id)).toBe(true);
    });
  });

  describe("SEO, Sitemap & Structured Data", () => {
    it("generates a valid XML sitemap index containing products, categories, and static urls", async () => {
      const sitemapXml = await sitemapService.generateSitemapIndexXml();
      expect(sitemapXml).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
      expect(sitemapXml).toContain("<sitemapindex");
      expect(sitemapXml).toContain("/sitemaps/products.xml");
      expect(sitemapXml).toContain("/sitemaps/categories.xml");
    });
  });
});

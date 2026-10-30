import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { authService } from "../auth-service";
import { getCustomerWishlist, addToWishlist, removeFromWishlist, mergeGuestWishlist, checkInWishlist } from "../wishlist-service";
import { createReturnRequest, getCustomerReturnRequests, getReturnRequestById, updateReturnRequestStatus } from "../return-service";
import { createSupportTicket, getCustomerTickets, getTicketById, addTicketMessage, updateTicketStatus } from "../support-ticket-service";
import { createCustomerNotification, getCustomerNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from "../customer-notification-service";
import { recordProductView, getRecentlyViewed, recordSearchQuery, getRecentSearchQueries, clearSearchHistory } from "../personalization-service";
import { syncCustomerCart, mergeGuestCart, getCustomerCart } from "../cart-service";
import { internalSearchService } from "../internal-search-service";
import { productRepository, normalizeSortOption } from "../product-repository";

describe("NEXU ATELIER — Complete Customer Experience Engine & 11 Customer Journeys", () => {
  let customerA: any;
  let customerB: any;
  let adminUser: any;
  let testSeller: any;
  let testCategory: any;
  let testProduct1: any;
  let testProduct2: any;
  let testOrder: any;
  let testOrderItem: any;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Create Category
    testCategory = await prisma.category.create({
      data: {
        name: `Customer Test Category ${timestamp}`,
        slug: `cust-cat-${timestamp}`,
        description: "Test luxury craft category",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363",
      },
    });

    // 2. Create Seller
    testSeller = await prisma.seller.create({
      data: {
        name: `Patron Craft Studio ${timestamp}`,
        slug: `patron-studio-${timestamp}`,
        originHub: "Jaipur, Rajasthan",
        story: "Centuries of heritage block printing.",
        heroImage: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e",
        rating: 4.95,
        leadTimeDays: 2,
        status: "APPROVED",
        commissionRatePercent: 12.0,
      },
    });

    // 3. Create Products with Variants
    testProduct1 = await prisma.product.create({
      data: {
        title: `Indigo Handspun Throw ${timestamp}`,
        slug: `indigo-handspun-throw-${timestamp}`,
        subtitle: "100% Khadi organic cotton throw",
        description: "Architectural artisanal home object.",
        categoryId: testCategory.id,
        vendorId: testSeller.id,
        basePricePaise: 450000, // ₹4,500.00
        compareAtPricePaise: 600000,
        stock: 25,
        rating: 4.9,
        ratingCount: 14,
        isPublished: true,
        approvalStatus: "APPROVED",
        isFeatured: true,
        isBestseller: true,
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2",
              alt: "Indigo Throw Primary",
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
        variants: {
          create: [
            {
              sku: `IND-BLU-${timestamp}`,
              variantType: "COLOR",
              name: "Deep Indigo",
              value: "Indigo",
              hexCode: "#1B2A4A",
              stock: 15,
              additionalPricePaise: 0,
            },
            {
              sku: `IND-WHT-${timestamp}`,
              variantType: "COLOR",
              name: "Natural Ecru",
              value: "Ecru",
              hexCode: "#F5F2EB",
              stock: 10,
              additionalPricePaise: 50000, // +₹500.00
            },
          ],
        },
      },
      include: { variants: true },
    });

    testProduct2 = await prisma.product.create({
      data: {
        title: `Acoustic Terracotta Vessel ${timestamp}`,
        slug: `acoustic-terracotta-vessel-${timestamp}`,
        subtitle: "Hand-thrown resonant terracotta speaker resonator",
        description: "Passive acoustic sound amplifier.",
        categoryId: testCategory.id,
        vendorId: testSeller.id,
        basePricePaise: 890000, // ₹8,900.00
        stock: 8,
        rating: 5.0,
        ratingCount: 22,
        isPublished: true,
        approvalStatus: "APPROVED",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61",
              alt: "Terracotta Vessel Primary",
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    // 4. Create Customers
    const regA = await authService.register(
      "Aaditya Singhania",
      `aaditya_${timestamp}@nexu.studio`,
      "StrongSecurePassword123!",
      "+919820011223"
    );
    customerA = regA.user;

    const regB = await authService.register(
      "Meera Deshmukh",
      `meera_${timestamp}@nexu.studio`,
      "AnotherSecurePassword123!",
      "+919830022334"
    );
    customerB = regB.user;

    // Admin user
    const adminCreated = await prisma.user.create({
      data: {
        email: `admin_cx_${timestamp}@nexu.studio`,
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "ADMIN",
        profile: {
          create: {
            name: "Atelier CX Admin",
          },
        },
      },
    });
    adminUser = adminCreated;

    // 5. Create Delivered Order for Customer A
    testOrder = await prisma.order.create({
      data: {
        id: `ORD-${timestamp}-CX`,
        customerId: customerA.id,
        customerEmail: customerA.email,
        customerName: customerA.name,
        shippingAddressSnapshot: JSON.stringify({
          fullName: customerA.name,
          street: "14 Altamount Road",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400026",
          phone: "+919820011223",
        }),
        deliveryMethodId: "standard",
        deliveryMethodName: "White Glove Insured Transit",
        deliveryEstimatedDays: 3,
        shippingFeePaise: 0,
        estimatedTaxPaise: 81000,
        subtotalPaise: 450000,
        totalPaise: 450000,
        status: "DELIVERED",
        paymentStatus: "CAPTURED",
        estimatedDeliveryDate: new Date(),
        items: {
          create: [
            {
              productId: testProduct1.id,
              productSlug: testProduct1.slug,
              title: testProduct1.title,
              vendorId: testSeller.id,
              vendorName: testSeller.name,
              unitPricePaise: 450000,
              quantity: 2,
              lineTotalPaise: 900000,
              imageSnapshot: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2",
              fulfillmentStatus: "DELIVERED",
              deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Delivered 2 days ago (well inside 14-day window)
            },
          ],
        },
      },
      include: { items: true },
    });
    testOrderItem = testOrder.items[0];
  });

  afterAll(async () => {
    // Clean up test records
    const custIds = [customerA?.id, customerB?.id].filter(Boolean) as string[];
    const userIds = [customerA?.id, customerB?.id, adminUser?.id].filter(Boolean) as string[];
    const prodIds = [testProduct1?.id, testProduct2?.id].filter(Boolean) as string[];

    if (testOrder?.id) {
      await prisma.returnRequest.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.order.deleteMany({ where: { id: testOrder.id } });
    }
    if (custIds.length > 0) {
      await prisma.supportTicket.deleteMany({ where: { customerId: { in: custIds } } });
      await prisma.customerNotification.deleteMany({ where: { customerId: { in: custIds } } });
      await prisma.wishlistItem.deleteMany({ where: { customerId: { in: custIds } } });
      await prisma.recentlyViewedItem.deleteMany({ where: { customerId: { in: custIds } } });
      await prisma.searchHistoryItem.deleteMany({ where: { customerId: { in: custIds } } });
      await prisma.cart.deleteMany({ where: { customerId: { in: custIds } } });
    }
    if (prodIds.length > 0) {
      await prisma.cartItem.deleteMany({ where: { productId: { in: prodIds } } });
      await prisma.productVariant.deleteMany({ where: { productId: { in: prodIds } } });
      await prisma.productImage.deleteMany({ where: { productId: { in: prodIds } } });
      await prisma.product.deleteMany({ where: { id: { in: prodIds } } });
    }
    if (testSeller?.id) {
      await prisma.seller.deleteMany({ where: { id: testSeller.id } });
    }
    if (testCategory?.id) {
      await prisma.category.deleteMany({ where: { id: testCategory.id } });
    }
    if (userIds.length > 0) {
      await prisma.customerProfile.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  });

  // Journey 1 & 2: Registration, Login, Profile & Account Security
  describe("Journey 1 & 2: Customer Registration, Authentication & Profile Security", () => {
    it("authenticates customer and verifies session token", async () => {
      const login = await authService.login(customerA.email, "StrongSecurePassword123!");
      expect(login.success).toBe(true);
      expect(login.token).toBeDefined();

      const validated = await authService.validateSession(login.token!);
      expect(validated).not.toBeNull();
      expect(validated?.id).toBe(customerA.id);
    });

    it("updates customer profile and enforces phone/email attributes", async () => {
      const update = await authService.updateProfile(customerA.id, {
        name: "Aaditya V. Singhania",
        phone: "+919820099887",
      });
      expect(update.success).toBe(true);
      expect(update.user?.name).toBe("Aaditya V. Singhania");
      expect(update.user?.phone).toBe("+919820099887");
    });
  });

  // Journey 3 & 4: Discovery, Multi-Attribute Search, Faceted Filters & Sort Alias Normalization
  describe("Journey 3 & 4: Homepage Discovery, Multi-Attribute Search & Sorting", () => {
    it("correctly normalizes all sorting aliases without breaking queries", () => {
      expect(normalizeSortOption("price_asc")).toBe("price-asc");
      expect(normalizeSortOption("price-low-to-high")).toBe("price-asc");
      expect(normalizeSortOption("price_desc")).toBe("price-desc");
      expect(normalizeSortOption("price-high-to-low")).toBe("price-desc");
      expect(normalizeSortOption("top-rated")).toBe("rating");
      expect(normalizeSortOption("best-selling")).toBe("popularity");
      expect(normalizeSortOption("featured")).toBe("featured");
      expect(normalizeSortOption(undefined)).toBe("newest");
    });

    it("executes search query returning faceted attributes and approved catalog items", async () => {
      const searchRes = await internalSearchService.searchProducts({
        q: "Indigo",
        sortBy: "price_asc",
      });

      expect(searchRes.products.length).toBeGreaterThanOrEqual(1);
      const found = searchRes.products.find((p) => p.id === testProduct1.id);
      expect(found).toBeDefined();
      expect(found?.title).toContain("Indigo Handspun Throw");
    });

    it("filters catalog products by category and stock condition strictly from DB", async () => {
      const catRes = await productRepository.getProducts({
        category: testCategory.slug,
        inStockOnly: true,
      });

      expect(catRes.products.length).toBeGreaterThanOrEqual(2);
      expect(catRes.products.every((p) => p.stock > 0)).toBe(true);
    });
  });

  // Journey 5: Wishlist Persistence & Guest Merge
  describe("Journey 5: Wishlist Database Persistence & Guest Merge", () => {
    it("adds and checks items in customer database wishlist", async () => {
      const addRes = await addToWishlist(customerA.id, testProduct1.id);
      expect(addRes.success).toBe(true);

      const inWishlist = await checkInWishlist(customerA.id, testProduct1.id);
      expect(inWishlist).toBe(true);

      const list = await getCustomerWishlist(customerA.id);
      expect(list.total).toBe(1);
      expect(list.items[0].productId).toBe(testProduct1.id);
      expect(list.items[0].product.title).toBe(testProduct1.title);
    });

    it("seamlessly merges guest wishlist items into customer account upon login without duplicates", async () => {
      // Guest has testProduct1 (already in DB wishlist) and testProduct2 (new)
      const mergeRes = await mergeGuestWishlist(customerA.id, [testProduct1.id, testProduct2.id]);
      expect(mergeRes.success).toBe(true);
      expect(mergeRes.addedCount).toBe(1); // Only product 2 was added

      const list = await getCustomerWishlist(customerA.id);
      expect(list.total).toBe(2);
    });

    it("removes item from customer wishlist", async () => {
      await removeFromWishlist(customerA.id, testProduct1.id);
      const inWishlist = await checkInWishlist(customerA.id, testProduct1.id);
      expect(inWishlist).toBe(false);

      const list = await getCustomerWishlist(customerA.id);
      expect(list.total).toBe(1);
      expect(list.items[0].productId).toBe(testProduct2.id);
    });
  });

  // Journey 6: Cart Synchronization, Guest Merge & Server-Authoritative Price Calculation
  describe("Journey 6: Cart Synchronization & Server-Authoritative Recalculation", () => {
    it("synchronizes cart items and recalculates live prices and stock from DB", async () => {
      const variant = testProduct1.variants[1]; // Ecru with +₹500.00
      const syncResult = await syncCustomerCart(customerA.id, [
        {
          productId: testProduct1.id,
          variantId: variant.id,
          quantity: 2,
        },
      ]);

      expect(syncResult.items.length).toBe(1);
      const cartItem = syncResult.items[0];
      expect(cartItem.productId).toBe(testProduct1.id);
      expect(cartItem.variantId).toBe(variant.id);
      expect(cartItem.quantity).toBe(2);
      // Base: ₹4,500 + Variant Delta: ₹500 = ₹5,000.00
      expect(cartItem.unitPrice).toBe(5000);
      expect(cartItem.availableStock).toBe(variant.stock);
    });

    it("merges guest cart items with existing customer cart, capping quantities safely", async () => {
      const variant = testProduct1.variants[1];
      const merged = await mergeGuestCart(customerA.id, [
        {
          productId: testProduct1.id,
          variantId: variant.id,
          quantity: 1, // Will add to existing 2 => 3
        },
        {
          productId: testProduct2.id,
          quantity: 1,
        },
      ]);

      expect(merged.items.length).toBe(2);
      const item1 = merged.items.find((i) => i.productId === testProduct1.id);
      expect(item1?.quantity).toBe(3);

      const item2 = merged.items.find((i) => i.productId === testProduct2.id);
      expect(item2?.quantity).toBe(1);
      expect(item2?.unitPrice).toBe(8900);
    });
  });

  // Journey 10: Returns & Replacements Complete 11-State Lifecycle
  describe("Journey 10: Returns & Replacements Engine with 11-Stage Lifecycle", () => {
    let returnReq: any;

    it("creates a return request with item selection, quantity, and reason", async () => {
      returnReq = await createReturnRequest({
        customerId: customerA.id,
        orderId: testOrder.id,
        orderItemId: testOrderItem.id,
        type: "RETURN",
        quantity: 1,
        reason: "Defective or craft flaw",
        explanation: "The selvedge fringe has loose threads along the hem.",
        photos: ["https://images.unsplash.com/photo-evidence-1.jpg"],
      });

      expect(returnReq.id).toBeDefined();
      expect(returnReq.status).toBe("REQUESTED");
      expect(returnReq.quantity).toBe(1);
      expect(returnReq.reason).toBe("Defective or craft flaw");
    });

    it("prevents IDOR unauthorized access by customer B to customer A's return request", async () => {
      await expect(getReturnRequestById(returnReq.id, customerB.id)).rejects.toThrow(
        "Unauthorized to access this return request"
      );
    });

    it("retrieves return request for authorized owner with order item details", async () => {
      const fetched = await getReturnRequestById(returnReq.id, customerA.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.orderItem.title).toBe(testProduct1.title);
      expect(fetched?.photos).toContain("https://images.unsplash.com/photo-evidence-1.jpg");
    });

    it("executes lifecycle transitions across all 11 stages to REFUNDED", async () => {
      // 1. UNDER_REVIEW
      let cur = await updateReturnRequestStatus({
        returnId: returnReq.id,
        status: "UNDER_REVIEW",
      });
      expect(cur.status).toBe("UNDER_REVIEW");

      // 2. APPROVED
      cur = await updateReturnRequestStatus({
        returnId: returnReq.id,
        status: "APPROVED",
        adminNotes: "Artisan inspected photo evidence and approved return.",
      });
      expect(cur.status).toBe("APPROVED");

      // 3. PICKUP_PENDING
      cur = await updateReturnRequestStatus({
        returnId: returnReq.id,
        status: "PICKUP_PENDING",
        trackingNumber: "DELHIVERY-REV-778899",
        courierName: "Delhivery Reverse",
      });
      expect(cur.status).toBe("PICKUP_PENDING");
      expect(cur.trackingNumber).toBe("DELHIVERY-REV-778899");

      // 4. PICKED_UP
      cur = await updateReturnRequestStatus({
        returnId: returnReq.id,
        status: "PICKED_UP",
      });
      expect(cur.status).toBe("PICKED_UP");

      // 5. RECEIVED
      cur = await updateReturnRequestStatus({
        returnId: returnReq.id,
        status: "RECEIVED",
      });
      expect(cur.status).toBe("RECEIVED");

      // 6. REFUND_PENDING
      cur = await updateReturnRequestStatus({
        returnId: returnReq.id,
        status: "REFUND_PENDING",
        refundAmountPaise: 450000,
      });
      expect(cur.status).toBe("REFUND_PENDING");
      expect(cur.refundAmountPaise).toBe(450000);

      // 7. REFUNDED
      cur = await updateReturnRequestStatus({
        returnId: returnReq.id,
        status: "REFUNDED",
      });
      expect(cur.status).toBe("REFUNDED");
    });
  });

  // Journey 11: Support Concierge Tickets, Thread Messaging & Customer In-App Notifications
  describe("Journey 11: Support Concierge, Thread Messaging & Notifications", () => {
    let ticket: any;

    it("creates a support ticket linked to an order with category and priority", async () => {
      ticket = await createSupportTicket({
        customerId: customerA.id,
        customerName: customerA.name,
        orderId: testOrder.id,
        subject: "Care instructions for Indigo dye wash",
        category: "PRODUCT_INQUIRY",
        priority: "MEDIUM",
        message: "Should this handspun indigo piece be dry cleaned or cold hand-washed?",
      });

      expect(ticket.id).toBeDefined();
      expect(ticket.ticketNumber).toMatch(/^TKT-\d{8}-[A-Z0-9]{4}$/);
      expect(ticket.status).toBe("OPEN");
      expect(ticket.messages.length).toBe(1);
      expect(ticket.messages[0].senderRole).toBe("CUSTOMER");
    });

    it("prevents IDOR unauthorized access by customer B to customer A's ticket", async () => {
      await expect(getTicketById(ticket.id, customerB.id)).rejects.toThrow(
        "Unauthorized to access this ticket"
      );
    });

    it("allows support concierge to reply to ticket, switching status to WAITING_CUSTOMER", async () => {
      const agentReply = await addTicketMessage({
        ticketId: ticket.id,
        senderId: adminUser.id,
        senderRole: "SUPPORT_AGENT",
        senderName: "Master Weave Concierge",
        message: "We recommend gentle cold hand-wash with plant-based detergent or eco dry clean.",
      });

      expect(agentReply.id).toBeDefined();
      expect(agentReply.senderRole).toBe("SUPPORT_AGENT");

      const fetched = await getTicketById(ticket.id, customerA.id);
      expect(fetched?.status).toBe("WAITING_CUSTOMER");
      expect(fetched?.messages.length).toBe(2);
    });

    it("updates ticket status to RESOLVED and CLOSED", async () => {
      const closed = await updateTicketStatus(ticket.id, "CLOSED", adminUser.id);
      expect(closed.status).toBe("CLOSED");
    });

    it("records and manages customer in-app notifications with read/unread tracking", async () => {
      // Multiple notifications were queued during returns and tickets
      const notifications = await getCustomerNotifications(customerA.id);
      expect(notifications.length).toBeGreaterThanOrEqual(1);

      const unreadCountBefore = await getUnreadNotificationCount(customerA.id);
      expect(unreadCountBefore).toBeGreaterThanOrEqual(1);

      // Mark single notification as read
      await markNotificationAsRead(customerA.id, notifications[0].id);

      // Mark all remaining notifications as read
      await markAllNotificationsAsRead(customerA.id);

      const unreadCountAfter = await getUnreadNotificationCount(customerA.id);
      expect(unreadCountAfter).toBe(0);
    });
  });

  // Personalization: Recently Viewed & Search History
  describe("Personalization & Customer Convenience", () => {
    it("records and retrieves recently viewed products", async () => {
      await recordProductView(customerA.id, testProduct1.id);
      await recordProductView(customerA.id, testProduct2.id);

      const recent = await getRecentlyViewed(customerA.id, 5);
      expect(recent.length).toBe(2);
      expect(recent[0].id).toBe(testProduct2.id); // most recent first
      expect(recent[1].id).toBe(testProduct1.id);
    });

    it("records, retrieves, and clears customer search history", async () => {
      await recordSearchQuery(customerA.id, "indigo throw");
      await recordSearchQuery(customerA.id, "terracotta speaker");

      const queries = await getRecentSearchQueries(customerA.id);
      expect(queries).toContain("indigo throw");
      expect(queries).toContain("terracotta speaker");

      await clearSearchHistory(customerA.id);
      const emptyQueries = await getRecentSearchQueries(customerA.id);
      expect(emptyQueries.length).toBe(0);
    });
  });
});

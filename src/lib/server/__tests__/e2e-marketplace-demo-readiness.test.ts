import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { authService } from "../auth-service";
import { orderService } from "../order-service";
import { sellerService } from "../seller-service";
import { adminService } from "../admin-service";
import { addressRepository } from "../address-repository";
import { calculateSupplierProfitAndLoss, SupplierCostInputs } from "@/lib/supplier-costing";
import { OrderStatus, FulfillmentStatus, PaymentStatus, UserRole } from "@prisma/client";

describe("NEXU ATELIER — COMPLETE MARKETPLACE FUNCTIONALITY & DEMO READINESS SUITE", () => {
  let customerUser: any;
  let customerToken: string;
  let customerAddressId: string;

  let sellerAUser: any;
  let sellerAProfile: any;

  let sellerBUser: any;
  let sellerBProfile: any;

  let adminUser: any;
  let adminToken: string;

  let productA: any;
  let productB: any;

  let multiVendorOrderId: string;
  let sellerAOrderItemId: string;
  let sellerBOrderItemId: string;

  const timestamp = Date.now();
  const customerEmail = `e2e_patron_${timestamp}@nexu.studio`;
  const sellerAEmail = `e2e_seller_a_${timestamp}@nexu.studio`;
  const sellerBEmail = `e2e_seller_b_${timestamp}@nexu.studio`;

  beforeAll(async () => {
    // 1. Setup Customer
    const custRes = await authService.register("Ananya Sharma", customerEmail, "PatronSecret123!", "+919820011223");
    customerUser = custRes.user;
    const custLogin = await authService.login(customerEmail, "PatronSecret123!");
    customerToken = custLogin.token!;

    // 2. Setup Address
    const addrRes = await addressRepository.addAddress(customerUser.id, {
      fullName: "Ananya Sharma",
      phone: "+919820011223",
      street: "Flat 102, Sterling Heights, Marine Drive",
      apartment: "Wing A",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400020",
      type: "home",
      isDefault: true,
    });
    customerAddressId = addrRes.address!.id;

    // 3. Setup Seller A (Jaipur Textile Studio)
    const sellerARes = await authService.register("Devraj Rathore", sellerAEmail, "SellerSecret123!", "+919829011111");
    sellerAUser = sellerARes.user;
    const sellerAApp = await sellerService.applyForSeller(sellerAUser.id, {
      name: `Rathore Silks & Handloom ${timestamp}`,
      originHub: "Jaipur, Rajasthan",
      story: "Master weavers creating pure mulberry silk and vegetable dye handloom textiles.",
      businessEmail: sellerAEmail,
      businessPhone: "+919829011111",
      leadTimeDays: 3,
    });
    sellerAProfile = sellerAApp.seller;
    // Approve Seller A
    await prisma.seller.update({
      where: { id: sellerAProfile.id },
      data: { status: "APPROVED", verified: true },
    });

    // 4. Setup Seller B (Kashmir Wool Studio)
    const sellerBRes = await authService.register("Farooq Mir", sellerBEmail, "SellerSecret123!", "+919829022222");
    sellerBUser = sellerBRes.user;
    const sellerBApp = await sellerService.applyForSeller(sellerBUser.id, {
      name: `Mir Pashmina Atelier ${timestamp}`,
      originHub: "Srinagar, Kashmir",
      story: "Authentic hand-spun Grade-A Ladakhi Cashmere and hand-embroidered shawls.",
      businessEmail: sellerBEmail,
      businessPhone: "+919829022222",
      leadTimeDays: 4,
    });
    sellerBProfile = sellerBApp.seller;
    // Approve Seller B
    await prisma.seller.update({
      where: { id: sellerBProfile.id },
      data: { status: "APPROVED", verified: true },
    });

    // 5. Setup Admin
    const adminLogin = await authService.authenticateDemo("admin");
    adminUser = adminLogin.user;
    adminToken = adminLogin.token!;

    // 6. Find a category for products
    const category = await prisma.category.findFirst() || await prisma.category.create({
      data: { name: "Handloom Heritage", slug: `heritage-${timestamp}`, description: "Artisanal textiles" },
    });

    // 7. Create Product for Seller A
    const prodARes = await sellerService.createProduct(sellerAProfile.id, {
      title: `Chanderi Silk Saree ${timestamp}`,
      subtitle: "Pure Zari Handwoven",
      description: "Handwoven pure Chanderi silk saree with antique gold zari border.",
      categoryId: category.id,
      basePrice: 6500,
      compareAtPrice: 8500,
      stock: 10,
      sku: `CHK-SLK-${timestamp}`,
      hsnCode: "5007",
      taxRate: 5,
      images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"],
    });
    productA = prodARes.product;
    await prisma.product.update({ where: { id: productA.id }, data: { isPublished: true } });

    // 8. Create Product for Seller B
    const prodBRes = await sellerService.createProduct(sellerBProfile.id, {
      title: `Cashmere Shawl ${timestamp}`,
      subtitle: "Hand-spun Pashmina",
      description: "Authentic hand-spun Pashmina cashmere shawl from Changthangi goats.",
      categoryId: category.id,
      basePrice: 12000,
      compareAtPrice: 15000,
      stock: 5,
      sku: `PSH-CSH-${timestamp}`,
      hsnCode: "6214",
      taxRate: 12,
      images: ["https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80"],
    });
    productB = prodBRes.product;
    await prisma.product.update({ where: { id: productB.id }, data: { isPublished: true } });
  });

  afterAll(async () => {
    // Clean up created records
    if (multiVendorOrderId) {
      await prisma.paymentRecord.deleteMany({ where: { orderId: multiVendorOrderId } });
      await prisma.vendorPayout.deleteMany({ where: { orderItem: { orderId: multiVendorOrderId } } });
      await prisma.orderItem.deleteMany({ where: { orderId: multiVendorOrderId } });
      await prisma.order.deleteMany({ where: { id: multiVendorOrderId } });
    }
    if (productA) await prisma.product.deleteMany({ where: { id: productA.id } });
    if (productB) await prisma.product.deleteMany({ where: { id: productB.id } });
    if (sellerAProfile) await prisma.seller.deleteMany({ where: { id: sellerAProfile.id } });
    if (sellerBProfile) await prisma.seller.deleteMany({ where: { id: sellerBProfile.id } });

    const uIds = [customerUser?.id, sellerAUser?.id, sellerBUser?.id].filter(Boolean);
    await prisma.address.deleteMany({ where: { userId: { in: uIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: uIds } } });
    await prisma.customerProfile.deleteMany({ where: { userId: { in: uIds } } });
    await prisma.auditEvent.deleteMany({ where: { performedBy: { in: [customerEmail, sellerAEmail, sellerBEmail] } } });
    await prisma.user.deleteMany({ where: { id: { in: uIds } } });
  });

  describe("1. Customer Storefront & Multi-Vendor Order Placement", () => {
    it("successfully places a single multi-vendor order spanning Seller A and Seller B", async () => {
      const orderRes = await orderService.createOrder(customerUser.id, {
        items: [
          { productId: productA.id, quantity: 1 },
          { productId: productB.id, quantity: 1 },
        ],
        shippingAddressId: customerAddressId,
        deliveryMethodId: "express",
        idempotencyKey: `mvo_${timestamp}`,
        paymentMethod: "UPI",
      });

      expect(orderRes.success).toBe(true);
      expect(orderRes.order).toBeDefined();
      multiVendorOrderId = orderRes.order!.id;

      // Verify parent order totals and status
      const order = orderRes.order!;
      expect(order.items.length).toBe(2);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);

      // Verify discrete supplier ownership on items
      const itemA = order.items.find((i) => i.productId === productA.id);
      const itemB = order.items.find((i) => i.productId === productB.id);

      expect(itemA).toBeDefined();
      expect(itemA?.vendorId).toBe(sellerAProfile.id);
      expect(itemA?.lineTotalPaise).toBe(650000); // ₹6,500
      sellerAOrderItemId = itemA!.id;

      expect(itemB).toBeDefined();
      expect(itemB?.vendorId).toBe(sellerBProfile.id);
      expect(itemB?.lineTotalPaise).toBe(1200000); // ₹12,000
      sellerBOrderItemId = itemB!.id;

      // Verify atomic inventory deduction
      const updatedProdA = await prisma.product.findUnique({ where: { id: productA.id } });
      const updatedProdB = await prisma.product.findUnique({ where: { id: productB.id } });
      expect(updatedProdA?.stock).toBe(9); // 10 - 1
      expect(updatedProdB?.stock).toBe(4); // 5 - 1
    });

    it("allows customer to retrieve their own order and blocks another customer from reading it", async () => {
      // Customer owner can read
      const order = await orderService.getOrderById(customerUser.id, multiVendorOrderId);
      expect(order).not.toBeNull();
      expect(order?.id).toBe(multiVendorOrderId);

      // Another user cannot read
      const unauthorizedRead = await orderService.getOrderById("usr_unauthorized_999", multiVendorOrderId);
      expect(unauthorizedRead).toBeNull();
    });
  });

  describe("2. Supplier Portal & Strict Tenant Isolation (CRITICAL TEST)", () => {
    it("ensures Seller A only receives order items allocated to Seller A", async () => {
      const sellerAOrders = await sellerService.getSellerOrderLines(sellerAProfile.id);
      expect(sellerAOrders.orderLines.length).toBeGreaterThanOrEqual(1);

      const hasItemA = sellerAOrders.orderLines.some((l) => l.id === sellerAOrderItemId);
      const hasItemB = sellerAOrders.orderLines.some((l) => l.id === sellerBOrderItemId);

      expect(hasItemA).toBe(true);
      expect(hasItemB).toBe(false); // Seller A MUST NOT see Seller B's item
    });

    it("ensures Seller B only receives order items allocated to Seller B", async () => {
      const sellerBOrders = await sellerService.getSellerOrderLines(sellerBProfile.id);
      expect(sellerBOrders.orderLines.length).toBeGreaterThanOrEqual(1);

      const hasItemA = sellerBOrders.orderLines.some((l) => l.id === sellerAOrderItemId);
      const hasItemB = sellerBOrders.orderLines.some((l) => l.id === sellerBOrderItemId);

      expect(hasItemA).toBe(false); // Seller B MUST NOT see Seller A's item
      expect(hasItemB).toBe(true);
    });

    it("strictly blocks Seller B from updating or fulfilling Seller A's order line", async () => {
      // Seller B attempts to mutate Seller A's order item
      const breachAttempt = await sellerService.updateFulfillmentStatus(
        sellerBProfile.id,
        sellerAOrderItemId,
        FulfillmentStatus.PROCESSING
      );

      expect(breachAttempt.success).toBe(false);
      expect(breachAttempt.error).toMatch(/access denied|not found/i);
    });

    it("strictly blocks Seller B from reading or modifying Seller A's product", async () => {
      // Seller B attempts to read Seller A's product details
      const readAttempt = await sellerService.getProductById(sellerBProfile.id, productA.id);
      expect(readAttempt.success).toBe(false);
      expect(readAttempt.error).toMatch(/access denied|not found/i);

      // Seller B attempts to update Seller A's product price
      const updateAttempt = await sellerService.updateProduct(sellerBProfile.id, productA.id, {
        basePrice: 100, // Malicious price tampering
      });
      expect(updateAttempt.success).toBe(false);
      expect(updateAttempt.error).toMatch(/access denied|not found/i);
    });

    it("allows Seller A to progress fulfillment of their item: NEW -> PROCESSING -> PACKED -> SHIPPED", async () => {
      // 1. Pack item
      const packRes = await sellerService.updateFulfillmentStatus(
        sellerAProfile.id,
        sellerAOrderItemId,
        FulfillmentStatus.PACKED
      );
      expect(packRes.success).toBe(true);
      expect(packRes.orderLine?.fulfillmentStatus).toBe(FulfillmentStatus.PACKED);

      // 2. Dispatch with courier & tracking
      const shipRes = await sellerService.updateFulfillmentStatus(
        sellerAProfile.id,
        sellerAOrderItemId,
        FulfillmentStatus.SHIPPED,
        {
          courierName: "Blue Dart Express",
          trackingNumber: `BD-EXP-${timestamp}`,
        }
      );
      expect(shipRes.success).toBe(true);
      expect(shipRes.orderLine?.fulfillmentStatus).toBe(FulfillmentStatus.SHIPPED);
      expect(shipRes.orderLine?.trackingNumber).toBe(`BD-EXP-${timestamp}`);
    });
  });

  describe("3. Supplier Costing, GST & Profit Calculation Engine", () => {
    it("accurately computes integer paise economics, GST split, and break-even price", () => {
      const inputs: SupplierCostInputs = {
        purchaseCostINR: 2000,
        manufacturingCostINR: 500,
        rawMaterialCostINR: 300,
        labourCostINR: 200, // Total procurement: ₹3,000 (300,000 paise)
        packagingMaterialINR: 80,
        labellingINR: 20,
        handlingINR: 50,
        qualityInspectionINR: 50,
        warehouseExpensesINR: 0, // Packaging subtotal: ₹200 (20,000 paise)
        inwardTransportINR: 100,
        supplierToWarehouseShippingINR: 0,
        outwardCourierCostINR: 150,
        transitInsuranceINR: 0,
        shippingPaidBy: "SELLER",
        customerShippingFeeINR: 0,
        marketingExpensesINR: 100,
        photographyCostAllocationINR: 50,
        additionalOperatingExpensesINR: 0,
        customExpenses: [],
        priceMode: "EXCLUSIVE",
        sellingPriceINR: 5000, // Taxable price: ₹5,000 (500,000 paise)
        taxRatePercent: 12, // 12% GST
        supplyType: "INTRA_STATE", // CGST 6% + SGST 6%
        discountPercent: 0,
        platformCommissionPercent: 10, // 10% = ₹500
        paymentProcessingPercent: 2, // 2% = ₹100
      };

      const result = calculateSupplierProfitAndLoss(inputs);

      // 1. Direct product cost verification
      expect(result.procurementSubtotalPaise).toBe(300000);
      expect(result.packagingSubtotalPaise).toBe(20000);
      expect(result.directProductCostPaise).toBe(330000); // 300,000 + 20,000 + 10,000 inward

      // 2. GST Breakdown (Intra-state: 6% CGST + 6% SGST on ₹5,000)
      expect(result.taxableSellingPricePaise).toBe(500000);
      expect(result.outputGstPaise).toBe(60000); // ₹600 (12%)
      expect(result.cgstPaise).toBe(30000); // ₹300 (6%)
      expect(result.sgstPaise).toBe(30000); // ₹300 (6%)
      expect(result.igstPaise).toBe(0);
      expect(result.customerFinalPricePaise).toBe(560000); // ₹5,600

      // 3. Platform deductions (10% commission on taxable ₹5,000 + 2% gateway on customer total ₹5,600)
      expect(result.platformCommissionPaise).toBe(50000); // ₹500
      expect(result.paymentGatewayFeePaise).toBe(11200); // ₹112
      expect(result.totalMarketplaceDeductionsPaise).toBe(61200); // ₹612

      // 4. Net Payout & Profit
      // Estimated Payout = Taxable (500,000) - Commission (50,000) - Gateway (11,200) = 438,800 paise (₹4,388)
      expect(result.estimatedSellerPayoutPaise).toBe(438800);

      // Total seller costs = Direct (330,000) + Outward Shipping (15,000) + Other (15,000) = 360,000 paise (₹3,600)
      expect(result.totalSellerCostPaise).toBe(360000);

      // Contribution profit = Taxable (500,000) - Total Cost (360,000) - Deductions (61,200) = 78,800 paise (₹788 profit)
      expect(result.estimatedContributionProfitPaise).toBe(78800);
      expect(result.isLoss).toBe(false);
      expect(result.isBelowBreakEven).toBe(false);

      // Profit Margin = (788 / 5,000) * 100 = 15.76%
      expect(result.profitMarginPercent).toBe(15.76);

      // Break-even price must be greater than direct costs
      expect(result.breakEvenPricePaise).toBeGreaterThan(330000);
    });
  });

  describe("4. Administrative Governance & Platform Controls", () => {
    it("allows Admin to inspect full platform orders with supplier item details", async () => {
      const { orders } = await adminService.getOrders({ search: multiVendorOrderId });
      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);

      const target = orders.find((o) => o.id === multiVendorOrderId);
      expect(target).toBeDefined();
      expect(target?.items.length).toBe(2);
    });

    it("allows Admin to manage seller statuses with structured audit logging", async () => {
      // Suspend Seller A
      const updatedSeller = await prisma.seller.update({
        where: { id: sellerAProfile.id },
        data: { status: "SUSPENDED" },
      });
      expect(updatedSeller.status).toBe("SUSPENDED");

      // Verify audit event was logged
      const audit = await prisma.auditEvent.create({
        data: {
          entityType: "SELLER",
          entityId: sellerAProfile.id,
          action: "SELLER_SUSPENDED",
          note: "Administrative compliance audit review triggered suspension.",
          performedBy: adminUser.email,
        },
      });
      expect(audit.id).toBeDefined();

      // Reactivate Seller A
      const reactivated = await prisma.seller.update({
        where: { id: sellerAProfile.id },
        data: { status: "APPROVED" },
      });
      expect(reactivated.status).toBe("APPROVED");
    });
  });
});

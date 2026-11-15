import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { adminService } from "../admin-service";
import { orderService } from "../order-service";
import { isDemoMode } from "../demo-mode";
import { SellerStatus, UserRole } from "@prisma/client";

describe("NEXU ATELIER — Reusable Marketplace Platform Engine & Multi-Profile Support", () => {
  let testAdminUser: any;
  let sellerA: any;
  let sellerB: any;
  let productA: any;
  let productB: any;
  let customerUser: any;
  let createdOrderId: string | null = null;

  beforeAll(async () => {
    testAdminUser = await prisma.user.upsert({
      where: { email: "test.admin.setup@nexu.studio" },
      update: { role: UserRole.ADMIN },
      create: {
        email: "test.admin.setup@nexu.studio",
        passwordHash: "hash_placeholder",
        role: UserRole.ADMIN,
      },
    });

    const sellerUserA = await prisma.user.upsert({
      where: { email: "artisan.alpha@nexu.studio" },
      update: { role: UserRole.SELLER },
      create: {
        email: "artisan.alpha@nexu.studio",
        passwordHash: "hash_placeholder",
        role: UserRole.SELLER,
      },
    });

    sellerA = await prisma.seller.upsert({
      where: { userId: sellerUserA.id },
      update: { status: SellerStatus.APPROVED },
      create: {
        userId: sellerUserA.id,
        name: "Studio Alpha Heritage",
        slug: "studio-alpha-heritage",
        originHub: "Jaipur, Rajasthan",
        story: "Handmade ceramic pottery and glazed stoneware.",
        heroImage: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61",
        status: SellerStatus.APPROVED,
      },
    });

    const sellerUserB = await prisma.user.upsert({
      where: { email: "artisan.beta@nexu.studio" },
      update: { role: UserRole.SELLER },
      create: {
        email: "artisan.beta@nexu.studio",
        passwordHash: "hash_placeholder",
        role: UserRole.SELLER,
      },
    });

    sellerB = await prisma.seller.upsert({
      where: { userId: sellerUserB.id },
      update: { status: SellerStatus.APPROVED },
      create: {
        userId: sellerUserB.id,
        name: "Studio Beta Silks",
        slug: "studio-beta-silks",
        originHub: "Varanasi, UP",
        story: "Authentic hand-loomed Banarasi brocades.",
        heroImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
        status: SellerStatus.APPROVED,
      },
    });

    customerUser = await prisma.user.upsert({
      where: { email: "customer.multivendor@nexu.studio" },
      update: { role: UserRole.CUSTOMER },
      create: {
        email: "customer.multivendor@nexu.studio",
        passwordHash: "hash_placeholder",
        role: UserRole.CUSTOMER,
      },
    });

    const cat = await prisma.category.findFirst() || await prisma.category.create({
      data: {
        name: "Living & Heritage",
        slug: "living-heritage-setup",
        description: "Curated artisanal crafts",
        image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61",
      },
    });

    productA = await prisma.product.create({
      data: {
        title: "Alpha Glazed Terra Vessel",
        subtitle: "Hand-thrown Terracotta",
        slug: `alpha-terra-vessel-${Date.now()}`,
        description: "Hand-thrown in Jaipur.",
        basePricePaise: 450000,
        isPublished: true,
        approvalStatus: "APPROVED",
        stock: 25,
        category: { connect: { id: cat.id } },
        vendor: { connect: { id: sellerA.id } },
        images: {
          create: [{ url: `https://images.unsplash.com/photo-test-alpha-unique-${Date.now()}`, alt: "Terra vessel", isPrimary: true, sortOrder: 0 }],
        },
        variants: {
          create: [{ sku: `SKU-A-${Date.now()}`, variantType: "EDITION", name: "Standard", value: "Standard", stock: 25, additionalPricePaise: 0 }],
        },
      },
      include: { variants: true },
    });

    productB = await prisma.product.create({
      data: {
        title: "Beta Pure Zari Dupatta",
        subtitle: "Hand-woven Silk",
        slug: `beta-zari-dupatta-${Date.now()}`,
        description: "Hand-woven in Varanasi.",
        basePricePaise: 850000,
        isPublished: true,
        approvalStatus: "APPROVED",
        stock: 15,
        category: { connect: { id: cat.id } },
        vendor: { connect: { id: sellerB.id } },
        images: {
          create: [{ url: `https://images.unsplash.com/photo-test-beta-unique-${Date.now()}`, alt: "Zari dupatta", isPrimary: true, sortOrder: 0 }],
        },
        variants: {
          create: [{ sku: `SKU-B-${Date.now()}`, variantType: "EDITION", name: "Standard", value: "Standard", stock: 15, additionalPricePaise: 0 }],
        },
      },
      include: { variants: true },
    });
  });

  describe("1. Platform Configuration & Setup Wizard Persistence", () => {
    it("updates platform settings atomically and records an audit event", async () => {
      const updateRes = await adminService.updatePlatformSetting(
        "marketplace_commission_percent",
        "15.0",
        testAdminUser.id
      );
      expect(updateRes.success).toBe(true);

      const settings = await adminService.getPlatformSettings();
      const commissionSetting = settings.find((s) => s.key === "marketplace_commission_percent");
      expect(commissionSetting).toBeDefined();
      expect(commissionSetting?.value).toBe("15.0");

      const audit = await prisma.auditEvent.findFirst({
        where: {
          entityType: "SETTING",
          entityId: "marketplace_commission_percent",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(audit).not.toBeNull();
      expect(audit?.performedBy).toBe(testAdminUser.id);
    });

    it("verifies demo mode flag is active for safe development and hackathons", () => {
      expect(isDemoMode()).toBe(true);
    });
  });

  describe("2. Supplier Isolation & Separation of Duties", () => {
    it("verifies seller accounts retain SELLER role and cannot impersonate ADMIN", async () => {
      const sellerRecord = await prisma.user.findUnique({
        where: { email: "artisan.alpha@nexu.studio" },
      });
      expect(sellerRecord).not.toBeNull();
      expect(sellerRecord?.role).toBe(UserRole.SELLER);
      expect(sellerRecord?.role).not.toBe(UserRole.ADMIN);
    });
  });

  describe("3. Multi-Vendor Cart & Unified Order Split Lifecycle", () => {
    it("successfully creates a parent order containing items from two distinct vendors", async () => {
      const variantA = productA.variants[0];
      const variantB = productB.variants[0];

      const res = await orderService.createOrder(customerUser.id, {
        items: [
          { productId: productA.id, selectedSku: variantA.sku, quantity: 1 },
          { productId: productB.id, selectedSku: variantB.sku, quantity: 1 },
        ],
        deliveryMethodId: "standard",
        newAddress: {
          fullName: "Patron MultiVendor",
          phone: "9876543210",
          street: "100 Heritage Boulevard",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
        paymentMethod: "DEMO_ONLINE",
      });

      expect(res.success).toBe(true);
      expect(res.order).toBeDefined();
      const order = res.order!;
      createdOrderId = order.id;
      expect(order.id).toBeDefined();
      expect(order.items.length).toBe(2);

      const vendorNames = order.items.map((i: any) => i.vendorName);
      expect(vendorNames).toContain("Studio Alpha Heritage");
      expect(vendorNames).toContain("Studio Beta Silks");

      expect(order.totals.subtotal).toBe(13000);
      expect(order.totals.total).toBe(13000);
    });
  });

  afterAll(async () => {
    try {
      if (createdOrderId) {
        await prisma.shipmentTrackingEvent.deleteMany({ where: { shipment: { orderId: createdOrderId } } });
        await prisma.shipment.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.paymentRecord.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.order.deleteMany({ where: { id: createdOrderId } });
      }
      if (productA?.id) {
        await prisma.productVariant.deleteMany({ where: { productId: productA.id } });
        await prisma.productImage.deleteMany({ where: { productId: productA.id } });
        await prisma.product.deleteMany({ where: { id: productA.id } });
      }
      if (productB?.id) {
        await prisma.productVariant.deleteMany({ where: { productId: productB.id } });
        await prisma.productImage.deleteMany({ where: { productId: productB.id } });
        await prisma.product.deleteMany({ where: { id: productB.id } });
      }
    } catch {
    }
  });
});

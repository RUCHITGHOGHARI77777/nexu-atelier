import { PrismaClient, UserRole, ProductApprovalStatus, CouponDiscountType, AddressType } from "@prisma/client";
import { PRELOADED_PRODUCTS } from "../src/context/StoreContext";

const prisma = new PrismaClient();

async function run() {
  console.log("🚀 Starting complete catalog, coupon, and demo account synchronization...");

  // 1. Ensure Standard Platform Coupons
  const standardCoupons = [
    {
      code: "DEMO20",
      description: "20% Studio Showcase Discount",
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 20,
      minOrderValuePaise: 0,
      maxDiscountPaise: 500000,
      usageLimit: 99999,
      perCustomerLimit: 100,
      isActive: true,
    },
    {
      code: "ATELIER10",
      description: "10% Artisan Welcome Discount",
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderValuePaise: 0,
      maxDiscountPaise: 500000,
      usageLimit: 99999,
      perCustomerLimit: 100,
      isActive: true,
    },
    {
      code: "VIP20",
      description: "20% Connoisseur VIP Privilege",
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 20,
      minOrderValuePaise: 0,
      maxDiscountPaise: 1000000,
      usageLimit: 99999,
      perCustomerLimit: 100,
      isActive: true,
    },
    {
      code: "FIRST10",
      description: "10% First Acquisition Privilege",
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderValuePaise: 0,
      maxDiscountPaise: 500000,
      usageLimit: 99999,
      perCustomerLimit: 100,
      isActive: true,
    },
    {
      code: "FLAT500",
      description: "₹500 Flat Studio Acquisition Voucher",
      discountType: CouponDiscountType.FIXED_AMOUNT,
      discountValue: 500,
      minOrderValuePaise: 250000, // ₹2,500
      maxDiscountPaise: 50000,
      usageLimit: 99999,
      perCustomerLimit: 100,
      isActive: true,
    },
  ];

  for (const c of standardCoupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderValuePaise: c.minOrderValuePaise,
        maxDiscountPaise: c.maxDiscountPaise,
        isActive: true,
        expiresAt: null,
      },
      create: {
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderValuePaise: c.minOrderValuePaise,
        maxDiscountPaise: c.maxDiscountPaise,
        usageLimit: c.usageLimit,
        perCustomerLimit: c.perCustomerLimit,
        isActive: true,
        startsAt: new Date(Date.now() - 3600000),
      },
    });
  }
  console.log("✅ Standard platform coupons synchronized.");

  // 2. Replenish stock on existing DB products
  await prisma.product.updateMany({
    data: {
      stock: 45,
      isPublished: true,
      approvalStatus: ProductApprovalStatus.APPROVED,
    },
  });
  console.log("✅ All existing DB products stock replenished to 45 units & marked published/approved.");

  // Category & Vendor Mapping for PRELOADED_PRODUCTS
  const categoryMap: Record<string, string> = {
    Electronics: "cat_audio",
    "Fashion & Apparel": "cat_apparel",
    "Home & Kitchen": "cat_home",
    "B2B Wholesale Packs": "cat_essentials",
  };

  const vendorMap: Record<string, string> = {
    sup_voxel: "vnd_voxel_audio",
    sup_aerotech: "vnd_voxel_audio",
    sup_keeb: "vnd_voxel_audio",
    sup_sol: "vnd_sol_textiles",
    sup_kinetic: "vnd_kinetic_apparel",
    sup_monolith: "vnd_monolith_guild",
    sup_nordic: "vnd_nordic_form",
  };

  const defaultVendor = "vnd_sol_textiles";

  // 3. Upsert PRELOADED_PRODUCTS into PostgreSQL Product table
  for (const p of PRELOADED_PRODUCTS) {
    const categoryId = categoryMap[p.category] || "cat_apparel";
    const vendorId = vendorMap[p.supplier.id] || defaultVendor;
    const basePricePaise = Math.round(p.price * 100);
    const compareAtPricePaise = Math.round((p.mrpPrice || p.price * 1.25) * 100);

    const productRecord = await prisma.product.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        subtitle: p.subtitle || p.title,
        description: p.description,
        categoryId,
        vendorId,
        basePricePaise,
        compareAtPricePaise,
        stock: 35,
        isPublished: true,
        approvalStatus: ProductApprovalStatus.APPROVED,
        rating: p.rating || 4.9,
        ratingCount: p.reviewCount || 12,
        brand: p.supplier.name,
      },
      create: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle || p.title,
        description: p.description,
        categoryId,
        vendorId,
        basePricePaise,
        compareAtPricePaise,
        stock: 35,
        isPublished: true,
        approvalStatus: ProductApprovalStatus.APPROVED,
        rating: p.rating || 4.9,
        ratingCount: p.reviewCount || 12,
        brand: p.supplier.name,
      },
    });

    // Delete and re-create clean product images
    await prisma.productImage.deleteMany({ where: { productId: productRecord.id } });
    if (p.images && p.images.length > 0) {
      await prisma.productImage.createMany({
        data: p.images.map((url, idx) => ({
          productId: productRecord.id,
          url,
          alt: `${p.title} - View ${idx + 1}`,
          sortOrder: idx,
          isPrimary: idx === 0,
        })),
      });
    }

    // Delete and re-create clean variants
    await prisma.productVariant.deleteMany({ where: { productId: productRecord.id } });
    const variantData: any[] = [];

    if (p.sizes && p.sizes.length > 0) {
      for (const size of p.sizes) {
        variantData.push({
          productId: productRecord.id,
          sku: `${p.id}-SIZE-${size}`.toUpperCase(),
          variantType: "SIZE",
          name: "Size",
          value: size,
          stock: 15,
          additionalPricePaise: 0,
        });
      }
    }

    if (p.colors && p.colors.length > 0) {
      for (const color of p.colors) {
        variantData.push({
          productId: productRecord.id,
          sku: `${p.id}-COL-${color.name.replace(/\s+/g, "")}`.toUpperCase(),
          variantType: "COLOR",
          name: "Color",
          value: color.name,
          hexCode: color.hex,
          imageUrl: color.image,
          stock: 15,
          additionalPricePaise: 0,
        });
      }
    }

    if (variantData.length > 0) {
      await prisma.productVariant.createMany({ data: variantData });
    }
  }
  console.log(`✅ Upserted ${PRELOADED_PRODUCTS.length} StoreContext products into DB with variants and images.`);

  // 4. Ensure demo patron has a valid saved address in DB
  const patron = await prisma.user.findUnique({
    where: { email: "patron@nexu.studio" },
  });

  if (patron) {
    const existingAddr = await prisma.address.findFirst({
      where: { customerId: patron.id },
    });

    if (!existingAddr) {
      await prisma.address.create({
        data: {
          customerId: patron.id,
          fullName: "Aarav Mehta",
          phone: "+91 98765 43210",
          street: "Flat 402, Highline Horizon, Nariman Point",
          apartment: "Tower B, Seaface Promenade",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          country: "India",
          type: AddressType.HOME,
          isDefault: true,
        },
      });
      console.log("✅ Seeded default delivery address for demo patron Aarav Mehta.");
    }
  }

  // Count final products
  const finalProductCount = await prisma.product.count();
  console.log(`🎉 Demo catalog synchronization complete! Total products in DB: ${finalProductCount}`);

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

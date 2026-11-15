import {
  PrismaClient,
  UserRole,
  AddressType,
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  SellerStatus,
  ProductApprovalStatus,
  FulfillmentStatus,
  PayoutStatus,
  DisputeStatus,
  CouponDiscountType,
  ReviewStatus,
  ReportReasonCode,
  ReactionType,
} from "@prisma/client";
import { SEED_PRODUCTS, SEED_VENDORS } from "../src/data/seedCatalog";
import { hashPassword } from "../src/lib/server/password-util";

const prisma = new PrismaClient();

async function main() {
  // Fail-Closed Destructive-Seed Circuit Breaker
  if (process.env.ALLOW_SEED_RESET !== "true") {
    console.error("\n🛑 [SAFETY CIRCUIT BREAKER] Database seed execution blocked!");
    console.error("prisma/seed.ts contains destructive deleteMany() operations that will wipe existing data.");
    console.error("To explicitly permit local development seeding, set environment variable ALLOW_SEED_RESET=true");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("\n🛑 [SAFETY CIRCUIT BREAKER] Destructive seeding is strictly forbidden in production!");
    process.exit(1);
  }

  console.log("🌱 Starting safe database seeding for Nexu Atelier (Phase 4)...");

  // 1. Clean up existing operational records safely for idempotent seeding
  await prisma.productAnswer.deleteMany();
  await prisma.productQuestion.deleteMany();
  await prisma.reviewModerationEvent.deleteMany();
  await prisma.reviewReport.deleteMany();
  await prisma.reviewReaction.deleteMany();
  await prisma.sellerReviewResponse.deleteMany();
  await prisma.reviewMedia.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.sellerFeedback.deleteMany();
  await prisma.disputeCase.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.platformSetting.deleteMany();
  await prisma.vendorPayout.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Previous records cleaned.");

  // 2. Seed Users
  const defaultPasswordHash = hashPassword("Password123!");
  const adminPasswordHash = hashPassword("AdminPass123!");

  // Customers
  const patron1 = await prisma.user.create({
    data: {
      id: "usr_patron_01",
      email: "patron@nexu.studio",
      passwordHash: defaultPasswordHash,
      role: UserRole.CUSTOMER,
      profile: {
        create: {
          name: "Aarav Mehta",
          phone: "+91 98765 43210",
        },
      },
    },
  });

  const patron2 = await prisma.user.create({
    data: {
      id: "usr_patron_02",
      email: "priya@nexu.studio",
      passwordHash: defaultPasswordHash,
      role: UserRole.CUSTOMER,
      profile: {
        create: {
          name: "Priya Sharma",
          phone: "+91 98765 11111",
        },
      },
    },
  });

  // Admin
  await prisma.user.create({
    data: {
      id: "usr_admin_01",
      email: "admin@nexu.studio",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      profile: {
        create: {
          name: "Devika Patel",
          phone: "+91 98765 99999",
        },
      },
    },
  });

  // Sellers
  const sellerUser1 = await prisma.user.create({
    data: {
      id: "usr_seller_01",
      email: "solstice@nexu.studio",
      passwordHash: defaultPasswordHash,
      role: UserRole.SELLER,
      profile: {
        create: {
          name: "Rajesh Solanki (Solstice Loom)",
          phone: "+91 98251 12345",
        },
      },
    },
  });

  const sellerUser2 = await prisma.user.create({
    data: {
      id: "usr_seller_02",
      email: "voxel@nexu.studio",
      passwordHash: defaultPasswordHash,
      role: UserRole.SELLER,
      profile: {
        create: {
          name: "Kenji Sato (Voxel Acoustics)",
          phone: "+91 80234 56789",
        },
      },
    },
  });

  const pendingSellerUser = await prisma.user.create({
    data: {
      id: "usr_seller_03",
      email: "pending.artisan@nexu.studio",
      passwordHash: defaultPasswordHash,
      role: UserRole.SELLER,
      profile: {
        create: {
          name: "Hansa Ben (Kutch Embroideries)",
          phone: "+91 94261 98765",
        },
      },
    },
  });

  const rejectedSellerUser = await prisma.user.create({
    data: {
      id: "usr_seller_04",
      email: "rejected.artisan@nexu.studio",
      passwordHash: defaultPasswordHash,
      role: UserRole.SELLER,
      profile: {
        create: {
          name: "Unverified Trader",
          phone: "+91 90000 00000",
        },
      },
    },
  });

  console.log("👤 Users & profiles (Customers, Admin, Sellers) created.");

  // 3. Seed Addresses
  const addr1 = await prisma.address.create({
    data: {
      id: "addr_patron_01_default",
      customerId: patron1.id,
      fullName: "Aarav Mehta",
      phone: "9876543210",
      street: "Flat 402, Highline Residency, Nariman Point",
      apartment: "Tower B, Level 4",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      country: "India",
      type: AddressType.HOME,
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      id: "addr_patron_01_studio",
      customerId: patron1.id,
      fullName: "Aarav Mehta Studio",
      phone: "9876543210",
      street: "Unit 12, Indirapuram Design Quarter",
      apartment: "Design Loft 3",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560038",
      country: "India",
      type: AddressType.STUDIO,
      isDefault: false,
    },
  });

  const addr2 = await prisma.address.create({
    data: {
      id: "addr_patron_02_default",
      customerId: patron2.id,
      fullName: "Priya Sharma",
      phone: "9876511111",
      street: "Villa 14, Koregaon Park Lotus Greens",
      apartment: "North Wing",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      country: "India",
      type: AddressType.HOME,
      isDefault: true,
    },
  });

  console.log("📍 Addresses seeded.");

  // 4. Seed Sellers (Vendors)
  const vendorUserMap: Record<string, string> = {
    vnd_sol_textiles: sellerUser1.id,
    vnd_voxel_audio: sellerUser2.id,
  };

  for (const [key, v] of Object.entries(SEED_VENDORS)) {
    await prisma.seller.create({
      data: {
        id: v.id,
        userId: vendorUserMap[v.id] || null,
        slug: v.slug,
        name: v.name,
        originHub: v.location,
        story: v.story,
        heroImage: v.avatarUrl,
        verified: true,
        rating: v.rating,
        leadTimeDays: 2,
        status: SellerStatus.APPROVED,
        businessEmail: `${v.slug}@nexu.studio`,
        businessPhone: "+91 98000 00001",
        taxIdentifier: "24AAACS1234A1Z5",
        commissionRatePercent: 10.0,
        bankAccountName: v.name,
        bankAccountNumber: "998822110033",
        bankIfsc: "HDFC0001234",
        approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
    });
  }

  // Seed Pending Seller (Application in review)
  await prisma.seller.create({
    data: {
      id: "vnd_kutch_craft",
      userId: pendingSellerUser.id,
      slug: "kutch-heritage-embroideries",
      name: "Kutch Heritage Embroideries",
      originHub: "Bhuj, Kutch, Gujarat",
      story: "Authentic mirror-work and Ahir needlecraft collective.",
      heroImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      verified: false,
      rating: 4.8,
      leadTimeDays: 4,
      status: SellerStatus.PENDING,
      businessEmail: "pending.artisan@nexu.studio",
      businessPhone: "+91 94261 98765",
      taxIdentifier: "24BBBCS5678B1Z2",
      commissionRatePercent: 10.0,
    },
  });

  // Seed Rejected Seller (Application rejected with reason)
  await prisma.seller.create({
    data: {
      id: "vnd_rejected_craft",
      userId: rejectedSellerUser.id,
      slug: "unverified-factory-outlet",
      name: "Unverified Factory Outlet",
      originHub: "Industrial Zone C",
      story: "Mass produced commercial goods without craft authenticity.",
      heroImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      verified: false,
      rating: 2.0,
      leadTimeDays: 7,
      status: SellerStatus.REJECTED,
      rejectionReason: "Failed authenticity check: items are mass manufactured rather than handcrafted artisan goods.",
      businessEmail: "rejected.artisan@nexu.studio",
      businessPhone: "+91 90000 00000",
      commissionRatePercent: 10.0,
    },
  });

  console.log("🏛️ Sellers (Approved, Pending, Rejected) seeded.");

  // 5. Seed Categories
  const categoryDefs = [
    {
      id: "cat_apparel",
      slug: "apparel",
      name: "Apparel",
      description: "Master-woven heritage textiles and tailored contemporary outerwear.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "cat_audio",
      slug: "audio-electronics",
      name: "Audio & Electronics",
      description: "Precision spatial monitors and acoustic playback instruments.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "cat_home",
      slug: "home-objects",
      name: "Home Objects",
      description: "Architectural vessels, sculptural lighting, and handcrafted bronze accents.",
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "cat_footwear",
      slug: "footwear-leather",
      name: "Footwear & Leather",
      description: "Vegetable-tanned full-grain leather footwear and Goodyear-welted carry goods.",
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "cat_essentials",
      slug: "modern-essentials",
      name: "Modern Essentials",
      description: "Functional daily artifacts engineered for timeless elegance.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const catMap = new Map<string, string>();
  for (const c of categoryDefs) {
    const cat = await prisma.category.create({ data: c });
    catMap.set(c.name.toLowerCase(), cat.id);
  }

  console.log("📂 Categories seeded.");

  const getCatId = (catName: string) => {
    const lower = catName.toLowerCase();
    for (const [key, id] of catMap.entries()) {
      if (lower.includes(key) || key.includes(lower)) return id;
    }
    return catMap.get("modern essentials") || "cat_essentials";
  };

  // 6. Seed Products, Images & Variants
  for (const p of SEED_PRODUCTS) {
    const categoryId = getCatId(p.category);
    const vendorId = p.vendor.id;

    const basePricePaise = Math.round(p.basePrice * 100);
    const compareAtPricePaise = p.compareAtPrice ? Math.round(p.compareAtPrice * 100) : null;

    const createdProduct = await prisma.product.create({
      data: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        categoryId,
        vendorId,
        basePricePaise,
        compareAtPricePaise,
        stock: p.stock,
        lowStockThreshold: 5,
        isPublished: true,
        approvalStatus: ProductApprovalStatus.APPROVED,
        isFeatured: p.isFeatured || false,
        isBestseller: (p.reviewCount || 0) > 40,
        isArtisanDirect: true,
        rating: p.rating || 5.0,
        ratingCount: p.reviewCount || 10,
        material: p.materials || p.specifications?.find((s) => s.label.toLowerCase().includes("fabric") || s.label.toLowerCase().includes("material"))?.value || "Master-grade natural formulation",
        dimensions: p.specifications?.find((s) => s.label.toLowerCase().includes("dimensions"))?.value || "Standard studio proportion",
        weight: p.specifications?.find((s) => s.label.toLowerCase().includes("weight"))?.value || "Calibrated studio density",
        careInstructions: p.specifications?.find((s) => s.label.toLowerCase().includes("care"))?.value || "Professional care recommended",
        images: {
          create: p.images.map((url, idx) => ({
            url,
            alt: `${p.title} view ${idx + 1}`,
            sortOrder: idx,
          })),
        },
      },
    });

    // Seed Color Variants
    if (p.availableColors && p.availableColors.length > 0) {
      for (let i = 0; i < p.availableColors.length; i++) {
        const c = p.availableColors[i];
        await prisma.productVariant.create({
          data: {
            productId: createdProduct.id,
            sku: `${p.id}-CLR-${c.name.toUpperCase().replace(/\s+/g, "_")}`,
            variantType: "COLOR",
            name: "Color",
            value: c.name,
            hexCode: c.hex,
            imageUrl: c.image,
            stock: Math.floor(p.stock / p.availableColors.length) + (i === 0 ? p.stock % p.availableColors.length : 0),
          },
        });
      }
    }

    // Seed Size Variants
    if (p.availableSizes && p.availableSizes.length > 0) {
      for (const sz of p.availableSizes) {
        await prisma.productVariant.create({
          data: {
            productId: createdProduct.id,
            sku: `${p.id}-SZ-${sz.toUpperCase().replace(/\s+/g, "_")}`,
            variantType: "SIZE",
            name: "Size",
            value: sz,
            stock: Math.floor(p.stock / p.availableSizes.length),
          },
        });
      }
    }
  }

  console.log("📦 Products, images & variants seeded.");

  // 7. Seed Orders with Seller-Specific Fulfillment Lines and Payouts
  const p1 = SEED_PRODUCTS[0]; // Solstice Loom Studio
  const p2 = SEED_PRODUCTS[1]; // Voxel Acoustic Dynamics
  const p3 = SEED_PRODUCTS[2]; // Nordic Form Atelier

  const subtotalPaise1 = (p1.basePrice + p2.basePrice) * 100;
  const shippingFeePaise1 = subtotalPaise1 >= 250000 ? 0 : 15000;
  const taxPaise1 = Math.round(subtotalPaise1 * 0.12);
  const totalPaise1 = subtotalPaise1 + shippingFeePaise1;

  const item1Gross = p1.basePrice * 100;
  const item1Commission = Math.round(item1Gross * 0.10);
  const item1Net = item1Gross - item1Commission;

  const item2Gross = p2.basePrice * 100;
  const item2Commission = Math.round(item2Gross * 0.10);
  const item2Net = item2Gross - item2Commission;

  const order1 = await prisma.order.create({
    data: {
      id: "ORD-2026-88192",
      customerId: patron1.id,
      customerEmail: patron1.email,
      customerName: "Aarav Mehta",
      shippingAddressSnapshot: JSON.stringify(addr1),
      deliveryMethodId: "standard",
      deliveryMethodName: "Studio Direct Standard Courier",
      deliveryEstimatedDays: 3,
      shippingFeePaise: shippingFeePaise1,
      estimatedTaxPaise: taxPaise1,
      subtotalPaise: subtotalPaise1,
      totalPaise: totalPaise1,
      status: OrderStatus.IN_PRODUCTION,
      paymentStatus: PaymentStatus.ESCROW_HOLD,
      idempotencyKey: "idemp_seed_ord_01",
      estimatedDeliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      items: {
        create: [
          {
            id: "item_ord_88192_01",
            productId: p1.id,
            productSlug: p1.slug,
            title: p1.title,
            vendorId: p1.vendor.id,
            vendorName: p1.vendor.name,
            selectedColorName: p1.availableColors?.[0]?.name,
            selectedColorHex: p1.availableColors?.[0]?.hex,
            selectedSize: "M",
            unitPricePaise: p1.basePrice * 100,
            quantity: 1,
            lineTotalPaise: item1Gross,
            imageSnapshot: p1.images[0],
            fulfillmentStatus: FulfillmentStatus.PROCESSING,
          },
          {
            id: "item_ord_88192_02",
            productId: p2.id,
            productSlug: p2.slug,
            title: p2.title,
            vendorId: p2.vendor.id,
            vendorName: p2.vendor.name,
            selectedColorName: p2.availableColors?.[0]?.name,
            selectedColorHex: p2.availableColors?.[0]?.hex,
            selectedSize: "Standard Case",
            unitPricePaise: p2.basePrice * 100,
            quantity: 1,
            lineTotalPaise: item2Gross,
            imageSnapshot: p2.images[0],
            fulfillmentStatus: FulfillmentStatus.PACKED,
          },
        ],
      },
      payments: {
        create: {
          transactionRef: "TXN-ESCROW-88192",
          provider: PaymentProvider.ESCROW_INTERNAL,
          amountPaise: totalPaise1,
          currency: "INR",
          status: PaymentStatus.ESCROW_HOLD,
          rawGatewayResponse: JSON.stringify({ mode: "escrow_mock", verified: true }),
        },
      },
      auditEvents: {
        create: [
          {
            entityType: "ORDER",
            entityId: "ORD-2026-88192",
            action: "ORDER_CONFIRMED",
            note: "Order confirmed and verified via Phase 2/3 escrow protocol.",
            performedBy: "system",
          },
          {
            entityType: "ORDER",
            entityId: "ORD-2026-88192",
            action: "PRODUCTION_STARTED",
            note: "Artisan cutting and handloom finishing in progress.",
            performedBy: "vendor:vnd_sol_textiles",
          },
        ],
      },
    },
  });

  // Seed Payout records for Order 1
  await prisma.vendorPayout.create({
    data: {
      sellerId: p1.vendor.id,
      orderItemId: "item_ord_88192_01",
      grossAmountPaise: item1Gross,
      commissionPaise: item1Commission,
      netPayoutPaise: item1Net,
      status: PayoutStatus.ESCROW_HOLD,
    },
  });

  await prisma.vendorPayout.create({
    data: {
      sellerId: p2.vendor.id,
      orderItemId: "item_ord_88192_02",
      grossAmountPaise: item2Gross,
      commissionPaise: item2Commission,
      netPayoutPaise: item2Net,
      status: PayoutStatus.ESCROW_HOLD,
    },
  });

  // Seed Order for Patron 2 (Priya Sharma)
  const item3Gross = p3.basePrice * 100;
  const item3Commission = Math.round(item3Gross * 0.10);
  const item3Net = item3Gross - item3Commission;

  const subtotalPaise2 = p3.basePrice * 100;
  const shippingFeePaise2 = subtotalPaise2 >= 250000 ? 0 : 15000;
  const taxPaise2 = Math.round(subtotalPaise2 * 0.12);
  const totalPaise2 = subtotalPaise2 + shippingFeePaise2;

  await prisma.order.create({
    data: {
      id: "ORD-2026-99001",
      customerId: patron2.id,
      customerEmail: patron2.email,
      customerName: "Priya Sharma",
      shippingAddressSnapshot: JSON.stringify(addr2),
      deliveryMethodId: "standard",
      deliveryMethodName: "Studio Direct Standard Courier",
      deliveryEstimatedDays: 3,
      shippingFeePaise: shippingFeePaise2,
      estimatedTaxPaise: taxPaise2,
      subtotalPaise: subtotalPaise2,
      totalPaise: totalPaise2,
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.ESCROW_HOLD,
      idempotencyKey: "idemp_seed_ord_02",
      estimatedDeliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      items: {
        create: [
          {
            id: "item_ord_99001_01",
            productId: p3.id,
            productSlug: p3.slug,
            title: p3.title,
            vendorId: p3.vendor.id,
            vendorName: p3.vendor.name,
            unitPricePaise: p3.basePrice * 100,
            quantity: 1,
            lineTotalPaise: item3Gross,
            imageSnapshot: p3.images[0],
            fulfillmentStatus: FulfillmentStatus.SHIPPED,
            courierName: "Bluedart Air Express",
            trackingNumber: "BD-88492019IN",
            dispatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
          },
        ],
      },
      payments: {
        create: {
          transactionRef: "TXN-ESCROW-99001",
          provider: PaymentProvider.ESCROW_INTERNAL,
          amountPaise: totalPaise2,
          currency: "INR",
          status: PaymentStatus.ESCROW_HOLD,
        },
      },
      auditEvents: {
        create: [
          {
            entityType: "ORDER",
            entityId: "ORD-2026-99001",
            action: "ORDER_CONFIRMED",
            note: "Order confirmed.",
            performedBy: "system",
          },
          {
            entityType: "ORDER",
            entityId: "ORD-2026-99001",
            action: "ORDER_DISPATCHED",
            note: "Dispatched via Bluedart Air priority tracking BD-88492019IN.",
            performedBy: "vendor:vnd_nordic_form",
          },
        ],
      },
    },
  });

  await prisma.vendorPayout.create({
    data: {
      sellerId: p3.vendor.id,
      orderItemId: "item_ord_99001_01",
      grossAmountPaise: item3Gross,
      commissionPaise: item3Commission,
      netPayoutPaise: item3Net,
      status: PayoutStatus.ELIGIBLE_FOR_PAYOUT,
    },
  });

  console.log("🧾 Seed orders, fulfillment lines, and vendor payouts created.");

  // 9. Seed Platform Settings
  const settings = [
    { key: "marketplace_commission_percent", value: "10.0", description: "Default platform commission percentage on seller gross sales" },
    { key: "free_shipping_threshold_inr", value: "2500", description: "Minimum cart subtotal to qualify for complimentary shipping" },
    { key: "patron_return_window_days", value: "14", description: "Eligible days post-delivery for customer return/dispute requests" },
    { key: "support_email", value: "concierge@nexu.studio", description: "Official patron & seller relations support email" },
    { key: "escrow_clearance_hold_days", value: "14", description: "Automated holding period before vendor payouts transition to eligible" },
  ];

  for (const s of settings) {
    await prisma.platformSetting.create({
      data: {
        key: s.key,
        value: s.value,
        description: s.description,
        updatedBy: "usr_admin_01",
      },
    });
  }
  console.log("⚙️ Platform settings seeded.");

  // 10. Seed Coupons / Promotional Rules
  await prisma.coupon.create({
    data: {
      code: "NEXUFIRST",
      description: "Inaugural patron welcome offer: 15% off up to ₹1,500 on orders above ₹2,000",
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 15, // 15%
      minOrderValuePaise: 200000, // ₹2,000
      maxDiscountPaise: 150000, // ₹1,500
      usageLimit: 500,
      perCustomerLimit: 1,
      timesUsed: 1,
      isActive: true,
      fundedBy: "PLATFORM",
      usages: {
        create: {
          userId: patron1.id,
          orderId: "ORD-2026-99002",
          discountPaise: 82500,
        },
      },
    },
  });

  await prisma.coupon.create({
    data: {
      code: "ATELIER10",
      description: "Heritage patronage reward: 10% off up to ₹1,000 on orders above ₹1,000",
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 10, // 10%
      minOrderValuePaise: 100000, // ₹1,000
      maxDiscountPaise: 100000, // ₹1,000
      usageLimit: 1000,
      perCustomerLimit: 2,
      timesUsed: 0,
      isActive: true,
      fundedBy: "PLATFORM",
    },
  });

  await prisma.coupon.create({
    data: {
      code: "FESTIVE500",
      description: "Curated celebration voucher: Flat ₹500 off on orders above ₹3,000",
      discountType: CouponDiscountType.FIXED_AMOUNT,
      discountValue: 50000, // ₹500 in paise
      minOrderValuePaise: 300000, // ₹3,000
      maxDiscountPaise: 50000,
      usageLimit: 200,
      perCustomerLimit: 1,
      timesUsed: 0,
      isActive: true,
      fundedBy: "PLATFORM",
    },
  });
  console.log("🎟️ Promotional coupons seeded.");

  // 11. Seed Dispute / Return Case
  await prisma.disputeCase.create({
    data: {
      id: "DSP-2026-001",
      orderId: "ORD-2026-99001",
      orderItemId: "item_ord_99001_01",
      customerId: patron2.id,
      sellerId: p3.vendor.id,
      reason: "Parcel outer wooden crate damaged during courier transit; superficial finish scratch on bronze rim.",
      evidence: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
      status: DisputeStatus.UNDER_REVIEW,
      refundAmountPaise: 250000, // ₹2,500 proposed compensation
      internalNotes: "Patron contacted concierge. Logistics partner Bluedart Air notified of transit claim.",
    },
  });
  console.log("⚖️ Dispute case seeded.");

  // 12. Seed Product Reviews, Customer Reactions, Official Seller Replies, and Seller Service Feedback
  const review1 = await prisma.productReview.create({
    data: {
      productId: p1.id,
      customerId: patron1.id,
      orderItemId: "item_ord_88192_01",
      variantName: "Standard",
      rating: 5,
      title: "Exquisite hand-spun mulberry silk and bespoke heritage drape",
      comment: "The tactile richness of this raw silk shawl is truly peerless. The zari selvedge borders have an understated obsidian shimmer under evening illumination. Packaging arrived in an archival linen presentation box with signed weaver provenance.",
      isVerifiedPurchase: true,
      status: ReviewStatus.PUBLISHED,
      helpfulVotes: 5,
      unhelpfulVotes: 0,
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80",
            mediaType: "IMAGE",
            sortOrder: 0,
          },
        ],
      },
      sellerResponse: {
        create: {
          sellerId: p1.vendor.id,
          responseText: "Thank you for welcoming our handloom creation into your private collection. Our Master Weavers in Varanasi spent over 18 days articulating the raw zari borders. We recommend dry cleaning in specialized silk muslin to preserve the natural luster.",
        },
      },
    },
  });

  // Reaction on review1 by patron2
  await prisma.reviewReaction.create({
    data: {
      reviewId: review1.id,
      userId: patron2.id,
      reactionType: ReactionType.HELPFUL,
    },
  });

  const review2 = await prisma.productReview.create({
    data: {
      productId: p2.id,
      customerId: patron1.id,
      orderItemId: "item_ord_88192_02",
      variantName: "Bronze / 32cm",
      rating: 4,
      title: "Sculptural presence is magnificent, slightly heavier than anticipated",
      comment: "A substantial lost-wax cast artifact. The dark umber patina is mesmerizing on the dining table. Subtracted one star only because the piece is over 4.5kg, making it difficult to reposition frequently.",
      isVerifiedPurchase: true,
      status: ReviewStatus.PUBLISHED,
      helpfulVotes: 2,
      unhelpfulVotes: 0,
      sellerResponse: {
        create: {
          sellerId: p2.vendor.id,
          responseText: "We deeply appreciate your discerning critique. The solid bronze weight ensures acoustic resonance and architectural stability. A microfibre felt pad is included in the base to protect polished stone surfaces.",
        },
      },
    },
  });

  // Seed a reported review for testing admin moderation queue
  const reportedReview = await prisma.productReview.create({
    data: {
      productId: p3.id,
      customerId: patron1.id,
      rating: 1,
      title: "Spam promotion text with external phone contact",
      comment: "Contact 9820011223 for 50% cheaper knockoffs at www.fake-atelier.biz! Call now!",
      isVerifiedPurchase: false,
      status: ReviewStatus.REPORTED,
      reportCount: 3,
      reports: {
        create: [
          {
            reporterId: patron2.id,
            reasonCode: ReportReasonCode.SPAM_OR_ADVERTISEMENT,
            explanation: "Blatant commercial spam and advertising competitor phonelines.",
          },
          {
            reporterId: "usr_admin_01",
            reasonCode: ReportReasonCode.HARASSMENT_OR_ABUSE,
            explanation: "Soliciting external non-verified phone numbers on product page.",
          },
        ],
      },
    },
  });

  // Seed Seller Feedback for Order 1
  await prisma.sellerFeedback.create({
    data: {
      sellerId: p1.vendor.id,
      customerId: patron1.id,
      orderId: "ORD-2026-88192",
      packagingRating: 5,
      deliveryRating: 5,
      communicationRating: 5,
      comment: "Flawless white-glove packaging. Dispatch notifications were proactive and courier tracking was precise down to the delivery hour.",
    },
  });

  // Atomically update product aggregates for p1 and p2
  const p1Reviews = await prisma.productReview.findMany({
    where: { productId: p1.id, status: ReviewStatus.PUBLISHED },
  });
  const p1Avg = p1Reviews.reduce((sum, r) => sum + r.rating, 0) / p1Reviews.length;
  await prisma.product.update({
    where: { id: p1.id },
    data: {
      rating: Math.round(p1Avg * 10) / 10,
      ratingCount: p1Reviews.length,
      ratingBreakdownJson: JSON.stringify({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 }),
    },
  });

  const p2Reviews = await prisma.productReview.findMany({
    where: { productId: p2.id, status: ReviewStatus.PUBLISHED },
  });
  const p2Avg = p2Reviews.reduce((sum, r) => sum + r.rating, 0) / p2Reviews.length;
  await prisma.product.update({
    where: { id: p2.id },
    data: {
      rating: Math.round(p2Avg * 10) / 10,
      ratingCount: p2Reviews.length,
      ratingBreakdownJson: JSON.stringify({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 }),
    },
  });

  console.log("⭐ Reviews, verified reactions, seller replies, and feedback scorecard seeded.");

  // Seed Product Q&As
  const q1 = await prisma.productQuestion.create({
    data: {
      productId: p1.id,
      authorName: "Vikram Singhania",
      question: "Is the handwoven mulberry silk delicate to water stains, or has it undergone natural plant-gum waterproofing?",
      upvotes: 14,
      answers: {
        create: [
          {
            authorName: "Sol Weaving Collective",
            authorRole: "STUDIO_ARTISAN",
            answer: "Every piece undergoes an organic steam treatment and beeswax-free natural plant oil barrier that resists atmospheric moisture, though we recommend dry cleaning only for liquid spills.",
            upvotes: 9,
          },
          {
            authorName: "Aarav Mehta",
            authorRole: "VERIFIED_BUYER",
            answer: "Can confirm from 6 months of daily wear—spilled some sparkling water on the drape and it brushed off cleanly without any water rings.",
            upvotes: 5,
          },
        ],
      },
    },
  });

  const q2 = await prisma.productQuestion.create({
    data: {
      productId: p1.id,
      authorName: "Meera Kapoor",
      question: "Does the garment include extra fabric in the inner seams for custom tailoring adjustments?",
      upvotes: 7,
      answers: {
        create: [
          {
            authorName: "Sol Weaving Collective",
            authorRole: "STUDIO_ARTISAN",
            answer: "Yes, our master tailors preserve a 1.5-inch French seam allowance on both sides to allow effortless silhouette alterations at your personal tailor.",
            upvotes: 8,
          },
        ],
      },
    },
  });

  console.log("💬 Craft Questions & Answers seeded.");

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

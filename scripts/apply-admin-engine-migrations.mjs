import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Applying additive migrations for Central Admin Control Engine...");

  // 1. Additive columns on User
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT FALSE;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;`);
  console.log("✓ Additive columns applied to User (isSuspended, suspensionReason)");

  // 2. Safe additive enum values
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';`);
    await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURNED';`);
    console.log("✓ Additive enum values applied to OrderStatus");
  } catch (e) {
    console.log("Enum OrderStatus alter notice:", e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "FulfillmentStatus" ADD VALUE IF NOT EXISTS 'RETURNED';`);
    console.log("✓ Additive enum values applied to FulfillmentStatus");
  } catch (e) {
    console.log("Enum FulfillmentStatus alter notice:", e.message);
  }

  // 3. Default Website Settings (Appearance, Content, Banners, Sections, Policies)
  const defaultSettings = [
    {
      key: "site_title",
      value: "NEXU ATELIER | Curated Indian Craft & Luxury",
      description: "Public marketplace browser title and brand identity headline",
    },
    {
      key: "site_logo",
      value: "/brand/logo.svg",
      description: "Primary brand mark / vector SVG logo path",
    },
    {
      key: "site_favicon",
      value: "/favicon.ico",
      description: "Browser tab icon and bookmark avatar",
    },
    {
      key: "homepage_hero_headline",
      value: "Rare Indian Heritage Crafts, Reimagined",
      description: "Hero masthead primary headline on public storefront homepage",
    },
    {
      key: "homepage_hero_subtitle",
      value: "Directly sourced from generational master artisan ateliers and certified weaving cooperatives across India.",
      description: "Hero masthead secondary tagline and subtext",
    },
    {
      key: "homepage_hero_image",
      value: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80",
      description: "Storefront homepage hero curated background image URL",
    },
    {
      key: "homepage_banner_text",
      value: "Complimentary Pan-India Insured Express Delivery on Curated Orders Above ₹2,500",
      description: "Top notification / promotional ticker banner text on public storefront",
    },
    {
      key: "homepage_banner_enabled",
      value: "true",
      description: "Toggle visibility of storefront top notification banner (true/false)",
    },
    {
      key: "homepage_show_trending",
      value: "true",
      description: "Toggle visibility of Trending / Featured products carousel on homepage",
    },
    {
      key: "homepage_show_curated_categories",
      value: "true",
      description: "Toggle visibility of Curated Categories exploration section",
    },
    {
      key: "homepage_show_artisan_studios",
      value: "true",
      description: "Toggle visibility of Featured Master Studios section",
    },
    {
      key: "theme_preset",
      value: "gallery-white",
      description: "Approved visual preset (gallery-white: Clean gallery white background, neutral charcoal accents)",
    },
    {
      key: "footer_tagline",
      value: "Preserving the lineage of master Indian ateliers through ethical luxury commerce and verified provenance.",
      description: "Footer statement and cultural manifesto",
    },
    {
      key: "footer_support_phone",
      value: "+91 800 234 5678",
      description: "Official patron concierge telephone helpline",
    },
    {
      key: "policy_returns_content",
      value: "Every piece at Nexu Atelier is crafted by master artisans. In the rare event of transit damage or authenticity discrepancy, patrons may request a complimentary return or exchange within 14 days of tracked delivery.",
      description: "Patron returns and exchanges guarantee policy text",
    },
    {
      key: "policy_shipping_content",
      value: "Orders are hand-inspected and dispatched directly from certified artisan hubs via insured express courier within 2-4 business days.",
      description: "Logistics, insurance, and transit fulfillment policy text",
    },
    {
      key: "policy_privacy_content",
      value: "Nexu Atelier guarantees absolute patron privacy. Customer records, payment details, and shipping coordinates are cryptographically protected and never sold to third parties.",
      description: "Patron privacy commitment and data handling disclosure",
    },
  ];

  for (const s of defaultSettings) {
    const existing = await prisma.platformSetting.findUnique({ where: { key: s.key } });
    if (!existing) {
      await prisma.platformSetting.create({
        data: {
          key: s.key,
          value: s.value,
          description: s.description,
          updatedBy: "system_migration",
        },
      });
      console.log(`+ Initialized setting: ${s.key}`);
    }
  }

  console.log("✓ Central Admin Control Engine additive migrations completed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

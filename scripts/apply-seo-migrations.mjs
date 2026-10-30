import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Applying NEXU ATELIER SEO & Product Discovery Migrations ===");

  const addCol = async (table, col, def) => {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col}" ${def};`);
      console.log(`Added column "${col}" to "${table}".`);
    } catch (e) {
      console.log(`Column "${col}" on "${table}":`, e.message);
    }
  };

  // 1. Add Amazon-Style and Advanced SEO Columns to Product
  await addCol("Product", "metaTitle", "TEXT");
  await addCol("Product", "metaDescription", "TEXT");
  await addCol("Product", "canonicalUrl", "TEXT");
  await addCol("Product", "ogImage", "TEXT");
  await addCol("Product", "ogTitle", "TEXT");
  await addCol("Product", "ogDescription", "TEXT");
  await addCol("Product", "highlightsJson", "TEXT");
  await addCol("Product", "mpn", "TEXT");
  await addCol("Product", "gtin", "TEXT");
  await addCol("Product", "manufacturer", "TEXT");
  await addCol("Product", "countryOfOrigin", "TEXT DEFAULT 'India'");
  await addCol("Product", "warranty", "TEXT");
  await addCol("Product", "includedItems", "TEXT");
  await addCol("Product", "returnPolicy", "TEXT DEFAULT '7-Day Atelier Replacement'");
  await addCol("Product", "googleProductCategory", "TEXT");
  await addCol("Product", "condition", "TEXT DEFAULT 'NEW'");
  await addCol("Product", "targetGender", "TEXT DEFAULT 'unisex'");
  await addCol("Product", "targetAgeGroup", "TEXT DEFAULT 'adult'");
  await addCol("Product", "seoKeywords", "TEXT");
  await addCol("Product", "seoQualityScore", "INTEGER DEFAULT 0");
  await addCol("Product", "seoIssuesJson", "TEXT");

  // 2. Add Enhanced Image Fields to ProductImage
  await addCol("ProductImage", "title", "TEXT");
  await addCol("ProductImage", "imageType", "TEXT DEFAULT 'GALLERY'");
  await addCol("ProductImage", "isPrimary", "BOOLEAN NOT NULL DEFAULT false");
  await addCol("ProductImage", "width", "INTEGER");
  await addCol("ProductImage", "height", "INTEGER");

  // 3. Create ProductSlugRedirect table if not exists
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProductSlugRedirect" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        "oldSlug" TEXT NOT NULL UNIQUE,
        "newSlug" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created or verified "ProductSlugRedirect" table.');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ProductSlugRedirect_oldSlug_idx" ON "ProductSlugRedirect"("oldSlug");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ProductSlugRedirect_productId_idx" ON "ProductSlugRedirect"("productId");
    `);
  } catch (e) {
    console.log("ProductSlugRedirect table setup:", e.message);
  }

  // 4. Seed Default Global Platform Settings for SEO
  const defaultSettings = [
    { key: "seo.site_name", value: "NEXU ATELIER", description: "Marketplace brand name used in SEO titles and rich snippets." },
    { key: "seo.default_meta_title", value: "NEXU ATELIER — Handcrafted Artisan Heritage & Modern Luxury", description: "Default fallback page title." },
    { key: "seo.default_meta_description", value: "Explore certified handcrafted luxury, bespoke artisan textiles, heritage jewellery, and master craft decor on NEXU ATELIER.", description: "Default meta description." },
    { key: "seo.default_og_image", value: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80", description: "Default Open Graph share image URL." },
    { key: "seo.canonical_base_url", value: "https://nexu.studio", description: "Authoritative production domain URL." },
    { key: "seo.google_verification_code", value: "", description: "Google Search Console HTML meta tag verification code." },
    { key: "seo.bing_verification_code", value: "", description: "Bing Webmaster Tools msvalidate.01 verification code." },
    { key: "seo.merchant_center_account_id", value: "", description: "Google Merchant Center Account ID." },
    { key: "seo.merchant_center_feed_target_country", value: "IN", description: "Target country ISO code for Google Shopping." },
    { key: "seo.merchant_center_feed_currency", value: "INR", description: "Google Shopping feed currency." },
    { key: "seo.indexing_policy_out_of_stock", value: "INDEX_AS_OUT_OF_STOCK", description: "Whether out-of-stock items remain indexed with OutOfStock schema or get noindexed." }
  ];

  for (const s of defaultSettings) {
    try {
      await prisma.platformSetting.upsert({
        where: { key: s.key },
        create: { key: s.key, value: s.value, description: s.description, updatedBy: "SYSTEM_MIGRATION" },
        update: {},
      });
      console.log(`Seeded platform setting: ${s.key}`);
    } catch (e) {
      console.log(`Platform setting ${s.key}:`, e.message);
    }
  }

  console.log("=== SEO & Product Discovery Migrations Applied Successfully ===");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

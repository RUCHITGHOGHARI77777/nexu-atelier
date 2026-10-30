import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Applying Additive Migrations for Smart Listing & Category Attributes ===");

  // 1. Additive columns on Product
  const productCols = [
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "attributesJson" TEXT;`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "submittedForReviewAt" TIMESTAMP(3);`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewSlaMinutes" INTEGER DEFAULT 60;`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isReviewOverdue" BOOLEAN NOT NULL DEFAULT FALSE;`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewOverdueAt" TIMESTAMP(3);`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lastSlaReminderAt" TIMESTAMP(3);`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slaReminderCount" INTEGER NOT NULL DEFAULT 0;`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rejectedFieldsJson" TEXT;`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "suggestedCorrectionsJson" TEXT;`,
  ];
  for (const sql of productCols) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log("✓ Additive columns applied to Product");

  // 2. Create CategoryAttribute table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CategoryAttribute" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "dataType" TEXT NOT NULL,
      "isRequired" BOOLEAN NOT NULL DEFAULT FALSE,
      "allowedValuesJson" TEXT,
      "defaultUnit" TEXT,
      "allowedUnitsJson" TEXT,
      "validationRulesJson" TEXT,
      "isCustomerVisible" BOOLEAN NOT NULL DEFAULT TRUE,
      "isVariantAttribute" BOOLEAN NOT NULL DEFAULT FALSE,
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CategoryAttribute_categoryId_idx" ON "CategoryAttribute"("categoryId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "CategoryAttribute_categoryId_slug_key" ON "CategoryAttribute"("categoryId", "slug");
  `);
  console.log("✓ CategoryAttribute table and indexes created");

  // 3. Create SupplierDraft table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SupplierDraft" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sellerId" TEXT NOT NULL REFERENCES "Seller"("id") ON DELETE CASCADE,
      "productId" TEXT,
      "draftKey" TEXT NOT NULL,
      "title" TEXT,
      "categoryId" TEXT,
      "draftDataJson" TEXT NOT NULL,
      "version" INTEGER NOT NULL DEFAULT 1,
      "isSubmitted" BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "SupplierDraft_sellerId_draftKey_key" ON "SupplierDraft"("sellerId", "draftKey");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "SupplierDraft_sellerId_idx" ON "SupplierDraft"("sellerId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "SupplierDraft_productId_idx" ON "SupplierDraft"("productId");
  `);
  console.log("✓ SupplierDraft table and indexes created");

  // 4. Create ProductRevision table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProductRevision" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
      "revisionNumber" INTEGER NOT NULL,
      "snapshotJson" TEXT NOT NULL,
      "changedFieldsJson" TEXT,
      "adminFeedback" TEXT,
      "submittedBy" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProductRevision_productId_idx" ON "ProductRevision"("productId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProductRevision_productId_revisionNumber_idx" ON "ProductRevision"("productId", "revisionNumber");
  `);
  console.log("✓ ProductRevision table and indexes created");

  // 5. Default SLA Platform Settings
  const defaultSlaSettings = [
    { key: "sla_review_minutes", value: "60", description: "Target product review SLA turnaround in minutes" },
    { key: "sla_reminder_intervals", value: "[15, 30, 45]", description: "Review reminder intervals in minutes before SLA breach" },
    { key: "sla_business_hours_only", value: "false", description: "Whether review SLA applies only during business hours (9am-6pm IST)" },
    { key: "sla_escalation_email", value: "admin@nexu.studio", description: "Admin escalation recipient for SLA breach notifications" },
    { key: "sla_auto_approval_enabled", value: "false", description: "Strict policy: SLA expiration NEVER automatically approves products" },
  ];

  for (const s of defaultSlaSettings) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PlatformSetting" ("key", "value", "description", "updatedAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT ("key") DO NOTHING;
    `, s.key, s.value, s.description);
  }
  console.log("✓ Default Review SLA PlatformSettings verified");

  // 6. Seed Category Attributes for standard categories
  const categoryAttributes = [
    // Apparel
    {
      categoryId: "cat_apparel",
      name: "Fabric / Weave",
      slug: "fabric",
      dataType: "DROPDOWN",
      isRequired: true,
      allowedValuesJson: JSON.stringify(["Mulberry Silk", "Khadi Cotton", "Organic Linen", "Pashmina Wool", "Chanderi Silk", "Raw Tussar Silk", "Bamboo Cotton"]),
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: JSON.stringify({ minLength: 2, maxLength: 50 }),
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 1,
    },
    {
      categoryId: "cat_apparel",
      name: "Fit & Silhouette",
      slug: "fit",
      dataType: "DROPDOWN",
      isRequired: false,
      allowedValuesJson: JSON.stringify(["Tailored Classic", "Relaxed Drape", "Oversized Atelier", "Structured Slim", "Contemporary Regular"]),
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 2,
    },
    {
      categoryId: "cat_apparel",
      name: "Craft / Pattern Technique",
      slug: "craft_technique",
      dataType: "DROPDOWN",
      isRequired: false,
      allowedValuesJson: JSON.stringify(["Hand Block Print (Bagru/Sanganeri)", "Ikat Double Weave", "Ajrakh Natural Dye", "Zari Hand Embroidery", "Solid Pure Tone"]),
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 3,
    },
    {
      categoryId: "cat_apparel",
      name: "Care Instructions",
      slug: "care_type",
      dataType: "DROPDOWN",
      isRequired: true,
      allowedValuesJson: JSON.stringify(["Dry Clean Only", "Gentle Hand Wash Cold with Mild Silk Detergent", "Cool Machine Wash Inside Out"]),
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 4,
    },
    {
      categoryId: "cat_apparel",
      name: "Garment Length",
      slug: "garment_length",
      dataType: "MEASUREMENT",
      isRequired: false,
      allowedValuesJson: null,
      defaultUnit: "inch",
      allowedUnitsJson: JSON.stringify(["inch", "cm"]),
      validationRulesJson: JSON.stringify({ min: 10, max: 70 }),
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 5,
    },

    // Audio & Electronics
    {
      categoryId: "cat_audio",
      name: "Brand / Manufacturer",
      slug: "brand",
      dataType: "TEXT",
      isRequired: true,
      allowedValuesJson: null,
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: JSON.stringify({ minLength: 2, maxLength: 60 }),
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 1,
    },
    {
      categoryId: "cat_audio",
      name: "Model / Hardware Version",
      slug: "model_number",
      dataType: "TEXT",
      isRequired: true,
      allowedValuesJson: null,
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: JSON.stringify({ minLength: 2, maxLength: 50 }),
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 2,
    },
    {
      categoryId: "cat_audio",
      name: "Warranty Coverage",
      slug: "warranty_period",
      dataType: "MEASUREMENT",
      isRequired: true,
      allowedValuesJson: null,
      defaultUnit: "months",
      allowedUnitsJson: JSON.stringify(["months", "years"]),
      validationRulesJson: JSON.stringify({ min: 1, max: 60 }),
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 3,
    },
    {
      categoryId: "cat_audio",
      name: "Connectivity Modes",
      slug: "connectivity",
      dataType: "MULTI_SELECT",
      isRequired: true,
      allowedValuesJson: JSON.stringify(["Bluetooth 5.3", "USB-C Lossless Audio", "Wi-Fi AirPlay / Cast", "3.5mm Gold-Plated Aux", "Optical Toslink"]),
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 4,
    },
    {
      categoryId: "cat_audio",
      name: "Battery Capacity",
      slug: "battery_capacity",
      dataType: "MEASUREMENT",
      isRequired: false,
      allowedValuesJson: null,
      defaultUnit: "mAh",
      allowedUnitsJson: JSON.stringify(["mAh", "Wh"]),
      validationRulesJson: JSON.stringify({ min: 50, max: 50000 }),
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 5,
    },

    // Home Objects
    {
      categoryId: "cat_home",
      name: "Primary Raw Material",
      slug: "primary_material",
      dataType: "DROPDOWN",
      isRequired: true,
      allowedValuesJson: JSON.stringify(["Reclaimed Teak Wood", "Solid Cast Brass", "Bidri Alloy with Silver Inlay", "Hand-carved Makrana Marble", "Terracotta & Black Clay", "Mouth-blown Borosilicate Glass"]),
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 1,
    },
    {
      categoryId: "cat_home",
      name: "Net Weight",
      slug: "net_weight",
      dataType: "MEASUREMENT",
      isRequired: true,
      allowedValuesJson: null,
      defaultUnit: "g",
      allowedUnitsJson: JSON.stringify(["g", "kg"]),
      validationRulesJson: JSON.stringify({ min: 10, max: 50000 }),
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 2,
    },
    {
      categoryId: "cat_home",
      name: "Dimensions (L x W x H)",
      slug: "dimensions_lwh",
      dataType: "STRUCTURED_SPECS",
      isRequired: true,
      allowedValuesJson: null,
      defaultUnit: "cm",
      allowedUnitsJson: JSON.stringify(["cm", "inch"]),
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 3,
    },
    {
      categoryId: "cat_home",
      name: "Fragile Piece",
      slug: "is_fragile",
      dataType: "BOOLEAN",
      isRequired: true,
      allowedValuesJson: null,
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 4,
    },

    // Footwear & Leather
    {
      categoryId: "cat_footwear",
      name: "Leather / Upper Material",
      slug: "upper_material",
      dataType: "DROPDOWN",
      isRequired: true,
      allowedValuesJson: JSON.stringify(["Full-Grain Vegetable Tanned Vachetta", "Hand-burnished Calfskin", "Reversed Suede", "Vegan Bio-Microfiber"]),
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 1,
    },
    {
      categoryId: "cat_footwear",
      name: "Sole Construction",
      slug: "sole_construction",
      dataType: "DROPDOWN",
      isRequired: true,
      allowedValuesJson: JSON.stringify(["Goodyear Welted Leather Sole", "Blake Stitch Plantation Crepe", "Vibram Commando Lugged Rubber"]),
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 2,
    },
    {
      categoryId: "cat_footwear",
      name: "Water Resistant",
      slug: "water_resistant",
      dataType: "BOOLEAN",
      isRequired: false,
      allowedValuesJson: null,
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: null,
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 3,
    },

    // Modern Essentials
    {
      categoryId: "cat_essentials",
      name: "Material Composition",
      slug: "material_composition",
      dataType: "TEXT",
      isRequired: true,
      allowedValuesJson: null,
      defaultUnit: null,
      allowedUnitsJson: null,
      validationRulesJson: JSON.stringify({ minLength: 3, maxLength: 80 }),
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 1,
    },
    {
      categoryId: "cat_essentials",
      name: "Net Quantity / Pack Size",
      slug: "net_quantity",
      dataType: "MEASUREMENT",
      isRequired: true,
      allowedValuesJson: null,
      defaultUnit: "piece",
      allowedUnitsJson: JSON.stringify(["piece", "set", "pack", "g", "ml"]),
      validationRulesJson: JSON.stringify({ min: 1, max: 10000 }),
      isCustomerVisible: true,
      isVariantAttribute: false,
      displayOrder: 2,
    },
  ];

  for (const attr of categoryAttributes) {
    const id = `attr_${attr.categoryId}_${attr.slug}`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "CategoryAttribute" (
        "id", "categoryId", "name", "slug", "dataType", "isRequired",
        "allowedValuesJson", "defaultUnit", "allowedUnitsJson", "validationRulesJson",
        "isCustomerVisible", "isVariantAttribute", "displayOrder", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("categoryId", "slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "dataType" = EXCLUDED."dataType",
        "isRequired" = EXCLUDED."isRequired",
        "allowedValuesJson" = EXCLUDED."allowedValuesJson",
        "defaultUnit" = EXCLUDED."defaultUnit",
        "allowedUnitsJson" = EXCLUDED."allowedUnitsJson",
        "validationRulesJson" = EXCLUDED."validationRulesJson",
        "isCustomerVisible" = EXCLUDED."isCustomerVisible",
        "isVariantAttribute" = EXCLUDED."isVariantAttribute",
        "displayOrder" = EXCLUDED."displayOrder",
        "updatedAt" = CURRENT_TIMESTAMP;
    `,
      id,
      attr.categoryId,
      attr.name,
      attr.slug,
      attr.dataType,
      attr.isRequired,
      attr.allowedValuesJson,
      attr.defaultUnit,
      attr.allowedUnitsJson,
      attr.validationRulesJson,
      attr.isCustomerVisible,
      attr.isVariantAttribute,
      attr.displayOrder
    );
  }

  console.log(`✓ Seeded ${categoryAttributes.length} category attributes across categories`);
  await prisma.$disconnect();
  console.log("=== Additive Migrations Completed Successfully ===");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

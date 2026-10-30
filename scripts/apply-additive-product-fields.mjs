import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  console.log("Applying additive migration...");

  // 1. Add CHANGES_REQUESTED enum value
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "ProductApprovalStatus" ADD VALUE IF NOT EXISTS 'CHANGES_REQUESTED';`);
    console.log("✓ Added CHANGES_REQUESTED to ProductApprovalStatus enum");
  } catch (err) {
    console.log("Enum update notice:", err.message);
  }

  // 2. Add additive columns to Product
  const columns = [
    { name: "brand", type: "TEXT" },
    { name: "sku", type: "TEXT" },
    { name: "productType", type: "TEXT" },
    { name: "subcategory", type: "TEXT" },
    { name: "searchKeywords", type: "TEXT" },
    { name: "dispatchEstimate", type: "TEXT" },
    { name: "packageDimensions", type: "TEXT" },
    { name: "taxRatePercent", type: "DOUBLE PRECISION DEFAULT 12.0" },
  ];

  for (const col of columns) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};`);
      console.log(`✓ Added column Product.${col.name}`);
    } catch (err) {
      console.log(`Column ${col.name} notice:`, err.message);
    }
  }

  console.log("Additive migration completed safely.");
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

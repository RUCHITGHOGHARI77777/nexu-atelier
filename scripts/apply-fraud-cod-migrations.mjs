import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Applying Fraud Detection & COD Engine Migrations ===");

  // 1. Create Enums if they do not exist
  const createEnumIfMissing = async (enumName, values) => {
    try {
      const exists = await prisma.$queryRawUnsafe(`
        SELECT 1 FROM pg_type WHERE typname = '${enumName}';
      `);
      if (Array.isArray(exists) && exists.length > 0) {
        console.log(`Enum "${enumName}" already exists.`);
        return;
      }
      const valuesList = values.map(v => `'${v}'`).join(", ");
      await prisma.$executeRawUnsafe(`CREATE TYPE "${enumName}" AS ENUM (${valuesList});`);
      console.log(`Created enum "${enumName}".`);
    } catch (e) {
      console.log(`Note on enum "${enumName}":`, e.message);
    }
  };

  await createEnumIfMissing("RiskLevel", ["LOW", "MEDIUM", "HIGH"]);
  await createEnumIfMissing("RiskAction", [
    "ALLOW",
    "REQUIRE_OTP",
    "REQUIRE_ADDITIONAL_CONFIRMATION",
    "RESTRICT_COD",
    "MANUAL_REVIEW",
    "BLOCK",
  ]);
  await createEnumIfMissing("RiskReviewStatus", ["PENDING", "APPROVED", "REJECTED", "OVERRIDDEN"]);
  await createEnumIfMissing("CodCollectionStatus", ["PENDING", "COLLECTED", "REMITTED", "FAILED", "RTO"]);

  // 2. Add columns to CustomerProfile
  const addCol = async (table, col, def) => {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col}" ${def};`);
      console.log(`Added column "${col}" to "${table}".`);
    } catch (e) {
      console.log(`Column "${col}" on "${table}":`, e.message);
    }
  };

  await addCol("CustomerProfile", "isPhoneVerified", "BOOLEAN NOT NULL DEFAULT false");
  await addCol("CustomerProfile", "phoneVerifiedAt", "TIMESTAMP(3)");
  await addCol("CustomerProfile", "codRefusalCount", "INTEGER NOT NULL DEFAULT 0");
  await addCol("CustomerProfile", "rtoCount", "INTEGER NOT NULL DEFAULT 0");

  // 3. Add columns to PaymentRecord
  await addCol("PaymentRecord", "method", "TEXT");
  await addCol("PaymentRecord", "maskedDetails", "TEXT");
  await addCol("PaymentRecord", "isCod", "BOOLEAN NOT NULL DEFAULT false");
  await addCol("PaymentRecord", "codCollectionStatus", '"CodCollectionStatus"');
  await addCol("PaymentRecord", "codCollectedAt", "TIMESTAMP(3)");
  await addCol("PaymentRecord", "codRemittedAt", "TIMESTAMP(3)");
  await addCol("PaymentRecord", "courierRemittanceRef", "TEXT");

  // 4. Create OrderRiskAssessment table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrderRiskAssessment" (
        "id" TEXT PRIMARY KEY,
        "orderId" TEXT,
        "customerId" TEXT NOT NULL,
        "riskScore" INTEGER NOT NULL,
        "riskLevel" "RiskLevel" NOT NULL,
        "triggeredReasonsJson" TEXT NOT NULL,
        "recommendedAction" "RiskAction" NOT NULL,
        "reviewStatus" "RiskReviewStatus" NOT NULL DEFAULT 'PENDING',
        "reviewedByAdminId" TEXT,
        "overrideReason" TEXT,
        "isFalsePositive" BOOLEAN NOT NULL DEFAULT false,
        "signalsJson" TEXT,
        "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OrderRiskAssessment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log('Created table "OrderRiskAssessment".');

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrderRiskAssessment_customerId_idx" ON "OrderRiskAssessment"("customerId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrderRiskAssessment_riskLevel_idx" ON "OrderRiskAssessment"("riskLevel");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrderRiskAssessment_reviewStatus_idx" ON "OrderRiskAssessment"("reviewStatus");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrderRiskAssessment_assessedAt_idx" ON "OrderRiskAssessment"("assessedAt");`);
  } catch (e) {
    console.log('Error creating "OrderRiskAssessment":', e.message);
  }

  // 5. Add columns to Order
  await addCol("Order", "isCod", "BOOLEAN NOT NULL DEFAULT false");
  await addCol("Order", "codFeePaise", "INTEGER NOT NULL DEFAULT 0");
  await addCol("Order", "codCollectionStatus", '"CodCollectionStatus"');
  await addCol("Order", "riskScore", "INTEGER");
  await addCol("Order", "riskLevel", '"RiskLevel"');
  await addCol("Order", "riskAction", '"RiskAction"');
  await addCol("Order", "riskAssessmentId", "TEXT");

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Order" 
      ADD CONSTRAINT "Order_riskAssessmentId_fkey" 
      FOREIGN KEY ("riskAssessmentId") REFERENCES "OrderRiskAssessment"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    console.log("Added foreign key Order.riskAssessmentId.");
  } catch (e) {
    console.log("FK Order.riskAssessmentId note:", e.message);
  }

  // 6. Seed default PlatformSettings for Fraud & COD
  const defaultSettings = [
    { key: "fraud_high_risk_threshold", value: "70", description: "Score at or above which an order is classified as HIGH risk." },
    { key: "fraud_medium_risk_threshold", value: "35", description: "Score at or above which an order is classified as MEDIUM risk." },
    { key: "fraud_cod_enabled", value: "true", description: "Global master toggle for Cash on Delivery." },
    { key: "fraud_cod_min_value_paise", value: "50000", description: "Minimum order value in paise for COD eligibility (₹500)." },
    { key: "fraud_cod_max_value_paise", value: "1500000", description: "Maximum order value in paise for COD eligibility (₹15,000)." },
    { key: "fraud_cod_fee_paise", value: "5000", description: "Convenience fee in paise for Cash on Delivery (₹50)." },
    { key: "fraud_max_daily_orders", value: "5", description: "Maximum allowed orders per customer per 24 hours before triggering risk alert." },
    { key: "fraud_rto_threshold", value: "2", description: "Number of prior RTO/COD refusals before COD is automatically restricted." },
    { key: "fraud_restricted_pincodes", value: "[]", description: "JSON array of postal codes restricted from COD delivery." },
    { key: "fraud_require_otp_above_score", value: "35", description: "Risk score threshold requiring mobile OTP verification for COD." },
  ];

  for (const s of defaultSettings) {
    const existing = await prisma.platformSetting.findUnique({ where: { key: s.key } });
    if (!existing) {
      await prisma.platformSetting.create({
        data: {
          key: s.key,
          value: s.value,
          description: s.description,
          updatedBy: "SYSTEM_MIGRATION",
        },
      });
      console.log(`Seeded platform setting: ${s.key}`);
    }
  }

  console.log("=== Migrations Applied Successfully ===");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

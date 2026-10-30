import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function createSnapshot() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  await fs.mkdir(backupDir, { recursive: true });

  const tables = [
    "user",
    "seller",
    "category",
    "product",
    "productImage",
    "productVariant",
    "order",
    "orderItem",
    "auditEvent",
  ];

  const snapshot = {
    timestamp,
    counts: {},
    data: {},
  };

  for (const table of tables) {
    snapshot.counts[table] = await prisma[table].count();
    snapshot.data[table] = await prisma[table].findMany();
  }

  const filename = `db_snapshot_${timestamp}.json`;
  const filePath = path.join(backupDir, filename);
  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf8");

  console.log(`Successfully created database snapshot: ${filePath}`);
  console.log("Counts:", snapshot.counts);

  await prisma.$disconnect();
}

createSnapshot().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});

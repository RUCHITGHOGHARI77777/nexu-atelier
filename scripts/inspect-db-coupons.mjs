import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const coupons = await prisma.coupon.findMany();
  console.log("EXISTING COUPONS:", coupons);
  await prisma.$disconnect();
}

run().catch(console.error);


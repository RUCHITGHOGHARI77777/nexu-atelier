import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.category.findMany();
  const sellers = await prisma.seller.findMany({ select: { id: true, name: true, slug: true } });
  console.log("CATEGORIES:", categories);
  console.log("SELLERS:", sellers);
  await prisma.$disconnect();
}

run().catch(console.error);

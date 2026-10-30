import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
  const [users, sellers, categories, products, orders] = await Promise.all([
    prisma.user.count(),
    prisma.seller.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);
  console.log("UNTOUCHED DB COUNTS:", { users, sellers, categories, products, orders });
  await prisma.$disconnect();
}
run();

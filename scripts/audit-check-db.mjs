import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [users, sellers, products, orders, orderItems, shipments, payments, audits, categories, reviews] = await Promise.all([
    prisma.user.count(),
    prisma.seller.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.shipment.count(),
    prisma.paymentRecord.count(),
    prisma.auditEvent.count(),
    prisma.category.count(),
    prisma.productReview.count(),
  ]);

  console.log("DATABASE_RECORD_AUDIT:", JSON.stringify({
    users,
    sellers,
    products,
    categories,
    orders,
    orderItems,
    shipments,
    payments,
    audits,
    reviews,
  }, null, 2));

  // Check demo accounts specifically
  const demoEmails = [
    "patron@nexu.studio",
    "customer@nexu.studio",
    "solstice@nexu.studio",
    "kashmir@nexu.studio",
    "admin@nexu.studio",
    "controller@nexu.studio",
  ];

  const foundUsers = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: {
      id: true,
      email: true,
      role: true,
      isSuspended: true,
      seller: { select: { id: true, name: true, status: true } },
    },
  });

  console.log("DEMO_ACCOUNTS_AUDIT:", JSON.stringify(foundUsers, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

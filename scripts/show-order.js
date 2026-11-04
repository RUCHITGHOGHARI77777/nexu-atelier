const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: 'ORD-2026-B95164EE00C9' },
    include: {
      items: true,
      payments: true,
      customer: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: true
        }
      }
    }
  });
  console.log('--- BEGIN DB RECORD ---');
  console.log(JSON.stringify(order, null, 2));
  console.log('--- END DB RECORD ---');
}

main().finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== NEXU ATELIER: DATABASE AUDIT START ===');
  
  // Total Counts
  const totalOrders = await prisma.order.count();
  const totalOrderItems = await prisma.orderItem.count();
  const totalProducts = await prisma.product.count();
  const totalUsers = await prisma.user.count();
  const totalSellers = await prisma.seller.count();
  const totalShipments = await prisma.shipment.count();
  const totalPayments = await prisma.paymentRecord.count();
  const totalAuditEvents = await prisma.auditEvent.count();
  const totalNotifications = await prisma.notificationEvent.count();
  const totalCoupons = await prisma.coupon.count();
  const totalDisputes = await prisma.disputeCase.count();
  const totalRefunds = await prisma.refundRecord.count();
  const totalReviews = await prisma.productReview.count();

  console.log(`Summary Counts:
- Total Orders: ${totalOrders}
- Total Order Items: ${totalOrderItems}
- Total Products: ${totalProducts}
- Total Users: ${totalUsers}
- Total Sellers: ${totalSellers}
- Total Shipments: ${totalShipments}
- Total Payment Records: ${totalPayments}
- Total Audit Events: ${totalAuditEvents}
- Total Notification Events: ${totalNotifications}
- Total Coupons: ${totalCoupons}
- Total Disputes: ${totalDisputes}
- Total Refunds: ${totalRefunds}
- Total Reviews: ${totalReviews}
`);

  // Analyze Orders by Status
  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  console.log('Orders by Status:', ordersByStatus);

  // Analyze Orders by Payment Status
  const ordersByPaymentStatus = await prisma.order.groupBy({
    by: ['paymentStatus'],
    _count: { id: true },
  });
  console.log('Orders by Payment Status:', ordersByPaymentStatus);

  // Analyze COD vs Prepaid
  const ordersByCod = await prisma.order.groupBy({
    by: ['isCod'],
    _count: { id: true },
  });
  console.log('Orders by COD / Prepaid:', ordersByCod);

  // Analyze Order ID patterns to distinguish Test Data from Demo / Genuine Records
  const allOrders = await prisma.order.findMany({
    select: {
      id: true,
      createdAt: true,
      totalPaise: true,
      paymentStatus: true,
      status: true,
      isCod: true,
      customerEmail: true,
      customerName: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  let testCount = 0;
  let demoCount = 0;
  let seededCount = 0;
  let patronCount = 0;

  for (const o of allOrders) {
    const email = o.customerEmail || '';
    const id = o.id || '';
    if (
      email.includes('test') ||
      email.includes('example.com') ||
      id.includes('TEST') ||
      email.includes('attacker') ||
      email.includes('tamper')
    ) {
      testCount++;
    } else if (email.includes('demo') || email.includes('patron@nexu.studio')) {
      demoCount++;
    } else if (email.includes('seeded') || email.includes('curator')) {
      seededCount++;
    } else {
      patronCount++;
    }
  }

  console.log(`Order Classification:
- Automated Test Orders (Vitest / Security / Invariant tests): ${testCount}
- Verified Demo Orders (Manual browser & demo walkthroughs): ${demoCount}
- Seeded Baseline Orders (Initial marketplace seed): ${seededCount}
- Registered Patron Orders: ${patronCount}
- Total Checked: ${allOrders.length}
`);

  // Financial reconciliation check
  const aggregates = await prisma.order.aggregate({
    _sum: {
      subtotalPaise: true,
      estimatedTaxPaise: true,
      shippingFeePaise: true,
      discountPaise: true,
      totalPaise: true,
    },
    _avg: {
      totalPaise: true,
    },
  });
  console.log('Order Financial Aggregates (in paise):', aggregates);

  console.log('=== NEXU ATELIER: DATABASE AUDIT COMPLETE ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

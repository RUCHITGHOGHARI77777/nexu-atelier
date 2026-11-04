import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== DB AUDIT: ORDERS WITH COD & BUY NOW ===");
  const codOrders = await prisma.order.findMany({
    where: { isCod: true },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { items: true, payments: true },
  });
  console.log(`Total COD Orders found: ${codOrders.length}`);
  for (const o of codOrders) {
    console.log(`\nCOD Order ID: ${o.id}`);
    console.log(`  CreatedAt: ${o.createdAt.toISOString()}`);
    console.log(`  Total: ₹${o.totalPaise / 100} (${o.totalPaise} paise)`);
    console.log(`  Subtotal: ₹${o.subtotalPaise / 100} | Discount: ₹${o.discountPaise / 100} | GST: ₹${o.estimatedTaxPaise / 100}`);
    console.log(`  isCod: ${o.isCod} | paymentStatus: ${o.paymentStatus} | codCollectionStatus: ${o.codCollectionStatus}`);
    console.log(`  Payments (${o.payments.length}):`);
    for (const p of o.payments) {
      console.log(`    - ID: ${p.id} | Provider: ${p.provider} | Status: ${p.status} | TxRef: ${p.transactionRef} | isCod: ${p.isCod}`);
    }
  }

  console.log("\n=== DB AUDIT: TAX RECONCILIATION ORDER (DEMO20 COUPON) ===");
  const taxOrders = await prisma.order.findMany({
    where: { discountPaise: { gt: 0 } },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { items: true, payments: true },
  });
  for (const o of taxOrders) {
    console.log(`\nTax Order ID: ${o.id}`);
    console.log(`  Subtotal: ₹${o.subtotalPaise / 100} (${o.subtotalPaise} paise)`);
    console.log(`  Discount: ₹${o.discountPaise / 100} (${o.discountPaise} paise)`);
    console.log(`  GST (12%): ₹${o.estimatedTaxPaise / 100} (${o.estimatedTaxPaise} paise)`);
    console.log(`  Final Total: ₹${o.totalPaise / 100} (${o.totalPaise} paise)`);
    console.log(`  Payments:`, o.payments.map(p => ({ provider: p.provider, status: p.status, txRef: p.transactionRef, recon: p.reconciliationStatus })));
  }

  console.log("\n=== DB AUDIT: BUY NOW ORDER ===");
  const buyNowOrders = await prisma.order.findMany({
    where: {
      items: {
        some: { productSlug: "kinetic-heavyweight-450gsm-relaxed-hoodie" },
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { items: true, payments: true },
  });
  for (const o of buyNowOrders) {
    console.log(`\nBuy Now Order ID: ${o.id}`);
    console.log(`  Total: ₹${o.totalPaise / 100} (${o.totalPaise} paise)`);
    console.log(`  Items:`, o.items.map(it => ({ slug: it.productSlug, sku: it.selectedSku, size: it.selectedSize, pricePaise: it.pricePaise })));
    console.log(`  Payments:`, o.payments.map(p => ({ provider: p.provider, status: p.status, txRef: p.transactionRef, recon: p.reconciliationStatus })));
  }

  console.log("\n=== DB AUDIT: WHATSAPP AUTH USERS ===");
  const whatsappUsers = await prisma.user.findMany({
    where: {
      email: { contains: "nexu-auth.internal" },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { profile: true },
  });
  console.log(`Found ${whatsappUsers.length} WhatsApp authenticated patrons (nexu-auth.internal):`);
  for (const u of whatsappUsers) {
    console.log(`  User ID: ${u.id}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Profile Phone: ${u.profile?.phone}`);
    console.log(`  Display Name: ${u.profile?.displayName}`);
    console.log(`  Created: ${u.createdAt.toISOString()}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

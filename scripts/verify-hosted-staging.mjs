import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const HOSTED_URL = "https://trailing-ungreased-unhappily.ngrok-free.dev";
const COMMON_HEADERS = { "ngrok-skip-browser-warning": "1" };

function extractCookie(res) {
  const raw = res.headers.get("set-cookie") || "";
  const match = raw.match(/nexu_customer_session=([^;]+)/);
  return match ? `nexu_customer_session=${match[1]}` : "";
}

function extractToken(cookieStr) {
  const match = cookieStr.match(/nexu_customer_session=([^;]+)/);
  return match ? match[1] : "";
}

async function verifyHostedStaging() {
  console.log("=================================================================");
  console.log(`NEXU ATELIER — HOSTED STAGING VERIFICATION (${HOSTED_URL})`);
  console.log("=================================================================\n");

  const results = {};

  // 1. Homepage & Catalog
  console.log("1. Checking Homepage & Storefront...");
  const homeRes = await fetch(`${HOSTED_URL}/`, { headers: COMMON_HEADERS });
  const homeText = await homeRes.text();
  const homePass = homeRes.status === 200 && homeText.includes("NEXU ATELIER");
  console.log(`   Homepage: ${homePass ? "PASS (200 OK)" : `FAIL (${homeRes.status})`}`);
  results.homepage = homePass;

  const catalogRes = await fetch(`${HOSTED_URL}/api/products?limit=6`, { headers: COMMON_HEADERS });
  const catalogData = await catalogRes.json();
  const products = catalogData.products || [];
  const catalogPass = catalogRes.status === 200 && products.length > 0;
  console.log(`   Catalog API: ${catalogPass ? "PASS (200 OK)" : "FAIL"} (${products.length} products found)`);
  results.catalog = catalogPass;

  // 2. Customer Authentication on Staging
  console.log("\n2. Customer Authentication on Hosted Staging...");
  const custLoginRes = await fetch(`${HOSTED_URL}/api/auth/login`, {
    method: "POST",
    headers: { ...COMMON_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "patron@nexu.studio", password: "Password123!" }),
  });
  const custCookie = extractCookie(custLoginRes);
  const custToken = extractToken(custCookie);
  const custLoginPass = custLoginRes.status === 200 && Boolean(custCookie);
  console.log(`   Customer Login (patron@nexu.studio): ${custLoginPass ? "PASS (Session Cookie set)" : "FAIL"}`);
  results.customerLogin = custLoginPass;

  // 3. Staging Multi-Vendor Order Placement
  console.log("\n3. Placing Multi-Vendor Order on Staging...");
  const custUser = await prisma.user.findUnique({ where: { email: "patron@nexu.studio" } });
  const custAddress = await prisma.address.findFirst({ where: { customerId: custUser.id } });
  
  const productA = products[0];
  const allProductsRes = await fetch(`${HOSTED_URL}/api/products?limit=30`, { headers: COMMON_HEADERS });
  const allProductsData = await allProductsRes.json();
  const allProds = allProductsData.products || [];
  const productB = allProds.find(p => p.vendor?.id && p.vendor.id !== productA.vendor?.id) || products[1];
  const isMultiVendor = productA.vendor?.id !== productB.vendor?.id;

  const orderPayload = {
    items: [
      { productId: productA.id, quantity: 1 },
      { productId: productB.id, quantity: 1 },
    ],
    shippingAddressId: custAddress.id,
    deliveryMethodId: "express",
    paymentMethod: "DEMO_UPI",
    idempotencyKey: `hosted_staging_${Date.now()}`,
    paymentDetails: {
      isDemo: true,
      bankRef: `DEMO-HOSTED-UTR-${Date.now()}`,
    },
  };

  const orderRes = await fetch(`${HOSTED_URL}/api/orders`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      "Content-Type": "application/json",
      Authorization: `Bearer ${custToken}`,
      Cookie: custCookie,
    },
    body: JSON.stringify(orderPayload),
  });
  const orderData = await orderRes.json();
  const placedOrderId = orderData.order?.id;
  const orderPass = (orderRes.status === 200 || orderRes.status === 201) && Boolean(placedOrderId);
  console.log(`   Order Placement: ${orderPass ? "PASS (201 Created)" : "FAIL"} (ID: ${placedOrderId})`);
  results.orderPlacement = orderPass;

  // 4. Verify Database Persistence of Hosted Order
  if (placedOrderId) {
    const dbOrder = await prisma.order.findUnique({
      where: { id: placedOrderId },
      include: { items: true, shipments: true, payments: true },
    });
    const expectedShipments = isMultiVendor ? 2 : 1;
    const dbPersistPass = Boolean(dbOrder && dbOrder.items.length === 2 && dbOrder.shipments.length === expectedShipments);
    console.log(`   Database Order Persistence: ${dbPersistPass ? "PASS" : "FAIL"} (${dbOrder?.items.length} items, ${dbOrder?.shipments.length} shipments stored, expected: ${expectedShipments})`);
    results.dbPersistence = dbPersistPass;
  }

  // 5. Supplier Authentication & Isolated Order Line Fulfillment
  console.log("\n4. Supplier Login & Tenant-Isolated Fulfillment...");
  const sellerLoginRes = await fetch(`${HOSTED_URL}/api/auth/login`, {
    method: "POST",
    headers: { ...COMMON_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "solstice@nexu.studio", password: "Password123!" }),
  });
  const sellerCookie = extractCookie(sellerLoginRes);
  const sellerToken = extractToken(sellerCookie);
  const sellerLoginPass = sellerLoginRes.status === 200 && Boolean(sellerCookie);
  console.log(`   Supplier Login (solstice@nexu.studio): ${sellerLoginPass ? "PASS" : "FAIL"}`);
  results.supplierLogin = sellerLoginPass;

  const sellerOrdersRes = await fetch(`${HOSTED_URL}/api/seller/orders`, {
    headers: {
      ...COMMON_HEADERS,
      Authorization: `Bearer ${sellerToken}`,
      Cookie: sellerCookie,
    },
  });
  const sellerOrdersData = await sellerOrdersRes.json();
  const sellerOrderLines = sellerOrdersData.orderLines || [];
  console.log(`   Supplier Isolated Lines: ${sellerOrdersRes.status === 200 ? "PASS" : "FAIL"} (${sellerOrderLines.length} studio lines)`);
  results.supplierLines = sellerOrdersRes.status === 200;

  // 6. Admin Authentication & Platform Oversight
  console.log("\n5. Administrator Governance on Hosted Staging...");
  const adminLoginRes = await fetch(`${HOSTED_URL}/api/auth/login`, {
    method: "POST",
    headers: { ...COMMON_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@nexu.studio", password: "Password123!" }),
  });
  const adminCookie = extractCookie(adminLoginRes);
  const adminToken = extractToken(adminCookie);
  const adminLoginPass = adminLoginRes.status === 200 && Boolean(adminCookie);
  console.log(`   Admin Login (admin@nexu.studio): ${adminLoginPass ? "PASS" : "FAIL"}`);
  results.adminLogin = adminLoginPass;

  const adminOrdersRes = await fetch(`${HOSTED_URL}/api/admin/orders?limit=5`, {
    headers: {
      ...COMMON_HEADERS,
      Authorization: `Bearer ${adminToken}`,
      Cookie: adminCookie,
    },
  });
  const adminOrdersData = await adminOrdersRes.json();
  const adminOrdersPass = adminOrdersRes.status === 200 && Array.isArray(adminOrdersData.orders);
  console.log(`   Admin Orders Ledger: ${adminOrdersPass ? "PASS" : "FAIL"} (${adminOrdersData.orders?.length} orders reviewed)`);
  results.adminOrders = adminOrdersPass;

  // 7. Security Defenses on Hosted Staging
  console.log("\n6. Live Security Defenses on Hosted Staging...");
  const unauthRes = await fetch(`${HOSTED_URL}/api/account/profile`, {
    method: "PATCH",
    headers: { ...COMMON_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Tampered" }),
  });
  const unauthBlocked = unauthRes.status === 401;
  console.log(`   Unauthenticated access to /api/account/profile: ${unauthBlocked ? "BLOCKED (401)" : `VULNERABLE (${unauthRes.status})`}`);
  results.unauthBlocked = unauthBlocked;

  const privEscRes = await fetch(`${HOSTED_URL}/api/admin/sellers`, {
    headers: {
      ...COMMON_HEADERS,
      Authorization: `Bearer ${custToken}`,
      Cookie: custCookie,
    },
  });
  const privEscBlocked = privEscRes.status === 401 || privEscRes.status === 403;
  console.log(`   Customer privilege escalation to /api/admin/sellers: ${privEscBlocked ? "BLOCKED (401/403)" : `VULNERABLE (${privEscRes.status})`}`);
  results.privEscBlocked = privEscBlocked;

  console.log("\n=================================================================");
  console.log("HOSTED STAGING SUMMARY RESULTS:");
  console.log(JSON.stringify(results, null, 2));
  console.log("=================================================================");
}

verifyHostedStaging()
  .catch(err => {
    console.error("Hosted verification failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

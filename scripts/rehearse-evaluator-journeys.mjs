import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

function extractCookie(res) {
  const raw = res.headers.get("set-cookie") || "";
  const match = raw.match(/nexu_customer_session=([^;]+)/);
  return match ? `nexu_customer_session=${match[1]}` : "";
}

function extractToken(cookieStr) {
  const match = cookieStr.match(/nexu_customer_session=([^;]+)/);
  return match ? match[1] : "";
}

async function runRehearsal() {
  console.log("=================================================================");
  console.log("NEXU ATELIER — FULL EVALUATOR JOURNEY & SECURITY REHEARSAL");
  console.log("=================================================================\n");

  const results = {
    customerJourney: {},
    supplierJourney: {},
    adminJourney: {},
    securityDefenses: {},
  };

  // ----------------------------------------------------------------------
  // 1. CUSTOMER JOURNEY
  // ----------------------------------------------------------------------
  console.log("▶ 1. Rehearsing Customer Journey...");
  
  // 1.1 Customer Authentication
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "patron@nexu.studio", password: "Password123!" }),
  });
  const customerCookie = extractCookie(loginRes);
  const customerToken = extractToken(customerCookie);
  const loginData = await loginRes.json();
  console.log(`  [1.1] Customer Login: ${loginRes.status === 200 && customerCookie ? "PASS" : "FAIL"} (${loginData.user?.email || "No email"})`);
  results.customerJourney.login = loginRes.status === 200 && Boolean(customerCookie);

  // 1.2 Browse Catalog & Search
  const catalogRes = await fetch(`${BASE_URL}/api/products?limit=10&page=1`);
  const catalogData = await catalogRes.json();
  const products = catalogData.products || catalogData.items || [];
  console.log(`  [1.2] Catalog Browse: ${catalogRes.status === 200 && products.length > 0 ? "PASS" : "FAIL"} (${products.length} products returned)`);
  results.customerJourney.browse = catalogRes.status === 200 && products.length > 0;

  // Select two products from different sellers for multi-vendor checkout
  const productA = products[0];
  const productB = products.find((p) => (p.vendor?.id || p.vendorId) !== (productA.vendor?.id || productA.vendorId)) || products[1];

  console.log(`  Selected Product A: "${productA.title}" by ${productA.vendor?.name || productA.vendorName || "Studio A"}`);
  console.log(`  Selected Product B: "${productB.title}" by ${productB.vendor?.name || productB.vendorName || "Studio B"}`);

  // 1.3 Customer Address Lookup/Creation
  const customerUser = await prisma.user.findUnique({ where: { email: "patron@nexu.studio" } });
  let customerAddress = await prisma.address.findFirst({ where: { customerId: customerUser.id } });
  if (!customerAddress) {
    customerAddress = await prisma.address.create({
      data: {
        customerId: customerUser.id,
        fullName: "Ananya Sharma",
        phone: "+919820011223",
        street: "702 Sterling Seaface, Worli",
        apartment: "Penthouse B",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400018",
        type: "HOME",
        isDefault: true,
      },
    });
  }
  console.log(`  [1.3] Customer Address: PASS (ID: ${customerAddress.id}, City: ${customerAddress.city})`);

  // Record stock before order
  const initialStockA = (await prisma.product.findUnique({ where: { id: productA.id } })).stock;

  // 1.4 Place Multi-Vendor Order via Orders API
  const orderPayload = {
    items: [
      { productId: productA.id, quantity: 1, selectedSize: "M" },
      { productId: productB.id, quantity: 1 },
    ],
    shippingAddressId: customerAddress.id,
    deliveryMethodId: "express",
    paymentMethod: "DEMO_UPI",
    idempotencyKey: `rehearsal_${Date.now()}`,
    paymentDetails: {
      isDemo: true,
      bankRef: `DEMO-UTR-${Date.now()}`,
    },
  };

  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
      Cookie: customerCookie,
    },
    body: JSON.stringify(orderPayload),
  });
  const orderData = await orderRes.json();
  const placedOrderId = orderData.order?.id;
  const isOrderSuccess = (orderRes.status === 200 || orderRes.status === 201) && Boolean(placedOrderId);
  console.log(`  [1.4] Multi-Vendor Order Placement: ${isOrderSuccess ? "PASS" : "FAIL"} (Order: ${placedOrderId})`);
  results.customerJourney.checkout = isOrderSuccess;

  // 1.5 Database Verification of Order, Atomic Inventory & Discrete Items
  if (placedOrderId) {
    const dbOrder = await prisma.order.findUnique({
      where: { id: placedOrderId },
      include: { items: true, payments: true, shipments: true },
    });
    const postStockA = (await prisma.product.findUnique({ where: { id: productA.id } })).stock;
    const stockDecremented = postStockA === initialStockA - 1;
    console.log(`  [1.5] DB Verification:
        - Parent Order Status: ${dbOrder.status}
        - Total Paise: ${dbOrder.totalPaise} (₹${dbOrder.totalPaise / 100})
        - Line Items Count: ${dbOrder.items.length}
        - Shipments Created: ${dbOrder.shipments.length}
        - Inventory Decrement: ${stockDecremented ? "PASS" : "FAIL"} (${initialStockA} -> ${postStockA})`);
    results.customerJourney.dbOrderVerified = Boolean(dbOrder && stockDecremented);
  }

  // 1.6 Fetch Customer Orders History
  const historyRes = await fetch(`${BASE_URL}/api/orders`, {
    headers: {
      Authorization: `Bearer ${customerToken}`,
      Cookie: customerCookie,
    },
  });
  const historyData = await historyRes.json();
  const ordersList = historyData.orders || [];
  const hasInHistory = Array.isArray(ordersList) && ordersList.some((o) => o.id === placedOrderId);
  console.log(`  [1.6] Order History Retrieval: ${historyRes.status === 200 && hasInHistory ? "PASS" : "FAIL"} (${ordersList.length} total orders)`);
  results.customerJourney.orderHistory = historyRes.status === 200 && hasInHistory;

  // ----------------------------------------------------------------------
  // 2. SUPPLIER JOURNEY
  // ----------------------------------------------------------------------
  console.log("\n▶ 2. Rehearsing Supplier Journey...");

  // 2.1 Supplier Authentication
  const sellerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "solstice@nexu.studio", password: "Password123!" }),
  });
  const sellerCookie = extractCookie(sellerLoginRes);
  const sellerToken = extractToken(sellerCookie);
  const sellerLoginData = await sellerLoginRes.json();
  const sellerProfile = await prisma.seller.findFirst({ where: { userId: sellerLoginData.user?.id } });
  console.log(`  [2.1] Supplier Login: ${sellerLoginRes.status === 200 && sellerCookie ? "PASS" : "FAIL"} (${sellerProfile?.name})`);
  results.supplierJourney.login = sellerLoginRes.status === 200;

  // 2.2 Supplier Order Lines (Tenant Isolated)
  const sellerOrdersRes = await fetch(`${BASE_URL}/api/seller/orders`, {
    headers: {
      Authorization: `Bearer ${sellerToken}`,
      Cookie: sellerCookie,
    },
  });
  const sellerOrdersData = await sellerOrdersRes.json();
  const sellerOrderLines = sellerOrdersData.orderLines || [];
  console.log(`  [2.2] Supplier Order Lines: ${sellerOrdersRes.status === 200 ? "PASS" : "FAIL"} (${sellerOrderLines.length} lines assigned)`);
  results.supplierJourney.orderLines = sellerOrdersRes.status === 200;

  // 2.3 Supplier Fulfillment Transition (PACKED -> SHIPPED with Tracking)
  let fulfillmentUpdated = false;
  if (sellerOrderLines.length > 0) {
    const targetLine = sellerOrderLines.find((l) => l.fulfillmentStatus === "NEW" || l.fulfillmentStatus === "PACKED") || sellerOrderLines[0];
    
    // If NEW, first transition to PACKED
    if (targetLine.fulfillmentStatus === "NEW") {
      await fetch(`${BASE_URL}/api/seller/orders/${targetLine.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
          Cookie: sellerCookie,
        },
        body: JSON.stringify({ status: "PACKED" }),
      });
    }

    // Now transition PACKED -> SHIPPED
    const updateRes = await fetch(`${BASE_URL}/api/seller/orders/${targetLine.id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerToken}`,
        Cookie: sellerCookie,
      },
      body: JSON.stringify({
        status: "SHIPPED",
        courierName: "Blue Dart Air Express",
        trackingNumber: `BD-TEST-${Date.now()}`,
      }),
    });
    const updateData = await updateRes.json();
    fulfillmentUpdated = updateRes.status === 200 && Boolean(updateData.orderLine);
    console.log(`  [2.3] Fulfillment Update (SHIPPED): ${fulfillmentUpdated ? "PASS" : "FAIL"} (Item: ${targetLine.id}, Final Status: ${updateData.orderLine?.fulfillmentStatus})`);
  }
  results.supplierJourney.fulfillmentUpdate = fulfillmentUpdated;

  // 2.4 Supplier Payouts & Settlement Visibility
  const payoutsRes = await fetch(`${BASE_URL}/api/seller/payouts`, {
    headers: {
      Authorization: `Bearer ${sellerToken}`,
      Cookie: sellerCookie,
    },
  });
  console.log(`  [2.4] Supplier Payouts: ${payoutsRes.status === 200 ? "PASS" : "FAIL"} (Payouts ledger accessible)`);
  results.supplierJourney.payouts = payoutsRes.status === 200;

  // ----------------------------------------------------------------------
  // 3. ADMIN JOURNEY
  // ----------------------------------------------------------------------
  console.log("\n▶ 3. Rehearsing Admin Journey...");

  // 3.1 Admin Authentication
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@nexu.studio", password: "Password123!" }),
  });
  const adminCookie = extractCookie(adminLoginRes);
  const adminToken = extractToken(adminCookie);
  const adminLoginData = await adminLoginRes.json();
  console.log(`  [3.1] Admin Login: ${adminLoginRes.status === 200 && adminCookie ? "PASS" : "FAIL"} (${adminLoginData.user?.role})`);
  results.adminJourney.login = adminLoginRes.status === 200;

  // 3.2 Admin Platform Orders
  const adminOrdersRes = await fetch(`${BASE_URL}/api/admin/orders?limit=10`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Cookie: adminCookie,
    },
  });
  const adminOrdersData = await adminOrdersRes.json();
  console.log(`  [3.2] Admin Orders Oversight: ${adminOrdersRes.status === 200 ? "PASS" : "FAIL"} (${adminOrdersData.orders?.length || 0} orders fetched)`);
  results.adminJourney.orders = adminOrdersRes.status === 200;

  // 3.3 Admin Sellers List & Moderation
  const adminSellersRes = await fetch(`${BASE_URL}/api/admin/sellers`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Cookie: adminCookie,
    },
  });
  const adminSellersData = await adminSellersRes.json();
  console.log(`  [3.3] Admin Sellers Governance: ${adminSellersRes.status === 200 ? "PASS" : "FAIL"} (${adminSellersData.sellers?.length || 0} sellers registered)`);
  results.adminJourney.sellers = adminSellersRes.status === 200;

  // 3.4 Admin Finances & GST Ledger
  const adminFinancesRes = await fetch(`${BASE_URL}/api/admin/finances`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Cookie: adminCookie,
    },
  });
  const adminFinancesData = await adminFinancesRes.json();
  console.log(`  [3.4] Admin Financials / GST Report: ${adminFinancesRes.status === 200 ? "PASS" : "FAIL"} (GMV: ₹${(adminFinancesData.summary?.grossVolumePaise || 0) / 100})`);
  results.adminJourney.finances = adminFinancesRes.status === 200;

  // ----------------------------------------------------------------------
  // 4. SECURITY & FAILURE SCENARIOS (SECTION 4 AUDIT)
  // ----------------------------------------------------------------------
  console.log("\n▶ 4. Testing Security Defense & Negative Scenarios...");

  // 4.1 Unauthenticated Customer accessing protected /api/account/profile
  const unauthOrdersRes = await fetch(`${BASE_URL}/api/account/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Tampered Name" }),
  });
  console.log(`  [4.1] Unauthenticated access to /api/account/profile: ${unauthOrdersRes.status === 401 ? "BLOCKED (401)" : `VULNERABLE (${unauthOrdersRes.status})`}`);
  results.securityDefenses.unauthProtectedBlocked = unauthOrdersRes.status === 401;

  // 4.2 Customer attempting to access Admin endpoint /api/admin/sellers
  const privEscRes = await fetch(`${BASE_URL}/api/admin/sellers`, {
    headers: {
      Authorization: `Bearer ${customerToken}`,
      Cookie: customerCookie,
    },
  });
  console.log(`  [4.2] Customer privilege escalation to /api/admin/sellers: ${privEscRes.status === 401 || privEscRes.status === 403 ? "BLOCKED (401/403)" : `VULNERABLE (${privEscRes.status})`}`);
  results.securityDefenses.privilegeEscalationBlocked = privEscRes.status === 401 || privEscRes.status === 403;

  // 4.3 Forged Payment Success without valid signature / authorization
  const forgedPaymentRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      orderId: placedOrderId,
      razorpayPaymentId: "pay_fake_forged_12345",
      razorpaySignature: "invalid_hmac_signature_tampered",
    }),
  });
  console.log(`  [4.3] Forged Payment Verification: ${forgedPaymentRes.status === 400 || forgedPaymentRes.status === 403 ? "REJECTED (400/403)" : `VULNERABLE (${forgedPaymentRes.status})`}`);
  results.securityDefenses.forgedPaymentRejected = forgedPaymentRes.status === 400 || forgedPaymentRes.status === 403;

  // 4.4 Out of Stock product rejection
  // Create a 0-stock dummy product to test inventory rejection
  const zeroStockProd = await prisma.product.create({
    data: {
      vendorId: sellerProfile.id,
      title: `Zero Stock Item ${Date.now()}`,
      subtitle: "Out of Stock Testing Artifact",
      slug: `zero-stock-${Date.now()}`,
      description: "Testing out of stock guard",
      basePricePaise: 100000,
      stock: 0,
      isPublished: true,
      categoryId: productA.categoryId || (await prisma.category.findFirst()).id,
    },
  });
  const zeroStockOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      items: [{ productId: zeroStockProd.id, quantity: 1 }],
      shippingAddressId: customerAddress.id,
      deliveryMethodId: "standard",
      paymentMethod: "DEMO_UPI",
    }),
  });
  const zeroStockData = await zeroStockOrderRes.json();
  const zeroStockRejected = zeroStockOrderRes.status === 400 && String(zeroStockData.error).toLowerCase().includes("stock");
  console.log(`  [4.4] Zero-Stock Order Rejection: ${zeroStockRejected ? "PASS (400 Out of Stock)" : `FAIL (${zeroStockOrderRes.status}: ${zeroStockData.error})`}`);
  results.securityDefenses.outOfStockRejected = zeroStockRejected;
  await prisma.product.delete({ where: { id: zeroStockProd.id } });

  console.log("\n=================================================================");
  console.log("REHEARSAL SUMMARY RESULTS:");
  console.log(JSON.stringify(results, null, 2));
  console.log("=================================================================");
}

runRehearsal()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

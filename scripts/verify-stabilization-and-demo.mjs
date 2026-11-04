import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const EDGE_CANARY_PATH = "C:\\Users\\Ruchit\\AppData\\Local\\Microsoft\\Edge SxS\\Application\\msedge.exe";

function getBrowserPath() {
  if (fs.existsSync(EDGE_CANARY_PATH)) return EDGE_CANARY_PATH;
  if (fs.existsSync(EDGE_PATH)) return EDGE_PATH;
  throw new Error("No compatible Edge/Chromium browser found.");
}

const BASE_URL = "http://localhost:3000";
const LOCAL_SCREENSHOTS = path.resolve(process.cwd(), "screenshots/stabilization");
const ARTIFACT_SCREENSHOTS = path.resolve(
  "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\98ffb342-e10e-4d49-a618-3e54cf244ed6\\screenshots/stabilization"
);

for (const dir of [LOCAL_SCREENSHOTS, ARTIFACT_SCREENSHOTS]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function takeScreenshot(page, filename) {
  const localFile = path.join(LOCAL_SCREENSHOTS, filename);
  const artifactFile = path.join(ARTIFACT_SCREENSHOTS, filename);
  await page.screenshot({ path: localFile, fullPage: false });
  fs.copyFileSync(localFile, artifactFile);
  console.log(`📸 Saved screenshot: ${filename}`);
}

async function gotoPage(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));
}

async function advanceCheckoutToStep3(page) {
  // If demo address button is available, click it
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const demoAddrBtn = btns.find((b) => b.innerText.includes("Fill Demo Address"));
    if (demoAddrBtn) demoAddrBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Step 1: Address -> Courier
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const continueBtn = btns.find((b) => b.innerText.includes("Proceed to Courier Method"));
    if (continueBtn) continueBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Step 2: Courier -> Review & Payment
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const reviewBtn = btns.find((b) => b.innerText.includes("Review Final Order"));
    if (reviewBtn) reviewBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
}

async function completeOnlinePayment(page) {
  // Click Authorize & Pay to open gateway modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const payBtn = btns.find((b) => b.innerText.includes("Authorize & Pay"));
    if (payBtn) payBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Click start payment simulation
  await page.waitForSelector("#demo-start-upi-payment", { timeout: 10000 });
  await page.click("#demo-start-upi-payment");
  await new Promise((r) => setTimeout(r, 600));

  // Click fast skip to instantly finish
  await page.waitForSelector("#demo-fast-skip-btn", { timeout: 10000 });
  await page.click("#demo-fast-skip-btn");

  // Wait for confirmation redirect
  await page.waitForFunction(() => window.location.pathname.includes("/checkout/confirmation"), {
    timeout: 20000,
  });
}

const testResults = [];
function recordResult(testName, passed, details) {
  testResults.push({ testName, passed, details });
  const mark = passed ? "[✓ PASS]" : "[✗ FAIL]";
  console.log(`${mark} ${testName} — ${details}`);
}

async function runStabilizationVerification() {
  console.log("================================================================================");
  console.log("NEXU ATELIER — FINAL STABILIZATION & REAL DEMO VALIDATION SUITE");
  console.log("================================================================================");

  const initialOrderCount = await prisma.order.count();
  console.log(`📊 Initial PostgreSQL Order Count: ${initialOrderCount}\n`);

  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: TAX RECONCILIATION ORDER (Subtotal ₹3,490 - Discount ₹698 = ₹2,792)
    // -------------------------------------------------------------------------
    console.log("▶ TEST 1: Tax Reconciliation Verification...");
    await gotoPage(page, `${BASE_URL}/product/chanderi-silk-embroidered-anarkali-robe`);

    // Select Size L
    await page.evaluate(() => {
      const sizeButtons = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText.trim() === "M" || b.innerText.trim() === "L" || b.innerText.trim() === "Free Size"
      );
      if (sizeButtons.length > 0) sizeButtons[0].click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Click Add to Bag
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const addBtn = buttons.find((b) => b.innerText.includes("Add to Bag"));
      if (addBtn) addBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Navigate to /cart
    await gotoPage(page, `${BASE_URL}/cart`);
    await takeScreenshot(page, "tax_01_cart_before_coupon.png");

    // Apply Coupon DEMO20 using verified typing selector
    await page.waitForSelector("#cart-coupon-input", { timeout: 10000 });
    await page.focus("#cart-coupon-input");
    await page.type("#cart-coupon-input", "DEMO20", { delay: 40 });
    await page.evaluate(() => {
      const form = document.querySelector("#cart-coupon-input")?.closest("form");
      if (form) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.click();
      }
    });
    await new Promise((r) => setTimeout(r, 1200));
    await takeScreenshot(page, "tax_02_cart_coupon_applied.png");

    // Proceed to /checkout
    await gotoPage(page, `${BASE_URL}/checkout`);
    await page.waitForSelector("form", { timeout: 10000 });
    await takeScreenshot(page, "tax_03_checkout_step1.png");

    await advanceCheckoutToStep3(page);
    await takeScreenshot(page, "tax_04_checkout_step3.png");

    await completeOnlinePayment(page);
    const taxOrderUrl = page.url();
    const taxOrderIdMatch = taxOrderUrl.match(/orderId=([^&]+)/);
    const taxOrderId = taxOrderIdMatch ? taxOrderIdMatch[1] : null;
    await takeScreenshot(page, "tax_05_confirmation.png");

    // Query DB for Tax Order
    const dbTaxOrder = await prisma.order.findUnique({
      where: { id: taxOrderId },
      include: { payments: true },
    });

    // Reconcile Indian GST Mathematics:
    // Subtotal: 349000 paise (₹3,490.00)
    // Discount: 69800 paise (₹698.00)
    // Net Payable: 279200 paise (₹2,792.00)
    // Inclusive 12% GST = Math.round((279200 * 12) / 112) = 29914 paise (₹299.14)
    // Taxable Supply Value = 279200 - 29914 = 249286 paise (₹2,492.86)
    // CGST (6%) = 14957 paise (₹149.57), SGST (6%) = 14957 paise (₹149.57)
    // Sum = 249286 + 29914 = 279200 paise (Exact single paisa reconciliation)
    const expectedTaxPaise = Math.round((279200 * 12) / 112);
    const taxReconciled =
      dbTaxOrder &&
      dbTaxOrder.totalPaise === 279200 &&
      dbTaxOrder.discountPaise === 69800 &&
      dbTaxOrder.subtotalPaise === 349000 &&
      dbTaxOrder.estimatedTaxPaise === expectedTaxPaise;

    recordResult(
      "Tax Reconciliation Audit",
      Boolean(taxReconciled),
      `Subtotal: ₹${dbTaxOrder?.subtotalPaise / 100}, Discount: ₹${dbTaxOrder?.discountPaise / 100}, Payable: ₹${dbTaxOrder?.totalPaise / 100}, GST (12% incl): ₹${dbTaxOrder?.estimatedTaxPaise / 100} (Exact ₹299.14)`
    );

    // -------------------------------------------------------------------------
    // TEST 2: BUY NOW WITH SEPARATE ORDER & UNCHANGED ORDINARY BAG
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 2: Buy Now Complete Journey & Bag Preservation...");

    // First, place an item in the regular bag: Monolith Kolhapuri Sandal
    await gotoPage(page, `${BASE_URL}/product/monolith-artisan-heritage-kolhapuri-sandal`);
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll("button")).some((b) => b.innerText.includes("UK 8")),
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const sizeButtons = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText.includes("UK 8") || b.innerText.includes("UK 9")
      );
      if (sizeButtons.length > 0) sizeButtons[0].click();
    });
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const addBtn = btns.find((b) => b.innerText.includes("Add to Bag"));
      if (addBtn) addBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Verify item in regular bag
    await gotoPage(page, `${BASE_URL}/cart`);
    await page.waitForFunction(
      () => document.body.innerText.includes("Shopping Bag") && !document.body.innerText.includes("empty"),
      { timeout: 10000 }
    );
    const cartHasKolhapuriBefore = await page.evaluate(() =>
      document.body.innerText.includes("Kolhapuri") || document.body.innerText.includes("Monolith")
    );
    recordResult("Regular Bag Populated", Boolean(cartHasKolhapuriBefore), "Monolith Kolhapuri Sandal saved in main Bag");
    await takeScreenshot(page, "buynow_01_ordinary_cart_before.png");

    // Now go to a DIFFERENT product for Instant Buy Now: Kinetic Heavyweight Hoodie
    await gotoPage(page, `${BASE_URL}/product/kinetic-heavyweight-450gsm-relaxed-hoodie`);
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll("button")).some((b) => b.innerText.trim() === "M"),
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const sizeM = btns.find((b) => b.innerText.trim() === "M" || b.innerText.trim() === "L");
      if (sizeM) sizeM.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Click Buy Now
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const buyNowBtn = btns.find((b) => b.innerText.includes("Buy Now"));
      if (buyNowBtn) buyNowBtn.click();
    });
    await page.waitForFunction(() => window.location.pathname.includes("/checkout"), { timeout: 15000 });
    await takeScreenshot(page, "buynow_02_direct_checkout_loaded.png");

    const isDirectBuyUrl = page.url().includes("direct=1");
    const checkoutShowsHoodieOnly = await page.evaluate(
      () =>
        document.body.innerText.includes("Kinetic Heavyweight") &&
        !document.body.innerText.includes("Kolhapuri")
    );
    recordResult(
      "Buy Now Direct Routing",
      Boolean(isDirectBuyUrl && checkoutShowsHoodieOnly),
      "Checkout isolated strictly to Buy Now piece without mixing ordinary cart"
    );

    // Complete Buy Now Checkout
    await advanceCheckoutToStep3(page);
    await completeOnlinePayment(page);
    const buyNowOrderUrl = page.url();
    const buyNowOrderIdMatch = buyNowOrderUrl.match(/orderId=([^&]+)/);
    const buyNowOrderId = buyNowOrderIdMatch ? buyNowOrderIdMatch[1] : null;
    await takeScreenshot(page, "buynow_03_confirmation.png");

    // Verify DB record for Buy Now order
    const dbBuyNowOrder = await prisma.order.findUnique({
      where: { id: buyNowOrderId },
      include: { items: true, payments: true },
    });
    const buyNowOrderValid =
      dbBuyNowOrder &&
      dbBuyNowOrder.items.length === 1 &&
      dbBuyNowOrder.items[0].productSlug === "kinetic-heavyweight-450gsm-relaxed-hoodie" &&
      (dbBuyNowOrder.items[0].selectedSize === "M" || dbBuyNowOrder.items[0].selectedSize === "L") &&
      (dbBuyNowOrder.totalPaise === 249000 || dbBuyNowOrder.totalPaise === 264000);

    recordResult(
      "Buy Now Database Order",
      Boolean(buyNowOrderValid),
      `Order: ${dbBuyNowOrder?.id} | SKU: ${dbBuyNowOrder?.items[0]?.selectedSku} | Total: ₹${dbBuyNowOrder?.totalPaise / 100}`
    );

    // CRUCIAL: Verify ordinary cart still has Monolith Kolhapuri Sandal!
    await gotoPage(page, `${BASE_URL}/cart`);
    await takeScreenshot(page, "buynow_04_ordinary_cart_after.png");
    const cartHasKolhapuriAfter = await page.evaluate(() =>
      document.body.innerText.includes("Kolhapuri") || document.body.innerText.includes("Monolith")
    );
    recordResult(
      "Ordinary Bag Preserved Post-Buy Now",
      cartHasKolhapuriAfter,
      "Original shopping bag items remained intact after completing separate Buy Now order"
    );

    // -------------------------------------------------------------------------
    // TEST 3: CASH ON DELIVERY (COD) JOURNEY
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 3: Cash on Delivery (COD) Journey...");

    // Proceed with the Kolhapuri Sandal from cart to checkout
    await gotoPage(page, `${BASE_URL}/checkout`);
    await page.waitForSelector("form", { timeout: 10000 });

    await advanceCheckoutToStep3(page);

    // Step 3: Select COD Payment Method Tab
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll("button")).some((b) => b.innerText.includes("Pay on Delivery") || b.innerText.includes("COD")),
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll("button"));
      const codTab = tabs.find((b) => b.innerText.includes("Pay on Delivery") || b.innerText.includes("COD"));
      if (codTab) codTab.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await takeScreenshot(page, "cod_01_method_selected.png");

    // Click Confirm Cash on Delivery
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll("button")).some((b) => b.innerText.includes("Confirm Cash on Delivery")),
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const confirmCodBtn = btns.find((b) => b.innerText.includes("Confirm Cash on Delivery"));
      if (confirmCodBtn) confirmCodBtn.click();
    });

    // Wait for confirmation redirect
    await page.waitForFunction(() => window.location.pathname.includes("/checkout/confirmation"), {
      timeout: 20000,
    });
    const codOrderUrl = page.url();
    const codOrderIdMatch = codOrderUrl.match(/orderId=([^&]+)/);
    const codOrderId = codOrderIdMatch ? codOrderIdMatch[1] : null;
    await takeScreenshot(page, "cod_02_confirmation.png");

    // Verify DB record for COD order
    const dbCodOrder = await prisma.order.findUnique({
      where: { id: codOrderId },
      include: { items: true, payments: true },
    });

    const codValidInDb =
      dbCodOrder &&
      dbCodOrder.isCod === true &&
      dbCodOrder.paymentStatus === "ESCROW_HOLD" &&
      dbCodOrder.codCollectionStatus === "PENDING" &&
      dbCodOrder.payments[0]?.provider === "ESCROW_INTERNAL" &&
      dbCodOrder.payments[0]?.status === "ESCROW_HOLD" &&
      dbCodOrder.payments[0]?.isCod === true;

    recordResult(
      "Cash on Delivery DB Record",
      Boolean(codValidInDb),
      `Order: ${dbCodOrder?.id} | isCod: ${dbCodOrder?.isCod} | paymentStatus: ${dbCodOrder?.paymentStatus} | codStatus: ${dbCodOrder?.codCollectionStatus}`
    );

    // Verify in customer order archive
    await gotoPage(page, `${BASE_URL}/account/orders`);
    await page.waitForFunction(
      () =>
        document.body.innerText.includes("My Studio Orders") &&
        !document.body.innerText.includes("Loading order history..."),
      { timeout: 10000 }
    );
    const codInArchive = await page.evaluate(
      (orderId) => document.body.innerText.includes(orderId),
      codOrderId
    );
    await takeScreenshot(page, "cod_03_account_orders.png");
    recordResult(
      "COD Visible in Customer Orders",
      codInArchive,
      `Order ${codOrderId} visible in /account/orders with Confirmed badge`
    );

    // Inspect COD Order Detail Page
    await gotoPage(page, `${BASE_URL}/account/orders/${codOrderId}`);
    await page.waitForFunction(() => document.body.innerText.includes("Order Details"), { timeout: 10000 });
    const codDetailShowsMethod = await page.evaluate(() =>
      document.body.innerText.includes("Cash on Delivery") &&
      document.body.innerText.includes("PENDING COLLECTION")
    );
    await takeScreenshot(page, "cod_04_order_detail.png");
    recordResult(
      "COD Order Detail & Truth",
      codDetailShowsMethod,
      "Order details accurately display 'Cash on Delivery (Doorstep)' and 'PENDING COLLECTION'"
    );

    // -------------------------------------------------------------------------
    // TEST 4: PAYMENT TRUTH AUDIT
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 4: Payment Truth & Gateway Distinctions...");
    const demoPayment = dbTaxOrder?.payments[0];
    let demoMeta = {};
    try {
      demoMeta = JSON.parse(demoPayment?.rawGatewayResponse || "{}");
    } catch {}

    const demoPaymentTruthValid =
      demoPayment &&
      demoPayment.transactionRef.includes("SANDBOX") &&
      demoPayment.reconciliationStatus === "DEMO_EXCLUDED" &&
      demoMeta.isSandbox === true &&
      demoMeta.isProduction === false;

    recordResult(
      "Payment Truth — Sandbox Isolation",
      Boolean(demoPaymentTruthValid),
      `Transaction Ref: ${demoPayment?.transactionRef} | isSandbox: ${demoMeta.isSandbox} | Excluded from bank recon: ${demoPayment?.reconciliationStatus}`
    );

    const codPayment = dbCodOrder?.payments[0];
    const codPaymentTruthValid =
      codPayment &&
      codPayment.isCod === true &&
      codPayment.provider === "ESCROW_INTERNAL" &&
      codPayment.status === "ESCROW_HOLD";

    recordResult(
      "Payment Truth — COD Escrow Isolation",
      Boolean(codPaymentTruthValid),
      `Provider: ${codPayment?.provider} | status: ${codPayment?.status} | isCod: ${codPayment?.isCod}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: REAL FUNCTIONAL VERIFICATION (Edge Cases)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 5: Real Functional Verification (Edge Cases)...");

    // Add item to test cart operations
    await gotoPage(page, `${BASE_URL}/product/chanderi-silk-embroidered-anarkali-robe`);
    await page.evaluate(() => {
      const sizeButtons = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText.trim() === "M" || b.innerText.trim() === "L"
      );
      if (sizeButtons.length > 0) sizeButtons[0].click();
    });
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const addBtn = btns.find((b) => b.innerText.includes("Add to Bag"));
      if (addBtn) addBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Test Invalid Coupon Code Check
    await gotoPage(page, `${BASE_URL}/cart`);
    await page.waitForSelector("#cart-coupon-input", { timeout: 10000 });
    await page.focus("#cart-coupon-input");
    await page.type("#cart-coupon-input", "INVALID999_CODE", { delay: 40 });
    await page.evaluate(() => {
      const form = document.querySelector("#cart-coupon-input")?.closest("form");
      if (form) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.click();
      }
    });
    await new Promise((r) => setTimeout(r, 1000));

    const invalidCouponHandled = await page.evaluate(
      () =>
        document.body.innerText.includes("Invalid") ||
        document.body.innerText.includes("ineligible") ||
        document.body.innerText.includes("Ineligible")
    );
    recordResult("Invalid Coupon Rejection", invalidCouponHandled, "Entering INVALID999_CODE returned clear error message");

    // Quantity Increment and Subtotal update
    const initialPriceText = await page.evaluate(() => {
      const el = document.querySelector(".font-mono.text-lg.font-black");
      return el ? el.innerText : "";
    });

    await page.evaluate(() => {
      const plusBtns = Array.from(document.querySelectorAll("button")).filter((b) => b.innerText.trim() === "+");
      if (plusBtns[0]) plusBtns[0].click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const updatedPriceText = await page.evaluate(() => {
      const el = document.querySelector(".font-mono.text-lg.font-black");
      return el ? el.innerText : "";
    });
    const quantityUpdated = initialPriceText !== updatedPriceText;
    recordResult("Quantity Adjustment", quantityUpdated, `Subtotal dynamically recalculated (${initialPriceText} -> ${updatedPriceText})`);

    // Item Removal
    await page.evaluate(() => {
      const trashBtns = Array.from(document.querySelectorAll("button")).filter((b) => b.title === "Remove item");
      if (trashBtns[0]) trashBtns[0].click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------------------
    // TEST 6: VISUAL AUDIT & MOBILE RESPONSIVENESS
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 6: Visual Audit & Responsive Viewports...");

    // Desktop Viewport
    await page.setViewport({ width: 1440, height: 900 });
    await gotoPage(page, `${BASE_URL}/`);
    await takeScreenshot(page, "visual_desktop_01_homepage.png");

    await gotoPage(page, `${BASE_URL}/shop`);
    await takeScreenshot(page, "visual_desktop_02_catalog.png");

    await gotoPage(page, `${BASE_URL}/guilds`);
    await takeScreenshot(page, "visual_desktop_03_guilds.png");

    await gotoPage(page, `${BASE_URL}/search?q=silk`);
    await takeScreenshot(page, "visual_desktop_04_search.png");

    // Mobile Viewport (iPhone 14 / modern Android: 390 x 844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await gotoPage(page, `${BASE_URL}/`);
    await takeScreenshot(page, "visual_mobile_01_homepage.png");

    await gotoPage(page, `${BASE_URL}/shop`);
    await takeScreenshot(page, "visual_mobile_02_catalog.png");

    await gotoPage(page, `${BASE_URL}/product/chanderi-silk-embroidered-anarkali-robe`);
    await takeScreenshot(page, "visual_mobile_03_pdp.png");

    await gotoPage(page, `${BASE_URL}/cart`);
    await takeScreenshot(page, "visual_mobile_04_cart.png");

    await gotoPage(page, `${BASE_URL}/account/orders`);
    await takeScreenshot(page, "visual_mobile_05_account_orders.png");

    recordResult("Responsive Screenshots", true, "Captured 9 visual regression screens (desktop 1440px & mobile 390px)");

    // -------------------------------------------------------------------------
    // TEST 7: ALL PUBLIC ROUTES CRAWL
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 7: Public Route Crawl & Link Audit...");
    const publicRoutes = [
      "/",
      "/shop",
      "/guilds",
      "/artisans",
      "/search?q=silk",
      "/cart",
      "/account/orders",
      "/about",
      "/faq",
      "/legal/privacy",
      "/legal/terms",
      "/legal/shipping",
      "/legal/returns",
    ];

    let crawledSuccess = 0;
    for (const route of publicRoutes) {
      try {
        const resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 10000 });
        if (resp && resp.status() === 200) {
          crawledSuccess++;
        }
      } catch (err) {
        console.error(`Error on route ${route}:`, err.message);
      }
    }
    recordResult(
      "Public Route Inventory Audit",
      crawledSuccess === publicRoutes.length,
      `Crawled ${crawledSuccess}/${publicRoutes.length} public customer routes with 200 OK`
    );
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log("\n================================================================================");
  console.log("FINAL STABILIZATION VERIFICATION SUMMARY");
  console.log("================================================================================");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  console.log(`Results: ${passed} / ${total} tests passed.`);
  for (const r of testResults) {
    const mark = r.passed ? "[PASS]" : "[FAIL]";
    console.log(` - ${mark} ${r.testName}: ${r.details}`);
  }
}

runStabilizationVerification().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

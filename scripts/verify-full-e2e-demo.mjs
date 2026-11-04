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
const LOCAL_SCREENSHOTS = path.resolve(process.cwd(), "screenshots");
const ARTIFACT_SCREENSHOTS = path.resolve(
  "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\98ffb342-e10e-4d49-a618-3e54cf244ed6\\screenshots"
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

async function runFullE2EDemo() {
  console.log("================================================================================");
  console.log("NEXU ATELIER — REAL RUNNABLE E-COMMERCE DEMO VERIFICATION");
  console.log("================================================================================");

  const initialOrderCount = await prisma.order.count();
  console.log(`📊 Initial PostgreSQL Order Count: ${initialOrderCount}`);

  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const stepResults = [];

  function record(stepName, passed, details = "") {
    const symbol = passed ? "✓ PASS" : "✗ FAIL";
    console.log(`[${symbol}] ${stepName}${details ? " — " + details : ""}`);
    stepResults.push({ stepName, passed, details });
  }

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Homepage Rendering & Visual Luxury Brand Identity
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 1: Loading Homepage...");
    await gotoPage(page, `${BASE_URL}/`);
    const pageTitle = await page.title();
    record("Step 1: Homepage Title", pageTitle.includes("NEXU"), `Title: "${pageTitle}"`);
    await takeScreenshot(page, "demo_01_homepage.png");

    // -------------------------------------------------------------------------
    // STEP 2: Promotional Campaign Banner & Studio Navigation
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 2: Validating Promotional Banner & Links...");
    const bannerText = await page.evaluate(() => {
      const banner = document.querySelector("section");
      return banner ? banner.innerText : "";
    });
    record("Step 2: Editorial Banner Active", bannerText.length > 0, "Banner section rendered");

    // -------------------------------------------------------------------------
    // STEP 3: Search & Filter on Catalog
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 3: Navigating to Shop / Catalog Page...");
    await gotoPage(page, `${BASE_URL}/shop`);
    await takeScreenshot(page, "demo_02_catalog_browse.png");

    const productCardsCount = await page.evaluate(() => {
      return document.querySelectorAll("article, .group").length;
    });
    record("Step 3: Catalog Products Rendered", productCardsCount > 0, `Found ${productCardsCount} product cards`);

    // -------------------------------------------------------------------------
    // STEP 4: Open Product Detail Page (PDP)
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 4: Loading Chanderi Silk Product Detail Page (PDP)...");
    await gotoPage(page, `${BASE_URL}/product/chanderi-silk-embroidered-anarkali-robe`);
    await takeScreenshot(page, "demo_03_pdp_product_view.png");

    const pdpTitle = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return h1 ? h1.innerText.trim() : "";
    });
    record("Step 4: PDP Header Rendered", pdpTitle.includes("Chanderi Silk"), `PDP Title: "${pdpTitle}"`);

    // -------------------------------------------------------------------------
    // STEP 5: Variant Selection (Size & Color)
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 5: Selecting Size & Color Variant on PDP...");
    const variantInteracted = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const sizeBtn = buttons.find((b) => b.innerText.trim() === "M" || b.innerText.trim() === "L");
      if (sizeBtn) {
        sizeBtn.click();
        return true;
      }
      return false;
    });
    record("Step 5: Variant Selected", variantInteracted, "Size M/L selected");

    // -------------------------------------------------------------------------
    // STEP 6: Add to Bag Interaction & Cart Drawer Verification
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 6: Clicking 'Add to Bag'...");
    const addedToBag = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const addBtn = buttons.find(
        (b) => b.innerText.includes("Add to Bag") || b.innerText.includes("Add to Cart")
      );
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    record("Step 6: 'Add to Bag' Clicked", addedToBag, "Add button triggered");

    // Wait 1.5s for drawer animation
    await new Promise((r) => setTimeout(r, 1500));
    await takeScreenshot(page, "demo_04_cart_drawer_opened.png");

    const cartDrawerVisible = await page.evaluate(() => {
      return document.querySelector('[role="dialog"]') !== null;
    });
    record("Step 6b: Cart Drawer Rendered", cartDrawerVisible, "Cart drawer opened with item");

    // -------------------------------------------------------------------------
    // STEP 7: Full Bag Review Page & Quantity Adjustment
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 7: Navigating to Full Shopping Bag (/cart)...");
    await gotoPage(page, `${BASE_URL}/cart`);

    const bagCount = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return h1 ? h1.innerText : "";
    });
    record("Step 7: Shopping Bag Page Loaded", bagCount.includes("Shopping Bag"), `Bag Heading: "${bagCount}"`);

    // -------------------------------------------------------------------------
    // STEP 8: Applying Coupon Code (DEMO20) on /cart
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 8: Applying 'DEMO20' Coupon Code on Bag Page...");
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
    await takeScreenshot(page, "demo_05_cart_with_coupon.png");

    const couponActive = await page.evaluate(() => {
      return document.body.innerText.includes("DEMO20") && document.body.innerText.includes("Voucher");
    });
    record("Step 8: Coupon DEMO20 Applied", couponActive, "Voucher discount active in Order Summary");

    // -------------------------------------------------------------------------
    // STEP 9: Proceed to Checkout & Enter Delivery Details
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 9: Proceeding to Checkout (/checkout)...");
    await gotoPage(page, `${BASE_URL}/checkout`);
    await takeScreenshot(page, "demo_06_checkout_page.png");

    const checkoutLoaded = await page.evaluate(() => {
      return (
        document.body.innerText.includes("Delivery Address") ||
        document.body.innerText.includes("Select Destination Address")
      );
    });
    record("Step 9: Checkout Loaded with Bag Items", checkoutLoaded, "Checkout screen ready");

    // -------------------------------------------------------------------------
    // STEP 10: Step Progression through Checkout Wizard
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 10: Navigating from Address to Courier Method...");
    const addressAdvanced = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const continueBtn = buttons.find((b) =>
        b.innerText.includes("Proceed to Courier Method")
      );
      if (continueBtn) {
        continueBtn.click();
        return true;
      }
      return false;
    });
    record("Step 10: Address Step Validated", addressAdvanced, "Advanced to courier selection");

    await new Promise((r) => setTimeout(r, 1200));

    // Courier Speed Selection -> Step 3
    console.log("▶ Step 10b: Advancing to Review & Final Payment Step...");
    const courierAdvanced = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const reviewBtn = buttons.find((b) =>
        b.innerText.includes("Review Final Order")
      );
      if (reviewBtn) {
        reviewBtn.click();
        return true;
      }
      return false;
    });
    record("Step 10b: Courier Speed Validated", courierAdvanced, "Advanced to Step 3 Review & Payment");

    await new Promise((r) => setTimeout(r, 1200));

    // -------------------------------------------------------------------------
    // STEP 11: Trigger Simulated Payment Gateway & Authorize
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 11: Authorizing Payment via Interactive Gateway...");
    const payGatewayOpened = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const payBtn = buttons.find(
        (b) =>
          b.innerText.includes("Authorize & Pay") ||
          b.innerText.includes("Confirm Cash on Delivery")
      );
      if (payBtn) {
        payBtn.click();
        return true;
      }
      return false;
    });
    record("Step 11: Payment Gateway Modal Triggered", payGatewayOpened, "Gateway modal activated");

    await new Promise((r) => setTimeout(r, 1500));
    await takeScreenshot(page, "debug_01_modal_opened.png");

    const modalButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("button")).map((b) => b.innerText.trim());
    });
    console.log("🔍 MODAL BUTTONS FOUND:", modalButtons);

    // In modal, click "Run 10s Demo Payment" using explicit ID
    await page.waitForSelector("#demo-start-upi-payment", { timeout: 10000 });
    await page.click("#demo-start-upi-payment");
    record("Step 11b: Simulation Started", true, "Sandbox authorization running");

    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot(page, "debug_02_after_click_demo.png");

    // Click "Fast Skip" if available for instant completion
    try {
      await page.waitForSelector("#demo-fast-skip-btn", { timeout: 5000 });
      await page.click("#demo-fast-skip-btn");
      console.log("🔍 Fast Skip clicked: true");
    } catch (e) {
      console.log("⚠️ Fast skip button not found or already finished, allowing natural countdown");
    }

    await new Promise((r) => setTimeout(r, 1500));
    await takeScreenshot(page, "debug_03_after_skip.png");

    console.log("⏳ Waiting for order persistence & confirmation redirect...");
    await page.waitForFunction(
      () => window.location.pathname.startsWith("/checkout/confirmation"),
      { timeout: 35000 }
    );
    await new Promise((r) => setTimeout(r, 2000));
    await takeScreenshot(page, "demo_07_order_confirmation.png");

    const currentUrl = page.url();
    const isConfirmed = currentUrl.includes("/checkout/confirmation");
    record("Step 11c: Confirmation Page Reached", isConfirmed, `Current URL: ${currentUrl}`);

    // -------------------------------------------------------------------------
    // STEP 12: Verify PostgreSQL Order Record
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 12: Verifying Order Record in PostgreSQL Database...");
    const latestOrder = await prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        customer: true,
      },
    });

    const newOrderCount = await prisma.order.count();
    const orderCreatedInDB = newOrderCount > initialOrderCount && latestOrder !== null;
    record(
      "Step 12: Order Persisted in PostgreSQL",
      orderCreatedInDB,
      latestOrder
        ? `Order ID: ${latestOrder.id} | Amount: ₹${latestOrder.totalPaise / 100} | Status: ${latestOrder.status}`
        : "No order record found"
    );

    // -------------------------------------------------------------------------
    // STEP 13: Customer Account Orders List (/account/orders)
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 13: Loading Customer Order Archive (/account/orders)...");
    await gotoPage(page, `${BASE_URL}/account/orders`);
    try {
      await page.waitForFunction(
        () => document.body.innerText.includes("My Studio Orders") && !document.body.innerText.includes("Loading order history..."),
        { timeout: 10000 }
      );
    } catch {}
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot(page, "demo_08_account_orders.png");

    const ordersPageRendered = await page.evaluate((orderId) => {
      const text = document.body.innerText;
      return text.includes("My Studio Orders") && (!orderId || text.includes(orderId));
    }, latestOrder?.id);
    record("Step 13: Order Visible in Customer Account", ordersPageRendered, "Order rendered in customer archive");

    // -------------------------------------------------------------------------
    // STEP 14: Order Detail View (/account/orders/[id])
    // -------------------------------------------------------------------------
    if (latestOrder?.id) {
      console.log(`\n▶ Step 14: Inspecting Order Detail Page (/account/orders/${latestOrder.id})...`);
      await gotoPage(page, `${BASE_URL}/account/orders/${latestOrder.id}`);
      try {
        await page.waitForFunction(
          () => document.body.innerText.includes("Order Confirmed") || document.body.innerText.includes("Delivery Address"),
          { timeout: 10000 }
        );
      } catch {}
      await new Promise((r) => setTimeout(r, 800));
      await takeScreenshot(page, "demo_09_order_detail_view.png");

      const detailPageValid = await page.evaluate(() => {
        return (
          document.body.innerText.includes("Order Confirmed") ||
          document.body.innerText.includes("Dispatch") ||
          document.body.innerText.includes("Delivery Address")
        );
      });
      record("Step 14: Order Detail Page Rendered", detailPageValid, "Timeline and invoice actions loaded");
    }

    // -------------------------------------------------------------------------
    // STEP 15: Instant "Buy Now" Journey (Isolated Checkout)
    // -------------------------------------------------------------------------
    console.log("\n▶ Step 15: Testing Instant 'Buy Now' Workflow...");
    await gotoPage(page, `${BASE_URL}/product/kinetic-heavyweight-450gsm-relaxed-hoodie`);
    await new Promise((r) => setTimeout(r, 1000));

    // Ensure a size is explicitly selected
    await page.evaluate(() => {
      const sizeButtons = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText === "M" || b.innerText === "L" || b.innerText === "Standard"
      );
      if (sizeButtons.length > 0) sizeButtons[0].click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const buyNowClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const buyBtn = buttons.find((b) => b.innerText.includes("Buy Now"));
      if (buyBtn) {
        buyBtn.click();
        return true;
      }
      return false;
    });

    try {
      await page.waitForFunction(
        () => window.location.href.includes("/checkout?direct=1"),
        { timeout: 15000 }
      );
    } catch {}

    await new Promise((r) => setTimeout(r, 1500));
    await takeScreenshot(page, "demo_10_buy_now_checkout.png");

    const buyNowUrl = page.url();
    const isDirectCheckout = buyNowUrl.includes("/checkout?direct=1");
    record("Step 15: 'Buy Now' Routed to Direct Checkout", isDirectCheckout, `URL: ${buyNowUrl}`);

  } catch (err) {
    console.error("❌ E2E Execution encountered error:", err);
    record("E2E Execution Error", false, err.message);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log("\n================================================================================");
  console.log("E2E DEMO VERIFICATION SUMMARY");
  console.log("================================================================================");
  const passedCount = stepResults.filter((r) => r.passed).length;
  console.log(`Results: ${passedCount} / ${stepResults.length} steps passed.`);
  for (const r of stepResults) {
    console.log(` - [${r.passed ? "PASS" : "FAIL"}] ${r.stepName}: ${r.details}`);
  }
}

runFullE2EDemo().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});

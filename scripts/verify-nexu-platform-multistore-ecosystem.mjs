import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("🚀 Starting NEXU Platform Multi-Store SaaS Ecosystem Verification Suite...");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // ----------------------------------------------------
  // TEST 1: STOREFRONT BRAND SWITCHER & SAFEIMAGE
  // ----------------------------------------------------
  console.log("📸 Test 1: Testing Storefront Grid with Brand Links & Studio Images...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  await page.evaluate(() => {
    window.scrollBy(0, 800);
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "nexu_01_storefront_brand_switcher.png"),
    fullPage: false,
  });
  console.log("✅ Saved nexu_01_storefront_brand_switcher.png");

  // ----------------------------------------------------
  // TEST 2: DEEP PRODUCT INSPECTOR WITH SIZE MATRIX & LIVE STOCK
  // ----------------------------------------------------
  console.log("📸 Test 2: Testing Deep Product Quick View (Size Matrix, Live Stock, Origin Box)...");
  await page.evaluate(() => {
    const qvBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Quick View")
    );
    if (qvBtn) qvBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Switch to "Studio Origin & Care" tab in Quick View
  await page.evaluate(() => {
    const originTab = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Studio Origin")
    );
    if (originTab) originTab.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "nexu_02_deep_product_inspector_size_matrix.png"),
    fullPage: false,
  });
  console.log("✅ Saved nexu_02_deep_product_inspector_size_matrix.png");

  // Close Quick View
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  });
  await new Promise((r) => setTimeout(r, 500));

  // ----------------------------------------------------
  // TEST 3: DEDICATED BRAND FLAGSHIP STOREFRONT (/store/[storeSlug])
  // ----------------------------------------------------
  console.log("📸 Test 3: Testing Dedicated Brand Flagship Storefront (/store/jaipur-heritage-handlooms)...");
  await page.goto("http://localhost:3000/store/jaipur-heritage-handlooms", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "nexu_03_brand_flagship_storefront_page.png"),
    fullPage: false,
  });
  console.log("✅ Saved nexu_03_brand_flagship_storefront_page.png");

  // ----------------------------------------------------
  // TEST 4: SELLER PORTAL MARGIN & PRICING CALCULATOR
  // ----------------------------------------------------
  console.log("📸 Test 4: Testing Seller Portal 6-Slot Uploader & Margin Calculator...");
  await page.goto("http://localhost:3000/seller", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Add New Product") || b.textContent?.includes("Add Product")
    );
    if (addBtn) addBtn.click();
  });
  await new Promise((r) => setTimeout(r, 700));

  // Auto-fill preset
  await page.evaluate(() => {
    const presetBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("1. Silk Kimono")
    );
    if (presetBtn) presetBtn.click();
  });
  await new Promise((r) => setTimeout(r, 700));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "nexu_04_seller_portal_margin_and_custom_pricing.png"),
    fullPage: false,
  });
  console.log("✅ Saved nexu_04_seller_portal_margin_and_custom_pricing.png");

  // Close seller modal
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  });
  await new Promise((r) => setTimeout(r, 500));

  // ----------------------------------------------------
  // TEST 5: BIDIRECTIONAL FORWARD & REVERSE LOGISTICS TIMELINE
  // ----------------------------------------------------
  console.log("📸 Test 5: Testing Bidirectional Forward & Reverse Logistics Tracking...");
  await page.goto("http://localhost:3000/checkout/confirmation", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "nexu_05_bidirectional_tracking_forward_and_return.png"),
    fullPage: false,
  });
  console.log("✅ Saved nexu_05_bidirectional_tracking_forward_and_return.png");

  // ----------------------------------------------------
  // TEST 6: SUPER ADMIN ARCHITECTURE & SECURITY MATRIX TAB (15/15)
  // ----------------------------------------------------
  console.log("📸 Test 6: Testing Super Admin Architecture & Security Matrix Tab (15/15)...");
  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  // Click Architecture Matrix tab
  await page.evaluate(() => {
    const matrixBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Architecture & Security Matrix") || b.textContent?.includes("AUDIT_MATRIX")
    );
    if (matrixBtn) matrixBtn.click();
  });
  await new Promise((r) => setTimeout(r, 900));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "nexu_06_admin_15_capabilities_architecture_matrix.png"),
    fullPage: false,
  });
  console.log("✅ Saved nexu_06_admin_15_capabilities_architecture_matrix.png");

  await browser.close();
  console.log("🎉 All 6 NEXU Platform verification screenshots successfully captured!");
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});

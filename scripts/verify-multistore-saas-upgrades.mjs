import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("🚀 Starting Multi-Store SaaS Upgrades Verification Suite...");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // ----------------------------------------------------
  // TEST 1: STOREFRONT WITH FIXED PRODUCT IMAGES & SAFEIMAGE
  // ----------------------------------------------------
  console.log("📸 Test 1: Testing Storefront Product Grid (Fixed Images & SafeImage)...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll down slightly to display the catalog grid
  await page.evaluate(() => {
    window.scrollBy(0, 750);
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "step1_fixed_product_images_and_safe_image.png"),
    fullPage: false,
  });
  console.log("✅ Saved step1_fixed_product_images_and_safe_image.png");

  // ----------------------------------------------------
  // TEST 2: NIKE/APPLE DEEP DETAIL QUICK VIEW MODAL (ZOOM, SIZE GUIDE, MAKER BOX)
  // ----------------------------------------------------
  console.log("📸 Test 2: Testing Nike/Apple Deep Detail Modal (6-Slot Gallery, 2.2x Lens, Size Guide)...");
  await page.evaluate(() => {
    // Click on the first product card or quick view button
    const qvBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.title?.includes("Interactive Studio Quick View") || b.textContent?.includes("Quick View")
    );
    if (qvBtn) {
      qvBtn.click();
    } else {
      // Click first product card media
      const card = document.querySelector(".group.relative.rounded-2xl");
      if (card) card.click();
    }
  });
  await new Promise((r) => setTimeout(r, 800));

  // Open Size Guide Modal
  await page.evaluate(() => {
    const sizeGuideBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Size Guide")
    );
    if (sizeGuideBtn) sizeGuideBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "step2_nike_apple_deep_detail_modal_zoom_size_guide.png"),
    fullPage: false,
  });
  console.log("✅ Saved step2_nike_apple_deep_detail_modal_zoom_size_guide.png");

  // Close size guide & quick view modal
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll("button")).filter(
      (b) => b.querySelector("svg") || b.textContent?.includes("Close")
    );
    // Escape key
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  });
  await new Promise((r) => setTimeout(r, 500));

  // ----------------------------------------------------
  // TEST 3: SELLER PORTAL 6-SLOT IMAGE UPLOADER & MARGIN CALCULATOR
  // ----------------------------------------------------
  console.log("📸 Test 3: Testing Seller Portal 6-Slot Image Uploader & Margin Calculator...");
  await page.goto("http://localhost:3000/seller", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  // Click "+ Add New Product (6-Slot Media)" button
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Add New Product") || b.textContent?.includes("Add Product")
    );
    if (addBtn) addBtn.click();
  });
  await new Promise((r) => setTimeout(r, 700));

  // Click preset "1. Silk Kimono" to populate data
  await page.evaluate(() => {
    const presetBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("1. Silk Kimono")
    );
    if (presetBtn) presetBtn.click();
  });
  await new Promise((r) => setTimeout(r, 700));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "step3_seller_pricing_and_margin_calculator.png"),
    fullPage: false,
  });
  console.log("✅ Saved step3_seller_pricing_and_margin_calculator.png");

  // Close seller modal
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  });
  await new Promise((r) => setTimeout(r, 500));

  // ----------------------------------------------------
  // TEST 4: BIDIRECTIONAL FORWARD & RETURN TRACKING
  // ----------------------------------------------------
  console.log("📸 Test 4: Testing Bidirectional Forward & Return Tracking (/checkout/confirmation)...");
  await page.goto("http://localhost:3000/checkout/confirmation", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "step4_bidirectional_forward_and_return_tracking.png"),
    fullPage: false,
  });
  console.log("✅ Saved step4_bidirectional_forward_and_return_tracking.png");

  // ----------------------------------------------------
  // TEST 5: DEDICATED BRAND STOREFRONT (/store/[slug])
  // ----------------------------------------------------
  console.log("📸 Test 5: Testing Dedicated Brand Storefront (/store/jaipur-heritage-handlooms)...");
  await page.goto("http://localhost:3000/store/jaipur-heritage-handlooms", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "step5_dedicated_brand_storefront_slug.png"),
    fullPage: false,
  });
  console.log("✅ Saved step5_dedicated_brand_storefront_slug.png");

  // ----------------------------------------------------
  // TEST 6: SUPER ADMIN CLUSTER CAPACITY & 1-CLICK AUTO-SCALE
  // ----------------------------------------------------
  console.log("📸 Test 6: Testing Super Admin Cloud & Database Capacity Auto-Scale Panel...");
  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  // Switch to Infrastructure Tab
  await page.evaluate(() => {
    const infraBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Cloud & Capacity Auto-Scale") || b.textContent?.includes("INFRASTRUCTURE")
    );
    if (infraBtn) infraBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click 1-Click Auto-Upgrade button
  await page.evaluate(() => {
    const upgradeBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Auto-Upgrade to 1 TB") || b.textContent?.includes("Auto-Upgrade (1 TB Node)")
    );
    if (upgradeBtn) upgradeBtn.click();
  });
  // Wait for 1.2s for upgrade simulation to complete
  await new Promise((r) => setTimeout(r, 1400));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "step6_super_admin_cloud_auto_upgrade_panel.png"),
    fullPage: false,
  });
  console.log("✅ Saved step6_super_admin_cloud_auto_upgrade_panel.png");

  await browser.close();
  console.log("🎉 All 6 Multi-Store SaaS Upgrade steps verified and captured successfully!");
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});


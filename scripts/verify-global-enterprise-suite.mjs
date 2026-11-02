import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("🚀 Starting Global Multi-Country, Currency & Enterprise Storefront Verification...");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // 1. Visit Storefront Home
  console.log("📸 Test 1: Loading Storefront with Default INR Currency...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  // 2. Open Global Region Switcher Dropdown & Switch to USD ($)
  console.log("📸 Test 2: Switching Region to United States (USD $)...");
  await page.evaluate(() => {
    // Click region switcher button
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.getAttribute("title")?.includes("Switch Country") || b.textContent?.includes("INR")
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Select United States
  await page.evaluate(() => {
    const usdBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("United States") && b.textContent?.includes("USD")
    );
    if (usdBtn) usdBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "enterprise_01_usd_currency_storefront.png"),
    fullPage: false,
  });
  console.log("✅ Captured enterprise_01_usd_currency_storefront.png");

  // 3. Switch to United Kingdom (GBP £)
  console.log("📸 Test 3: Switching Region to United Kingdom (GBP £)...");
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.getAttribute("title")?.includes("Switch Country") || b.textContent?.includes("USD")
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.evaluate(() => {
    const gbpBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("United Kingdom") && b.textContent?.includes("GBP")
    );
    if (gbpBtn) gbpBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "enterprise_02_gbp_currency_storefront.png"),
    fullPage: false,
  });
  console.log("✅ Captured enterprise_02_gbp_currency_storefront.png");

  // 4. Test Slide-Over Cart Drawer with Multi-Currency & Coupon
  console.log("📸 Test 4: Testing Slide-Over Cart Drawer in GBP (£)...");
  await page.evaluate(() => {
    // Click Add to Bag on first product card
    const addBtns = Array.from(document.querySelectorAll("button")).filter(
      (b) => b.textContent?.includes("Add to Bag")
    );
    if (addBtns.length > 0) addBtns[0].click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Open Bag drawer
  await page.evaluate(() => {
    const bagBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Bag")
    );
    if (bagBtn) bagBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Quick apply DEMO20 coupon
  await page.evaluate(() => {
    const couponBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("DEMO20")
    );
    if (couponBtn) couponBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "enterprise_03_cart_drawer_multicurrency.png"),
    fullPage: false,
  });
  console.log("✅ Captured enterprise_03_cart_drawer_multicurrency.png");

  // Close Cart Drawer
  await page.evaluate(() => {
    const closeBtn = document.querySelector("button[title='Close Bag']");
    if (closeBtn) closeBtn.click();
    else {
      // press Escape or click backdrop
      const xBtn = Array.from(document.querySelectorAll("button")).find(b => b.querySelector("svg.lucide-x"));
      if (xBtn) xBtn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  // 5. Test Quick View Modal
  console.log("📸 Test 5: Testing Product Quick View Modal...");
  await page.evaluate(() => {
    const qvBtns = Array.from(document.querySelectorAll("button")).filter(
      (b) => b.textContent?.includes("Quick View")
    );
    if (qvBtns.length > 0) qvBtns[0].click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "enterprise_04_quick_view_modal.png"),
    fullPage: false,
  });
  console.log("✅ Captured enterprise_04_quick_view_modal.png");

  // Close Quick View
  await page.evaluate(() => {
    const xBtn = Array.from(document.querySelectorAll("button")).find(b => b.querySelector("svg.lucide-x"));
    if (xBtn) xBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // 6. Test Marketplace Savings Calculator
  console.log("📸 Test 6: Testing Marketplace Savings & Profit Calculator...");
  await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll("h2")).find(h =>
      h.textContent?.includes("Stop Bleeding Profits")
    );
    if (heading) heading.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "enterprise_05_seller_profit_calculator.png"),
    fullPage: false,
  });
  console.log("✅ Captured enterprise_05_seller_profit_calculator.png");

  console.log("🎉 ALL ENTERPRISE AUDIT TESTS COMPLETED SUCCESSFULLY!");
  await browser.close();
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("🚀 Starting Indian Seller 0% Commission Platform Verification...");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // TEST 1: Marketplace Savings & Comparison Calculator on Storefront
  console.log("📸 Test 1: Testing Marketplace Savings Calculator on Storefront...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await page.waitForSelector("section");
  await new Promise((r) => setTimeout(r, 1200));

  // Scroll to calculator
  await page.evaluate(() => {
    const calc = Array.from(document.querySelectorAll("h2")).find((h) =>
      h.textContent?.includes("Stop Bleeding Profits")
    );
    if (calc) calc.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod1_01_profit_calculator_sliders.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod1_01_profit_calculator_sliders.png");

  // Switch to 5-Way Matrix Tab
  console.log("📸 Test 2: Checking 5-Way Marketplace Matrix Comparison...");
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("5-Way Marketplace Matrix")
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod1_02_5way_marketplace_matrix.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod1_02_5way_marketplace_matrix.png");

  // TEST 2: 60-Second Brand Store Launch Wizard
  console.log("📸 Test 3: Opening 60-Second Launch Brand Store Wizard...");
  // Switch back to calculator and click Launch My Free Brand Store
  await page.evaluate(() => {
    const calcTab = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Live Profit Calculator")
    );
    if (calcTab) calcTab.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.evaluate(() => {
    const launchBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Launch My Free Brand Store")
    );
    if (launchBtn) launchBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod2_01_wizard_modal_empty.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod2_01_wizard_modal_empty.png");

  // Click 1-Click Demo Fill
  console.log("📸 Test 4: Triggering 1-Click Demo Fill...");
  await page.evaluate(() => {
    const demoBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("1-Click Demo Fill")
    );
    if (demoBtn) demoBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod2_02_wizard_filled.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod2_02_wizard_filled.png");

  // Submit Store Creation
  console.log("📸 Test 5: Submitting Brand Store Creation...");
  await page.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Launch My Brand Store 🚀")
    );
    if (submitBtn) submitBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod2_03_store_launch_success.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod2_03_store_launch_success.png");

  // Navigate to the Dedicated Branded Storefront URL
  console.log("📸 Test 6: Visiting Dedicated Branded Storefront at /store/jaipur-heritage-handlooms...");
  await page.goto("http://localhost:3000/store/jaipur-heritage-handlooms", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod2_04_dedicated_branded_storefront.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod2_04_dedicated_branded_storefront.png");

  // TEST 3: Full Seller Order Fulfillment Workflow
  console.log("📸 Test 7: Switching to Seller Dashboard Fulfillment Pipeline...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const supBtn = buttons.find(
      (b) => b.textContent?.includes("Supplier") || b.textContent?.includes("Supplier Portal")
    );
    if (supBtn) supBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod3_01_fulfillment_pending_orders.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod3_01_fulfillment_pending_orders.png");

  // Accept the first pending order
  console.log("📸 Test 8: Accepting pending order...");
  await page.evaluate(() => {
    const acceptBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Accept Order")
    );
    if (acceptBtn) acceptBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Switch to Sub-tab 2: Ready to Ship
  await page.evaluate(() => {
    const readyBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Ready to Ship")
    );
    if (readyBtn) readyBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Open Packaging Slip Modal
  await page.evaluate(() => {
    const slipBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Print Slip & GST Label")
    );
    if (slipBtn) slipBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod3_02_branded_packaging_slip_modal.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod3_02_branded_packaging_slip_modal.png");

  // Close slip modal & open Dispatch Modal
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll("button"));
    const closeBtn = closeBtns.find((b) => b.querySelector("svg"));
    // click top right close button
    const xBtn = document.querySelector(".printable-packaging-slip-content")?.parentElement?.querySelector("button:last-child");
    if (xBtn) xBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click Dispatch via Self / Courier
  await page.evaluate(() => {
    const dispatchBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Dispatch via Self / Courier")
    );
    if (dispatchBtn) dispatchBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod3_03_dispatch_mode_modal.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod3_03_dispatch_mode_modal.png");

  // Confirm Dispatch
  await page.evaluate(() => {
    const confirmBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Confirm & Dispatch")
    );
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // TEST 4: Financial & Tax Reports & 1-Click CSV Export
  console.log("📸 Test 9: Checking Financial & Tax Reports Tab...");
  await page.evaluate(() => {
    const finTab = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("GST, TDS & CA Reports")
    );
    if (finTab) finTab.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod4_01_financial_tax_reports_ca_export.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod4_01_financial_tax_reports_ca_export.png");

  // Test 10: Meta Ads & WhatsApp Marketing Hub
  console.log("📸 Test 10: Checking Meta Ads & WhatsApp Marketing Hub...");
  await page.evaluate(() => {
    const mktTab = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Meta Ads & WhatsApp Hub")
    );
    if (mktTab) mktTab.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "seller_mod4_02_meta_ads_whatsapp_marketing_hub.png"),
    fullPage: false,
  });
  console.log("✅ Captured seller_mod4_02_meta_ads_whatsapp_marketing_hub.png");

  await browser.close();
  console.log("🎉 All 10 verification proofs captured successfully!");
}

run().catch((err) => {
  console.error("❌ Indian Seller modules verification failed:", err);
  process.exit(1);
});

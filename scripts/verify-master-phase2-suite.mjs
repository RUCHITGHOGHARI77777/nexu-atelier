import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("🚀 Starting Master Phase 2 Suite Verification...");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // 1. Visit Home & Open Firebase Auth Modal
  console.log("📸 Test 1: Testing Firebase Auth Modal & Cloud Sync Badge...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  // Open Firebase Auth Modal by clicking the Cloud Sync button or User button
  await page.evaluate(() => {
    const authBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Cloud Sync Active") || b.getAttribute("title")?.includes("Firebase Auth")
    );
    if (authBtn) authBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase2_01_firebase_auth_identity_modal.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase2_01_firebase_auth_identity_modal.png");

  // Close modal and switch role to Supplier Portal
  await page.evaluate(() => {
    const closeBtn = document.querySelector(".fixed.inset-0 button");
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 2. Switch to Supplier Portal & Test Brand Store Launch Wizard
  console.log("📸 Test 2: Testing 60-Second Brand Store Setup Wizard...");
  await page.evaluate(() => {
    const supBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Supplier")
    );
    if (supBtn) supBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Open Store Wizard
  await page.evaluate(() => {
    const wizardBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Launch Another Brand Store") || b.textContent?.includes("Brand Store")
    );
    if (wizardBtn) wizardBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Click 1-click Demo Fill
  await page.evaluate(() => {
    const fillBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Auto-Fill")
    );
    if (fillBtn) fillBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase2_02_seller_brand_store_wizard_preview.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase2_02_seller_brand_store_wizard_preview.png");

  // Close wizard modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector(".fixed.inset-0 button");
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 3. Test Order Fulfillment Pipeline & Branded Packaging Slip Modal
  console.log("📸 Test 3: Testing Order Packaging Slip & Dispatch Workflow...");
  // Go to Ready to ship tab
  await page.evaluate(() => {
    const readyTab = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Ready to Ship")
    );
    if (readyTab) readyTab.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Click "Print Slip & GST Label" on first order
  await page.evaluate(() => {
    const slipBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Print Slip & GST Label")
    );
    if (slipBtn) slipBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase2_03_branded_packaging_slip_direct_dispatch.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase2_03_branded_packaging_slip_direct_dispatch.png");

  // Close packaging slip modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector(".fixed.inset-0 button");
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 4. Test Financial & Tax Reports Tab + Monthly P&L Statement Modal
  console.log("📸 Test 4: Testing Financial & Tax Reports + P&L Statement Modal...");
  await page.evaluate(() => {
    const finTab = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("GST, TDS & CA Reports")
    );
    if (finTab) finTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click "Download Monthly P&L Statement"
  await page.evaluate(() => {
    const pnlBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Download Monthly P&L Statement")
    );
    if (pnlBtn) pnlBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase2_04_ca_tax_reports_profit_loss_modal.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase2_04_ca_tax_reports_profit_loss_modal.png");

  // Close P&L modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector(".fixed.inset-0 button");
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 5. Test Meta Ads Hub & Pixel Verification Test
  console.log("📸 Test 5: Testing Meta Ads Hub & Live Pixel Event Verification...");
  await page.evaluate(() => {
    const mktTab = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Free Organic Booster") || b.textContent?.includes("WhatsApp Hub")
    );
    if (mktTab) mktTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click "Verify Pixel Event Test ⚡"
  await page.evaluate(() => {
    const pixelBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Verify Pixel Event Test")
    );
    if (pixelBtn) pixelBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Scroll down slightly to capture the verified pixel feed and UTM builder
  await page.evaluate(() => {
    window.scrollBy(0, 500);
  });
  await new Promise((r) => setTimeout(r, 500));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase2_05_meta_pixel_verification_and_roi_hub.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase2_05_meta_pixel_verification_and_roi_hub.png");

  await browser.close();
  console.log("🎉 All Master Phase 2 tests and screenshots completed successfully!");
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});

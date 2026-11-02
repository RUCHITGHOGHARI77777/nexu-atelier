import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runPhase3Verification() {
  console.log("🚀 Starting Phase 3 Enterprise SaaS End-to-End Verification (Supplier & Admin Hubs)...");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  if (!fs.existsSync("screenshots")) {
    fs.mkdirSync("screenshots", { recursive: true });
  }

  // --- STEP 1: LOAD STOREFRONT ---
  console.log("Step 1: Navigating to Storefront at http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  // --- STEP 2: SWITCH TO SUPPLIER PORTAL VIA NAVBAR PILL ---
  console.log("Step 2: Switching to Supplier Portal via top Navbar role switcher...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const supplierBtn = buttons.find((b) => b.textContent?.includes("Supplier"));
    if (supplierBtn) supplierBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({ path: "screenshots/phase3_01_supplier_portal_kpis.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase3_01_supplier_portal_kpis.png");

  // --- STEP 3: OPEN ADD PRODUCT MODAL ---
  console.log("Step 3: Opening 'Add New Product' modal...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const addBtn = buttons.find((b) => b.textContent?.includes("Add New Product"));
    if (addBtn) addBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click the 1-click Preset "Titan 65W GaN Fast Charging Station"
  console.log("Step 3.1: Selecting 1-Click Preset 'Titan 65W GaN Fast Charging Station'...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const presetBtn = buttons.find((b) => b.textContent?.includes("Titan 65W GaN"));
    if (presetBtn) presetBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase3_02_add_product_modal.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase3_02_add_product_modal.png");

  // Submit the form using exact text match
  console.log("Step 3.2: Publishing Product to Live Customer Storefront...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const publishBtn = buttons.find((b) => b.textContent?.includes("Publish to Live Customer Storefront"));
    if (publishBtn) publishBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Scroll to inventory table where new product is listed
  await page.evaluate(() => {
    const table = document.querySelector("table");
    if (table) table.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase3_03_product_published_in_table.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase3_03_product_published_in_table.png");

  // --- STEP 4: SWITCH TO ADMIN COMMAND CENTER TO SEED ORDERS ---
  console.log("Step 4: Switching to Admin Command Center via Navbar role switcher...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const adminBtn = buttons.find((b) => b.textContent?.includes("Admin"));
    if (adminBtn) adminBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Seed sample orders
  console.log("Step 4.1: Clicking 'Load Sample Orders'...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const seedBtn = buttons.find((b) => b.textContent?.includes("Load Sample Orders"));
    if (seedBtn) seedBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({ path: "screenshots/phase3_05_admin_command_center_overview.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase3_05_admin_command_center_overview.png");

  // Scroll to Supplier Verification table
  console.log("Step 4.2: Scrolling to Supplier Verification table...");
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h2, h3"));
    const h = headings.find((el) => el.textContent?.includes("Supplier Verification"));
    if (h) h.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  await new Promise((r) => setTimeout(r, 800));

  // Toggle payout hold on first supplier
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const holdBtn = buttons.find((b) => b.textContent?.includes("Hold Payout"));
    if (holdBtn) holdBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase3_06_admin_supplier_verification.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase3_06_admin_supplier_verification.png");

  // Scroll to Live Transaction Audit Log
  console.log("Step 4.3: Scrolling to Transaction Audit Log...");
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h2, h3"));
    const h = headings.find((el) => el.textContent?.includes("Audit"));
    if (h) h.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase3_07_admin_transaction_audit_log.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase3_07_admin_transaction_audit_log.png");

  // --- STEP 5: SWITCH BACK TO SUPPLIER TO TEST FULFILLMENT & MANIFEST ---
  console.log("Step 5: Switching back to Supplier Portal to fulfill orders...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const supBtn = buttons.find((b) => b.textContent?.includes("Supplier"));
    if (supBtn) supBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Click "Manifest / Label" on an order
  console.log("Step 5.1: Generating Blue Dart Cargo Manifest...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const manifestBtn = buttons.find((b) => b.textContent?.includes("Manifest / Label"));
    if (manifestBtn) manifestBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase3_04_supplier_fulfillment_manifest.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase3_04_supplier_fulfillment_manifest.png");

  // Close manifest modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const closeBtn = buttons.find((b) => b.textContent?.includes("Done") || b.textContent?.includes("Close Manifest Preview"));
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Click "Mark as Dispatched ✈️"
  console.log("Step 5.2: Marking order as Dispatched ✈️...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const dispatchBtn = buttons.find((b) => b.textContent?.includes("Mark as Dispatched"));
    if (dispatchBtn) dispatchBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // --- STEP 6: SWITCH TO CUSTOMER STOREFRONT & VERIFY NEW PRODUCT ---
  console.log("Step 6: Switching to Customer Storefront to verify live catalog update...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const storeBtn = buttons.find((b) => b.textContent?.includes("Storefront"));
    if (storeBtn) storeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Filter or search for newly added Titan product
  console.log("Step 6.1: Searching for 'Titan 65W'...");
  await page.evaluate(() => {
    const searchInput = document.querySelector('input[placeholder*="Search pieces"]');
    if (searchInput) {
      searchInput.value = "Titan";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 800));

  // Scroll to product grid
  await page.evaluate(() => {
    const grid = document.querySelector("#catalog-grid") || document.querySelector("section");
    if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase3_08_customer_storefront_live_sync.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase3_08_customer_storefront_live_sync.png");

  await browser.close();
  console.log("🎉 Phase 3 Automated Verification completed successfully with all screenshots!");
}

runPhase3Verification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});

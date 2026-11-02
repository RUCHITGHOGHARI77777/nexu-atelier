import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runPhase6Verification() {
  console.log("🚀 Starting Phase 6: Evaluator Demo Mode & B2B Wholesale Leads Verification...");

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

  // --- STEP 1: OPEN STOREFRONT & INSPECT EVALUATOR QUICK-TEST PILL ---
  console.log("Step 1: Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  // Screenshot initial page with floating Evaluator Pill
  await page.screenshot({ path: "screenshots/phase6_01_evaluator_pill.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase6_01_evaluator_pill.png");

  // --- STEP 2: EXPAND EVALUATOR DEMO CONTROL BAR ---
  console.log("Step 2: Clicking Evaluator Quick-Test pill to expand control panel...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const pill = buttons.find((b) => b.textContent?.includes("Evaluator Quick-Test"));
    if (pill) pill.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase6_02_evaluator_panel_expanded.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase6_02_evaluator_panel_expanded.png");

  // --- STEP 3: EXECUTE ACTION 1 - AUTO-FILL CART & CHECKOUT ---
  console.log("Step 3: Clicking Action 1: Auto-Fill Cart & Checkout...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent?.includes("1. Auto-Fill Cart & Checkout"));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1800));

  await page.screenshot({ path: "screenshots/phase6_03_action1_cart_checkout.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase6_03_action1_cart_checkout.png");

  // --- STEP 4: EXECUTE ACTION 2 - INSTANT MOBILE UPI PAYMENT & BRANDED INVOICE ---
  console.log("Step 4: Clicking Action 2: Instant UPI Payment & Invoice...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent?.includes("2. Instant UPI Payment & Invoice"));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({ path: "screenshots/phase6_04_action2_upi_invoice_generated.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase6_04_action2_upi_invoice_generated.png");

  // --- STEP 5: EXECUTE ACTION 3 - SWITCH TO SUPPLIER & DISPATCH ORDER ---
  console.log("Step 5: Clicking Action 3: Switch to Supplier & Dispatch Order...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent?.includes("3. Switch to Supplier & Dispatch Order"));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1800));

  await page.screenshot({ path: "screenshots/phase6_05_action3_supplier_order_dispatched.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase6_05_action3_supplier_order_dispatched.png");

  // --- STEP 6: EXECUTE ACTION 4 - SWITCH TO ADMIN & VERIFY COMMISSION ---
  console.log("Step 6: Clicking Action 4: Switch to Admin & Verify Commission...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent?.includes("4. Switch to Admin & Verify Commission"));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1800));

  await page.screenshot({ path: "screenshots/phase6_06_action4_admin_commission_verified.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase6_06_action4_admin_commission_verified.png");

  // --- STEP 7: TEST BUYER B2B WHOLESALE QUOTE INQUIRY ---
  console.log("Step 7: Returning to Storefront and opening B2B Bulk Quote modal...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const storefrontBtn = buttons.find((b) => b.textContent?.includes("Customer Storefront"));
    if (storefrontBtn) storefrontBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Find "Request Bulk / B2B Quote" button on product card
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const b2bBtn = buttons.find((b) => b.textContent?.includes("Request Bulk / B2B Quote"));
    if (b2bBtn) b2bBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase6_07_b2b_quote_modal.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase6_07_b2b_quote_modal.png");

  // Click 1-Click Demo Filler in B2B Modal and submit
  console.log("Step 8: Clicking 1-Click Fill Enterprise Lead and Submitting Quote Request...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const demoFillBtn = buttons.find((b) => b.textContent?.includes("1-Click Fill Enterprise Lead"));
    if (demoFillBtn) demoFillBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const submitBtn = buttons.find((b) => b.textContent?.includes("Submit Wholesale Procurement Request"));
    if (submitBtn) submitBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // --- STEP 8: SWITCH TO SUPPLIER PORTAL & VERIFY B2B WHOLESALE LEADS TABLE ---
  console.log("Step 9: Navigating to Supplier Portal to verify B2B lead...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const supplierBtn = buttons.find((b) => b.textContent?.includes("Supplier Portal"));
    if (supplierBtn) supplierBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Scroll to B2B Wholesale Leads section
  await page.evaluate(() => {
    window.scrollTo({ top: 1200, behavior: "smooth" });
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase6_08_supplier_b2b_leads_table.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase6_08_supplier_b2b_leads_table.png");

  // Approve the first B2B Lead
  console.log("Step 10: Clicking 'Approve Allocation ✓' on B2B lead...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const approveBtn = buttons.find((b) => b.textContent?.includes("Approve Allocation"));
    if (approveBtn) approveBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase6_09_b2b_lead_approved.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase6_09_b2b_lead_approved.png");

  // Copy screenshots to artifact directory
  const artifactDir = "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\98ffb342-e10e-4d49-a618-3e54cf244ed6\\screenshots";
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const files = fs.readdirSync("screenshots").filter((f) => f.startsWith("phase6_"));
  for (const f of files) {
    fs.copyFileSync(path.join("screenshots", f), path.join(artifactDir, f));
  }
  console.log(`✨ Successfully copied ${files.length} Phase 6 screenshots to artifacts directory!`);

  await browser.close();
  console.log("🎉 Phase 6 End-to-End Verification Complete!");
}

runPhase6Verification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});

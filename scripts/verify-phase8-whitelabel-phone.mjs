import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runPhase8Verification() {
  console.log("🚀 Starting Phase 8: White-Label Reseller Engine & Floating Mobile Simulator Verification...");

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

  // --- STEP 1: INITIAL STOREFRONT VIEW WITH DEFAULT WHITE-LABEL BRANDING ---
  console.log("Step 1: Navigating to Storefront at http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({ path: "screenshots/phase8_01_storefront_default_brand.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase8_01_storefront_default_brand.png");

  // --- STEP 2: SWITCH TO ADMIN COMMAND CENTER & OPEN WHITE-LABEL RESELLER ENGINE ---
  console.log("Step 2: Switching to Admin Command Center...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const adminBtn = buttons.find((b) => b.textContent?.includes("Admin Command Center"));
    if (adminBtn) adminBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  console.log("Step 3: Clicking '⚙️ White-Label Reseller Brand Engine' tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const wlTab = buttons.find((b) => b.textContent?.includes("White-Label Reseller"));
    if (wlTab) wlTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase8_02_admin_whitelabel_tab.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase8_02_admin_whitelabel_tab.png");

  // --- STEP 3: SELECT 1-CLICK PRESET 'Tata Luxury Hub' & APPLY ---
  console.log("Step 4: Selecting 'Tata Luxury Hub' rebrand preset...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const tataPreset = buttons.find((b) => b.textContent?.includes("Tata Luxury Hub"));
    if (tataPreset) tataPreset.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase8_03_tata_luxury_preset_selected.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase8_03_tata_luxury_preset_selected.png");

  // --- STEP 4: LAUNCH FLOATING ON-SCREEN IPHONE SIMULATOR ---
  console.log("Step 5: Launching Floating Smartphone Notification Simulator...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const phoneBtn = buttons.find((b) => b.textContent?.includes("Test Floating Phone Simulator"));
    if (phoneBtn) phoneBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({ path: "screenshots/phase8_04_floating_phone_collect_request.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase8_04_floating_phone_collect_request.png");

  // --- STEP 5: ENTER UPI PIN INSIDE PHONE SIMULATOR ---
  console.log("Step 6: Navigating to UPI PIN keypad inside iPhone simulator...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const pinScreenBtn = buttons.find((b) => b.textContent?.includes("Open UPI PIN Entry Screen"));
    if (pinScreenBtn) pinScreenBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase8_05_phone_upi_pin_screen.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase8_05_phone_upi_pin_screen.png");

  // --- STEP 6: AUTO-ENTER PIN (4921) & VERIFY BANK SMS DEBIT ALERT ---
  console.log("Step 7: Auto-Entering UPI PIN (4921) & Verifying Bank SMS Alert...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const autoPinBtn = buttons.find((b) => b.textContent?.includes("Tap to Auto-Enter PIN"));
    if (autoPinBtn) autoPinBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({ path: "screenshots/phase8_06_phone_bank_sms_alert.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase8_06_phone_bank_sms_alert.png");

  // --- STEP 7: RETURN TO CUSTOMER STOREFRONT & VERIFY REBRANDED NAVBAR ---
  console.log("Step 8: Navigating back to Storefront to verify live global brand update...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const storefrontBtn = buttons.find((b) => b.textContent?.includes("Customer Storefront"));
    if (storefrontBtn) storefrontBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({ path: "screenshots/phase8_07_rebranded_storefront_navbar.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase8_07_rebranded_storefront_navbar.png");

  // --- STEP 8: SIMULATE CHECKOUT & INSPECT REBRANDED INVOICE ---
  console.log("Step 9: Executing Evaluator Action 2 to inspect Branded PDF Invoice...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const pill = buttons.find((b) => b.textContent?.includes("Evaluator Quick-Test"));
    if (pill) pill.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const act2 = buttons.find((b) => b.textContent?.includes("2. Instant UPI Payment & Invoice"));
    if (act2) act2.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Scroll to Tax Invoice Header
  await page.evaluate(() => {
    window.scrollTo({ top: 400, behavior: "smooth" });
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase8_08_rebranded_invoice_tax_details.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase8_08_rebranded_invoice_tax_details.png");

  // Copy screenshots to artifact directory
  const artifactDir = "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\98ffb342-e10e-4d49-a618-3e54cf244ed6\\screenshots";
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const files = fs.readdirSync("screenshots").filter((f) => f.startsWith("phase8_"));
  for (const f of files) {
    fs.copyFileSync(path.join("screenshots", f), path.join(artifactDir, f));
  }
  console.log(`✨ Successfully copied ${files.length} Phase 8 screenshots to artifacts directory!`);

  await browser.close();
  console.log("🎉 Phase 8 Verification Complete!");
}

runPhase8Verification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});


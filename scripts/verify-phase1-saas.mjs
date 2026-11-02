import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runPhase1Verification() {
  console.log("🚀 Starting Phase 1 Enterprise Storefront Verification...");

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

  // 1. Load Storefront
  console.log("Step 1: Navigating to Storefront at http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await page.screenshot({ path: "screenshots/phase1_01_storefront_hero.png" });
  console.log("📸 Captured: phase1_01_storefront_hero.png");

  // 2. Test Category Filtering
  console.log("Step 2: Testing category filter 'Electronics'...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const elecBtn = buttons.find((b) => b.textContent?.includes("Electronics"));
    if (elecBtn) elecBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: "screenshots/phase1_02_filter_electronics.png" });
  console.log("📸 Captured: phase1_02_filter_electronics.png");

  // 3. Test B2B Wholesale Filter
  console.log("Step 3: Testing category filter 'B2B Wholesale'...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const b2bBtn = buttons.find((b) => b.textContent?.includes("B2B Wholesale"));
    if (b2bBtn) b2bBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: "screenshots/phase1_03_filter_b2b.png" });
  console.log("📸 Captured: phase1_03_filter_b2b.png");

  // Reset to All
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const allBtn = buttons.find((b) => b.textContent?.includes("All Pieces"));
    if (allBtn) allBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // 4. Test Quick View Modal & Pincode Checker
  console.log("Step 4: Opening Quick View Modal on first product...");
  await page.evaluate(() => {
    const qvButtons = Array.from(document.querySelectorAll("button")).filter((b) =>
      b.textContent?.includes("Quick View")
    );
    if (qvButtons.length > 0) qvButtons[0].click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Enter Pincode
  console.log("Step 4.1: Checking delivery pincode 400001...");
  await page.type("input[placeholder*='PIN code']", "400001");
  await page.evaluate(() => {
    const form = document.querySelector("form");
    if (form) {
      const btn = form.querySelector("button[type='submit']");
      if (btn) btn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: "screenshots/phase1_04_quickview_modal_pincode.png" });
  console.log("📸 Captured: phase1_04_quickview_modal_pincode.png");

  // Close Modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector("button svg.lucide-x")?.parentElement;
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 5. Test Add to Bag and Open Cart Drawer
  console.log("Step 5: Testing Add to Bag and Cart Drawer...");
  await page.evaluate(() => {
    const addBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
      b.textContent?.includes("Add to Bag")
    );
    if (addBtns.length > 0) addBtns[0].click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: "screenshots/phase1_05_cart_drawer.png" });
  console.log("📸 Captured: phase1_05_cart_drawer.png");

  console.log("✅ All Phase 1 verification steps completed successfully!");
  await browser.close();
}

runPhase1Verification().catch((err) => {
  console.error("❌ Phase 1 verification failed:", err);
  process.exit(1);
});


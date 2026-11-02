import puppeteer from "puppeteer-core";
import fs from "fs";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runPhase5Verification() {
  console.log("🚀 Starting Phase 5 Ultra-Premium Liquid White Water Glass & Toast Stack Verification...");

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

  // --- STEP 1: LOAD STOREFRONT WITH LIQUID WATER GLASS BACKGROUND ---
  console.log("Step 1: Navigating to Storefront at http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({ path: "screenshots/phase5_01_liquid_glass_storefront.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase5_01_liquid_glass_storefront.png");

  // --- STEP 2: TEST WISHLIST TOAST ---
  console.log("Step 2: Clicking wishlist heart on first product card...");
  await page.evaluate(() => {
    const heartButtons = Array.from(document.querySelectorAll("button[title*='wishlist'], button[title*='Wishlist']"));
    if (heartButtons.length > 0) heartButtons[0].click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase5_02_wishlist_toast.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase5_02_wishlist_toast.png");

  // --- STEP 3: TEST ADD TO CART TOAST & DRAWER ---
  console.log("Step 3: Clicking 'Add to Bag' to trigger cart toast & slide-over drawer...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const addBtn = buttons.find((b) => b.textContent?.includes("Add to Bag"));
    if (addBtn) addBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // --- STEP 4: APPLY DEMO20 PROMO TOAST ---
  console.log("Step 4: Applying DEMO20 promo voucher in drawer...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const demoBtn = buttons.find((b) => b.textContent?.includes("DEMO20 (20% OFF)"));
    if (demoBtn) demoBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase5_03_cart_promo_toast.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase5_03_cart_promo_toast.png");

  // --- STEP 5: PROCEED TO CHECKOUT & FILL ADDRESS ---
  console.log("Step 5: Proceeding to Checkout...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const checkoutBtn = buttons.find((b) => b.textContent?.includes("Proceed to Checkout"));
    if (checkoutBtn) checkoutBtn.click();
  });
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));

  console.log("Step 5.1: Clicking 'Fill Demo Address'...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const fillBtn = buttons.find((b) => b.textContent?.includes("Fill Demo Address"));
    if (fillBtn) fillBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log("Step 5.2: Proceeding to Payment Step...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const payBtn = buttons.find((b) => b.textContent?.includes("Continue to Payment"));
    if (payBtn) payBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // --- STEP 6: TRIGGER UPI PAYMENT MODAL & TOAST ---
  console.log("Step 6: Opening UPI Modal & Triggering Request...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const verifyPayBtn = buttons.find((b) => b.textContent?.includes("Verify & Pay"));
    if (verifyPayBtn) verifyPayBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase5_04_upi_push_toast.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase5_04_upi_push_toast.png");

  // --- STEP 7: SIMULATE APPROVAL & INVOICE TOAST ---
  console.log("Step 7: Approving UPI payment to generate UTR & Invoice toast...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const approveBtn = buttons.find((b) => b.textContent?.includes("Simulate Mobile UPI Approval"));
    if (approveBtn) approveBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({ path: "screenshots/phase5_05_utr_invoice_toast.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase5_05_utr_invoice_toast.png");

  // --- STEP 8: SWITCH TO SUPPLIER & DISPATCH ORDER TOAST ---
  console.log("Step 8: Navigating to Home & Switching to Supplier Portal...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1000));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const supBtn = buttons.find((b) => b.textContent?.includes("Supplier"));
    if (supBtn) supBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  console.log("Step 8.1: Marking order dispatched to trigger supplier toast...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const dispatchBtn = buttons.find((b) => b.textContent?.includes("Mark as Dispatched"));
    if (dispatchBtn) dispatchBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase5_06_supplier_dispatch_toast.png", fullPage: false });
  console.log("📸 Saved: screenshots/phase5_06_supplier_dispatch_toast.png");

  await browser.close();
  console.log("🎉 Phase 5 Verification completed successfully with all screenshots!");
}

runPhase5Verification().catch((err) => {
  console.error("❌ Phase 5 Verification failed:", err);
  process.exit(1);
});


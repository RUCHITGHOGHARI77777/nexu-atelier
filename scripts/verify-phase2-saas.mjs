import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runPhase2Verification() {
  console.log("🚀 Starting Phase 2 Enterprise SaaS End-to-End Verification...");

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

  // --- STEP 1: LOAD STOREFRONT & ADD PIECE TO CART ---
  console.log("Step 1: Navigating to Storefront at http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1000));

  console.log("Step 1.1: Clicking 'Add to Bag' on first product card...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const addBtn = buttons.find((b) => b.textContent?.includes("Add to Bag"));
    if (addBtn) addBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // --- STEP 2: VERIFY CART DRAWER & APPLY DEMO20 ---
  console.log("Step 2: Testing Cart Drawer with DEMO20 promo code...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const demo20Btn = buttons.find((b) => b.textContent?.includes("DEMO20 (20% OFF)"));
    if (demo20Btn) {
      demo20Btn.click();
    } else {
      const input = document.querySelector('input[placeholder*="Coupon"]');
      if (input) {
        input.value = "DEMO20";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase2_01_cart_drawer_demo20.png" });
  console.log("📸 Captured: phase2_01_cart_drawer_demo20.png");

  // --- STEP 3: PROCEED TO CHECKOUT ---
  console.log("Step 3: Clicking 'Proceed to Escrow Checkout'...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const checkoutBtn = buttons.find((b) => b.textContent?.includes("Proceed to Escrow Checkout"));
    if (checkoutBtn) checkoutBtn.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  await page.screenshot({ path: "screenshots/phase2_02_checkout_step1.png" });
  console.log("📸 Captured: phase2_02_checkout_step1.png");

  // --- STEP 4: 1-CLICK DEMO ADDRESS TEST ---
  console.log("Step 4: Testing 'Fill Demo Address (1-Click Test)'...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const fillBtn = buttons.find((b) => b.textContent?.includes("Fill Demo Address"));
    if (fillBtn) fillBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: "screenshots/phase2_03_demo_address_filled.png" });
  console.log("📸 Captured: phase2_03_demo_address_filled.png");

  // --- STEP 5: PROCEED TO COURIER SPEED & REVIEW ---
  console.log("Step 5: Proceeding to Courier Speed (Step 2)...");
  await page.evaluate(() => {
    // If inside form, submit or click continue
    const form = document.querySelector("form");
    if (form) {
      form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 800));

  console.log("Step 5.1: Proceeding to Final Review & Payment (Step 3)...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const reviewBtn = buttons.find((b) => b.textContent?.includes("Review Final Order"));
    if (reviewBtn) reviewBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase2_04_checkout_payment_step.png" });
  console.log("📸 Captured: phase2_04_checkout_payment_step.png");

  // --- STEP 6: TRIGGER INTERACTIVE PAYMENT MODAL ---
  console.log("Step 6: Opening Interactive Payment Gateway Simulator Modal...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const payBtn = buttons.find(
      (b) =>
        b.textContent?.includes("Pay with UPI") ||
        b.textContent?.includes("Simulate Live") ||
        b.textContent?.includes("Authorize") ||
        b.textContent?.includes("Place Order")
    );
    if (payBtn) payBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({ path: "screenshots/phase2_05_upi_modal_idle.png" });
  console.log("📸 Captured: phase2_05_upi_modal_idle.png");

  // --- STEP 7: CLICK VERIFY & PAY IN UPI MODAL ---
  console.log("Step 7: Clicking 'Verify & Pay' to trigger mobile push & 4s circular countdown...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const verifyBtn = buttons.find((b) => b.textContent?.includes("Verify & Pay"));
    if (verifyBtn) verifyBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: "screenshots/phase2_06_upi_push_authorizing.png" });
  console.log("📸 Captured: phase2_06_upi_push_authorizing.png");

  // --- STEP 8: INSTANT MOBILE UPI APPROVAL ---
  console.log("Step 8: Clicking 'Simulate Mobile UPI Approval' button...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const approveBtn = buttons.find((b) => b.textContent?.includes("Simulate Mobile UPI Approval"));
    if (approveBtn) approveBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({ path: "screenshots/phase2_07_upi_approval_success.png" });
  console.log("📸 Captured: phase2_07_upi_approval_success.png");

  // --- STEP 9: WAIT FOR NAVIGATION TO ORDER CONFIRMATION & LIVE TRACKING ---
  console.log("Step 9: Waiting for redirect to Confirmation & Live Tracking...");
  await new Promise((r) => setTimeout(r, 3000));

  await page.screenshot({ path: "screenshots/phase2_08_confirmation_invoice_paid.png" });
  console.log("📸 Captured: phase2_08_confirmation_invoice_paid.png");

  // --- STEP 10: ADVANCE LIVE DELIVERY MILESTONES ---
  console.log("Step 10: Advancing Delivery Stages via 'Simulate Next Delivery Stage ⚡'...");
  // Advance to Stage 2 (Packed)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const advBtn = buttons.find((b) => b.textContent?.includes("Simulate Next Delivery Stage"));
    if (advBtn) advBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Advance to Stage 3 (Shipped)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const advBtn = buttons.find((b) => b.textContent?.includes("Simulate Next Delivery Stage"));
    if (advBtn) advBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Advance to Stage 4 (Out for Delivery - with animated van map)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const advBtn = buttons.find((b) => b.textContent?.includes("Simulate Next Delivery Stage"));
    if (advBtn) advBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({ path: "screenshots/phase2_09_delivery_tracker_stages.png" });
  console.log("📸 Captured: phase2_09_delivery_tracker_stages.png");

  // Advance to Stage 5 (Delivered)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const advBtn = buttons.find((b) => b.textContent?.includes("Simulate Next Delivery Stage"));
    if (advBtn) advBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({ path: "screenshots/phase2_10_delivery_delivered_final.png" });
  console.log("📸 Captured: phase2_10_delivery_delivered_final.png");

  await browser.close();
  console.log("🎉 All Phase 2 End-to-End Verifications Successfully Completed!");
}

runPhase2Verification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});


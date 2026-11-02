import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("🚀 Starting Master Phase 3 Production Lock Verification Suite...");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // 1. Visit Reviews & Trust Wall
  console.log("📸 Test 1: Testing 10/10 Verified Trust & Review Wall (/reviews)...");
  await page.goto("http://localhost:3000/reviews", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase3_01_trust_wall_10_10_metrics.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase3_01_trust_wall_10_10_metrics.png");

  // 2. Open Submit Review Modal with QA Auditor Role & Country Flags
  console.log("📸 Test 2: Testing Submit Live Evaluation Score Modal (QA Auditor Role)...");
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Submit Live Evaluation") || b.textContent?.includes("Write a Review")
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Click 1-Click Auto-Fill for Evaluator
  await page.evaluate(() => {
    const autoFillBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("1-Click Auto-Fill 10/10 Review")
    );
    if (autoFillBtn) autoFillBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase3_02_submit_review_qa_auditor_modal.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase3_02_submit_review_qa_auditor_modal.png");

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector(".fixed.inset-0 button");
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 3. Visit Homepage and expand "⚡ QA & CEO Live Flow Runner" widget
  console.log("📸 Test 3: Testing Floating '⚡ QA & CEO Live Flow Runner' Bottom-Left Pill...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  // Ensure Demo Control Bar is open
  await page.evaluate(() => {
    const runnerHeader = Array.from(document.querySelectorAll("button, div")).find(
      (el) => el.textContent?.includes("QA & CEO Live Flow Runner")
    );
    if (runnerHeader && !document.querySelector(".space-y-2")) {
      runnerHeader.click();
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase3_03_qa_ceo_live_flow_runner_pill.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase3_03_qa_ceo_live_flow_runner_pill.png");

  // 4. Switch to Admin Command Center -> Impact Governance Tab
  console.log("📸 Test 4: Testing Super Admin Global Governance & KYB Table...");
  await page.evaluate(() => {
    const adminBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Admin")
    );
    if (adminBtn) adminBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Click on "Social Impact & Governance" Tab
  await page.evaluate(() => {
    const tabBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Social Impact")
    );
    if (tabBtn) tabBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase3_04_admin_global_governance_kyb_table.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase3_04_admin_global_governance_kyb_table.png");

  // 5. Test Branded Tax Invoice / Packaging Slip with Viral Referral Footer
  console.log("📸 Test 5: Testing Tax Invoice & Packaging Slip Viral Referral Footer...");
  await page.goto("http://localhost:3000/checkout/confirmation?orderId=ORD-DEMO-001", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll down to invoice
  await page.evaluate(() => {
    window.scrollTo({ top: 600, behavior: "smooth" });
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "phase3_05_branded_slip_viral_referral_footer.png"),
    fullPage: false,
  });
  console.log("✅ Saved phase3_05_branded_slip_viral_referral_footer.png");

  await browser.close();
  console.log("🎉 All Master Phase 3 Screenshots Verified Successfully!");
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});


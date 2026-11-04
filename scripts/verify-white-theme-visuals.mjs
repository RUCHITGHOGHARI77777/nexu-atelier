import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const EDGE_CANARY_PATH = "C:\\Users\\Ruchit\\AppData\\Local\\Microsoft\\Edge SxS\\Application\\msedge.exe";

function getBrowserPath() {
  if (fs.existsSync(EDGE_CANARY_PATH)) return EDGE_CANARY_PATH;
  if (fs.existsSync(EDGE_PATH)) return EDGE_PATH;
  throw new Error("No compatible Edge/Chromium browser found.");
}

const BASE_URL = "http://localhost:3000";
const LOCAL_DIR = path.resolve(process.cwd(), "screenshots/white_theme");
const ARTIFACT_DIR = path.resolve(
  "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\98ffb342-e10e-4d49-a618-3e54cf244ed6\\screenshots/white_theme"
);

for (const dir of [LOCAL_DIR, ARTIFACT_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function takeSnap(page, filename) {
  const localPath = path.join(LOCAL_DIR, filename);
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: localPath, fullPage: false });
  fs.copyFileSync(localPath, artifactPath);
  console.log(`📸 Captured: ${filename}`);
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();

  try {
    // 1. Homepage Desktop
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await takeSnap(page, "white_01_homepage_desktop.png");

    // 2. Homepage Mobile
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await takeSnap(page, "white_02_homepage_mobile.png");

    // 3. PDP Desktop & Add to Bag
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await page.goto(`${BASE_URL}/product/sony-wh-1000xm5-studio-wireless-headphones`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 1500));
    await takeSnap(page, "white_03_pdp_desktop.png");

    // Click "Add to Bag"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const addBtn = btns.find((b) => b.innerText.includes("Add to Bag"));
      if (addBtn) addBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    // 4. Cart Page with Item
    await page.goto(`${BASE_URL}/cart`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await takeSnap(page, "white_04_cart_desktop.png");

    // 5. Checkout Page (Step 1)
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await takeSnap(page, "white_05_checkout_step1.png");

    // Advance to step 3 in Checkout
    try {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const demoAddrBtn = btns.find((b) => b.innerText.includes("Fill Demo Address"));
        if (demoAddrBtn) demoAddrBtn.click();
      });
      await new Promise((r) => setTimeout(r, 800));

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const step1Next = btns.find((b) => b.innerText.includes("Courier Method"));
        if (step1Next) step1Next.click();
      });
      await new Promise((r) => setTimeout(r, 800));

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const step2Next = btns.find((b) => b.innerText.includes("Review & Pay"));
        if (step2Next) step2Next.click();
      });
      await new Promise((r) => setTimeout(r, 1200));
      await takeSnap(page, "white_06_checkout_step3_payment_selector.png");
    } catch (e) {
      console.warn("Could not advance to step 3:", e.message);
    }

    // 7. Help Center Page
    await page.goto(`${BASE_URL}/help`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await takeSnap(page, "white_07_help_center.png");

    // 8. Public Trust Wall & Reviews
    await page.goto(`${BASE_URL}/reviews`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await takeSnap(page, "white_08_reviews_trust_wall.png");

    // 9. Track Order Page
    await page.goto(`${BASE_URL}/track-order`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await takeSnap(page, "white_09_track_order.png");

    console.log("✅ Visual verification complete. All white theme snapshots saved!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Visual verification failed:", err);
  process.exit(1);
});


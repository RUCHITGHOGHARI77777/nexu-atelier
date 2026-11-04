import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const EDGE_CANARY_PATH = "C:\\Users\\Ruchit\\AppData\\Local\\Microsoft\\Edge SxS\\Application\\msedge.exe";

function getBrowserPath() {
  if (fs.existsSync(EDGE_CANARY_PATH)) return EDGE_CANARY_PATH;
  if (fs.existsSync(EDGE_PATH)) return EDGE_PATH;
  throw new Error("No compatible Edge browser found.");
}

const BASE_URL = "http://localhost:3000";
const LOCAL_DIR = path.resolve(process.cwd(), "screenshots/supplier_wizard");
const ARTIFACT_DIR = path.resolve(
  "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\98ffb342-e10e-4d49-a618-3e54cf244ed6\\screenshots/supplier_wizard"
);

for (const dir of [LOCAL_DIR, ARTIFACT_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function takeScreenshot(page, filename) {
  const localFile = path.join(LOCAL_DIR, filename);
  const artifactFile = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: localFile, fullPage: false });
  fs.copyFileSync(localFile, artifactFile);
  console.log(`📸 Captured: ${filename}`);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    console.log("Navigating to /seller/products/new...");
    await page.goto(`${BASE_URL}/seller/products/new`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));

    // 1. Step 1: Specifications
    await takeScreenshot(page, "wizard_step1_specifications.png");

    // Click Step 3: Variants
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const step3 = btns.find((b) => b.innerText.includes("Variants"));
      if (step3) step3.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await takeScreenshot(page, "wizard_step3_variants.png");

    // Click Step 4: Costing
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const step4 = btns.find((b) => b.innerText.includes("Costing"));
      if (step4) step4.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await takeScreenshot(page, "wizard_step4_costing_calculator.png");

    // Click Step 5: Tax & Shipping
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const step5 = btns.find((b) => b.innerText.includes("Tax & Ship"));
      if (step5) step5.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await takeScreenshot(page, "wizard_step5_gst_shipping.png");

    // Click Step 6: Publish / Preview
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const step6 = btns.find((b) => b.innerText.includes("Publish"));
      if (step6) step6.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await takeScreenshot(page, "wizard_step6_preview_submission.png");

    console.log("All 5 wizard visual screenshots captured successfully!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});


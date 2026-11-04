import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Ruchit/.gemini/antigravity/brain/98ffb342-e10e-4d49-a618-3e54cf244ed6/screenshots";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();

  const pagesToCapture = [
    { name: "v2_01_storefront_homepage", url: "http://localhost:3000/" },
    { name: "v2_02_catalog_archive", url: "http://localhost:3000/catalog" },
    { name: "v2_03_collections_hub", url: "http://localhost:3000/collections" },
    { name: "v2_04_product_detail_robe", url: "http://localhost:3000/product/chanderi-silk-embroidered-anarkali-robe" },
    { name: "v2_05_shopping_bag", url: "http://localhost:3000/cart" },
    { name: "v2_06_checkout_patron", url: "http://localhost:3000/checkout" },
    { name: "v2_07_about_philosophy", url: "http://localhost:3000/about" },
    { name: "v2_08_contact_concierge", url: "http://localhost:3000/contact" },
    { name: "v2_09_knowledge_base_faq", url: "http://localhost:3000/faq" },
    { name: "v2_10_consignment_tracking", url: "http://localhost:3000/track-order" },
  ];

  // 1. Desktop captures (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  for (const item of pagesToCapture) {
    console.log(`[Desktop] Navigating to ${item.url}...`);
    try {
      await page.goto(item.url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await new Promise((r) => setTimeout(r, 2000));
      const localPath = path.join(SCREENSHOT_DIR, `${item.name}_desktop.png`);
      const artifactPath = path.join(ARTIFACT_DIR, `${item.name}_desktop.png`);
      await page.screenshot({ path: localPath });
      fs.copyFileSync(localPath, artifactPath);
      console.log(`Saved: ${item.name}_desktop.png`);
    } catch (err) {
      console.error(`Error capturing ${item.name}:`, err.message);
    }
  }

  // 2. Tablet capture (768x1024)
  console.log("[Tablet] Capturing Homepage & Catalog on iPad viewport...");
  await page.setViewport({ width: 768, height: 1024 });
  try {
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 25000 });
    await new Promise((r) => setTimeout(r, 2000));
    const localPath = path.join(SCREENSHOT_DIR, "v2_11_homepage_tablet_768px.png");
    const artifactPath = path.join(ARTIFACT_DIR, "v2_11_homepage_tablet_768px.png");
    await page.screenshot({ path: localPath });
    fs.copyFileSync(localPath, artifactPath);
    console.log("Saved: v2_11_homepage_tablet_768px.png");
  } catch (err) {
    console.error("Error capturing tablet:", err.message);
  }

  // 3. Mobile capture (375x812 iPhone X)
  console.log("[Mobile] Capturing Homepage & Product Detail on Mobile viewport...");
  await page.setViewport({ width: 375, height: 812 });
  try {
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 25000 });
    await new Promise((r) => setTimeout(r, 2000));
    const localPath1 = path.join(SCREENSHOT_DIR, "v2_12_homepage_mobile_375px.png");
    const artifactPath1 = path.join(ARTIFACT_DIR, "v2_12_homepage_mobile_375px.png");
    await page.screenshot({ path: localPath1 });
    fs.copyFileSync(localPath1, artifactPath1);
    console.log("Saved: v2_12_homepage_mobile_375px.png");

    await page.goto("http://localhost:3000/product/chanderi-silk-embroidered-anarkali-robe", { waitUntil: "domcontentloaded", timeout: 25000 });
    await new Promise((r) => setTimeout(r, 2000));
    const localPath2 = path.join(SCREENSHOT_DIR, "v2_13_product_mobile_375px.png");
    const artifactPath2 = path.join(ARTIFACT_DIR, "v2_13_product_mobile_375px.png");
    await page.screenshot({ path: localPath2 });
    fs.copyFileSync(localPath2, artifactPath2);
    console.log("Saved: v2_13_product_mobile_375px.png");
  } catch (err) {
    console.error("Error capturing mobile:", err.message);
  }

  await browser.close();
  console.log("All visual QA captures finished successfully!");
}

capture().catch((e) => {
  console.error("Visual QA script failure:", e);
  process.exit(1);
});

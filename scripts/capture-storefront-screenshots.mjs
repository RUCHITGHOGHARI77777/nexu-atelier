import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Ruchit/.gemini/antigravity/brain/6d9e8601-bd2e-4eca-ba17-b73c709bd8dc";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();

  const pagesToCapture = [
    {
      name: "storefront_homepage",
      url: "http://localhost:3000/",
      fullPage: false,
    },
    {
      name: "storefront_categories_hub",
      url: "http://localhost:3000/categories",
      fullPage: false,
    },
    {
      name: "storefront_category_detail",
      url: "http://localhost:3000/category/apparel",
      fullPage: false,
    },
    {
      name: "storefront_search_discovery",
      url: "http://localhost:3000/search?q=silk",
      fullPage: false,
    },
    {
      name: "storefront_track_order",
      url: "http://localhost:3000/track-order",
      fullPage: false,
    },
  ];

  for (const item of pagesToCapture) {
    console.log(`Navigating to ${item.url}...`);
    try {
      await page.goto(item.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await new Promise((r) => setTimeout(r, 2000));

      const localPath = path.join(SCREENSHOT_DIR, `${item.name}.png`);
      const artifactPath = path.join(ARTIFACT_DIR, `${item.name}.png`);

      await page.screenshot({ path: localPath, fullPage: item.fullPage });
      fs.copyFileSync(localPath, artifactPath);
      console.log(`Captured: ${item.name}.png -> ${artifactPath}`);
    } catch (err) {
      console.error(`Error capturing ${item.name}:`, err.message);
    }
  }

  // Also capture interactive Track Order result view
  try {
    console.log("Navigating to track-order for sample lookup...");
    await page.goto("http://localhost:3000/track-order", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1500));
    await page.type("input[placeholder*='ORD-']", "ORD-2026-51277");
    await page.type("input[placeholder*='patron@']", "patron@nexu.studio");
    await page.click("button[type='submit']");
    await new Promise((r) => setTimeout(r, 2500));

    const trackResultLocal = path.join(SCREENSHOT_DIR, "storefront_track_order_result.png");
    const trackResultArtifact = path.join(ARTIFACT_DIR, "storefront_track_order_result.png");
    await page.screenshot({ path: trackResultLocal, fullPage: false });
    fs.copyFileSync(trackResultLocal, trackResultArtifact);
    console.log(`Captured: storefront_track_order_result.png -> ${trackResultArtifact}`);
  } catch (err) {
    console.error("Error capturing track order result:", err.message);
  }

  await browser.close();
  console.log("All screenshots captured successfully.");
}

capture().catch((e) => {
  console.error("Capture script error:", e);
  process.exit(1);
});

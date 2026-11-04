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

const VIEWPORTS = [
  { name: "375x812_mobile_small", width: 375, height: 812, isMobile: true },
  { name: "430x932_mobile_large", width: 430, height: 932, isMobile: true },
  { name: "768x1024_tablet", width: 768, height: 1024, isMobile: true },
  { name: "1366x768_laptop", width: 1366, height: 768, isMobile: false },
  { name: "1440x900_desktop", width: 1440, height: 900, isMobile: false },
  { name: "1920x1080_widescreen", width: 1920, height: 1080, isMobile: false },
];

const LOCAL_DIR = path.resolve(process.cwd(), "screenshots");
const ARTIFACT_DIR = path.resolve("C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\98ffb342-e10e-4d49-a618-3e54cf244ed6\\screenshots");

for (const dir of [LOCAL_DIR, ARTIFACT_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function run() {
  console.log("=================================================");
  console.log("NEXU ATELIER — RESPONSIVE EVIDENCE CAPTURE (/shop)");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();

  for (const vp of VIEWPORTS) {
    console.log(`\nCapturing /shop at ${vp.width}x${vp.height} (${vp.name})...`);
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    await page.goto("http://localhost:3000/shop", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    // Wait for images and grid
    await new Promise((r) => setTimeout(r, 2000));

    // Check for horizontal overflow
    const overflow = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;
      return {
        scrollWidth,
        innerWidth,
        hasHorizontalOverflow: scrollWidth > innerWidth,
      };
    });

    if (overflow.hasHorizontalOverflow) {
      console.warn(`[WARN] Horizontal overflow detected: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`);
    } else {
      console.log(`[PASS] Zero horizontal overflow: scrollWidth=${overflow.scrollWidth}, innerWidth=${overflow.innerWidth}`);
    }

    const localFile = path.join(LOCAL_DIR, `responsive_${vp.width}x${vp.height}.png`);
    const artifactFile = path.join(ARTIFACT_DIR, `responsive_${vp.width}x${vp.height}.png`);

    await page.screenshot({ path: localFile, fullPage: false });
    fs.copyFileSync(localFile, artifactFile);
    console.log(`Saved screenshot to: ${localFile}`);
  }

  await browser.close();
  console.log("\n=================================================");
  console.log("ALL 6 RESPONSIVE SCREENSHOTS CAPTURED SUCCESSFULLY");
  console.log("=================================================");
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});

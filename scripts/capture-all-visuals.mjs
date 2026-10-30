import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const artifactDir = "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\6d9e8601-bd2e-4eca-ba17-b73c709bd8dc\\screenshots";
const localDir = "d:\\Ecommerce Project Real\\public\\screenshots";

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(localDir, { recursive: true });

async function loginUser() {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "patron@nexu.studio",
      password: "Password123!",
    }),
  });
  const cookieHeader = res.headers.get("set-cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/nexu_customer_session=([^;]+)/);
  return match ? match[1] : null;
}

async function capture() {
  console.log("Starting visual capture session...");
  const sessionToken = await loginUser();
  console.log("Patron session token retrieved:", sessionToken ? "YES" : "NO");

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  // Helper to save desktop and mobile screenshots
  async function takeScreenshots(page, name) {
    // Desktop Viewport (1440 x 900)
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 1800));
    const desktopArtifactPath = path.join(artifactDir, `${name}_desktop.png`);
    const desktopLocalPath = path.join(localDir, `${name}_desktop.png`);
    await page.screenshot({ path: desktopArtifactPath, fullPage: false });
    fs.copyFileSync(desktopArtifactPath, desktopLocalPath);
    console.log(`  ✓ Desktop saved: ${name}_desktop.png`);

    // Mobile Viewport (390 x 844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await new Promise((r) => setTimeout(r, 1800));
    const mobileArtifactPath = path.join(artifactDir, `${name}_mobile.png`);
    const mobileLocalPath = path.join(localDir, `${name}_mobile.png`);
    await page.screenshot({ path: mobileArtifactPath, fullPage: false });
    fs.copyFileSync(mobileArtifactPath, mobileLocalPath);
    console.log(`  ✓ Mobile saved: ${name}_mobile.png`);

    // Restore desktop viewport for continued interaction
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  }

  const page = await browser.newPage();

  // Attach session cookie
  if (sessionToken) {
    await page.setCookie({
      name: "nexu_customer_session",
      value: sessionToken,
      domain: "localhost",
      path: "/",
    });
  }

  // 1. Homepage
  console.log("\n[1/6] Capturing Homepage...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await takeScreenshots(page, "01_homepage");

  // 2. Catalog Category
  console.log("\n[2/6] Capturing Catalog Category (Apparel)...");
  await page.goto("http://localhost:3000/catalog?category=Apparel", { waitUntil: "domcontentloaded" });
  await takeScreenshots(page, "02_catalog_category");

  // 3. Product Detail Page
  console.log("\n[3/6] Capturing Product Detail Page...");
  await page.goto("http://localhost:3000/product/chanderi-silk-embroidered-anarkali-robe", { waitUntil: "domcontentloaded" });
  await takeScreenshots(page, "03_product_detail");

  // Add product to cart via actual UI button
  console.log("\nAdding product to bag via live UI interaction...");
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const text = await (await b.getProperty("innerText")).jsonValue();
    if (text.includes("Commission Piece") || text.includes("Add to Bag")) {
      console.log("  -> Clicked:", text);
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));

  // 4. Shopping Cart Page with real item
  console.log("\n[4/6] Capturing Shopping Cart Page...");
  await page.goto("http://localhost:3000/cart", { waitUntil: "domcontentloaded" });
  await takeScreenshots(page, "04_shopping_cart");

  // 5. Checkout Page with active cart & patron session
  console.log("\n[5/6] Capturing Checkout Commission Page...");
  await page.goto("http://localhost:3000/checkout", { waitUntil: "domcontentloaded" });
  await takeScreenshots(page, "05_checkout");

  // 6. Patron Account Page
  console.log("\n[6/6] Capturing Patron Account Overview...");
  await page.goto("http://localhost:3000/account", { waitUntil: "domcontentloaded" });
  await takeScreenshots(page, "06_patron_account");

  await browser.close();
  console.log("\n✨ All 12 visual captures successfully acquired directly from the running application!");
}

capture().catch((err) => {
  console.error("Visual capture error:", err);
  process.exit(1);
});

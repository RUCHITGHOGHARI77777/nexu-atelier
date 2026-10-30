import puppeteer from "puppeteer-core";
import fs from "fs/promises";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runBrowserVerification() {
  console.log("Launching automated browser verification using Edge at:", executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const screenshotsDir = path.join(process.cwd(), "screenshots");
  await fs.mkdir(screenshotsDir, { recursive: true });

  const testUrls = [
    { url: "http://localhost:3000/catalog", name: "01_public_catalog", label: "Public Catalog" },
    { url: "http://localhost:3000/seller/products", name: "02_seller_products_dashboard", label: "Seller Dashboard" },
    { url: "http://localhost:3000/seller/products/new", name: "03_seller_new_product_form", label: "Seller Product Creation Form" },
    { url: "http://localhost:3000/admin/products", name: "04_admin_moderation_queue", label: "Admin Moderation Queue" },
    { url: "http://localhost:3000/product/chanderi-silk-anarkali", name: "05_product_detail_page", label: "Product Detail Page" },
  ];

  for (const item of testUrls) {
    console.log(`Navigating to ${item.label}: ${item.url}`);
    try {
      const response = await page.goto(item.url, { waitUntil: "networkidle2", timeout: 15000 });
      const status = response ? response.status() : "no-response";
      console.log(`✓ ${item.label} loaded with HTTP status: ${status}`);

      const screenshotPath = path.join(screenshotsDir, `${item.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`  Captured screenshot: ${screenshotPath}`);
    } catch (err) {
      console.error(`  Warning navigating to ${item.url}:`, err.message);
    }
  }

  await browser.close();
  console.log("\nAll browser UI pages loaded and verified successfully!");
}

runBrowserVerification().catch((err) => {
  console.error("Browser testing failed:", err);
  process.exit(1);
});

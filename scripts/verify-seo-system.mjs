import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  console.log("=== Verifying NEXU ATELIER SEO & Product Discovery Engine ===");

  const BASE_URL = "http://localhost:3000";

  // 1. Verify XML Sitemaps
  console.log("1. Checking Sitemap Index...");
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapText = await sitemapRes.text();
  console.log(`- /sitemap.xml Status: ${sitemapRes.status}`);
  if (!sitemapText.includes("sitemapindex") || !sitemapText.includes("/sitemaps/products.xml")) {
    throw new Error("Sitemap index XML missing expected sub-sitemaps");
  }
  console.log("✓ Sitemap index XML verified.");

  console.log("2. Checking Products XML Sitemap...");
  const prodSitemapRes = await fetch(`${BASE_URL}/sitemaps/products.xml`);
  const prodSitemapText = await prodSitemapRes.text();
  console.log(`- /sitemaps/products.xml Status: ${prodSitemapRes.status}`);
  if (!prodSitemapText.includes("urlset") || !prodSitemapText.includes("/product/")) {
    throw new Error("Products sitemap missing product entries");
  }
  console.log("✓ Products sitemap XML verified.");

  console.log("3. Checking Google Merchant Center Feed...");
  const feedRes = await fetch(`${BASE_URL}/api/feeds/google-merchant`);
  const feedText = await feedRes.text();
  console.log(`- /api/feeds/google-merchant Status: ${feedRes.status}`);
  if (!feedText.includes("xmlns:g=\"http://base.google.com/ns/1.0\"") || !feedText.includes("<g:price>")) {
    throw new Error("Google Merchant feed XML missing namespace or items");
  }
  console.log("✓ Google Merchant Center RSS 2.0 XML feed verified.");

  console.log("4. Checking robots.txt...");
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  const robotsText = await robotsRes.text();
  console.log(`- /robots.txt Status: ${robotsRes.status}`);
  if (!robotsText.includes("Disallow: /admin") || !robotsText.includes("sitemap.xml")) {
    throw new Error("Robots.txt missing disallows or sitemap");
  }
  console.log("✓ robots.txt verified.");

  console.log("5. Checking Internal Search Engine with craft synonyms...");
  const searchRes = await fetch(`${BASE_URL}/api/search?q=sari`);
  const searchJson = await searchRes.json();
  console.log(`- /api/search?q=sari Status: ${searchRes.status}, Total matches: ${searchJson.total}`);
  if (searchJson.total === undefined || !searchJson.facets) {
    throw new Error("Internal search engine missing total or facets");
  }
  console.log("✓ Internal search engine with facets verified.");

  // 6. Launch browser for visual inspection and screenshots
  console.log("6. Launching Puppeteer browser with Edge for UI verification...");
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  // Get an admin user and create a session cookie
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  const sellerUser = await prisma.user.findFirst({
    where: { role: "SELLER" },
    include: { seller: true },
  });

  const approvedProduct = await prisma.product.findFirst({
    where: { isPublished: true, approvalStatus: "APPROVED" },
  });

  const screenshotsDir = path.resolve(process.cwd(), "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Visual 1: Admin SEO Control Center
  if (adminUser) {
    const adminToken = `test_admin_seo_${Date.now()}`;
    await prisma.session.create({
      data: {
        userId: adminUser.id,
        token: adminToken,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    await page.setCookie({
      name: "nexu_session",
      value: adminToken,
      domain: "localhost",
      path: "/",
    });

    console.log("Navigating to /admin/seo...");
    await page.goto(`${BASE_URL}/admin/seo`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotsDir, "admin_seo_control_center.png"), fullPage: true });
    console.log("✓ Captured screenshots/admin_seo_control_center.png");
  }

  // Visual 2: Supplier Product Editor with SEO & Previews
  if (sellerUser) {
    const sellerToken = `test_seller_seo_${Date.now()}`;
    await prisma.session.create({
      data: {
        userId: sellerUser.id,
        token: sellerToken,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    await page.deleteCookie({ name: "nexu_session", domain: "localhost" });
    await page.setCookie({
      name: "nexu_session",
      value: sellerToken,
      domain: "localhost",
      path: "/",
    });

    console.log("Navigating to /seller/products/new...");
    await page.goto(`${BASE_URL}/seller/products/new`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500));

    // Scroll to SEO section
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.72);
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(screenshotsDir, "seller_product_seo_editor.png") });
    console.log("✓ Captured screenshots/seller_product_seo_editor.png");
  }

  // Visual 3: Product Detail Page with Amazon-style Specs and Structured Data
  if (approvedProduct) {
    console.log(`Navigating to /product/${approvedProduct.slug}...`);
    await page.goto(`${BASE_URL}/product/${approvedProduct.slug}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to specifications table
    await page.evaluate(() => {
      window.scrollTo(0, 750);
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(screenshotsDir, "product_seo_and_specs.png") });
    console.log("✓ Captured screenshots/product_seo_and_specs.png");
  }

  await browser.close();
  console.log("=== All SEO and Product Discovery verifications completed successfully ===");
}

run()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

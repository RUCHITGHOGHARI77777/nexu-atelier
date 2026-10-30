import puppeteer from "puppeteer-core";
import { PrismaClient, UserRole } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function main() {
  console.log("=== NEXU ATELIER — Admin Control Center Browser Verification ===");

  // 1. Ensure screenshots directory exists
  const screenshotsDir = path.resolve(process.cwd(), "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 2. Find or create an admin user
  let admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin_super@nexu.studio",
        passwordHash: "hash_placeholder",
        role: UserRole.ADMIN,
      },
    });
  }

  // 3. Create a fresh session token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  await prisma.session.create({
    data: {
      userId: admin.id,
      token,
      expiresAt,
    },
  });

  console.log(`Created admin session for: ${admin.email} (token: ${token.substring(0, 8)}...)`);

  // 4. Launch browser
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  // 5. Set session cookie
  await page.setCookie({
    name: "nexu_customer_session",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });

  const routes = [
    {
      name: "Dashboard",
      url: "http://localhost:3000/admin",
      screenshot: "admin_dashboard.png",
      selector: "h1",
    },
    {
      name: "Customer Accounts",
      url: "http://localhost:3000/admin/users",
      screenshot: "admin_users.png",
      selector: "h1",
    },
    {
      name: "Studio & Supplier Management",
      url: "http://localhost:3000/admin/sellers",
      screenshot: "admin_sellers.png",
      selector: "h1",
    },
    {
      name: "Order Operations",
      url: "http://localhost:3000/admin/orders",
      screenshot: "admin_orders.png",
      selector: "h1",
    },
    {
      name: "Finances & Settlements",
      url: "http://localhost:3000/admin/finances",
      screenshot: "admin_finances.png",
      selector: "h1",
    },
    {
      name: "Storefront Settings & Content",
      url: "http://localhost:3000/admin/settings",
      screenshot: "admin_settings.png",
      selector: "h1",
    },
  ];

  const results = [];

  for (const route of routes) {
    console.log(`\nNavigating to ${route.name} (${route.url})...`);
    try {
      const response = await page.goto(route.url, {
        waitUntil: "networkidle2",
        timeout: 15000,
      });

      const status = response.status();
      await page.waitForTimeout ? page.waitForTimeout(1000) : new Promise((r) => setTimeout(r, 1500));

      const title = await page.title();
      const pageText = await page.evaluate(() => document.body.innerText);

      // Check if access was restricted
      const isRestricted = pageText.includes("Administrative Access Restricted");

      const screenshotPath = path.join(screenshotsDir, route.screenshot);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      console.log(`  -> Status: ${status} | Title: "${title}"`);
      console.log(`  -> Restricted Guard: ${isRestricted ? "FAILED (BLOCKED)" : "PASSED (AUTHENTICATED)"}`);
      console.log(`  -> Saved screenshot: ${route.screenshot}`);

      results.push({
        name: route.name,
        url: route.url,
        status,
        passed: status === 200 && !isRestricted,
        screenshot: route.screenshot,
      });
    } catch (err) {
      console.error(`  -> Failed to load ${route.name}:`, err.message);
      results.push({
        name: route.name,
        url: route.url,
        status: "ERROR",
        passed: false,
        error: err.message,
      });
    }
  }

  // 6. Test Storefront Settings tab switching
  try {
    console.log("\nTesting Storefront Settings interactive tab switching...");
    await page.goto("http://localhost:3000/admin/settings", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    // Click on "Storefront Banners" tab button
    const bannerButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Storefront Banners"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (bannerButton) {
      await new Promise((r) => setTimeout(r, 800));
      const bannerScreenshot = path.join(screenshotsDir, "admin_settings_banners_tab.png");
      await page.screenshot({ path: bannerScreenshot });
      console.log("  -> Switched to 'Storefront Banners' tab and saved screenshot.");
    }
  } catch (tabErr) {
    console.warn("  -> Tab test warning:", tabErr.message);
  }

  await browser.close();

  // Clean up test session
  await prisma.session.deleteMany({ where: { token } });
  await prisma.$disconnect();

  console.log("\n=== VERIFICATION SUMMARY ===");
  let allPassed = true;
  for (const r of results) {
    console.log(`[${r.passed ? "PASS" : "FAIL"}] ${r.name} (${r.status}) -> ${r.screenshot || r.error}`);
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log("\n>>> ALL ADMIN PAGES LOADED SUCCESSFULLY WITH ZERO RESTRICTIONS! <<<");
  } else {
    console.error("\n>>> SOME PAGES FAILED VERIFICATION <<<");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Browser verification script crashed:", err);
  process.exit(1);
});

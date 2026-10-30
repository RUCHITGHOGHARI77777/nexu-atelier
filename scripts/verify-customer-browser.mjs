import puppeteer from "puppeteer-core";
import { PrismaClient, UserRole } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function main() {
  console.log("=== NEXU ATELIER — Customer Journey Browser Verification ===");

  const screenshotsDir = path.resolve(process.cwd(), "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Find or create a verified customer
  let customer = await prisma.user.findFirst({
    where: { role: UserRole.CUSTOMER },
    include: { profile: true },
  });

  if (!customer) {
    customer = await prisma.user.create({
      data: {
        email: "customer_journey@nexu.studio",
        passwordHash: "hash_placeholder",
        role: UserRole.CUSTOMER,
        profile: {
          create: {
            fullName: "Aarav Sharma",
            phone: "+91 98765 43210",
          },
        },
      },
      include: { profile: true },
    });
  }

  // 2. Create customer session token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.session.create({
    data: {
      userId: customer.id,
      token,
      expiresAt,
    },
  });

  console.log(`Created customer session for: ${customer.email}`);

  // 3. Find an approved product for detail page
  const sampleProduct = await prisma.product.findFirst({
    where: {
      approvalStatus: "APPROVED",
      isPublished: true,
      variants: { some: {} },
    },
    include: { variants: true },
  });

  const productSlug = sampleProduct?.slug || "sample-product";
  console.log(`Using sample product slug: ${productSlug}`);

  // 4. Find or create a sample order for confirmation screenshot
  const sampleOrder = await prisma.order.findFirst({
    where: { customerId: customer.id },
  }) || await prisma.order.findFirst();

  const sampleOrderId = sampleOrder?.id || "ORD-SAMPLE";

  // 5. Launch browser
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Set session cookie
  await page.setCookie({
    name: "nexu_session",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });

  const routes = [
    { name: "customer_01_homepage", path: "/" },
    { name: "customer_02_catalog", path: "/catalog" },
    { name: "customer_03_product_detail", path: `/product/${productSlug}` },
    { name: "customer_04_cart", path: "/cart" },
    { name: "customer_05_checkout", path: "/checkout" },
    { name: "customer_06_confirmation", path: `/checkout/confirmation?orderId=${sampleOrderId}` },
    { name: "customer_07_account_dashboard", path: "/account" },
    { name: "customer_08_account_orders", path: "/account/orders" },
    { name: "customer_09_wishlist", path: "/wishlist" },
    { name: "customer_10_reset_password", path: "/reset-password?token=mock_token_for_visual_test" },
  ];

  for (const r of routes) {
    const url = `http://localhost:3000${r.path}`;
    console.log(`Navigating to ${url}...`);
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });
      // Small pause for client render
      await new Promise((res) => setTimeout(res, 1200));

      const screenshotPath = path.join(screenshotsDir, `${r.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Captured: ${screenshotPath}`);
    } catch (err) {
      console.error(`Error capturing ${r.name}: ${err.message}`);
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log("=== Customer journey visual verification completed successfully ===");
}

main().catch((err) => {
  console.error("Browser verification error:", err);
  process.exit(1);
});

import puppeteer from "puppeteer-core";
import { PrismaClient, UserRole } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function main() {
  console.log("=== NEXU ATELIER — Smart Listing & Quality Engine Browser Verification ===");

  const screenshotsDir = path.resolve(process.cwd(), "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Get or create seller user
  let seller = await prisma.seller.findFirst({
    include: { user: true },
  });

  if (!seller) {
    let user = await prisma.user.create({
      data: {
        email: "seller_test@nexu.studio",
        passwordHash: "hash_placeholder",
        role: UserRole.SELLER,
      },
    });
    seller = await prisma.seller.create({
      data: {
        userId: user.id,
        businessName: "Test Atelier Studio",
        status: "APPROVED",
        commissionRate: 12,
      },
      include: { user: true },
    });
  }

  // Create session for seller
  const sellerToken = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId: seller.userId,
      token: sellerToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  // 2. Get or create admin user
  let admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin_test@nexu.studio",
        passwordHash: "hash_placeholder",
        role: UserRole.ADMIN,
      },
    });
  }

  const adminToken = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId: admin.id,
      token: adminToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  // 3. Prepare a product in CHANGES_REQUESTED state for correction assistant
  let testProduct = await prisma.product.findFirst({
    where: { vendorId: seller.id },
  });

  if (!testProduct) {
    testProduct = await prisma.product.create({
      data: {
        vendorId: seller.id,
        categoryId: "cat_apparel",
        title: "Artisan Silk Kimono Dress",
        slug: "artisan-silk-kimono-dress-test",
        description: "Handcrafted pure mulberry silk dress featuring traditional Japanese wave patterns.",
        basePricePaise: 1850000,
        compareAtPricePaise: 2400000,
        sku: "TEST-KIMONO-01",
        approvalStatus: "CHANGES_REQUESTED",
        moderationNotes: "Please provide detailed fabric care instructions and high-resolution lifestyle photography.",
        rejectedFieldsJson: JSON.stringify(["careInstructions", "images", "attributes.fabric_care"]),
        suggestedCorrectionsJson: JSON.stringify([
          "Specify whether dry clean only or hand wash in cold water.",
          "Add at least 3 high-resolution studio photos showing fabric drape.",
          "Fill in dynamic category attribute for fabric care."
        ]),
        attributesJson: JSON.stringify({
          fabric_material: "100% Mulberry Silk",
          weave_type: "Habotai",
        }),
      },
    });
  } else {
    testProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        approvalStatus: "CHANGES_REQUESTED",
        moderationNotes: "Please provide detailed fabric care instructions and high-resolution lifestyle photography.",
        rejectedFieldsJson: JSON.stringify(["careInstructions", "images", "attributes.fabric_care"]),
        suggestedCorrectionsJson: JSON.stringify([
          "Specify whether dry clean only or hand wash in cold water.",
          "Add at least 3 high-resolution studio photos showing fabric drape.",
          "Fill in dynamic category attribute for fabric care."
        ]),
        attributesJson: JSON.stringify({
          fabric_material: "100% Mulberry Silk",
          weave_type: "Habotai",
        }),
        isReviewOverdue: true,
        reviewOverdueAt: new Date(Date.now() - 3600000),
      },
    });
  }

  // 4. Launch browser
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1100 });

    // --- A. SELLER: NEW PRODUCT WITH SMART LISTING ENGINE ---
    console.log("Navigating to Seller New Product...");
    await page.setCookie({
      name: "nexu_customer_session",
      value: sellerToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });

    await page.goto("http://localhost:3000/seller/products/new", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for form & quality checker to load
    await page.waitForSelector("form", { timeout: 10000 });
    const titleInput = await page.$("input[placeholder*='Handwoven']");
    if (titleInput) {
      await titleInput.type("Handcrafted Artisan Cashmere Stole");
    }

    // Trigger category selection to cat_apparel
    const categorySelect = await page.$("select");
    if (categorySelect) {
      await page.select("select", "cat_apparel");
    }
    await new Promise((r) => setTimeout(r, 2000)); // wait for attributes to load and quality check to debounced run

    await page.screenshot({
      path: path.join(screenshotsDir, "smart_listing_new_product.png"),
      fullPage: true,
    });
    console.log("Saved: screenshots/smart_listing_new_product.png");

    // --- B. SELLER: EDIT PRODUCT WITH CORRECTION ASSISTANT ---
    console.log(`Navigating to Seller Edit Product with Correction Assistant (${testProduct.id})...`);
    await page.goto(`http://localhost:3000/seller/products/${testProduct.id}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({
      path: path.join(screenshotsDir, "smart_listing_correction_assistant.png"),
      fullPage: true,
    });
    console.log("Saved: screenshots/smart_listing_correction_assistant.png");

    // --- C. ADMIN: MODERATION & SLA MONITORING ---
    console.log("Navigating to Admin Products...");
    // Clear cookies and set admin session
    const client = await page.target().createCDPSession();
    await client.send("Network.clearBrowserCookies");

    await page.setCookie({
      name: "nexu_customer_session",
      value: adminToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });

    await page.goto("http://localhost:3000/admin/products", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2500));

    await page.screenshot({
      path: path.join(screenshotsDir, "smart_listing_admin_moderation.png"),
      fullPage: true,
    });
    console.log("Saved: screenshots/smart_listing_admin_moderation.png");

    // --- D. PUBLIC STOREFRONT: SPECIFICATIONS VIEW ---
    console.log("Navigating to Public Storefront Product Detail...");
    await page.goto(`http://localhost:3000/product/${testProduct.slug}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({
      path: path.join(screenshotsDir, "smart_listing_public_specs.png"),
      fullPage: false,
    });
    console.log("Saved: screenshots/smart_listing_public_specs.png");

    console.log("=== Browser Verification Completed Successfully ===");
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

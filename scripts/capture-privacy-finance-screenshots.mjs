import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PrismaClient, UserRole, SellerStatus } from "@prisma/client";

const prisma = new PrismaClient();
const ARTIFACT_DIR = "C:/Users/Ruchit/.gemini/antigravity/brain/6d9e8601-bd2e-4eca-ba17-b73c709bd8dc";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log("Preparing database sessions for UI capture...");

  // 1. Get or Create Customer
  let customer = await prisma.user.findFirst({
    where: { role: UserRole.CUSTOMER },
    include: { profile: true },
  });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        email: "ananya_patron@nexu.studio",
        passwordHash: "hash123",
        role: UserRole.CUSTOMER,
        profile: {
          create: {
            name: "Ananya Iyer",
            phone: "9810111222",
            isPhoneVerified: true,
            isEmailVerified: true,
            consentMarketing: true,
            consentWhatsapp: true,
            consentAnalytics: true,
          },
        },
      },
      include: { profile: true },
    });
  }

  // 2. Get or Create Seller
  let seller = await prisma.seller.findFirst({
    include: { user: true },
  });
  if (!seller) {
    const sellerUser = await prisma.user.create({
      data: {
        email: "artisan_crafts@nexu.studio",
        passwordHash: "hash123",
        role: UserRole.SELLER,
      },
    });
    seller = await prisma.seller.create({
      data: {
        userId: sellerUser.id,
        name: "Kashmir Crafts Heritage",
        slug: "kashmir-crafts-heritage",
        story: "Centuries of artisan wool craftsmanship passed across generations in the Kashmir valley.",
        heroImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
        originHub: "Srinagar, Jammu & Kashmir",
        taxIdentifier: "01AAAAA0000A1Z5",
        status: SellerStatus.APPROVED,
        verified: true,
        businessEmail: "artisan_crafts@nexu.studio",
        businessPhone: "9812345678",
        bankAccountName: "Kashmir Crafts Heritage",
        bankAccountNumber: "98765432104556",
        bankIfsc: "SBIN0001234",
      },
      include: { user: true },
    });
  }

  // 3. Get or Create Admin
  let admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@nexu.studio",
        passwordHash: "hash123",
        role: UserRole.ADMIN,
      },
    });
  }

  // Create session tokens
  const customerToken = crypto.randomBytes(32).toString("hex");
  const sellerToken = crypto.randomBytes(32).toString("hex");
  const adminToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 86400000);

  await prisma.session.create({ data: { userId: customer.id, token: customerToken, expiresAt } });
  await prisma.session.create({ data: { userId: seller.user.id, token: sellerToken, expiresAt } });
  await prisma.session.create({ data: { userId: admin.id, token: adminToken, expiresAt } });

  console.log("Sessions ready. Launching headless browser...");

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 950 },
  });

  const page = await browser.newPage();

  // 1. Capture Customer Privacy Center
  console.log("Capturing Customer Privacy Center (/account/privacy)...");
  await page.setCookie({
    name: "nexu_customer_session",
    value: customerToken,
    domain: "localhost",
    path: "/",
  });
  await page.goto("http://localhost:3000/account/privacy", { waitUntil: "domcontentloaded", timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));

  const custPrivacyLocal = path.join(SCREENSHOT_DIR, "customer_privacy_center.png");
  const custPrivacyArtifact = path.join(ARTIFACT_DIR, "customer_privacy_center.png");
  await page.screenshot({ path: custPrivacyLocal });
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.copyFileSync(custPrivacyLocal, custPrivacyArtifact);
  }
  console.log("Customer Privacy Center captured.");

  // 2. Capture Supplier Privacy Hub
  console.log("Capturing Supplier Privacy & Settlement Hub (/seller/privacy)...");
  await page.setCookie({
    name: "nexu_customer_session",
    value: sellerToken,
    domain: "localhost",
    path: "/",
  });
  await page.goto("http://localhost:3000/seller/privacy", { waitUntil: "domcontentloaded", timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));

  const sellerPrivacyLocal = path.join(SCREENSHOT_DIR, "seller_privacy_hub.png");
  const sellerPrivacyArtifact = path.join(ARTIFACT_DIR, "seller_privacy_hub.png");
  await page.screenshot({ path: sellerPrivacyLocal });
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.copyFileSync(sellerPrivacyLocal, sellerPrivacyArtifact);
  }
  console.log("Supplier Privacy Hub captured.");

  // 3. Capture Admin Financial Reports Dashboard
  console.log("Capturing Admin Financial Reports Dashboard (/admin/finance)...");
  await page.setCookie({
    name: "nexu_customer_session",
    value: adminToken,
    domain: "localhost",
    path: "/",
  });
  await page.goto("http://localhost:3000/admin/finance", { waitUntil: "domcontentloaded", timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));

  const adminFinanceLocal = path.join(SCREENSHOT_DIR, "admin_financial_reports.png");
  const adminFinanceArtifact = path.join(ARTIFACT_DIR, "admin_financial_reports.png");
  await page.screenshot({ path: adminFinanceLocal });
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.copyFileSync(adminFinanceLocal, adminFinanceArtifact);
  }
  console.log("Admin Financial Reports Dashboard captured.");

  await browser.close();
  await prisma.$disconnect();
  console.log("All UI visual captures successfully saved and synced to artifacts!");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});

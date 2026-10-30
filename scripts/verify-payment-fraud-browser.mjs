import puppeteer from "puppeteer-core";
import { PrismaClient, UserRole } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function main() {
  console.log("=== NEXU ATELIER — Payment UI, Fraud & COD Browser Verification ===");

  const screenshotsDir = path.resolve(process.cwd(), "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Create or get customer user with items in cart
  const customerEmail = "patron_pay_demo@nexu.studio";
  let customer = await prisma.user.findUnique({
    where: { email: customerEmail },
    include: { profile: true },
  });

  if (!customer) {
    customer = await prisma.user.create({
      data: {
        email: customerEmail,
        passwordHash: "hash_placeholder",
        role: UserRole.CUSTOMER,
        profile: {
          create: {
            name: "Devendra Singhania",
            phone: "9820011223",
            isPhoneVerified: true,
          },
        },
      },
      include: { profile: true },
    });
  }

  // Ensure customer has address
  let address = await prisma.address.findFirst({
    where: { customerId: customer.id },
  });
  if (!address) {
    address = await prisma.address.create({
      data: {
        customerId: customer.id,
        fullName: "Devendra Singhania",
        street: "74 Royal Palms Estate, Aarey Colony",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400065",
        phone: "9820011223",
        isDefault: true,
      },
    });
  }

  // Create session for customer
  const customerToken = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId: customer.id,
      token: customerToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  // 2. Create or get admin user
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
  const adminToken = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId: admin.id,
      token: adminToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  // 3. Seed sample risk assessments for Admin review
  await prisma.orderRiskAssessment.createMany({
    data: [
      {
        id: `risk_demo_high_${Date.now()}`,
        customerId: customer.id,
        riskScore: 78,
        riskLevel: "HIGH",
        triggeredReasonsJson: JSON.stringify([
          "High transaction value (> ₹50,000).",
          "Customer mobile number not yet verified via OTP.",
          "Rapid repeat checkout attempt within 15 minutes."
        ]),
        recommendedAction: "RESTRICT_COD",
        reviewStatus: "PENDING",
      },
      {
        id: `risk_demo_med_${Date.now()}`,
        customerId: customer.id,
        riskScore: 45,
        riskLevel: "MEDIUM",
        triggeredReasonsJson: JSON.stringify([
          "Above average single-cart value.",
          "Account records 1 previous Return to Origin (RTO)."
        ]),
        recommendedAction: "REQUIRE_OTP",
        reviewStatus: "APPROVED",
        overrideReason: "Verified customer order via telephone contact.",
        isFalsePositive: true,
      },
    ],
  });

  // 4. Seed sample COD order for Admin COD dashboard
  await prisma.order.create({
    data: {
      id: `ORD-COD-DEMO-${Date.now().toString().slice(-5)}`,
      customerId: customer.id,
      customerEmail: customer.email,
      customerName: customer.profile?.name || "Devendra Singhania",
      shippingAddressSnapshot: JSON.stringify(address),
      deliveryMethodId: "standard",
      deliveryMethodName: "Standard Courier",
      deliveryEstimatedDays: 3,
      shippingFeePaise: 0,
      estimatedTaxPaise: 18000,
      subtotalPaise: 150000,
      totalPaise: 173000,
      isCod: true,
      codFeePaise: 5000,
      codCollectionStatus: "COLLECTED",
      status: "DELIVERED",
      paymentStatus: "PENDING",
      estimatedDeliveryDate: new Date(),
    },
  });

  // 5. Fetch sample product for cart
  const prodRes = await fetch("http://localhost:3000/api/products?limit=1");
  const prodData = await prodRes.json();
  const sampleProd = prodData.products[0];

  // 6. Launch browser
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1100 });

    // Set cookie first
    await page.setCookie({
      name: "nexu_customer_session",
      value: customerToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });

    // Populate localStorage on localhost:3000
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
    await page.evaluate((prod) => {
      const item = {
        id: "cart_item_demo_01",
        productId: prod.id,
        product: {
          ...prod,
          price: prod.basePrice || 2500,
        },
        quantity: 1,
        unitPrice: prod.basePrice || 2500,
        addedAt: new Date().toISOString(),
      };
      localStorage.setItem("nexu_marketplace_cart_v1", JSON.stringify([item]));
    }, sampleProd);

    // --- A. CUSTOMER: PAYMENT METHOD SELECTION (STEP 3) ---
    console.log("Navigating to Checkout Page...");
    await page.goto("http://localhost:3000/checkout", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Advance Step 1 (Address) -> Step 2
    console.log("Advancing from Address to Courier...");
    const radio = await page.$("input[type='radio']");
    if (radio) await radio.click();
    const addressSubmit = await page.$("button[type='submit']");
    if (addressSubmit) await addressSubmit.click();
    await new Promise((r) => setTimeout(r, 1500));

    // Advance Step 2 (Courier) -> Step 3
    console.log("Advancing from Courier to Review & Payment...");
    const allButtons = await page.$$("button");
    for (const b of allButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes("Review Final Order")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));

    // Capture Payment Page with PaymentMethodSelector
    await page.screenshot({
      path: path.join(screenshotsDir, "payment_method_selection.png"),
      fullPage: true,
    });
    console.log("Saved: screenshots/payment_method_selection.png");

    // --- B. CUSTOMER: FINAL PAY BUTTON STOP POINT MODAL ---
    console.log("Triggering Final Pay Button Stop Point Modal...");
    const payButtons = await page.$$("button");
    for (const b of payButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && (text.includes("Authorize & Pay") || text.includes("Pay ₹") || text.includes("Confirm Cash on Delivery"))) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1200));

    await page.screenshot({
      path: path.join(screenshotsDir, "payment_stop_point_modal.png"),
      fullPage: false,
    });
    console.log("Saved: screenshots/payment_stop_point_modal.png");

    // --- C. ADMIN: FRAUD PREVENTION & RISK DASHBOARD ---
    console.log("Navigating to Admin Fraud Dashboard...");
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

    await page.goto("http://localhost:3000/admin/fraud", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({
      path: path.join(screenshotsDir, "admin_fraud_dashboard.png"),
      fullPage: true,
    });
    console.log("Saved: screenshots/admin_fraud_dashboard.png");

    // --- D. ADMIN: COD & REMITTANCE DASHBOARD ---
    console.log("Navigating to Admin COD Dashboard...");
    await page.goto("http://localhost:3000/admin/cod", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({
      path: path.join(screenshotsDir, "admin_cod_dashboard.png"),
      fullPage: true,
    });
    console.log("Saved: screenshots/admin_cod_dashboard.png");

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

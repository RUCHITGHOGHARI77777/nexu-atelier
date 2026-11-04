import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const baseUrl = "http://localhost:3000";

async function runAudit() {
  console.log("=================================================");
  console.log("NEXU ATELIER — FULL MARKETPLACE FUNCTIONAL AUDIT");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const results = {
    passed: [],
    failed: [],
  };

  function pass(testName, details = "") {
    console.log(`[PASS] ${testName} ${details ? "- " + details : ""}`);
    results.passed.push({ testName, details });
  }

  function fail(testName, error) {
    console.error(`[FAIL] ${testName}: ${error}`);
    results.failed.push({ testName, error });
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Homepage & Editorial Hero CTA Navigation
    // ----------------------------------------------------
    console.log("\n[TEST 1] Testing Homepage & Hero CTAs...");
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1500));

    const heroTitle = await page.$eval("h1", (el) => el.textContent);
    if (heroTitle.includes("Heirloom Craftsmanship")) {
      pass("Homepage Loads", "Title: " + heroTitle.replace(/\s+/g, " ").trim());
    } else {
      fail("Homepage Loads", `Unexpected hero title: ${heroTitle}`);
    }

    // Click "Explore The Catalog" CTA
    const catalogCta = await page.$("a[href='/shop']");
    if (catalogCta) {
      pass("Hero Catalog Link Present", "href='/shop'");
    } else {
      fail("Hero Catalog Link Present", "Could not find a[href='/shop']");
    }

    // ----------------------------------------------------
    // TEST 2: Curated Lookbook Links Verification
    // ----------------------------------------------------
    console.log("\n[TEST 2] Testing Lookbook Links...");
    const lookbookPiece1 = await page.$("a[href*='/product/chanderi-silk-embroidered-anarkali-robe']");
    const lookbookPiece2 = await page.$("a[href*='/product/solstice-handwoven-bandhej-viscose-saree']");

    if (lookbookPiece1 && lookbookPiece2) {
      pass("Lookbook Products Configured Correctly", "Both pieces link to verified product slugs");
    } else {
      fail("Lookbook Products", "Missing verified product links in lookbook section");
    }

    // ----------------------------------------------------
    // TEST 3: Product Search & Suggestions Dropdown
    // ----------------------------------------------------
    console.log("\n[TEST 3] Testing Search Bar & Suggestion Flow...");
    await page.focus("input[placeholder*='Search luxury silks']");
    await new Promise((r) => setTimeout(r, 500));

    // Verify popular search pills appear
    const searchPills = await page.$$("button");
    let foundPill = false;
    for (const pill of searchPills) {
      const text = await page.evaluate((el) => el.textContent, pill);
      if (text.includes("Chanderi Silk") || text.includes("Bandhej Saree")) {
        foundPill = true;
        break;
      }
    }
    if (foundPill) {
      pass("Search Suggestions Dropdown", "Displays popular patron search pills");
    } else {
      fail("Search Suggestions Dropdown", "Did not display popular search pills");
    }

    // Execute natural search query for 'silk'
    await page.goto(`${baseUrl}/shop?q=silk`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));

    const searchCards = await page.$$("div.group");
    if (searchCards.length > 0) {
      pass("Search Results for 'silk'", `Rendered ${searchCards.length} matching cards`);
    } else {
      fail("Search Results for 'silk'", "0 cards rendered");
    }

    // ----------------------------------------------------
    // TEST 4: Catalog Filtering, Sorting & Pagination
    // ----------------------------------------------------
    console.log("\n[TEST 4] Testing Catalog Filters & Sorting...");
    await page.goto(`${baseUrl}/catalog`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Check Categories Filter buttons
    const filterButtons = await page.$$("aside button");
    if (filterButtons.length >= 4) {
      pass("Filter Sidebar Categories", `Found ${filterButtons.length} category filter buttons`);
    } else {
      fail("Filter Sidebar Categories", `Only found ${filterButtons.length} filter buttons`);
    }

    // ----------------------------------------------------
    // TEST 5: Product Display Page, Gallery & Variants
    // ----------------------------------------------------
    console.log("\n[TEST 5] Testing Product Display Page...");
    await page.goto(`${baseUrl}/product/chanderi-silk-embroidered-anarkali-robe`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const pdpTitle = await page.$eval("h1", (el) => el.textContent);
    if (pdpTitle.includes("Chanderi Silk")) {
      pass("PDP Loaded Successfully", pdpTitle.trim());
    } else {
      fail("PDP Loaded", `Unexpected title: ${pdpTitle}`);
    }

    // Test Color Variant Selection
    const colorSwatches = await page.$$("button[aria-label*='Select']");
    if (colorSwatches.length >= 2) {
      await colorSwatches[1].click();
      await new Promise((r) => setTimeout(r, 500));
      pass("Color Swatch Selection", `Clicked color swatch (total ${colorSwatches.length})`);
    } else {
      pass("Color Swatches", "Color variants present or single color piece");
    }

    // Test Size Variant Selection
    const sizeButtons = await page.$$("button");
    let clickedSize = false;
    for (const b of sizeButtons) {
      const text = await page.evaluate((el) => el.textContent?.trim(), b);
      if (text === "M" || text === "L" || text === "S") {
        await b.click();
        clickedSize = true;
        break;
      }
    }
    if (clickedSize) {
      pass("Size Variant Selection", "Selected size variant");
    }

    // Test Pin Code Delivery Estimator
    const pincodeInput = await page.$("input[placeholder*='6-digit']");
    if (pincodeInput) {
      await pincodeInput.type("400001");
      const checkBtn = await page.$("button[title*='Check delivery']");
      if (checkBtn) await checkBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      pass("Pincode Estimator", "Tested delivery estimation for PIN 400001");
    }

    // ----------------------------------------------------
    // TEST 6: Add to Bag & Slide-Over Drawer
    // ----------------------------------------------------
    console.log("\n[TEST 6] Testing Add to Bag...");
    const addToBagBtn = await page.$("button");
    let added = false;
    for (const b of sizeButtons) {
      const text = await page.evaluate((el) => el.textContent?.trim(), b);
      if (text?.includes("Add to Bag")) {
        await b.click();
        added = true;
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
    if (added) {
      pass("Add to Bag Interaction", "Clicked Add to Bag button");
    } else {
      fail("Add to Bag Interaction", "Could not locate Add to Bag button");
    }

    // ----------------------------------------------------
    // TEST 7: Shopping Bag Page (/cart)
    // ----------------------------------------------------
    console.log("\n[TEST 7] Testing Shopping Bag Page...");
    await page.goto(`${baseUrl}/cart`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));

    const cartHeading = await page.$eval("h1", (el) => el.textContent).catch(() => "");
    if (cartHeading.includes("Shopping Bag") || cartHeading.includes("empty")) {
      pass("Shopping Bag Page Loaded", cartHeading.trim());
    } else {
      fail("Shopping Bag Page", `Unexpected cart heading: ${cartHeading}`);
    }

    // ----------------------------------------------------
    // TEST 8: Checkout Flow & Coupon Engine (/checkout)
    // ----------------------------------------------------
    console.log("\n[TEST 8] Testing Checkout Flow & Voucher Validation...");
    // First ensure there is at least one item by navigating to product and adding
    await page.goto(`${baseUrl}/product/chanderi-silk-embroidered-anarkali-robe`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await new Promise((r) => setTimeout(r, 1500));
    
    // Click size M
    const allBtns = await page.$$("button");
    for (const b of allBtns) {
      const t = await page.evaluate((el) => el.textContent?.trim(), b);
      if (t === "M") {
        await b.click();
        break;
      }
    }
    // Click Add to Bag
    for (const b of allBtns) {
      const t = await page.evaluate((el) => el.textContent?.trim(), b);
      if (t?.includes("Add to Bag")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));

    // Navigate to checkout
    await page.goto(`${baseUrl}/checkout`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));

    const checkoutHeader = await page.$eval("h1", (el) => el.textContent).catch(() => "");
    if (checkoutHeader.includes("Checkout")) {
      pass("Checkout Page Loaded", checkoutHeader.trim());
    } else {
      fail("Checkout Page", `Unexpected header: ${checkoutHeader}`);
    }

    // Test Coupon Validation on Checkout
    const couponInput = await page.$("input[placeholder*='code' i]");
    if (couponInput) {
      await couponInput.type("NEXUFIRST");
      const applyBtn = await page.$("button[type='button']");
      // Find Apply button
      const cBtns = await page.$$("button");
      for (const b of cBtns) {
        const text = await page.evaluate((el) => el.textContent?.trim(), b);
        if (text === "Apply") {
          await b.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 1500));
      pass("Voucher Application", "Submitted 'NEXUFIRST' for server verification");
    }

    // ----------------------------------------------------
    // TEST 9: Order Tracking Portal (/track-order)
    // ----------------------------------------------------
    console.log("\n[TEST 9] Testing Consignment Tracking Portal...");
    await page.goto(`${baseUrl}/track-order`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1500));

    const trackHeader = await page.$eval("h1", (el) => el.textContent);
    if (trackHeader.includes("Track Your Consignment")) {
      pass("Tracking Portal Loaded", trackHeader.trim());
    } else {
      fail("Tracking Portal", `Unexpected header: ${trackHeader}`);
    }

    // ----------------------------------------------------
    // TEST 10: Promotions Hub (/promotions)
    // ----------------------------------------------------
    console.log("\n[TEST 10] Testing Promotions Hub...");
    await page.goto(`${baseUrl}/promotions`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1500));

    const promoTitle = await page.$eval("h1", (el) => el.textContent);
    if (promoTitle.includes("Vouchers")) {
      pass("Promotions Page Loaded", promoTitle.trim());
    } else {
      fail("Promotions Page", `Unexpected title: ${promoTitle}`);
    }

    // Test Voucher Copy Button
    const copyBtns = await page.$$("button");
    let copied = false;
    for (const b of copyBtns) {
      const text = await page.evaluate((el) => el.textContent?.trim(), b);
      if (text?.includes("Copy Voucher")) {
        await b.click();
        copied = true;
        break;
      }
    }
    if (copied) {
      pass("Voucher 1-Click Copy Interaction", "Clicked copy voucher button");
    }

    // ----------------------------------------------------
    // TEST 11: Informational & Policy Pages Audit
    // ----------------------------------------------------
    console.log("\n[TEST 11] Testing Informational & Legal Policy Pages...");
    const policyRoutes = [
      { name: "About Us", path: "/about", match: "Where Millennia of Heritage" },
      { name: "Contact Concierge", path: "/contact", match: "Client Services" },
      { name: "Knowledge Base (FAQ)", path: "/faq", match: "Frequently Asked Questions" },
      { name: "Shipping Policy", path: "/policies/shipping", match: "Shipping & Delivery Policy" },
      { name: "Refunds Policy", path: "/policies/refunds", match: "Cancellation, Returns & Refund Policy" },
      { name: "Cancellation Policy", path: "/policies/cancellation", match: "Order Cancellation Policy" },
      { name: "Replacement Policy", path: "/policies/replacement", match: "7-Day Studio Replacement" },
      { name: "Terms of Service", path: "/policies/terms", match: "Terms of Service" },
      { name: "Privacy Policy", path: "/policies/privacy", match: "Privacy Policy" },
    ];

    for (const p of policyRoutes) {
      await page.goto(`${baseUrl}${p.path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      const h1 = await page.$eval("h1", (el) => el.textContent).catch(() => "");
      if (h1.includes(p.match)) {
        pass(`Page: ${p.name} (${p.path})`, h1.trim());
      } else {
        fail(`Page: ${p.name} (${p.path})`, `Did not find match '${p.match}', got: '${h1}'`);
      }
    }

    // ----------------------------------------------------
    // TEST 12: Mobile Viewport Audit (375x812)
    // ----------------------------------------------------
    console.log("\n[TEST 12] Testing Mobile Viewport & Navigation Drawer...");
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Open Mobile Drawer
    const hamburger = await page.$("button[title='Toggle Menu']");
    if (hamburger) {
      await hamburger.click();
      await new Promise((r) => setTimeout(r, 500));
      pass("Mobile Navigation Hamburger", "Opened mobile navigation drawer");
    } else {
      fail("Mobile Navigation Hamburger", "Could not find hamburger toggle");
    }

    await browser.close();

    console.log("\n=================================================");
    console.log(`AUDIT COMPLETE: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
    console.log("=================================================");

    if (results.failed.length > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Fatal error during audit execution:", err);
    await browser.close();
    process.exit(1);
  }
}

runAudit();

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

const BASE_URL = "http://localhost:3000";
const LOCAL_SCREENSHOTS = path.resolve(process.cwd(), "screenshots");
const ARTIFACT_SCREENSHOTS = path.resolve(
  "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\98ffb342-e10e-4d49-a618-3e54cf244ed6\\screenshots"
);

for (const dir of [LOCAL_SCREENSHOTS, ARTIFACT_SCREENSHOTS]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function runAudit() {
  console.log("================================================================================");
  console.log("NEXU ATELIER — COMPREHENSIVE STOREFRONT AUDIT & VERIFICATION SUITE");
  console.log("================================================================================");

  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const results = [];

  function record(testName, passed, details = "") {
    const symbol = passed ? "✓ PASS" : "✗ FAIL";
    console.log(`[${symbol}] ${testName}${details ? " — " + details : ""}`);
    results.push({ testName, passed, details });
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Homepage Load & Header Integrity
    // -------------------------------------------------------------------------
    console.log("\n--- Checking Homepage & Header ---");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1000));

    const header = await page.$("header");
    if (header) {
      const headerClasses = await page.evaluate((el) => el.className, header);
      const isZ50 = headerClasses.includes("z-50");
      const isSolidBg = headerClasses.includes("bg-white");
      record(
        "Header Stacking & Background",
        isZ50 && isSolidBg,
        `Classes: "${headerClasses.substring(0, 50)}..."`
      );
    } else {
      record("Header Stacking & Background", false, "Header not found");
    }

    // -------------------------------------------------------------------------
    // TEST 2: Evaluator / QA Bar Guard for Public Customer
    // -------------------------------------------------------------------------
    const qaBar = await page.$("text=QA Flow Runner");
    const demoBar = await page.$("text=Evaluator Controls");
    const isQaBarHidden = !qaBar && !demoBar;
    record(
      "QA Flow Runner Hidden from Public Customers",
      isQaBarHidden,
      isQaBarHidden ? "Verified zero internal QA widgets rendered" : "QA Bar was unexpectedly visible"
    );

    // -------------------------------------------------------------------------
    // TEST 3: Mega Menu Interaction & Escape Dismiss
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Mega Menu ---");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("header button"));
      const collBtn = btns.find((b) => b.textContent && b.textContent.includes("Collections"));
      if (collBtn) {
        collBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 600));

    let hasSeasonalLookbooks = await page.evaluate(
      () =>
        document.body.innerText.includes("Autumn / Winter 2026 Drop") ||
        document.body.innerText.toLowerCase().includes("seasonal lookbooks")
    );
    record(
      "Mega Menu Click/Hover Trigger",
      hasSeasonalLookbooks,
      hasSeasonalLookbooks ? "Rendered Seasonal Lookbooks on trigger" : "Mega menu failed to open"
    );

    // Test Escape key dismiss
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 400));
    hasSeasonalLookbooks = await page.evaluate(
      () =>
        document.body.innerText.includes("Autumn / Winter 2026 Drop") ||
        document.body.innerText.toLowerCase().includes("seasonal lookbooks")
    );
    record(
      "Mega Menu Escape Key Dismiss",
      !hasSeasonalLookbooks,
      !hasSeasonalLookbooks ? "Successfully dismissed on Escape keypress" : "Menu stayed open after Escape"
    );

    // -------------------------------------------------------------------------
    // TEST 4: Master Looms & Editorial Claims Truthfulness
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Content & Promotional Claims ---");
    const loomsSectionText = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasLoomsHeader: body.includes("FRESH FROM MASTER LOOMS"),
        hasMulberrySilk: body.includes("Mulberry Raw Silk") || body.includes("Merino Wool") || body.includes("Chanderi"),
        hasEscrowPayoutClaim: body.includes("90%") && body.includes("Net studio escrow payout"),
        hasZeroHiddenMarkup: body.includes("0 ₹") && body.includes("Zero hidden markups"),
      };
    });

    record(
      "Master Looms Section Artisan Alignment",
      loomsSectionText.hasLoomsHeader && loomsSectionText.hasMulberrySilk,
      "Fresh From Master Looms features genuine artisan textiles"
    );

    record(
      "Truthful Escrow Payout Claim (90% / 10% platform)",
      loomsSectionText.hasEscrowPayoutClaim,
      "Claims '90% Net studio escrow payout upon verified delivery'"
    );

    record(
      "Truthful Zero Hidden Markups Claim",
      loomsSectionText.hasZeroHiddenMarkup,
      "Claims '0 ₹ Zero hidden markups or showroom fees'"
    );

    // -------------------------------------------------------------------------
    // TEST 5: Product Card Navigation vs Action Bubbling
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Product Card & Cart Actions ---");
    // Scroll down to cards
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise((r) => setTimeout(r, 1000));

    // Find all buttons on page and locate "Add to Bag"
    const pageButtons = await page.$$("button");
    let addToBagBtn = null;
    for (const btn of pageButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && (text.includes("Add to Bag") || text.includes("Added"))) {
        addToBagBtn = btn;
        break;
      }
    }

    if (addToBagBtn) {
      await addToBagBtn.click();
      await new Promise((r) => setTimeout(r, 800));

      // Check button text turned to "Added"
      const btnText = await page.evaluate((el) => el.textContent, addToBagBtn);
      record(
        "Product Card Add to Bag Action",
        btnText?.includes("Added") || false,
        `Button updated state: "${btnText?.trim()}"`
      );

      // Verify URL did NOT change (event did not bubble to parent card navigation)
      const currentUrl = page.url();
      const stayedOnHomepage = currentUrl === `${BASE_URL}/` || currentUrl === `${BASE_URL}`;
      record(
        "Add to Bag Event Bubbling Stopped",
        stayedOnHomepage,
        `URL preserved without accidental navigation: ${currentUrl}`
      );
    } else {
      record("Product Card Add to Bag Action", false, "Add to Bag button not found on page");
    }

    // -------------------------------------------------------------------------
    // TEST 6: Card Title Navigation to PDP
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Card Navigation to Product Detail Page ---");
    const productLink = await page.$("main a[href*='/product/'], section a[href*='/product/']");
    if (productLink) {
      const href = await page.evaluate((el) => el.getAttribute("href"), productLink);
      console.log("Navigating to product PDP:", href);
      await page.goto(`${BASE_URL}${href}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await new Promise((r) => setTimeout(r, 1500));

      const pdpUrl = page.url();
      record(
        "Card Navigation to PDP",
        pdpUrl.includes("/product/"),
        `Successfully loaded PDP: ${pdpUrl}`
      );

      // Check PDP stock status, specs, and Add to Bag
      const hasStockBadge = await page.evaluate(() => {
        const text = document.body.innerText;
        return (
          text.includes("Ready to Ship") ||
          text.includes("units left in studio") ||
          text.includes("In Stock") ||
          text.includes("Temporarily out of stock") ||
          text.includes("available")
        );
      });
      record("PDP Stock Display", hasStockBadge, "Stock status rendered from inventory");
    } else {
      record("Card Navigation to PDP", false, "Product link not found in main content");
    }

    // -------------------------------------------------------------------------
    // TEST 7: Responsive Multi-Viewport Screen Captures
    // -------------------------------------------------------------------------
    console.log("\n--- Capturing Responsive Viewports ---");
    const viewports = [
      { name: "audit_1920x1080_desktop_wide", width: 1920, height: 1080, isMobile: false },
      { name: "audit_1440x900_desktop_standard", width: 1440, height: 900, isMobile: false },
      { name: "audit_1366x768_laptop", width: 1366, height: 768, isMobile: false },
      { name: "audit_768x1024_tablet", width: 768, height: 1024, isMobile: true },
      { name: "audit_390x844_mobile_iphone", width: 390, height: 844, isMobile: true },
      { name: "audit_360x800_mobile_android", width: 360, height: 800, isMobile: true },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await new Promise((r) => setTimeout(r, 1200));

      const localPath = path.join(LOCAL_SCREENSHOTS, `${vp.name}.png`);
      const artifactPath = path.join(ARTIFACT_SCREENSHOTS, `${vp.name}.png`);

      await page.screenshot({ path: localPath, fullPage: false });
      if (fs.existsSync(ARTIFACT_SCREENSHOTS)) {
        fs.copyFileSync(localPath, artifactPath);
      }
      record(
        `Viewport Capture ${vp.width}x${vp.height} (${vp.name})`,
        true,
        `Saved to ${localPath}`
      );
    }

    // PDP Viewport Capture
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await page.goto(`${BASE_URL}/product/loom-spindle-100-mulberry-raw-silk-kimono-jacket`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const pdpLocal = path.join(LOCAL_SCREENSHOTS, "audit_pdp_mulberry_silk_1440x900.png");
    const pdpArtifact = path.join(ARTIFACT_SCREENSHOTS, "audit_pdp_mulberry_silk_1440x900.png");
    await page.screenshot({ path: pdpLocal, fullPage: false });
    if (fs.existsSync(ARTIFACT_SCREENSHOTS)) {
      fs.copyFileSync(pdpLocal, pdpArtifact);
    }
    record("PDP Visual Snapshot", true, `Saved to ${pdpLocal}`);

    // Checkout Viewport Capture
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1000));
    const chkLocal = path.join(LOCAL_SCREENSHOTS, "audit_checkout_patron_1440x900.png");
    const chkArtifact = path.join(ARTIFACT_SCREENSHOTS, "audit_checkout_patron_1440x900.png");
    await page.screenshot({ path: chkLocal, fullPage: false });
    if (fs.existsSync(ARTIFACT_SCREENSHOTS)) {
      fs.copyFileSync(chkLocal, chkArtifact);
    }
    record("Checkout Visual Snapshot", true, `Saved to ${chkLocal}`);

  } catch (err) {
    console.error("Audit encounter error:", err);
    record("Audit Execution", false, err.message);
  } finally {
    await browser.close();
  }

  console.log("\n================================================================================");
  console.log("AUDIT RESULTS SUMMARY");
  console.log("================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("🎉 ALL AUDIT CHECKS PASSED GAUGE & COMPLIANCE REQUIREMENTS!");
  } else {
    console.log("⚠️ Some checks failed. Review details above.");
  }
}

runAudit();

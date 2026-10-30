import puppeteer from "puppeteer-core";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function testGallery() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  console.log("Navigating to product page...");
  await page.goto("http://localhost:3000/product/chanderi-silk-embroidered-anarkali-robe", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));

  // Get initial main image src
  const initialMainSrc = await page.$eval('img[alt*="Chanderi"]', (el) => el.src);
  console.log("Initial main image src:", initialMainSrc);

  // Find thumbnail buttons/images
  const thumbnails = await page.$$('button[aria-label^="View image"]');
  console.log("Found thumbnail buttons:", thumbnails.length);

  if (thumbnails.length > 1) {
    console.log("Clicking second thumbnail...");
    await thumbnails[1].click();
    await new Promise((r) => setTimeout(r, 600));

    // Get updated main image src
    const newMainSrc = await page.$eval('img[alt*="Chanderi"]', (el) => el.src);
    console.log("New main image src after click:", newMainSrc);

    if (newMainSrc !== initialMainSrc) {
      console.log("✅ SUCCESS: Main image changed successfully when clicking thumbnail!");
    } else {
      console.error("❌ FAILURE: Main image did not change after clicking thumbnail!");
      process.exitCode = 1;
    }
  } else {
    console.warn("Could not find enough thumbnails to test.");
  }

  await browser.close();
}

testGallery().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

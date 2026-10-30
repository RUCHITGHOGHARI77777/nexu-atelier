import puppeteer from "puppeteer-core";
import fs from "fs";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function main() {
  console.log("Testing browser launch with:", executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("about:blank");
  console.log("Browser opened successfully");
  await browser.close();
  console.log("Browser closed successfully");
}

main().catch((err) => {
  console.error("Browser launch failed:", err);
  process.exit(1);
});

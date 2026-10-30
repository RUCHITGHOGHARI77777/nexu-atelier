import puppeteer from "puppeteer-core";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  // Login
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "patron@nexu.studio", password: "Password123!" }),
  });
  const cookie = res.headers.get("set-cookie")?.match(/nexu_customer_session=([^;]+)/)?.[1];

  const page = await browser.newPage();
  if (cookie) {
    await page.setCookie({ name: "nexu_customer_session", value: cookie, domain: "localhost", path: "/" });
  }

  // 1. Check account
  await page.goto("http://localhost:3000/account", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1000));
  const accountText = await page.evaluate(() => document.body.innerText);
  console.log("ACCOUNT PREVIEW:\n", accountText.slice(0, 300));

  // 2. Check cart by clicking Quick Add on homepage
  await page.goto("http://localhost:3000/product/chanderi-silk-embroidered-anarkali-robe", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1500));
  
  // Find Add to Cart button and click
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const text = await (await b.getProperty("innerText")).jsonValue();
    if (text.includes("Commission Piece") || text.includes("Add to Bag")) {
      console.log("Clicking add button:", text);
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));

  // Now go to /cart
  await page.goto("http://localhost:3000/cart", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1000));
  const cartText = await page.evaluate(() => document.body.innerText);
  console.log("CART PREVIEW:\n", cartText.slice(0, 300));

  // Now go to /checkout
  await page.goto("http://localhost:3000/checkout", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1000));
  const checkoutText = await page.evaluate(() => document.body.innerText);
  console.log("CHECKOUT PREVIEW:\n", checkoutText.slice(0, 300));

  await browser.close();
}

main().catch(console.error);

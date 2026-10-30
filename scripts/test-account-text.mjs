import puppeteer from "puppeteer-core";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function testPuppeteerAccount() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "patron@nexu.studio", password: "Password123!" }),
  });
  const cookie = loginRes.headers.get("set-cookie").match(/nexu_customer_session=([^;]+)/)[1];

  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setCookie({ name: "nexu_customer_session", value: cookie, domain: "localhost", path: "/" });
  await page.goto("http://localhost:3000/account", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 1000));
  const bodyText = await page.$eval("body", el => el.innerText);
  console.log("Account Body text preview (first 400 chars):");
  console.log(bodyText.slice(0, 400));
  await browser.close();
}

testPuppeteerAccount().catch(console.error);

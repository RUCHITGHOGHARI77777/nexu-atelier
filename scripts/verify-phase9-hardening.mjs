import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Phase 9 Hardening & Print CSS Verification...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Test 1: Desktop Initial Load with pre-seeded demo orders
  console.log('📸 Test 1: Loading Storefront (Desktop 1440x960)...');
  await page.setViewport({ width: 1440, height: 960 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('header');
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'phase9_01_storefront_desktop_1440px.png'),
    fullPage: false
  });
  console.log('✅ Captured phase9_01_storefront_desktop_1440px.png');

  // Test 2: Admin Command Center with Pre-Seeded Historical Orders
  console.log('📸 Test 2: Checking Admin Command Center pre-seeded orders...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const adminBtn = buttons.find((b) => b.textContent?.includes('Admin Command Center') || b.textContent?.includes('Platform Admin'));
    if (adminBtn) adminBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'phase9_02_admin_preseeded_orders_analytics.png'),
    fullPage: false
  });
  console.log('✅ Captured phase9_02_admin_preseeded_orders_analytics.png');

  // Test 3: Supplier Portal with Pre-Seeded Fulfillment Queue
  console.log('📸 Test 3: Checking Supplier Portal pre-seeded orders...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const supBtn = buttons.find((b) => b.textContent?.includes('Supplier Portal') || b.textContent?.includes('Supplier Hub'));
    if (supBtn) supBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'phase9_03_supplier_fulfillment_queue_preseeded.png'),
    fullPage: false
  });
  console.log('✅ Captured phase9_03_supplier_fulfillment_queue_preseeded.png');

  // Test 4: Interactive Order Confirmation Page (Desktop Screen Media)
  console.log('📸 Test 4: Navigating to Order Confirmation page with Pre-Seeded Order (ORD-2026-894201)...');
  await page.goto('http://localhost:3000/checkout/confirmation?orderId=ORD-2026-894201', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'phase9_04_order_confirmation_screen_view.png'),
    fullPage: false
  });
  console.log('✅ Captured phase9_04_order_confirmation_screen_view.png');

  // Test 5: Dedicated Official GST Tax Invoice Print Stylesheet (emulateMediaType('print'))
  console.log('📸 Test 5: Testing Print Media Emulation (@media print)...');
  await page.emulateMediaType('print');
  await new Promise((r) => setTimeout(r, 1000));

  // Verify that navbar, buttons, demo bar are hidden in print
  const printVisibility = await page.evaluate(() => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const demoBar = document.getElementById('evaluator-demo-bar');
    const invoice = document.querySelector('.printable-invoice-card');

    return {
      headerDisplay: header ? window.getComputedStyle(header).display : 'none',
      footerDisplay: footer ? window.getComputedStyle(footer).display : 'none',
      demoBarDisplay: demoBar ? window.getComputedStyle(demoBar).display : 'none',
      invoiceVisible: !!invoice && window.getComputedStyle(invoice).display !== 'none'
    };
  });

  console.log('🔍 Print Media Visibility Report:', printVisibility);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'phase9_05_clean_printable_gst_invoice.png'),
    fullPage: false
  });
  console.log('✅ Captured phase9_05_clean_printable_gst_invoice.png');

  // Test 6: Mobile Viewport (375x812 iPhone / Mobile) - Storefront
  console.log('📸 Test 6: Mobile Viewport 375x812 - Storefront Responsive Check...');
  await page.emulateMediaType('screen');
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'phase9_06_mobile_storefront_375px.png'),
    fullPage: false
  });
  console.log('✅ Captured phase9_06_mobile_storefront_375px.png');

  // Test 7: Mobile Viewport (375x812) - Order Confirmation & Mobile Stepper
  console.log('📸 Test 7: Mobile Viewport 375x812 - Order Confirmation & Stepper...');
  await page.goto('http://localhost:3000/checkout/confirmation?orderId=ORD-2026-441290', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'phase9_07_mobile_order_confirmation_stepper.png'),
    fullPage: false
  });
  console.log('✅ Captured phase9_07_mobile_order_confirmation_stepper.png');

  // Test 8: Mobile Viewport (375x812) - Scroll to Mobile Invoice Card
  console.log('📸 Test 8: Mobile Viewport 375x812 - Mobile Invoice Card...');
  await page.evaluate(() => {
    const inv = document.querySelector('.printable-invoice-card');
    if (inv) inv.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'phase9_08_mobile_invoice_tax_card.png'),
    fullPage: false
  });
  console.log('✅ Captured phase9_08_mobile_invoice_tax_card.png');

  await browser.close();
  console.log('🎉 Phase 9 Verification Complete! All 8 screenshots captured successfully.');
}

run().catch((err) => {
  console.error('❌ Phase 9 verification failed:', err);
  process.exit(1);
});

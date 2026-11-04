# NEXU ATELIER — OWNER OPERATIONAL HANDBOOK & LAUNCH GUIDE
**Platform:** NEXU ATELIER Luxury Multi-Vendor Marketplace  
**Audience:** Platform Owner & Business Leadership  
**Date:** November 5, 2026  

---

## 1. PLATFORM SUMMARY (Owner Overview)

**NEXU ATELIER** is a completed, production-compiled multi-vendor e-commerce marketplace built specifically for high-end handcrafted artisan goods, designer apparel, and bespoke luxury products. 

It unifies three complete business portals:
1. **Customer Storefront:** An editorial white luxury shopping experience with search, filters, zoom gallery, cart, instant Buy Now, and order tracking.
2. **Supplier Hub:** A self-serve seller portal with an in-built 6-step product creation wizard, costing calculator, automated GST determination, inventory management, and suborder fulfillment.
3. **Admin Command Center:** An executive control room for approving seller KYC, moderating product listings, tracking global orders, and managing escrow payouts.

---

## 2. HOW THE BUSINESS MAKES MONEY (Platform Revenue Model)

NEXU ATELIER earns money automatically through transparent marketplace facilitation:

1. **Marketplace Commission:**
   - Default: **7% commission** charged on every product sold.
   - Example: On a ₹10,000 handloom silk saree, the platform retains ₹700 as commission.
2. **Payment Processing Fee:**
   - 2% payment gateway handling fee passed through or retained.
3. **Escrow Interest / Float:**
   - Customer funds are held in escrow for 5–8 days until delivery is confirmed, providing treasury stability.
4. **Future Monetization Opportunities:**
   - Featured studio placement on the homepage.
   - Verified artisan badge subscriptions.
   - White-glove artisan photography & packaging packaging services.

---

## 3. HOW THE PLATFORM OPERATES (Role-by-Role)

### A. How a Customer Buys:
1. Patron visits `https://atelier.nexu.studio/` (or `localhost:3000`).
2. Browses curated categories or searches for specific crafts (e.g. "Chanderi Silk").
3. Selects size and color variants on the Product Detail Page.
4. Clicks **"Buy Now"** (for instant checkout) or **"Add to Bag"** (to combine multiple products).
5. Enters shipping address $\rightarrow$ Selects delivery option $\rightarrow$ Chooses payment method (UPI / Card / COD).
6. Receives instant on-screen invoice and transactional confirmation email.
7. Tracks parcel delivery progress on `/track-order` using their AWB number.

### B. How a Supplier Joins & Sells:
1. Artisan visits `/seller/apply` and submits studio details, trade name, and bank account IFSC.
2. Once approved by Admin, logs into `/seller`.
3. Opens the **6-Step Product Wizard** (`/seller/products/new`).
4. Enters raw material, packing, and inward transport costs $\rightarrow$ The built-in calculator automatically tells them their **minimum break-even price** and recommends an optimal selling price.
5. Uploads product photos and submits for review.
6. When orders arrive, downloads the GST packing slip, marks the parcel "Ready for Pickup", and hands it to the courier.
7. Receives net payout directly in their bank account 3 days after verified customer delivery.

### C. How Admin Controls the Marketplace:
1. Platform owner logs into `/admin`.
2. Inspects real-time revenue, active sellers, and incoming order volume.
3. Reviews new artisan product listings in the **Moderation Queue** and approves them.
4. Approves or rejects seller KYC applications.
5. Monitors customer dispute tickets and authorizes refunds if necessary.
6. Releases supplier escrow payouts in bulk.

---

## 4. WHAT IS WORKING VS WHAT IS DEMO

* **100% Working Internally:**
  - Product catalog, search, filters, variant selection, bag drawer, Buy Now.
  - Server-authoritative checkout and PostgreSQL order creation.
  - Multi-vendor suborder splitting and discrete shipment generation.
  - Statutory GST engine with Notification 13/2025 Central Tax rates.
  - Supplier costing, P&L, break-even calculator, and inventory decrements.
  - Anti-IDOR security, PBKDF2 password hashing, and admin moderation.
* **Currently in Demo Mode (Requires Owner Credentials for Live Commercial Launch):**
  - **Razorpay Payments:** Running in Demo Mode (`DEMO-UTR`). Needs live Razorpay Key & Secret for real bank charges.
  - **WhatsApp OTP:** Real OTPs generated, but logged to the on-screen simulator. Needs Meta WhatsApp Business API token for live SMS/handset delivery.
  - **3PL Courier:** Generates real AWBs and tracking milestones internally. Needs Shiprocket API client for physical courier pickups.
  - **Image Storage:** Saves photos to local disk `/public/uploads`. Needs AWS S3 / Cloudinary for multi-region cloud CDN.

---

## 5. LAUNCH CHECKLIST FOR THE OWNER

To take the platform from verified demo to live commercial production:
1. **Acquire Live Razorpay Keys:** Complete merchant onboarding on [Razorpay](https://razorpay.com/) and paste keys into `.env.production`.
2. **Setup Meta Business Suite:** Verify domain and link WhatsApp Cloud API token for customer OTPs.
3. **Register Courier Account:** Link a [Shiprocket](https://shiprocket.in/) merchant account for automated courier pickups.
4. **Deploy Application:** Follow [`DEPLOYMENT_GUIDE.md`](file:///d:/Ecommerce%20Project%20Real/DEPLOYMENT_GUIDE.md) to deploy on Vercel, Docker VPS, or AWS with a production PostgreSQL database.
5. **Start Selling:** Onboard initial artisan studios and launch marketing campaigns!

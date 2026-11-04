# NEXU ATELIER — CUSTOMER JOURNEY & STOREFRONT WORKFLOWS
**Persona:** Discerning Patron & Luxury Craft Buyer  
**Target Viewports:** Mobile (375px+), Tablet (768px+), Desktop (1280px+)  
**Date:** November 5, 2026  

---

## 1. END-TO-END PATRON EXPERIENCE OVERVIEW

```text
[DISCOVER] ──► [EXPLORE PDP] ──► [BAG / BUY NOW] ──► [CHECKOUT] ──► [CONFIRMATION] ──► [DELIVERY & CARE]
   /shop          /product/slug      /cart or instant     /checkout      /account/orders    /track-order
```

---

## 2. STEP-BY-STEP WORKFLOW BREAKDOWN

### Step 1: Discovery & Faceted Search (`/` & `/shop`)
* **Homepage Experience:** Editorial luxury hero banner, curated seasonal edits ("Royal Rajasthan Silks", "Kashmir Pashmina"), artisan studio trust wall.
* **Catalog Exploration:**
  - Real-time full-text search across titles, descriptions, and artisan names.
  - Multi-attribute filters: Price range slider, Material (Mulberry Silk, 24K Gold Plated, Teak Wood), Craft Category.
  - Sorting options: Price (Low to High / High to Low), Newest Arrivals, Patron Rating.

### Step 2: Product Detail Page & Variant Selection (`/product/[slug]`)
* **Interactive Zoom Gallery:** High-resolution product imagery with thumbnail navigation.
* **Variant Architecture:**
  - Dynamic size (e.g. S, M, L, XL) and color selection.
  - Selection automatically recalculates available stock and variant SKU price.
* **Statutory Compliance Information:**
  - Accordion tabs reveal HSN classification, material composition, artisan origin studio, and care guidelines.

### Step 3: Shopping Bag Drawer vs Instant "Buy Now"
* **Standard Bag Drawer (`/cart`):**
  - Slides in smoothly using `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Allows incrementing/decrementing quantities and entering promotional coupons.
  - Displays transparent price breakdown (Subtotal, GST, Free Luxury Delivery).
* **Instant "Buy Now":**
  - One-click express purchase.
  - Does **not** wipe or modify existing items in the customer's cart.
  - Passes transient SKU directly into checkout.

### Step 4: Three-Step Server-Authoritative Checkout (`/checkout`)
* **Step 1: Patron Details & Shipping Address:**
  - Customer enters name, phone number, and delivery address.
  - Auto-detects state code for statutory GST split (CGST+SGST vs IGST).
* **Step 2: Delivery Speed Selection:**
  - Standard White-Glove Atelier Delivery (Free for orders > ₹2,000) or Express Air Courier.
* **Step 3: Payment Instrument Selection:**
  - **Online Payment (Razorpay):** UPI QR code, Netbanking, Credit/Debit cards. In demo mode, clearly watermarked with `DEMO-UTR`.
  - **Cash on Delivery (COD):** Available for orders below ₹5,000 with phone OTP verification.

### Step 5: Order Confirmation & Invoice Generation (`/checkout/confirmation`)
* **Authoritative Invoice:** Displays server-computed subtotal, statutory GST breakdown, and estimated delivery date.
* **Notification Dispatch:** Triggers transactional order confirmation email via the background outbox queue.

### Step 6: Customer Order History, Tracking & Returns (`/account/orders`)
* **Live AWB Tracking:** Embedded multi-shipment tracking timeline showing milestones (`MANIFESTED`, `PICKED_UP`, `IN_TRANSIT`, `DELIVERED`).
* **Pre-Dispatch Cancellation:** One-click cancellation available while order is in `CONFIRMED` status. Atomically restores product stock to the inventory ledger.
* **Post-Delivery Return Request:** 7-day return request flow with reason selection and photo upload.


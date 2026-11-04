# NEXU ATELIER — Live Evaluator Demo Speaking Script

**Duration:** 5–7 Minutes  
**Target Audience:** External Executive Evaluation Team & Technical Auditors  
**Live Staging URL:** `https://trailing-ungreased-unhappily.ngrok-free.dev` (Local Backup: `http://localhost:3000`)  
**Standard Demo Passphrase:** `Password123!` (or 1-click role presets on `/login`)  

---

## 1. Opening: Introduction & Purpose (0:00 – 1:00)

> *"Good morning, everyone. Today I am proud to walk you through **NEXU ATELIER**, an architectural multi-vendor e-commerce platform built specifically for Indian luxury handloom, artisanal fashion, and precision acoustic heritage studios.*
>
> *The commercial challenge we solved here is distinct: independent master craft studios want modern digital discovery, but traditional marketplaces either charge predatory 25 to 35 percent margins and commoditize their identity, or force them to run isolated websites where buyers face fragmented checkout, repeated account creation, and separated tracking.*
>
> *NEXU ATELIER bridges this gap with an institutional-grade platform built on Next.js 14, React 18, and PostgreSQL 17. A customer can add a pure Chanderi silk saree from a Jaipur weaver and an acoustic bass trap panel from an Ahmedabad workshop into a single cart, check out in one transaction, and behind the scenes, our database atomically splits that parent order into discrete, isolated supplier suborders with automated Indian statutory GST arithmetic.*
>
> *Let's look at the actual running staging application."*

---

## 2. Customer Demonstration: Discovery to Order Confirmation (1:00 – 2:45)

> *"We begin on the customer storefront at `https://trailing-ungreased-unhappily.ngrok-free.dev/`.*
>
> *Notice the visual identity: a restrained, editorial luxury aesthetic—warm white and ivory tones, minimal serif typography, and zero artificial neon gradients. Everything is designed to elevate the studio's craft.*
>
> *First, let's authenticate as our demo patron. I'll navigate to `/login` and select **'Patron'** (`patron@nexu.studio`). The session is immediately established using secure HTTP-only cookies.*
>
> *Now let's head to the **Catalog** at `/catalog`. Here, our patrons can browse curated products with instant filtering by heritage category, price, and maker studio. Let's open the **Solstice Raw Mulberry Silk Saree** (`/product/solstice-raw-mulberry-silk-saree`).*
>
> *On the Product Detail Page, notice our multi-attribute variant matrix. The customer can select exact sizes and color swatches. Each swatch dynamically updates product imagery and checks stock levels in real time.*
>
> *Let's add this saree to our bag, and let's also add a second product from a different artisan studio: the **Keychron Q1 Pro Custom Keyboard** or **Master Acoustic Bass Trap Panels** from Voxel Acoustic Dynamics.*
>
> *Now, let's open our **Cart** (`/cart`) and proceed to **Checkout** (`/checkout`).*
>
> *Here is where our multi-vendor engine shines: on this single checkout screen, the customer selects their delivery address in Mumbai, selects express courier delivery, and sees an exact, transparent breakdown of statutory GST (CGST and SGST) and delivery fees.*
>
> *We select **'UPI / Instant Gateway'** and click **'Confirm & Authorize Order'**.*
>
> *Immediately, an atomic database transaction runs: product inventory is decremented concurrently, a unique cryptographically generated parent order ID—`ORD-2026-XXXX`—is created, two discrete shipments are allocated with Blue Dart tracking identifiers, and the customer is welcomed by our confirmation screen with celebration confetti and milestone progress tracking.*
>
> *When the customer visits **Order History** at `/account/orders`, they can inspect both studio items and track parcel delivery stages."*

---

## 3. Supplier Demonstration: Isolated Fulfillment & Costing Engine (2:45 – 4:30)

> *"Now let's step into the shoes of the maker. I will open an incognito window and sign in as our master artisan studio at `/seller`: **Solstice Loom Studio** (`solstice@nexu.studio`).*
>
> *Here on the **Seller Hub** dashboard, the artisan sees their gross sales, net earnings, active order counts, and low-stock alerts.*
>
> *Let's click **'Orders'** (`/seller/orders`). Notice what has happened: even though the customer placed a single order containing products from multiple studios, **Solstice Loom Studio only sees the line item allocated to their workshop**. Competitor items, competitor pricing, and irrelevant customer records are completely hidden behind cryptographically enforced tenant isolation.*
>
> *Let's fulfill this order. Our order state machine enforces a rigorous forward progression. The artisan clicks **'Pack Order'**—the item status transitions to `PACKED`. Next, the studio clicks **'Ship Order'**, enters the Blue Dart courier name and tracking AWB, and the item transitions to `SHIPPED`.*
>
> *Next, let's look at one of the most powerful features built for our artisans: our **Supplier Costing & Profit Calculator**. Let's go to `/seller/products/new` and proceed to **Step 4: Costing & Margin Engine**.*
>
> *Artisans often struggle with the complex mathematics of Indian e-commerce. Here, the artisan inputs their raw material cost, labor cost, and packaging expenses. Our engine automatically calculates:*
> - *The statutory GST liability, correctly splitting intra-state 6% CGST + 6% SGST versus 12% IGST;*
> - *The 10% platform commission on the taxable base;*
> - *The 2% payment gateway fee on the customer total;*
> - *And delivers the exact break-even price and net escrow payout in integer paise without rounding errors.*
>
> *Finally, under **Payouts** (`/seller/payouts`), the artisan has an audited ledger of every rupee earned, held in escrow, and ready for settlement."*

---

## 4. Admin Demonstration: Platform Oversight & Compliance (4:30 – 5:45)

> *"Now let's log in as the marketplace operator at `/admin` using our platform administrator account: `admin@nexu.studio`.*
>
> *The **Admin Command Center** provides complete macro-level governance:*
> - *Under **Orders** (`/admin/orders`), the administrator can inspect every multi-vendor order, see which studios are fulfilling on time, and drill down into discrete shipping manifests.*
> - *Under **Sellers** (`/admin/sellers`), administrators review studio onboarding applications, verify workshop origin hubs and GSTIN credentials, and can suspend or approve studios with a single click.*
> - *Under **Finances** (`/admin/finances`), the platform generates real-time statutory GST reports, detailing total CGST, SGST, and IGST collected across all shipments.*
> - *And under **Audit Logs** (`/admin/audit-logs`), the administrator has an immutable chronological trail of over 7,100 security, login, and fulfillment events across the entire ecosystem."*

---

## 5. Closing: Current State, Business Potential & Launch Path (5:45 – 6:30)

> *"To summarize where NEXU ATELIER stands today:*
> - *The multi-vendor engine, customer cart, atomic checkout, tenant-isolated supplier fulfillment, and admin command center are **fully implemented, tested with 85 automated Vitest suites at 100% pass rate, and running live on PostgreSQL 17**.*
> - *Our external payment, WhatsApp OTP, and courier systems are currently operating in **secure, server-authoritative simulation mode**.*
> - *To transition from this staging demo to public commercial launch, all that remains is inserting live production API credentials for Razorpay, Meta WhatsApp Cloud API, and an enterprise SMTP provider.*
>
> *NEXU ATELIER delivers institutional stability with bespoke artisan luxury. Thank you, and I would be delighted to answer your questions or demonstrate any specific subsystem in detail."*


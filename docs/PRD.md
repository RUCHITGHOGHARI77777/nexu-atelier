# NEXU ATELIER — Product Requirements Document (PRD)

## 1. Product Vision & Executive Summary
**NEXU ATELIER** is an enterprise-grade multi-vendor artisanal e-commerce platform purpose-built for the luxury handcrafted goods, heritage textiles, bespoke jewelry, and master-crafted homeware market in India and internationally.

The platform eliminates systemic friction in traditional Indian artisanal commerce:
- **For Patrons (Customers):** A white-glove, editorial luxury purchasing experience free of intrusive popups, fake countdown timers, or cluttered discount banners. Features transparent statutory tax breakdowns, 1-Click Instant "Buy Now", persistent multi-item bag drawer, and courier tracking with live AWB milestones.
- **For Artisans & Designers (Suppliers/Sellers):** Autonomous operational hub with strict tenant data isolation, 6-step product creation wizard, real-time costing and profit/loss calculator (Mode A Cost-Plus markup & Mode B Market target margin), automated CBIC Notification 13/2025 GST apportionment, and transparent escrow settlement tracking.
- **For Marketplace Guardians (Administrators):** Unified governance over multiple onboarded artisan houses, seller onboarding audits, catalog review queues, parent/suborder oversight, automated 10% platform commission ledger, dispute resolution, and tamper-evident audit trails.

---

## 2. Market Context, Personas & Target Users

### 2.1 Market Context & Regulatory Landscape
- **Primary Market:** India (Currency: Indian Rupee `₹`, denominated internally in integer paise).
- **Statutory Taxation:** Complies strictly with the Central Board of Indirect Taxes and Customs (CBIC) **Notification 13/2025-Central Tax (Rate)**, dynamically calculating statutory slabs:
  - 5% GST for essential handcrafted textiles and materials below statutory price thresholds.
  - 12% GST for luxury apparel and designer garments.
  - 18% GST for bespoke jewelry, homeware, and lifestyle artifacts.
  - Automatic intra-state (CGST 50% + SGST 50%) vs. inter-state (IGST 100%) tax apportionment based on artisan studio state and patron delivery state.

### 2.2 User Personas

#### A. The Discerning Patron (Customer Persona)
- **Demographics:** Affluent individuals, collectors, and design connoisseurs.
- **Goals:** Acquire authentic artisanal items with verified provenance, explore curated designer collections, enjoy friction-free checkout, and track delivery reliably.
- **Frustrations:** Cluttered mass-market e-commerce layouts, untrustworthy discounts, opaque return policies, and unexpected taxes added late in checkout.

#### B. The Heritage Artisan Studio (Supplier/Seller Persona)
- **Demographics:** Master weavers, heritage jewelers, leather artisans, and studio managers.
- **Goals:** Showcase artisanal craftsmanship in an editorial luxury aesthetic, set sustainable prices using real cost structures, receive prompt escrow settlements, and dispatch suborders efficiently.
- **Frustrations:** Complex marketplace commissions, high technical listing barriers, lack of tax compliance tools, and commingled customer communications.

#### C. The Platform Guardian (Administrator Persona)
- **Demographics:** Marketplace founders, operations managers, and financial compliance officers.
- **Goals:** Maintain catalog luxury standards, prevent fraudulent transactions or counterfeit goods, balance escrow payouts against platform take-rate (10% commission on taxable base), and ensure full auditability.
- **Frustrations:** Unreliable multi-vendor order reconciliation, manual tax bookkeeping, and untraceable database changes.

---

## 3. Detailed Functional Requirements

### 3.1 Customer Shopping Experience & Storefront Engine
1. **Editorial Storefront Layout:**
   - Warm white-first luxury aesthetic (`#FFFFFF`, `#FAFAF8`, `#E8E8E4`) with Cormorant Garamond serif headings and Montserrat sans-serif body typography.
   - Curated hero banner, artisan studio spotlight, editorial category ribbons, and craftsmanship narratives.
   - Zero intrusive promotional popups or layout shifts (CLS < 0.002).
2. **Catalog Discovery & Faceted Filtering:**
   - URL: `/catalog`
   - Filter criteria: Hierarchy categories (e.g., Heritage Textiles, Fine Jewelry, Handcrafted Ceramics), craft technique, price range sliders, in-stock availability, and sorting (Featured, Newest, Price: Low to High, Price: High to Low).
   - Real-time debounced live search modal (`/api/products?search=...`) with instant thumbnail results.
3. **Product Detail Page (PDP):**
   - URL: `/products/[slug]`
   - Multi-angle high-resolution gallery with responsive hover/touch zoom.
   - Variant selector (Size, Color, Material) updating real-time inventory indicators.
   - Transparent statutory pricing: Displays MRP, gross customer price, and statutory GST inclusion badge (e.g., "Includes 12% GST / HSN 6204").
   - Verified artisan studio attribution card linking to the studio's brand profile.
   - Verified customer reviews with aggregate rating breakdown (1-5 stars).
4. **Dual Checkout Architecture:**
   - **Persistent Cart Drawer:** Slides from the right; allows quantity increment/decrement, displays server-calculated subtotal, and persists across sessions.
   - **1-Click Instant "Buy Now":** Opens a dedicated direct checkout modal for the selected product/variant without modifying, clearing, or overwriting existing items in the persistent cart drawer.
5. **Server-Authoritative Checkout:**
   - URL: `/checkout`
   - 3-Step linear progression: Delivery Address Selection -> Shipping & Fulfillment Review -> Payment Method Selection.
   - Server strictly recalculates all line items, tax rates, shipping rates, and coupon discounts from PostgreSQL in integer paise. Client prices are completely untrusted.
6. **Order History & Delivery Tracking:**
   - URL: `/account/orders` and `/account/orders/[id]`
   - Displays parent order status, decomposed vendor suborders, and live 3PL shipment tracking cards with courier name and AWB tracking numbers.

### 3.2 Supplier Portal (Seller Hub)
1. **Studio Onboarding & Profile Governance:**
   - URL: `/seller/onboarding` and `/seller/settings`
   - Captures legal business name, brand name, store slug, GSTIN, PAN, bank account details, and registered studio pickup address.
2. **6-Step Product Creation Studio (Wizard):**
   - URL: `/seller/products/new`
   - *Step 1: Specifications:* Title, slug, category assignment, craft heritage narrative, material composition.
   - *Step 2: Media Gallery:* Drag-and-drop multi-image uploader with primary thumbnail selection.
   - *Step 3: Variant Matrix:* Size, color, SKU generation, inventory quantity, and variant price overrides.
   - *Step 4: Costing & Profit/Loss Calculator:* Dynamic inputs for Raw Materials, Artisan Labor, Packaging, and Logistics; real-time calculation of Mode A (Cost-Plus markup) and Mode B (Market price margin analysis) with dynamic break-even price.
   - *Step 5: Statutory GST & Logistics:* HSN code mapping, tax slab selection (5%, 12%, 18%), and intra/inter-state tax preview.
   - *Step 6: Preview & Submission:* Full editorial PDP preview before submitting for administrative curation review.
3. **Fulfillment & Dispatch Workflow:**
   - URL: `/seller/orders` and `/seller/orders/[id]`
   - Monotonic fulfillment state machine: `NEW` -> `PACKED` -> `SHIPPED` (requires courier name + tracking number) -> `DELIVERED`.
   - Downloadable packing slips and shipping manifests.
4. **Financial Ledger & Escrow Earnings:**
   - URL: `/seller/finances`
   - Real-time ledger detailing gross sales, platform commission (10%), payment gateway charges (2%), outward shipping deductions, and net pending/settled escrow payouts.

### 3.3 Platform Administration & Governance (Admin Console)
1. **Marketplace Overview Dashboard:**
   - URL: `/admin/dashboard`
   - High-level KPIs: Gross Merchandise Value (GMV), net platform revenue, total customer orders, active sellers, and catalog inventory count.
2. **Artisan Studio & Catalog Moderation:**
   - URL: `/admin/sellers` and `/admin/products`
   - Review pending artisan studio applications (Approve / Reject / Request Info).
   - Review newly submitted products before they appear on the public storefront.
3. **Financial Settlement Engine:**
   - URL: `/admin/finances`
   - Audit escrow balances across all 12 artisan houses, approve batch payout disbursements, and export statutory tax reports.
4. **Fraud & COD Risk Management:**
   - URL: `/admin/fraud` and `/admin/cod`
   - Risk assessment rules based on order value, delivery pin code risk tier, and customer cancellation history.
5. **Tamper-Evident Audit Trail:**
   - URL: `/admin/audit`
   - Searchable log of 7,179+ system events recording actor ID, IP address, timestamp, action type, entity name, and before/after JSON diffs.

---

## 4. Multi-Vendor Marketplace Decomposition

When a patron places an order containing items from multiple artisan workshops:
1. **Parent Order Creation:** A single `Order` entity is created capturing the patron's total payment, delivery address snapshot, and payment gateway reference.
2. **Suborder Line Decomposition:** Individual `OrderItem` records are generated, each bound to the specific `vendorId` of the supplying atelier.
3. **Discrete Shipment Generation:** A distinct `Shipment` record is created for each unique vendor involved in the order. Each shipment tracks its own courier assignment, AWB number, shipping cost, and delivery milestones.
4. **Tenant Enclosure:** The supplier sees ONLY their suborder line items in `/seller/orders`. Competing suppliers' items are completely filtered out at the database query level.

---

## 5. Statutory Indian GST & Financial Engineering

### 5.1 Computation Formulas (Integer Paise Precision)
All monetary calculations are performed in integer paise ($1\text{ INR} = 100\text{ paise}$) with zero floating-point arithmetic:

$$\text{Taxable Base} = \mathrm{round}\left( \frac{\text{Customer Gross Price}}{1 + \text{GST Rate}} \right)$$

$$\text{Total GST Amount} = \text{Customer Gross Price} - \text{Taxable Base}$$

$$\text{Platform Commission} = \mathrm{round}\left( \text{Taxable Base} \times 10\% \right)$$

$$\text{Payment Gateway Fee} = \mathrm{round}\left( \text{Customer Gross Price} \times 2\% \right)$$

$$\text{Net Seller Payout} = \text{Customer Gross Price} - \text{Platform Commission} - \text{Gateway Fee} - \text{Outward Shipping}$$

### 5.2 Apportionment Rules
- **Intra-State Supply (Seller State == Customer State):**
  $$\text{CGST} = \mathrm{round}\left( \frac{\text{Total GST}}{2} \right), \quad \text{SGST} = \text{Total GST} - \text{CGST}$$
- **Inter-State Supply (Seller State != Customer State):**
  $$\text{IGST} = \text{Total GST}$$

---

## 6. Acceptance Criteria Matrix

| Feature Area | Acceptance Criteria | Verification Status |
| :--- | :--- | :--- |
| **Catalog & Filters** | Faceted filtering by category, craft origin, and price must update the product grid in < 200ms without full page reloads. | **PASS** (Verified on local & TLS staging) |
| **Instant Buy Now** | Triggering 1-Click Buy Now must open the direct checkout modal for the selected variant without altering items in the persistent cart drawer. | **PASS** (Verified via Playwright automation) |
| **Server Checkout** | Tampering with prices in the client HTTP payload must be rejected; server must calculate total in integer paise from database. | **PASS** (`e2e-marketplace-demo-readiness.test.ts`) |
| **Order Splitting** | An order with items from 2 vendors must generate 1 parent order, 2 discrete vendor line sets, and 2 distinct shipments. | **PASS** (`e2e-marketplace-demo-readiness.test.ts`) |
| **Tenant Isolation** | A seller querying `/api/seller/orders` must receive 0 records belonging to other sellers; IDOR attempts must return 403 or 404. | **PASS** (`tenant-security-anti-idor.test.ts`) |
| **Fulfillment Progression** | An order item cannot be marked `SHIPPED` unless it is in `PACKED` state and valid courier name and tracking number are supplied. | **PASS** (`e2e-marketplace-demo-readiness.test.ts`) |
| **Payment Security** | Webhook and verification endpoints must validate HMAC-SHA256 signature against raw binary payload; forged signatures must return 400. | **PASS** (`emergency-production-security.test.ts`) |
| **Admin Password** | Admin login with `admin@nexu.studio` and `Password123!` must succeed via PBKDF2 hash verification. | **PASS** (`scripts/check-user-pw.mjs`) |

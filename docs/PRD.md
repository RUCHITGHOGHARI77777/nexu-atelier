# NEXU ATELIER — Product Requirements Document (PRD)

## 1. Executive Summary & Product Vision
NEXU ATELIER is an enterprise-grade multi-vendor e-commerce platform purpose-built for the luxury artisanal lifestyle and heritage crafts market in India and abroad. The platform connects discerning patrons seeking verified provenance and master craftsmanship with independent artisan studios, heritage weavers, and luxury designers.

### Core Value Proposition:
- **Artisan Empowerment:** Eliminates technological friction for independent studios by providing automated GST calculation, fulfillment workflows, and an interactive costing and profitability engine.
- **Patron Confidence:** Delivers a white-glove, editorial luxury purchasing experience free of intrusive popups, fake countdown timers, or cluttered discount banners.
- **Enterprise Integrity:** Guarantees server-authoritative checkout, multi-vendor order decomposition, strict tenant data isolation, and immutable audit logs.

---

## 2. Market Context & Problem Space
1. **Fragmented Artisanal Commerce:** Independent master craftsmen often sell through informal channels (WhatsApp, Instagram DMs) or generic mass-market marketplaces that devalue luxury branding.
2. **Statutory Tax Complexity:** Calculating Goods and Services Tax (GST) for luxury apparel and handcrafted goods under Indian Ministry of Finance guidelines (e.g. CBIC Notification 13/2025-Central Tax Rate) requires dynamic rate determination based on price thresholds and HSN codes, along with proper intra-state (CGST+SGST) vs. inter-state (IGST) apportionment.
3. **Multi-Vendor Logistics Frictions:** When a customer orders items originating from multiple artisan workshops across different states, traditional single-vendor engines fail to split fulfillment manifests, resulting in dispatch chaos and customer confusion.

---

## 3. User Personas & Role Specifications

### 3.1 The Discerning Patron (Customer Persona)
- **Profile:** Affluent connoisseur valuing bespoke craftsmanship, authentic material heritage, and seamless digital service.
- **Key Workflows:**
  - Discovering products via editorial category narratives and faceted filters.
  - Reviewing multi-angle high-resolution imagery and verified artisan provenance notes.
  - Instant 1-Click "Buy Now" checkout or multi-item cart accumulation.
  - Tracking discrete shipments with courier AWB numbers.
  - Submitting verified customer reviews and ratings post-delivery.

### 3.2 The Artisan Studio (Supplier / Seller Persona)
- **Profile:** Master weavers, jewelers, and atelier managers managing specialized production batches.
- **Key Workflows:**
  - Onboarding and managing independent studio profiles with GSTIN, PAN, and bank details.
  - Utilizing the 6-step Product Creation Wizard with variant matrices (Size, Color, Material).
  - Leveraging the Costing & P&L Calculator (Mode A Cost-Plus markup & Mode B Market target margin).
  - Fulfilling suborders along monotonic forward state transitions (`NEW` -> `PACKED` -> `SHIPPED` -> `DELIVERED`).
  - Auditing net escrow earnings after deduction of 10% platform commission, 2% payment gateway fee, and outward shipping costs.

### 3.3 The Platform Guardian (Administrator Persona)
- **Profile:** Platform operations, financial auditors, and catalog curators.
- **Key Workflows:**
  - Monitoring marketplace KPIs: Gross Merchandise Value (GMV), active sellers, and catalog health.
  - Curating catalog listings through approval/revision workflows.
  - Overseeing multi-vendor parent orders and discrete shipment lifecycles.
  - Reconciling platform take-rate ledgers and authorizing batch escrow disbursements.
  - Investigating security alerts and operational events through immutable audit logs.

---

## 4. Functional Requirements

### 4.1 Customer Experience & Storefront Engine
- **Editorial Storefront:** Clean white-first layout (`#FFFFFF` and `#FAFAF8`) with serif typography (Cormorant Garamond) and subtle micro-interactions.
- **Faceted Discovery:** Dynamic filtering by category, price range, artisanal craft technique, and stock availability with debounced live search.
- **Product Detail Page (PDP):** Zoomable image gallery, variant selector updating inventory indicators, statutory GST-inclusive price display, and verified customer review wall.
- **Dual Checkout Mechanics:**
  - Persistent shopping bag drawer with atomic stock validation.
  - 1-Click Instant "Buy Now" modal executing focused single-item checkout without overwriting or clearing existing cart bag state.
- **Server-Authoritative Checkout:** The server recalculates all line subtotals, statutory tax slabs, shipping fees, and coupon deductions directly from PostgreSQL in integer paise. Client prices are completely untrusted.

### 4.2 Supplier Operations Engine (Seller Hub)
- **Tenant Data Isolation:** Complete database and API query enclosure ensuring no artisan studio can access or observe another seller's orders, catalogue, or financials (`where: { vendorId: seller.id }`).
- **6-Step Product Creation Studio:**
  1. *Specifications:* Title, slug, category, craft heritage story.
  2. *Media Gallery:* Multi-image upload and primary banner assignment.
  3. *Variant Matrix:* Size, color, material, SKU generation, and atomic inventory count.
  4. *Costing & Margin Calculator:* Real-time net margin, break-even price, and markup percentage.
  5. *Statutory GST & Logistics:* HSN code mapping and intra/inter-state tax apportionment.
  6. *Review & Submission:* Catalog preview and publishing.
- **Fulfillment State Machine:** Monotonic forward transitions requiring tracking number and courier selection for dispatch.
- **Financial Ledger:** Real-time visibility into gross sales, deducted platform commission (10%), payment gateway charges (2%), outward shipping deductions, and net pending/settled escrow payouts.

### 4.3 Governance & Administration Console
- **Marketplace Dashboard:** High-level metrics tracking GMV, order volume, active sellers, and platform net revenue.
- **Catalog Moderation:** Formal review queue for newly submitted artisan products.
- **Financial Settlement Engine:** Escrow payout batching, tax report generation, and dispute resolution.
- **Audit Trail:** Immutable ledger logging actor ID, action type, resource ID, and JSON before/after state diffs.

---

## 5. Non-Functional Requirements & Engineering Standards

| Dimension | Specification | Verification Status |
| :--- | :--- | :--- |
| **Financial Accuracy** | 100% integer paise arithmetic. Zero floating-point math. | 85/85 tests passed |
| **Tax Compliance** | CBIC Notification 13/2025 Central Tax (Rate) compliant. | Verified in `supplier-costing.test.ts` |
| **Tenant Boundary** | Every supplier query enforces `where: { vendorId: seller.id }`. | Verified in `tenant-security-anti-idor.test.ts` |
| **Authentication** | PBKDF2 with HMAC-SHA512 (210,000 iterations), HttpOnly cookies. | Verified in `security-hardening.test.ts` |
| **Build Stability** | 105 Next.js App Router routes compiled cleanly with 0 errors. | Verified via `npm run build` |
| **Accessibility** | WCAG 2.1 AA compliant contrast ratios and keyboard focus rings. | Verified across all portals |

---

## 6. Project Scope & Future Roadmap
- **Current Version (v1.0.0-demo-freeze):** Fully functional local and TLS-tunneled marketplace with live catalog, complete checkout, parent-suborder splitting, supplier fulfillment, admin governance, and simulated payments/OTP/couriers.
- **Phase 2 (Production Go-Live):** Activating live production credentials for Razorpay Payment Gateway, Meta WhatsApp Cloud API, and Shiprocket logistics API; configuring persistent AWS S3 / Cloudflare R2 image bucket.

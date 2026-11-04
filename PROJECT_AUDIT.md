# NEXU ATELIER — COMPREHENSIVE PROJECT AUDIT

**Date:** November 2026  
**Auditor:** Principal E-Commerce Architect & Senior Design Systems Engineer  
**Workspace Path:** `D:\Ecommerce Project Real`

---

## 1. Executive Summary

NEXU ATELIER is a multi-vendor e-commerce marketplace platform built on Next.js 14 (App Router) and PostgreSQL 17.10 via Prisma ORM. The platform facilitates discovery, evaluation, and direct procurement of handcrafted textiles, precision acoustic hardware, stoneware ceramics, and bespoke objects crafted by verified Indian artisan studios and engineering workshops.

This audit establishes the baseline technical and architectural state, documents current working features, catalogues database schemas, and outlines the boundary between Phase 1 (Public Customer-Facing Marketplace) and future phases (Admin Governance & Supplier Hub).

---

## 2. Technology Stack & Framework Inventory

| Dimension | Technology | Version | Purpose |
|---|---|---|---|
| **Core Framework** | Next.js App Router | 14.2.18 | Server-side rendering, streaming, API route handlers |
| **Language** | TypeScript | 5.0.x | Strict type safety across client and server |
| **UI Library** | React | 18.2.0 | Concurrent React component tree |
| **Styling Engine** | Tailwind CSS | 3.4.1 | Utility-first CSS, custom design tokens in `:root` |
| **ORM** | Prisma | 5.22.0 | Type-safe PostgreSQL client and schema migrations |
| **Database Engine** | PostgreSQL | 17.10 | ACID relational storage running locally on port 5432 |
| **Authentication** | Hybrid Engine | Proprietary | Google OAuth (Firebase Popup) + PBKDF2 salt-hash + HTTP-only cookie |
| **Test Runner** | Vitest | 2.1.9 | Node test runner executing 314 tests across 27 test suites |
| **Icons** | Lucide React | 0.468.0 | Minimalist iconography |

---

## 3. Database & Schema Architecture (`prisma/schema.prisma`)

The database contains 35+ relational models engineered for high-concurrency multi-tenant commerce:

1. **User & Identity:**
   - `User`: Roles (`CUSTOMER`, `SELLER`, `ADMIN`), suspended flags, timestamps.
   - `CustomerProfile`: Name, phone verification, marketing/data consents, COD risk counts.
   - `Session`: Cryptographic SHA-256 tokens linked to HTTP-only cookie with 7-day TTL.
   - `Address`: Geocoded shipping/billing addresses with Indian pincode validation.

2. **Marketplace & Multi-Vendor Engine:**
   - `Seller`: Multi-tenant vendor record (`slug`, `name`, `originHub`, `story`, `heroImage`, `rating`, `leadTimeDays`, `commissionRatePercent`, `bankAccountNumber`, `bankIfsc`, `status`).
   - `Product`: Authoritative product catalog (`slug`, `title`, `basePricePaise`, `compareAtPricePaise`, `stock`, `categoryId`, `vendorId`, `approvalStatus`, `rating`, `images`).
   - `ProductVariant`: SKU-level dimensioning (Size, Color, Material, delta pricing).
   - `Category` & `CategoryAttribute`: EAV dynamic schema attributes per taxonomy.

3. **Financials, Orders & Logistics:**
   - `Order`: Server-calculated totals (`subtotalPaise`, `taxPaise`, `shippingFeePaise`, `totalPaise`), idempotency keys, lifecycle status (`CONFIRMED`, `IN_PRODUCTION`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
   - `OrderItem`: Immutable historical price and vendor snapshots.
   - `Payment`: Gateway transaction references, UPI UTR IDs, payment status (`CAPTURED`, `PENDING_COLLECTION`, `FAILED`, `REFUNDED`).
   - `Shipment` & `TrackingEvent`: Air waybill (AWB) tracking with status checkpoints.
   - `RefundRecord`: Cryptographic idempotency keys preventing double-refunds.

---

## 4. Current Working Routes & Endpoints

### A. Customer Storefront (Phase 1)
- `/` — Curated marketplace homepage (Atelier spotlight, category highlights, trust pillars, maker showcases).
- `/shop` & `/catalog` — Authoritative product discovery with category, rating, and price filters.
- `/product/[slug]` — High-resolution product showcase with interactive thumbnails, variant picking, size guide, seller attribution, and Schema.org JSON-LD.
- `/store/[slug]` — Independent Brand Boutique showcasing verified maker story and maker catalog.
- `/cart` — Multi-vendor bag review, quantity management, coupon application.
- `/checkout` — Address selection, delivery tier choice, UPI/Card/COD payment simulation.
- `/track-order` — Order lookup by Order ID and email, displaying live tracking events.
- `/account` & `/account/orders` — Customer dashboard, order history, invoice download.
- `/account/addresses` — Saved shipping addresses with default toggle.
- `/about`, `/contact`, `/faq`, `/policies/*` — Customer service and informational pages.

### B. Internal Modules (Phase 2 & Phase 3)
- `/admin` — Private governance and compliance command center (Super Admin only).
- `/seller` — Private merchant inventory and Kanban fulfillment hub (Sellers only).

---

## 5. Security & Architectural Guardrails

1. **Zero-Trust Client Pricing:** Client-submitted prices are discarded. Subtotals and taxes are derived strictly from database records in minor units (paise).
2. **Idempotency Protection:** Order creation and payment confirmation reject rapid duplicate submissions.
3. **Cross-Tenant Isolation:** Seller A cannot modify or view Seller B's private draft listings or payouts.
4. **Zero-Storage Payment Security:** Test cards and UPI demo payments adhere to RBI guidelines (no CVV/PIN persisted).

---

## 6. Audit Verdict

The backend and database foundations are exceptionally robust and tested (314 tests passing). The visual design system requires elevation into luxury editorial commerce, with complete elimination of AI-generated artifacts, cropped photography, and visual clutter across all customer touchpoints.


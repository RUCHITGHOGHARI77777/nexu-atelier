# NEXU ATELIER — Master Project Architecture, Safety & Progress Tracker

**Document Version:** 1.1.0  
**Date Updated:** October 30, 2026  
**Repository Identity:** NEXU ATELIER Reusable E-Commerce Marketplace  
**Architecture:** Next.js 14.2.18 (App Router), TypeScript, Prisma ORM, PostgreSQL 17.10  
**Design System:** Modern Gallery White / Light Minimalist (`#fafafa` canvas, `#ffffff` cards, `border-zinc-200`, `text-zinc-950`)  

---

## 1. System Architecture & Portal Separation

NEXU ATELIER is a single reusable Next.js application that hosts three role-gated operational portals on the same domain and PostgreSQL database:

```
+--------------------------------------------------------------------------------------------------+
|                                    NEXU ATELIER CODEBASE                                         |
|                 (Single Reusable Next.js 14 + Prisma + PostgreSQL Software Product)              |
+--------------------------------------------------------------------------------------------------+
                                                  |
                    [ Developer / Installer clones from GitHub release ]
                    [ Configures .env, PostgreSQL DB, Storage, and Hosting ]
                    [ Executes migrations safely & creates initial Owner account ]
                                                  |
                                                  v
+--------------------------------------------------------------------------------------------------+
|                                DEPLOYED RUNNING CLIENT WEBSITE                                   |
|                             (Single running application on one domain)                           |
+------------------------------------+--------------------------------+----------------------------+
|        PUBLIC STOREFRONT           |     ADMIN CONTROL CENTER       |    SUPPLIER / VENDOR       |
|          Path: /*                  |          Path: /admin          |       Path: /seller        |
+------------------------------------+--------------------------------+----------------------------+
| - Customer discovery & browsing    | - Platform operations          | - Vendor onboarding        |
| - Product catalog, search, filter  | - Seller verification          | - Catalog management       |
| - Cart, checkout, payments         | - Global product approvals     | - Inventory levels         |
| - Order tracking & account history | - Commission & payout approval | - Order line fulfillment   |
| - Customer reviews & QA            | - Site branding (logo/favicon) | - Payout & dispute tracking|
|                                    | - Policies & business settings | - Product Q&A responses    |
+------------------------------------+--------------------------------+----------------------------+
                                     |                                |
                                     +---------------+----------------+
                                                     |
                                                     v
                                     [ Unified Database & Storage ]
                                     - PostgreSQL (35 Prisma models)
                                     - Encrypted credentials & ADC
                                     - Local / S3-compatible media
```

---

## 2. Feature Implementation Status

### A. Completed & Verified Features
1. **Database Schema:** 35 PostgreSQL Prisma models covering Users, Profiles, Sellers, Categories, Products, Images, Variants, Orders, Items, Payments, Payouts, Audit Events, Disputes, and Reviews.
2. **Automated Test Suite:** 151 passed out of 151 Vitest tests across 15 test suites with 100% pass rate.
3. **Multi-Tenant Seller Isolation:** `sellerService` strictly enforces `vendorId === seller.id` on all queries, updates, and order line fulfillment.
4. **Admin Moderation Backend:** `adminService.moderateProduct()` provides approval, rejection with mandatory editorial notes, and security audit trail logging.
5. **Secure Media Uploads:** `/api/upload/image` validates file types via magic bytes (JPEG, PNG, WebP), enforces a 4.0 MB limit, uses cryptographically random filenames, and enforces rate limiting.
6. **Destructive-Seed Protection:** Fail-closed circuit breaker in `prisma/seed.ts` blocking accidental execution unless `ALLOW_SEED_RESET=true` is explicitly provided.
7. **Zero Secrets in Repository:** Strict `.gitignore` excluding all `.env*` files (preserving only `.env.example`), `.next`, `node_modules`, `dist`, and backups.

### B. Incomplete Features (Queued for Resolution)
1. **Storefront Database Disconnect (Part 5):**
   Public `/catalog`, category filters, and `/product/[slug]` currently filter `SEED_PRODUCTS` from memory. Must be rewired to `productRepository` live queries.
2. **Supplier Product Creation & Edit Lifecycle (Part 3):**
   - Form at `/seller/products/new` accepts URLs; needs direct file upload integration.
   - Form currently auto-approves new products; needs default `PENDING_REVIEW` / `DRAFT`.
   - Edit page `/seller/products/[id]` and `GET /api/seller/products/[id]` are missing.
   - Seller table lacks status badges (`Draft`, `Under Review`, `Approved`, `Rejected`).
3. **Admin In-Modal Preview & Featured Toggle (Part 4):**
   - Moderation queue needs full in-modal product preview (all images, full specs, variant matrix).
   - Homepage `isFeatured` toggle needs to be exposed in the Admin table.
   - Controlled appearance customization (logo, favicon, site title, banners) persisted via `PlatformSetting`.
4. **Variant-Specific Inventory Enforcement (Part 6):**
   - `ProductInfo.tsx` must enforce stock per selected size/color variant.
   - `order-service.ts` must atomically decrement `ProductVariant.stock` alongside root `Product.stock`.

### C. Known Bugs Identified for Immediate Fix (Part 2)
1. **Invalid HTML Nesting in `ProductCard.tsx`:** Quick Add `<button>` is nested inside `<Link>` (`<a>`), causing click conflicts and accidental page navigations.
2. **Invalid HTML Nesting in Order Confirmation:** `<Link>` is nested inside `<Button>` (`<button><a href="...">...</a></button>`), causing dead clicks on "Track Order Timeline".
3. **Artificial 700ms Delay on Add to Bag:** `ProductInfo.tsx` has a hardcoded `setTimeout(..., 700)` delaying drawer open.
4. **Stale Client-Side Router Cache on Order Placement:** `checkout/page.tsx` does not call `router.refresh()`, and `fetch('/api/orders')` lacks `{ cache: 'no-store' }`, requiring a manual browser reload (F5) to see new orders.

---

## 3. Verified Backup Registry

| Backup File Name | Size | Date Created | Verification Status | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `nexu-ecommerce-platform.zip` | 3.45 MB | Oct 30, 2026 09:18 | Verified (0 secrets) | Initial safe platform archive |
| `nexu_part1_baseline_20261030.zip` | 3.44 MB | Oct 30, 2026 11:17 | Verified (0 secrets) | Part 1 baseline archive |
| `nexu_safety_backup_20261030_112515.zip` | 3.48 MB | Oct 30, 2026 11:25 | Verified (0 secrets, 427 entries) | New timestamped safety backup |

---

## 4. Ten-Part Development Roadmap

1. **PART 1: Protect Project & Establish Baseline** *(COMPLETED)*
2. **PART 2: Fix Navigation, Cart & Live Order Refresh** *(QUEUED)*
3. **PART 3: Complete Supplier Product Creation, Drafts, Upload & Editing** *(QUEUED)*
4. **PART 4: Admin Moderation & Controlled Website Settings** *(QUEUED)*
5. **PART 5: Connect Public Storefront to PostgreSQL Products** *(QUEUED)*
6. **PART 6: Correct Variant Inventory, Cart & Checkout** *(QUEUED)*
7. **PART 7: Complete Shopping & Supplier Fulfillment Journey** *(QUEUED)*
8. **PART 8: Security, Reliability, Legal & Operational Readiness** *(QUEUED)*
9. **PART 9: Reusable GitHub Release & Deployment Handover** *(QUEUED)*
10. **PART 10: Full QA, Release Gate & Final Handover** *(QUEUED)*

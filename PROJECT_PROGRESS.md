# NEXU ATELIER — Master Project Architecture, Safety & Progress Tracker

**Document Version:** 1.3.0  
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
1. **Database Schema:** 35 PostgreSQL Prisma models covering Users, Profiles, Sellers, Categories, Products, Images, Variants, Orders, Items, Payments, Payouts, Audit Events, Disputes, and Reviews. Additive fields (`brand`, `sku`, `productType`, `subcategory`, `searchKeywords`, `dispatchEstimate`, `packageDimensions`, `taxRatePercent`, `isSuspended`, `suspensionReason`), `CHANGES_REQUESTED` enum status, `PENDING_PAYMENT`/`RETURNED` OrderStatus, and `RETURNED` FulfillmentStatus added safely without data loss.
2. **Automated Test Suite:** 201 passed out of 201 Vitest tests across 19 test suites with 100% pass rate.
3. **Complete Customer Commerce & Account System:**
    - Stateless cryptographic HMAC SHA-256 password recovery tokens with 1-hour expiry, honeypot protection, rate limiting, and dedicated gallery white UI at `/reset-password`.
    - 100% database-isolated product discovery on public storefront: dynamic debounced search suggestion API (`/api/products?q=...`), dynamic category loading (`/api/categories`), and complete removal of static `SEED_PRODUCTS`.
    - Variant selection matrix with active price calculation, price deltas, SKU mapping, out-of-stock disabling, and cart/checkout integration.
    - Multi-supplier customer orders: single order checkout supporting discrete seller line items, independent fulfillment tracking, and isolated vendor payouts.
    - Server-authoritative checkout totals, coupon verification, and cryptographic payment verification (HMAC SHA-256) with tamper rejection.
    - Pre-dispatch order cancellation with atomic database inventory restoration across products and variants.
    - Event-driven transactional notification outbox queuing welcome, order confirmed, order cancelled, dispute submitted, and refund notices.
    - Gallery white design aesthetic consistency across all customer account, cart, checkout, and order confirmation surfaces.
4. **Multi-Tenant Seller Isolation:** `sellerService` strictly enforces `vendorId === seller.id` on all queries, updates, and order line fulfillment.
4. **Central Admin Control Engine (Part 4):**
    - Live real-time dashboard (`/admin`) aggregating real PostgreSQL metrics: GMV, net revenue, total orders, pending orders, delivered orders, cancelled orders, pending payments, active sellers, total customers, low-stock inventory count, and pending payouts.
    - Server-side date filtering (`today`, `7d`, `30d`, `all`).
    - Customer 360° dossier, suspension/reactivation with mandatory recorded reasons, and audit logging.
    - Studio dossier 360° modal viewing KYC data, bank accounts, complete product catalog with live variant stock, assigned discrete order lines, payouts, and audit trails.
    - Central order operations: parent order status transitions and discrete line-item fulfillment with 3PL courier tracking and auto-parent rollup.
    - Double-entry vendor payout settlements requiring verified banking UTR references (min 6 characters) and automatic escrow release on delivery.
    - Website appearance & content control: dynamic database-backed `PlatformSetting` for branding, hero masthead, announcement banners, section visibility, marketplace policies, and footer taglines. Storefront `AnnouncementBar` and `HeroSection` dynamically hydrate from `/api/settings/public`.
    - Server-side role-based administrative permissions (`VIEW_DASHBOARD`, `MANAGE_USERS`, `MODERATE_PRODUCTS`, `MANAGE_SELLERS`, `MANAGE_ORDERS`, `PROCESS_REFUNDS`, `MANAGE_PAYOUTS`, `MANAGE_SETTINGS`, `MANAGE_ADMINS`).
5. **Category & Taxonomy Engine:** Created `/admin/categories` and `/api/admin/categories` with full CRUD, product-attachment safety checks, and audit logging.
6. **Automations & Outbox Management:** Created `/admin/automations` and `/api/admin/automations` for monitoring transactional outbox events, failed jobs, and inventory low-stock scans.
7. **Executive Financial Reports:** Created `/admin/reports` and `/api/admin/reports` with real PostgreSQL revenue metrics and RFC 4180 CSV export.
8. **Enhanced Product Moderation & Homepage Spotlight:** In-modal multi-image gallery preview, full specifications, complete variant matrix, "Request Changes", "Reject Piece" with required feedback, and instant "Homepage Featured" toggle.
9. **Navigation, Cart & Order Flow Hardening (Part 2):** Eliminated all 27 invalid interactive HTML nesting points (`<button>` inside `<Link>`, `<Link>` inside `<Button>`), removed artificial 700ms cart drawer delay, guarded against duplicate rapid clicks, and enabled instant Next.js router synchronization on order placement.
10. **Secure Media Uploads:** `/api/upload/image` validates file types via magic bytes (JPEG, PNG, WebP), enforces a 4.0 MB limit, uses cryptographically random filenames, and enforces rate limiting.
11. **Destructive-Seed Protection:** Fail-closed circuit breaker in `prisma/seed.ts` blocking accidental execution unless `ALLOW_SEED_RESET=true` is explicitly provided.
12. **Zero Secrets in Repository:** Strict `.gitignore` excluding all `.env*` files (preserving only `.env.example`), `.next`, `node_modules`, `dist`, and backups.
13. **Full-Depth Supplier Product Engine (Part 3):** Full product creation & draft saving (`/seller/products/new`), device file upload with cover indicator, zero auto-approval (`DRAFT`/`PENDING_REVIEW`), full product editing (`/seller/products/[id]`), automatic unpublishing/re-moderation upon live product edit, and seller dashboard (`/seller/products`) with status tabs and inline admin feedback.
14. **Storefront Database Integration (Part 5):** Dynamic `/api/products` integration in `/catalog`, dynamic `/product/[slug]`, and homepage `TrendingSection`.
15. **Variant-Specific Inventory & Checkout Integrity (Part 6):** Atomic variant stock validation and decrementing during checkout in `order-service.ts`, out-of-stock guards, and variant stock restoration upon cancellation.
16. **Smart Listing, Auto-Draft, Category Attribute & Product Quality Engine:**
    - LocalStorage & PostgreSQL debounced background auto-draft synchronization with optimistic locking and conflict resolution (`SupplierDraft`).
    - Dynamic category attribute definitions (`CategoryAttribute`) with custom unit selection and customer storefront specifications integration.
    - Real listing quality evaluation engine (`listing-quality-checker.ts`) checking title spam, attributes, unit consistency, prohibited claims, pricing sanity, and providing 0-100 score with direct navigation hooks.
    - Supplier Correction Assistant (`CorrectionAssistantBanner`) for `CHANGES_REQUESTED` products with targeted field rejections, administrative feedback, and snapshot history (`ProductRevision`).
    - Admin Review SLA Engine with configurable thresholds, background scanning, breach notifications, and strict non-auto-approval safety rule.
17. **Fraud Detection, COD & Razorpay-Ready Checkout Payment UI:**
    - 10-signal order fraud evaluation engine (`fraud-detection-service.ts`) producing 0-100 risk score, risk level (`LOW`, `MEDIUM`, `HIGH`), and recommended action (`ALLOW`, `REQUIRE_OTP`, `RESTRICT_COD`, `MANUAL_REVIEW`, `BLOCK`).
    - Admin Fraud Review Dashboard (`/admin/fraud`) with customer verification status, RTO/refusal metrics, and manual override modal with mandatory explanatory reason and false-positive tracking.
    - Multi-factor Cash on Delivery (COD) engine (`cod-service.ts`) with min/max thresholds, serviceable PIN codes, multi-supplier consistency, mobile OTP confirmation, and ₹50 convenience fee.
    - Admin COD & Courier Remittance Reconciliation Dashboard (`/admin/cod`) with status tracking (`PENDING`, `COLLECTED`, `REMITTED`, `FAILED`, `RTO`) and UTR reference recording.
    - Razorpay payment provider architecture (`IPaymentAdapter`, `RazorpayPaymentAdapter`) and hosted gateway compliance documentation (`docs/razorpay-integration-architecture.md`).
    - Responsive customer payment method selector (`PaymentMethodSelector.tsx`) supporting Instant UPI, Hosted Cards, Net Banking, Wallets, and COD.
    - **Critical Stop Point Honored:** The Final Pay button displays selected method and authoritative amount but remains a non-processing placeholder modal, holding live charges and COD order creation in staging mode until the owner supplies the next processing specification.
    - Database-backed payment reporting (`payment-report-service.ts`) analyzing volume, methods, failed transactions, and courier remittances directly from PostgreSQL.
18. **WhatsApp Business Cloud API — Primary OTP Verification Engine & Complete Removal of SMS:**
    - Integrated Meta WhatsApp Business Cloud API (`whatsappService.ts`) compliant with Graph API v20.0 authentication template specifications.
    - Implemented secure OTP lifecycle management (`otpService.ts`): cryptographically secure 6-digit random codes, SHA-256 storage hashing (plaintext never stored in DB), 5-minute expiry, 60-second resend cooldown, 3-attempt brute force lock, and 5-request hourly abuse limit per phone.
    - Dedicated authentication routes `/api/auth/otp/send`, `/api/auth/otp/verify`, and `/api/auth/otp/login` enabling seamless 1-click passwordless customer authentication via WhatsApp.
    - Updated customer privacy profile verification (`verify-phone/route.ts` & `customer-privacy-service.ts`) to use WhatsApp OTP.
    - Completely deprecated and removed all SMS gateway references, variables, and fallbacks in strict compliance with marketplace directives.
19. **Automated Branded Transactional Email & Outbox Architecture:**
    - Designed 21 responsive luxury HTML email templates (`email-templates.ts`) featuring `#17191F` headings, `#2457C5` buttons, pure white cards, and full plain-text fallbacks.
    - Implemented transactional email provider driver architecture (`email-adapter.ts`) supporting Resend API (`RESEND_API_KEY`) and safe masked Console development sink.
    - Comprehensive transactional coverage:
      * **Customer Events:** Welcome Onboarding with welcome coupon, Account Verified, Order Confirmed with tracking link, Payment Verified with UTR ref, Order Shipped with AWB tracking, Delivery Updates, Order Delivered, Pre-Dispatch Cancellation with inventory restoration, Refund Notice, Password Reset, and Security Alerts.
      * **Supplier Events:** New Order Allocated with item counts & net payout, Order Status Updates, Product Approved & Published, Product Changes Requested with curator notes, Return/Dispute Requests, and Escrow Settlement Releases with banking UTR.
      * **Admin Alerts:** New Studio Applications with applicant details, Platform Health & Volume Alerts, Transaction/Gateway Failures, and Dispute Arbitration Escalations.
    - Integrated into core business workflows (`order-service.ts`, `seller-service.ts`, `admin-service.ts`, `auth-service.ts`).
    - Full idempotency deduplication and batch outbox retry queue processing (`notificationService.processOutboxQueue`).
20. **Automated Test Suite Expansion:** 337 passed out of 337 Vitest tests across 29 test suites with 100% pass rate. TypeScript static analysis clean with 0 errors across entire repository.

### B. Incomplete Features (Queued for Resolution)
1. **Complete Shopping & Supplier Fulfillment Journey (Part 7):**
    - Customer end-to-end checkout to seller order line dispatch status progression (PENDING -> PROCESSING -> SHIPPED -> DELIVERED).
    - Supplier shipping label / tracking number input.
2. **Security, Reliability & Legal Readiness (Part 8):**
    - Comprehensive rate limiting, CSRF protections, terms of service and privacy policy pages.
3. **Reusable GitHub Release & QA Handover (Parts 9 & 10):**
    - Docker compose setup, clean onboarding documentation, and end-to-end user acceptance signoff.

---

## 3. Verified Backup Registry

| Backup File Name | Size | Date Created | Verification Status | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `nexu-ecommerce-platform.zip` | 3.45 MB | Oct 30, 2026 09:18 | Verified (0 secrets) | Initial safe platform archive |
| `nexu_part1_baseline_20261030.zip` | 3.44 MB | Oct 30, 2026 11:17 | Verified (0 secrets) | Part 1 baseline archive |
| `nexu_safety_backup_20261030_112515.zip` | 3.48 MB | Oct 30, 2026 11:25 | Verified (0 secrets, 427 entries) | Timestamped safety backup |
| `db_snapshot_2026-10-30T06-41-39-369Z.json` | 275 KB | Oct 30, 2026 12:11 | Verified (53 users, 7 sellers, 12 products, 167 orders) | Pre-migration PostgreSQL JSON snapshot |

---

## 4. Ten-Part Development Roadmap

1. **PART 1: Protect Project & Establish Baseline** *(COMPLETED)*
2. **PART 2: Fix Navigation, Cart & Live Order Refresh** *(COMPLETED)*
3. **PART 3: Complete Supplier Product Creation, Drafts, Upload & Editing** *(COMPLETED)*
4. **PART 4: Admin Moderation & Controlled Website Settings** *(COMPLETED)*
5. **PART 5: Connect Public Storefront to PostgreSQL Products** *(COMPLETED)*
6. **PART 6: Correct Variant Inventory, Cart & Checkout** *(COMPLETED)*
7. **PART 7: Complete Shopping & Supplier Fulfillment Journey** *(QUEUED)*
8. **PART 8: Security, Reliability, Legal & Operational Readiness** *(QUEUED)*
9. **PART 9: Reusable GitHub Release & Deployment Handover** *(QUEUED)*
10. **PART 10: Full QA, Release Gate & Final Handover** *(QUEUED)*

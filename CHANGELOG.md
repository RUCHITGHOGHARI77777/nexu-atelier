# Changelog

All notable changes to the NEXU ATELIER project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-10-30 (Fraud Detection, COD & Razorpay-Ready Checkout Payment UI)
- **Order Fraud Detection Engine:**
  - Multi-signal risk assessment service (`fraud-detection-service.ts`) evaluating 10 distinct operational signals: verified mobile status, rapid duplicate order patterns (<15m), repeated failed/cancelled orders (7 days), previous COD refusal count, previous RTO occurrences, address completeness with 6-digit Indian postal code check, high order values (>₹50,000 / >₹100,000), order velocity (24h), session signature integrity, and gateway payment failure rate.
  - Generates authoritative `riskScore` (0-100), `riskLevel` (`LOW`, `MEDIUM`, `HIGH`), itemized `triggeredReasons`, and `recommendedAction` (`ALLOW`, `REQUIRE_OTP`, `REQUIRE_ADDITIONAL_CONFIRMATION`, `RESTRICT_COD`, `MANUAL_REVIEW`, `BLOCK`).
  - Persists all assessments to PostgreSQL `OrderRiskAssessment` table with full telemetry snapshots (`signalsJson`).
- **Admin Fraud Review Dashboard (`/admin/fraud`):**
  - Dedicated operations console for inspecting flagged checkouts, customer phone verification badges, prior order histories, and RTO counts.
  - Manual review and override modal with mandatory explanatory reason (min 5 characters) and false-positive correction flags that mitigate historical customer penalties.
  - Audit logging of all administrative decisions in `AuditEvent`.
- **Cash on Delivery (COD) Engine & Courier Reconciliation (`/admin/cod`):**
  - Multi-factor eligibility evaluator (`cod-service.ts`) enforcing global toggles, min/max thresholds (₹500 to ₹15,000), serviceable PIN codes, multi-supplier shipment consistency, customer risk profile, and mobile OTP verification for medium-risk checkouts.
  - Configurable COD courier convenience fee (₹50) automatically reflected in final checkout totals.
  - Administrative courier remittance reconciliation tool supporting UTR/bank reference tracking, notes, and collection status transitions (`PENDING`, `COLLECTED`, `REMITTED`, `FAILED`, `RTO`).
  - Strict privacy and security enforcement: suppliers see only assigned order lines and cannot mark COD money as received without authorized courier remittance.
- **Razorpay-Ready Payment Architecture:**
  - Comprehensive architectural specification (`docs/razorpay-integration-architecture.md`) detailing environment variable placeholders, `IPaymentAdapter` provider pattern, gateway status mapping, official sandbox credentials, webhook signature verification (`HMAC-SHA256`), and idempotency design.
  - Zero hardcoded secrets; strict adherence to PCI-DSS Level 1 hosted model.
- **Customer Payment Page & Critical Stop Point (`/checkout`):**
  - Responsive gallery white payment method selection experience (`PaymentMethodSelector.tsx`) supporting Instant UPI (GPay, PhonePe, Paytm, BHIM, Custom VPA), Hosted Credit/Debit Cards, Net Banking (50+ banks), Digital Wallets, and Cash on Delivery.
  - Multi-supplier shipment breakdown and dynamic order summary calculations.
  - **CRITICAL STOP POINT CONTRACT:** The Final Pay button displays the selected method and authoritative payable total but acts strictly as a non-processing placeholder. Clicking the button activates an informational modal ("Payment Gateway Sandbox Initialized: Ready for Owner Payment Processing Specification"), holding payment processing and COD order creation in staging mode without debiting cards or creating paid orders.
- **Database-Backed Financial Reporting:**
  - `PaymentReportService` computing monthly summaries, payment method distribution, COD collection, courier remittance status, and RTO metrics directly from PostgreSQL records with zero fabricated data.
- **Automated Test Coverage:**
  - 16 new automated tests in `src/lib/server/__tests__/fraud-and-cod-engine.test.ts` verifying all risk signals, COD rules, OTP logic, manual override, customer/supplier privacy, and Stop Point placeholder behavior.
  - 235 passed out of 235 tests across all 21 test suites in the repository.
  - 0 TypeScript compilation errors, 0 ESLint errors.
  - 4 visual browser verification screenshots in `screenshots/`.

### Added - 2026-10-30 (Smart Listing, Auto-Draft, Category Attribute & Quality Engine)
- **Auto-Draft & Recovery Engine:**
  - Multi-tier draft persistence: immediate LocalStorage metadata, IndexedDB-ready client manager, and debounced (2.5s) background synchronization to PostgreSQL `SupplierDraft` table.
  - Visual status pill (`AutoDraftStatusBadge`) providing real-time feedback: `SAVING`, `SAVED`, `OFFLINE`, `SYNC_FAILED`, `CONFLICT`.
  - Optimistic locking with incremental versioning detecting parallel edits and offering resume/discard resolution dialogs.
  - Automatic draft cleanup upon successful product submission and snapshot creation in `ProductRevision`.
  - Zero sensitive credentials or tokens in browser storage.
- **Category-Based Dynamic Attribute Engine:**
  - Admin-configurable attributes per category/subcategory stored in `CategoryAttribute` table with unique constraint on `(categoryId, slug)`.
  - Supported attribute types: `TEXT`, `NUMBER`, `BOOLEAN`, `DROPDOWN`, `MULTI_SELECT`, `MEASUREMENT` (with configurable unit selectors like g, kg, ml, L, cm, inch, carat), and `STRUCTURED_SPECS`.
  - Rendered dynamically in supplier product creation (`/seller/products/new`) and editing (`/seller/products/[id]`) via `CategoryAttributeFields`.
  - Seeded 19 initial attributes across all standard catalog categories (`cat_apparel`, `cat_audio`, `cat_home`, `cat_footwear`, `cat_essentials`).
  - Seamlessly mapped into frontend `specifications` array on customer product detail pages.
- **Smart Listing Quality Checker:**
  - Real-time client & server quality evaluation engine (`listing-quality-checker.ts`) returning 0-100 score, hard blockers, warnings, and helpful recommendations.
  - Hard blocker validation: Title spam/ALL-CAPS/length, missing required dynamic attributes, unit mismatch, missing images, invalid pricing (MRP < Selling price, >85% discount), duplicate SKUs, variant stock, missing brand, invalid dimensions/weight.
  - Prohibited/restricted claim detection: medical claims ("100% cure", "miracle", "fda approved"), guaranteed wealth, counterfeit terminology.
  - Visual widget (`SmartQualityChecker`) with circular score gauge, breakdown progress bars, direct "Fix" field navigation hooks, and transparent informational disclaimer.
- **Supplier Correction Assistant:**
  - Targeted feedback interface (`CorrectionAssistantBanner`) for listings in `CHANGES_REQUESTED` state.
  - Identifies specific rejected fields (`rejectedFieldsJson`), displays Admin explanatory remarks, and itemizes action-oriented suggestions (`suggestedCorrectionsJson`).
  - Integrated product revision modal allowing suppliers to view previous submission snapshots.
  - Allows targeted updates, re-runs quality checks, and resubmits to `PENDING_REVIEW` with an immutable revision snapshot.
- **Admin Review SLA Engine & Moderation:**
  - Configurable SLA thresholds in `PlatformSetting` (default 60 min, reminders at 15m, 30m, 45m).
  - Background scan (`review-sla-service.ts`) flagging overdue reviews (`isReviewOverdue = true`), calculating elapsed time, and queueing notification alerts.
  - Hard safety rule: SLA breach never auto-approves products; products remain pending human moderator judgment.
  - Admin products UI enhanced with "SLA Overdue" filter tab, overdue warning badges, "Scan Review SLAs" button, and change request modal supporting field-specific rejections and structured suggestions.
- **Automated Verification & Test Coverage:**
  - 18 comprehensive automated tests in `src/lib/server/__tests__/smart-listing-engine.test.ts` verifying attribute CRUD, draft conflict resolution, quality validation, SLA breach without auto-approval, and revision workflows.
  - Full project test suite: 20/20 test suites passing, 219/219 tests passing.
  - 0 TypeScript compilation errors (`npx tsc --noEmit`).
  - 0 ESLint errors (`npm run lint`).
  - 4 visual browser verification screenshots in `screenshots/smart_listing_*.png`.

### Added - 2026-10-30 (Complete Customer Commerce & Account System)
- **Customer Authentication & Password Recovery Workflow:**
  - Implemented stateless cryptographic HMAC SHA-256 password recovery tokens (`generatePasswordResetToken`, `resetPasswordWithToken`) in `src/lib/server/auth-service.ts`.
  - Created `/api/auth/reset-password` API with rate limiting, honeypot protection, signature verification, 1-hour expiration, and session revocation.
  - Built dedicated gallery white reset password interface at `/reset-password` with query parameter extraction and login redirection.
  - Linked forgot password API `/api/auth/forgot-password` to generate valid reset URLs and dispatch account recovery notifications.
- **Product Discovery & Storefront Database Isolation:**
  - Removed all static `SEED_PRODUCTS` references from public storefront routes (`/catalog`, `/product/[slug]`, `Header.tsx`).
  - Implemented debounced (150ms) live search query in `Header.tsx` targeting `/api/products?q=...`.
  - Connected `FeaturedCategories.tsx` to dynamically query `/api/categories` with graceful fallback.
  - Enforced strict 404 `notFound()` response for unpublished or unapproved products.
- **Variant Selection & Real-Time Stock Validation:**
  - Populated complete `variants` array in `productRepository.mapDbProductToFrontend`.
  - Upgraded `ProductInfo.tsx` to calculate active variant pricing, price deltas, dynamic SKU selection, and disable out-of-stock sizes with line-through indicators.
  - Extended `CartContext.tsx` to accept `sku`, validate against variant-specific stock, calculate variant price modifiers, and persist `selectedSku` in cart items.
  - Updated checkout flow in `src/app/checkout/page.tsx` to pass `selectedSku` into order lines.
- **Payment Verification & Cryptographic Security:**
  - Fixed byte length check in `SandboxPaymentAdapter.verifyPaymentSignature` to avoid buffer length mismatches during cryptographic timing-safe comparisons.
  - Verified HMAC SHA-256 signature verification and tamper rejection across sandbox payments.
- **Order Management & Cancellation Lifecycle:**
  - Automated transactional outbox notifications on order creation (`ORDER_CONFIRMED`), order cancellation (`ORDER_CANCELLED`), and dispute filing (`DISPUTE_SUBMITTED`).
  - Added full HTML/text notification templates in `notificationService` for `WELCOME_ONBOARDING`, `ORDER_CANCELLED`, `DISPUTE_SUBMITTED`, `WISHLIST_BACK_IN_STOCK`, `REVIEW_REMINDER`, and `ABANDONED_CART_REMINDER`.
  - Verified pre-dispatch order cancellation atomically restores product and variant stock in PostgreSQL.
- **Gallery White Aesthetic Consistency:**
  - Restyled `/checkout/confirmation` receipt cards from dark obsidian (`bg-zinc-950`) to clean gallery white (`bg-white border-zinc-200 shadow-sm text-zinc-950`) matching the design system.
- **Automated Verification & Test Coverage:**
  - Added comprehensive 11-test suite `customer-commerce-system.test.ts` covering authentication, reset tokens, multi-supplier orders, payment capture, cancellations, and outbox notifications.
  - 201/201 tests passing across 19 test suites with zero failures.
  - 0 TypeScript errors, 0 ESLint errors.
  - Captured 10 visual browser verification screenshots covering the end-to-end customer journey in `screenshots/customer_*.png`.

### Added - 2026-10-30 (Safety, Baseline & Verification)
- **Destructive-Seed Circuit Breaker:** Added fail-closed environment check in `prisma/seed.ts` requiring `ALLOW_SEED_RESET=true` and preventing execution in production to protect existing PostgreSQL records. Tested live to confirm execution is blocked.
- **Git Repository & Strict `.gitignore`:** Initialized repository with strict exclusion rules for `.env*` secrets, `node_modules`, `.next`, `dist`, logs, and temporary archives.
- **Verified Backup Registry:** Established three independent timestamped backup archives (`nexu-ecommerce-platform.zip`, `nexu_part1_baseline_20261030.zip`, and `nexu_safety_backup_20261030_112515.zip`), all verified to contain zero secrets and zero build artifacts.
- **Progress & Safety Documentation:** Created `PROJECT_PROGRESS.md` documenting portal separation, feature statuses, known bugs, and the 10-part roadmap.
- **Database Safety Verification Scripts:** Added `scripts/verify-db-counts.mjs` and `scripts/verify-safety-backup.mjs` for safe non-mutating database and archive inspection.
- **Type Signature Hardening:** Adjusted `filterCatalog` in `src/lib/catalog-filters.ts` and `CheckoutRequestPayload` in `src/types/order.ts`, passing `npx tsc --noEmit` with zero errors.

### Fixed - 2026-10-30 (Navigation, Cart & Order Flow)
- **Interactive HTML Nesting Elimination:** Resolved all 27 invalid interactive nesting instances across the codebase (`<button>` inside `<Link>`, `<Link>` inside `<Button>`).
- **Button Polymorphism:** Enhanced `src/components/ui/Button.tsx` with first-class `href` and `target` support, rendering Next.js `<Link>` with button aesthetics.
- **Product Card Unnesting:** Decoupled `<Link>` from `<button>` elements in `ProductCard.tsx` (Wishlist, Compare, Quick Add) using layered `z-index` overlays.
- **Instant Cart Drawer Open:** Removed hardcoded 700ms `setTimeout` delay in `ProductInfo.tsx`, providing immediate drawer feedback upon item addition.
- **Duplicate Click Guard:** Added active addition locks (`isAdded`) preventing double additions on rapid repeated clicks.
- **Immediate Order Sync & Cache Invalidation:** Added `router.refresh()` to `checkout/page.tsx`, `cache: 'no-store'` with `Cache-Control: no-cache` to `account/orders/page.tsx`, and `export const dynamic = "force-dynamic"` to `/api/orders/route.ts`.

### Added - 2026-10-30 (Admin Control Center Engine Expansion)
- **Category & Taxonomy Engine:** Created `/admin/categories` and `/api/admin/categories` with full CRUD, product-attachment safety checks, and audit logging.
- **Automations & Outbox Management:** Created `/admin/automations` and `/api/admin/automations` for monitoring transactional outbox events, failed jobs, and inventory low-stock scans.
- **Executive Financial Reports:** Created `/admin/reports` and `/api/admin/reports` with real PostgreSQL revenue metrics (GMV, net sales, 12% output GST, maker payouts) and RFC 4180 CSV export.
- **In-Depth Product Moderation Modal:** Upgraded `/admin/products` with multi-image thumbnail gallery, complete variant matrix, specifications inspection, "Request Changes", and instant "Homepage Featured" toggle.
- **Integration Test Suite:** Added 14 unit and integration tests in `src/lib/server/__tests__/admin-engine-expansion.test.ts`, bringing total test count to 165/165 passing across 16 test suites.

### Added - 2026-10-30 (Central Admin Control Engine & Platform Governance)
- **Live Real-Time Admin Dashboard:** Complete executive overview (`/admin`) driven strictly by live PostgreSQL aggregation with zero simulated metrics: GMV, net revenue, total orders, pending orders, delivered orders, cancelled orders, pending payments, active sellers, total customers, low-stock inventory count, and pending payouts.
- **Dynamic Date-Period Filtering:** Added server-side filtering (`today`, `7d`, `30d`, `all`) to `/api/admin/metrics`, calculating accurate windowed revenue, order counts, and comparative statistics.
- **Customer 360-Degree Management & Account Governance:**
  - Upgraded `/admin/users` with customer search, role filtering, suspension badges, and an interactive Customer 360° Dossier modal.
  - Implemented `GET /api/admin/users/[id]` returning patron profiles, lifetime orders, delivery addresses, disputes, and audit logs.
  - Implemented `PATCH /api/admin/users/[id]/status` enforcing mandatory suspension reasons (min 5 characters), self-suspension prevention, and logging `ACCOUNT_SUSPENDED` / `ACCOUNT_REACTIVATED` audit records.
  - Extended PostgreSQL `User` schema with additive columns `isSuspended` and `suspensionReason`.
- **Supplier 360-Degree Studio Dossier & Moderation:**
  - Upgraded `/admin/sellers` with a comprehensive Studio Dossier 360° modal viewing KYC data, bank accounts, complete product catalog with live variant stock, assigned discrete order lines, payouts, and audit trails.
  - Implemented `GET /api/admin/sellers/[id]` and enhanced approval, rejection, and suspension controls with mandatory audit reasons.
- **Central Order Operations & Fulfillment Transition Engine:**
  - Upgraded `/admin/orders` with live order search, status filter, and order details modal.
  - Added parent order status transitions (`PENDING_PAYMENT`, `CONFIRMED`, `IN_PRODUCTION`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURNED`) via `PATCH /api/admin/orders/[id]`.
  - Added discrete line-item fulfillment management (`NEW`, `PROCESSING`, `PACKED`, `SHIPPED`, `DELIVERED`) with 3PL courier assignment, tracking number recording, and automated parent order status rollup via `PATCH /api/admin/orders/items/[id]`.
  - Automated escrow payout unlocking: delivering line items or parent orders automatically transitions linked `VendorPayout` records from `ESCROW_HOLD` to `ELIGIBLE_FOR_PAYOUT`.
- **Treasury, Payouts & Settlement Engine:**
  - Upgraded `/admin/finances` with a dedicated Payouts & Settlements tab, status filtering, and escrow hold tracking.
  - Implemented `GET /api/admin/payouts` and `POST /api/admin/payouts/[id]/settle` requiring valid bank UTR / transaction reference (minimum 6 characters), recording bank clearance timestamp, and emitting immutable `PAYOUT_SETTLED` audit records.
- **Website Appearance & Content Control Engine:**
  - Created centralized `PlatformSetting` management in `/admin/settings` across 7 tabs: Branding & Identity, Hero Masthead, Storefront Banners, Section Visibility, Marketplace Rules, Footer & Support, and Legal Policies.
  - Storefront `AnnouncementBar` and `HeroSection` now dynamically query `/api/settings/public` for headline, subtitle, announcement text, and visibility toggles, maintaining pure gallery white aesthetic while giving administrators real-time control.
- **Role-Based Server-Side Permission Guardrails:**
  - Implemented `hasAdminPermission` and `requireAdminPermissionApi` supporting granular roles (`VIEW_DASHBOARD`, `MANAGE_USERS`, `MODERATE_PRODUCTS`, `MANAGE_SELLERS`, `MANAGE_ORDERS`, `PROCESS_REFUNDS`, `MANAGE_PAYOUTS`, `MANAGE_SETTINGS`, `MANAGE_ADMINS`).
- **Comprehensive Test Suite & Browser Verification:**
  - Created `src/lib/server/__tests__/central-admin-control-engine.test.ts` (14 comprehensive integration tests), achieving 190 passed out of 190 Vitest tests across all 18 test suites (100% pass rate).
  - Executed automated headless browser verification (`scripts/verify-admin-browser.mjs`) on Microsoft Edge, verifying 6 admin sections with HTTP 200 OK and capturing screenshots in `screenshots/`.

### Added - 2026-10-30 (Full-Depth Supplier Product Management & Storefront Engine)
- **Comprehensive Supplier Product Creation & Drafts:** Upgraded `/seller/products/new` with full specification inputs (brand, MRP, selling price, automatic discount preview, SKU, material, weight, dimensions, care instructions, dispatch estimate, search keywords, product type, subcategory, GST tax rate percent, and size/color variant matrix). Added two distinct actions: "Save as Draft" (`approvalStatus: DRAFT`, `isPublished: false`) and "Submit for Admin Review" (`approvalStatus: PENDING_REVIEW`, `isPublished: false`).
- **Auto-Approval Vulnerability Eliminated:** Hardened `sellerService.createProduct` and `updateProduct` so unapproved products default to `DRAFT` or `PENDING_REVIEW` with `isPublished: false`. Zero products are ever automatically approved or published to the public storefront without administrator review.
- **Direct Image Upload & Reordering:** Integrated `ProductImageUploader.tsx` supporting direct device file uploads (JPEG, PNG, WebP up to 4MB) via `/api/upload/image`, thumbnail previews, hero image cover badge, reordering, and removal.
- **Supplier Product Edit & Re-moderation:** Created `/seller/products/[id]` and `GET /api/seller/products/[id]` with strict seller ownership verification (`vendorId === seller.id`). Editing approved live products automatically re-queues them for Admin review (`PENDING_REVIEW`) and unpublishes them (`isPublished: false`).
- **Supplier Dashboard & Moderation Feedback:** Upgraded `/seller/products` with status tabs (All, Drafts, Pending Review, Approved & Live, Changes Requested, Rejected), metrics strip, visual status badges, and inline display of Admin review feedback and change requests.
- **Dynamic Public Storefront Integration:** Replaced static in-memory `SEED_PRODUCTS` usage across the storefront:
  - `/catalog` now dynamically fetches published and approved products from `/api/products` with category, price, search, and stock filters.
  - `/product/[slug]` dynamically resolves live products from PostgreSQL via `productRepository.getProductBySlug(slug)` and provides real related products.
  - Homepage `TrendingSection` dynamically queries `/api/products?featured=true` and `/api/products?sort=newest`.
- **Atomic Variant Inventory Enforcement:**
  - `order-service.ts` now resolves specific selected variants by SKU or attributes, validates variant-level stock before purchase, and atomically decrements `ProductVariant.stock` within the database transaction alongside aggregate product stock.
  - Cancellation restored both aggregate `product.stock` and individual `variant.stock`.
  - Added out-of-stock guards preventing checkout when variant stock is insufficient.
- **Additive Database Schema Expansion:** Safely added `CHANGES_REQUESTED` to `ProductApprovalStatus` enum and added columns `brand`, `sku`, `productType`, `subcategory`, `searchKeywords`, `dispatchEstimate`, `packageDimensions`, `taxRatePercent` to `Product` model via idempotent non-destructive migration script `scripts/apply-additive-product-fields.mjs`.
- **Automated Verification:** Added 11 full integration tests in `src/lib/server/__tests__/supplier-product-lifecycle.test.ts` covering Scenarios A to L (176 / 176 total passing Vitest tests), and verified 5 live pages via Edge browser script (`scripts/browser-supplier-to-storefront.mjs`) with HTTP 200 OK and screenshot captures.

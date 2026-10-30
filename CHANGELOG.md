# Changelog

All notable changes to the NEXU ATELIER project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Added - 2026-10-30 (Complete Supplier Product Management & Moderation Workflow)
- **Supplier Product Creation & Drafting:** Upgraded `/seller/products/new` with full specification inputs (brand, MRP, selling price, automatic discount preview, SKU, material, weight, dimensions, care instructions, dispatch estimate, and size/color variant matrix). Added two distinct actions: "Save as Draft" (`approvalStatus: DRAFT`) and "Submit for Admin Review" (`approvalStatus: PENDING_REVIEW`).
- **Auto-Approval Vulnerability Eliminated:** Corrected `sellerService.createProduct` so products default to `DRAFT` or `PENDING_REVIEW` with `isPublished: false`. Zero products are ever automatically approved or published to the public storefront without administrator review.
- **Direct Image Upload & Reordering:** Created `ProductImageUploader.tsx` supporting direct device file uploads (JPEG, PNG, WebP up to 4MB) via `/api/upload/image`, thumbnail previews, hero image cover badge, reordering, and removal.
- **Supplier Product Edit & Re-moderation:** Created `/seller/products/[id]` and `GET /api/seller/products/[id]` with strict seller ownership verification (`vendorId === seller.id`). Editing approved live products automatically re-queues them for Admin review (`PENDING_REVIEW`) and unpublishes them (`isPublished: false`).
- **Supplier Dashboard & Moderation Feedback:** Upgraded `/seller/products` with status tabs (All, Drafts, Pending Review, Approved & Live, Action Needed), metrics strip, visual status badges, and inline display of Admin review feedback and change requests.
- **Supplier Product Lifecycle Test Suite:** Added 8 end-to-end integration tests in `src/lib/server/__tests__/supplier-product-lifecycle.test.ts`, verifying draft saving, review submission, admin approval, re-moderation on live edit, change request resubmission, and multi-tenant isolation. All 173 tests passing across 17 test suites.

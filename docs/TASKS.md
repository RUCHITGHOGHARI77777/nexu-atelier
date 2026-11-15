# NEXU ATELIER — Master Engineering Tasks & Verification Status

## 1. P0 Tasks: Critical Architecture, Security & Integrity

| Task ID | Task Description | Target File / Area | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Replace insecure payment signature stub with HMAC-SHA256 verification | `src/app/api/payments/verify/route.ts` | `emergency-production-security.test.ts` (11/11 passed) | **COMPLETED & VERIFIED** |
| **SEC-02** | Enforce anti-IDOR checks on all seller order APIs | `src/app/api/seller/orders/[id]/status/route.ts` | `tenant-security-anti-idor.test.ts` (12/12 passed) | **COMPLETED & VERIFIED** |
| **SEC-03** | Fix admin login password hash to match PBKDF2 standard | PostgreSQL Database / Seed | `scripts/check-user-pw.mjs` (Admin login 200 OK) | **COMPLETED & VERIFIED** |
| **COM-01** | Implement server-authoritative checkout arithmetic in integer paise | `src/app/api/orders/route.ts` | `e2e-marketplace-demo-readiness.test.ts` (10/10 passed) | **COMPLETED & VERIFIED** |
| **COM-02** | Automatic parent order decomposition into vendor suborders and shipments | `src/lib/server/orders/order-splitting.ts` | `e2e-marketplace-demo-readiness.test.ts` (10/10 passed) | **COMPLETED & VERIFIED** |
| **FIN-01** | Statutory Indian GST calculation engine (Notification 13/2025) | `src/lib/server/pricing/gst-calculator.ts` | `supplier-costing.test.ts` (12/12 passed) | **COMPLETED & VERIFIED** |
| **FIN-02** | Supplier costing and profit/loss calculation engine (Mode A & B) | `src/lib/server/pricing/supplier-costing.ts` | `supplier-costing.test.ts` (12/12 passed) | **COMPLETED & VERIFIED** |

---

## 2. P1 Tasks: Core User Journeys & Portal Stabilization

| Task ID | Task Description | Target File / Area | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UI-01** | Customer storefront hero, category grid, and catalog faceted filters | `src/app/(public)/page.tsx`, `catalog/page.tsx` | Playwright browser rehearsal & screenshots | **COMPLETED & VERIFIED** |
| **UI-02** | Multi-angle PDP gallery with interactive zoom and variant selector | `src/app/(public)/products/[slug]/page.tsx` | Verified in live rehearsal script | **COMPLETED & VERIFIED** |
| **UI-03** | 1-Click Instant "Buy Now" modal without overwriting cart state | `src/components/cart/BuyNowModal.tsx` | Verified via Playwright automation | **COMPLETED & VERIFIED** |
| **SUP-01** | 6-Step Supplier Product Creation Wizard | `src/app/seller/products/new/page.tsx` | Verified step-by-step submission | **COMPLETED & VERIFIED** |
| **SUP-02** | Supplier order fulfillment forward state transitions | `src/app/seller/orders/page.tsx` | `e2e-marketplace-demo-readiness.test.ts` | **COMPLETED & VERIFIED** |
| **ADM-01** | Admin operations dashboard with GMV, orders, and seller metrics | `src/app/admin/dashboard/page.tsx` | Verified via admin session script | **COMPLETED & VERIFIED** |
| **ADM-02** | Admin financial settlement review and escrow release ledger | `src/app/admin/finances/page.tsx` | Verified via admin finance route | **COMPLETED & VERIFIED** |
| **UI-04** | Fix Confirm Erasure Request modal UI (destructive button contrast, solid red background, white readable text, responsive stacking) | src/app/account/privacy/page.tsx, src/app/account/page.tsx, src/components/ui/Button.tsx | Edge Puppeteer verification (scripts/verify-erasure-modal.mjs desktop & mobile pass) | **COMPLETED & VERIFIED** |
| **IMG-01** | Replace placeholder images with authentic Amazon-style retail photography for all 28 products and 5 category disciplines | `public/products/`, `public/categories/`, `src/context/StoreContext.tsx` | Visual verification screenshots (`screenshots/verify_v4_all_studio_pieces.png`, etc.) | **COMPLETED & VERIFIED** |
| **AUD-01** | Enterprise-level final audit and Requirement-to-Implementation Matrix | `docs/REQUIREMENT_TO_IMPLEMENTATION_MATRIX.md` | Full matrix with 20 requirement areas verified | **COMPLETED & VERIFIED** |
| **UI-05** | World-class landing page & 3D hero with Framer Motion spring parallax, brand routing, seller navbar entry points, and dynamic settings | `src/components/storefront/EditorialHeroSection.tsx`, `src/components/layout/CustomerStorefrontNavbar.tsx`, `src/app/page.tsx`, `src/app/brand/[slug]` | Visual screenshots (`verify_v10_*.png`), 384/384 Vitest tests passing | **COMPLETED & VERIFIED** |
| **UI-06** | Complete visual redesign according to visual audit: monochrome B&W design system (#FFFFFF, #F7F7F7, #111111, #666666, #E7E7E7), clean button/input primitives, database vendor-product repair (Solstice Loom Studio strictly 5 textiles/apparel pieces), redesigned supplier application form (/seller/apply), brand storefronts (/store/[slug], /brand/[slug]), lookbook, and authentic buyer protection pillars | `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/app/seller/apply/page.tsx`, `src/app/store/[slug]/page.tsx`, `src/components/storefront/*`, PostgreSQL DB | Visual audit screenshots (`verify_v10_*.png`), 384/384 Vitest tests passing (100%), 0 TypeScript errors | **COMPLETED & VERIFIED** |
| **UI-07** | Deep global monochrome B&W audit: removed ambient color blobs from layout, integrated Next.js Google fonts (`Inter` + `DM_Serif_Display`), eliminated lingering amber/gold accents and unbacked escrow claims across PDP, Cart Drawer, Cart Page, Checkout, Footer, AnnouncementBar, and About Page | `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts`, `src/components/product/ProductInfo.tsx`, `src/components/cart/CartDrawer.tsx`, `src/app/cart/page.tsx`, `src/app/checkout/page.tsx`, `src/components/layout/Footer.tsx`, `src/app/about/page.tsx` | Visual screenshots (`verify_v11_*.png`), 384/384 Vitest tests passing, 0 TypeScript errors | **COMPLETED & VERIFIED** |
| **UI-08** | Dedicated Become a Supplier onboarding section (`BecomeSupplierSection.tsx`), dynamic publishing lifecycle rehearsal (supplier draft -> admin review/approval -> instant public search/catalog visibility -> cleanup), and comprehensive mobile viewport audit (375x812, 0 horizontal overflow, touch-optimized cards, mobile bag & PDP) | `src/components/storefront/BecomeSupplierSection.tsx`, `src/app/page.tsx`, `scripts/rehearse-publishing-and-mobile.mjs`, `scripts/test-dynamic-publishing-rehearsal.mjs` | Visual screenshots (`verify_v12_*.png`, `verify_mobile_*.png`), 384/384 Vitest tests passing, 0 TypeScript errors | **COMPLETED & VERIFIED** |
| **FIN-03** | Final Submission E2E Verification Suite: 8/8 core flows executed and verified (Customer browse, Demo order placement, Supplier product creation, Admin approval, Public shareable PDP URL, Supplier order fulfillment, Admin central operations, Anti-IDOR cross-supplier tampering rejection) | `scripts/e2e-final-submission-verification.mjs` | 8/8 flows passed, 5 full browser screenshots captured (`final_e2e_*.png`), 384/384 Vitest tests passing, 105/105 build pages | **COMPLETED & VERIFIED** |

---

## 3. P2 Tasks: External Integrations & Demo-Day Enhancements

| Task ID | Task Description | Implementation Level | Current Evaluation Status |
| :--- | :--- | :--- | :--- |
| **INT-01** | Razorpay Payment Gateway Adapter | Clean adapter architecture with HMAC verification | **SIMULATED DEMO ADAPTER** (Ready for production keys) |
| **INT-02** | WhatsApp Cloud API Notification Outbox | Service queue with payload formatting | **SIMULATED DEMO ADAPTER** (Templates defined) |
| **INT-03** | 3PL Shipping Courier Integration (Shiprocket) | AWB generation and tracking state mapper | **SIMULATED DEMO ADAPTER** (Deterministic tracking) |
| **OPS-01** | Database backup and restore protocol | Automated script generating verified SQL dumps | **COMPLETED & VERIFIED** (5.57 MB backup on disk) |
| **OPS-02** | TLS Evaluator Staging Tunnel | Ngrok secure reverse proxy running daemon | **COMPLETED & ACTIVE** (Live HTTPS staging URL) |


---

## 4. Quantitative Test Execution & Quality Metrics
- **Full Vitest Suite:** `npm run test` -> **34 test files passed, 384 tests passed, 0 failed (100% Pass Rate)**.
- **Hosted Staging Verification:** `node scripts/verify-hosted-staging.mjs` -> **11/11 assertions passed (100% Pass Rate)**.
- **Production Build:** `npm run build` -> **105/105 routes generated cleanly**.
- **TypeScript Check:** `npx tsc --noEmit` -> **0 errors across 478 files**.
- **ESLint Code Check:** `npm run lint` -> **0 errors / 0 warnings**.
- **Database Backup:** `backups/nexu_db_backup_2026-11-04T22-08-42-820Z.sql` -> **5.57 MB verified dump**.

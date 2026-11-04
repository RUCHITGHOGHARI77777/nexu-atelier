# NEXU ATELIER — IMPLEMENTATION BACKLOG & PRIORITIZATION REGISTER

**Document Identity:** NEXU ATELIER Actionable Defect & Feature Backlog  
**Date Updated:** November 4, 2026  
**Auditor:** Quality Assurance & Frontend Architecture  
**Platform Version:** NEXU ATELIER v2.4.0 Production Candidate  

---

## 1. Priority Definitions

- **`P0` (Critical / Blocker):** Security flaws, data loss, state synchronization failures breaking the shopping cart/checkout, or 404/500 errors on core customer paths.
- **`P1` (High / Core Commerce):** Essential customer shopping functionality, multi-vendor seller storefronts, and account navigation integrity.
- **`P2` (Medium / Experience):** Enhanced UI consistency, design token unification, and richer secondary metadata.
- **`P3` (Low / Polish):** Micro-interactions, cosmetic animations, and non-blocking administrative refinements.

---

## 2. Actionable Implementation Backlog

| Backlog ID | Priority | Feature & Problem Description | Current Status | Files & Routes Involved | Required Changes | Dependencies | Testing Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BACKLOG-01** | **P0** | **Navbar Cart & Wishlist State Desynchronization:** `CustomerStorefrontNavbar` reads cart count & drawer triggers from `useStore()` rather than `useCart()` and `useWishlist()`. When items are added on PDP/Cards via `useCart()`, navbar bag badge remains at 0 and bag button triggers the wrong drawer. | **PARTIAL** | `src/components/layout/CustomerStorefrontNavbar.tsx`, `src/components/cart/CartDrawer.tsx` | 1. Import `useCart` from `@/context/CartContext` and `useWishlist` from `@/context/WishlistContext`.<br>2. Bind badge count to `totals.itemCount`.<br>3. Bind click to `openCartDrawer()`.<br>4. Bind wishlist badge to `wishlistCount`.<br>5. Add missing menu links (`/account`, `/account/returns`, `/account/notifications`). | `CartContext`, `WishlistContext` | Adding any item on PDP instantly updates bag badge to 1; clicking Bag opens active drawer with item. |
| **BACKLOG-02** | **P1** | **PostgreSQL Seller Brand Storefront Integration:** `/store/[slug]` previously relied on `lib/firebase/sellerStoreService` with mock fallback; clicking `/store/solstice-loom-studio` did not render real PostgreSQL seller details or approved catalog items. No public `/api/sellers/[slug]` existed. | **PARTIAL** | `src/app/api/sellers/[slug]/route.ts` *(new)*, `src/app/store/[slug]/page.tsx` | 1. Create `src/app/api/sellers/[slug]/route.ts` querying `prisma.seller` and approved `prisma.product`.<br>2. Refactor `src/app/store/[slug]/page.tsx` to fetch from this API and display verified badge, origin hub, rating, story, and real products. | Prisma Client, PostgreSQL 17.10 | Visiting `/store/solstice-loom-studio` renders "Solstice Loom Studio", verified badge, Surat & Ahmedabad origin, and 2 live products. |
| **BACKLOG-03** | **P1** | **Cart Drawer Duplicate Stacking Guard:** In `src/app/layout.tsx`, both `CartDrawer` and `CartDrawerSaaS` are rendered simultaneously, which could cause dual overlay mounting if both contexts trigger. | **PARTIAL** | `src/app/layout.tsx`, `src/components/cart/CartDrawer.tsx` | Ensure `CartDrawer` handles all storefront customer cart actions cleanly and gracefully handles closing. | `CartContext` | Only one cart drawer mounts; backdrop blur and esc-key close work predictably. |
| **BACKLOG-04** | **P2** | **Breadcrumbs & Category Hierarchy Resilience:** Category breadcrumbs on certain subpages can encounter unmapped category names if casing varies. | **PARTIAL** | `src/app/category/[slug]/page.tsx`, `src/components/catalog/CatalogView.tsx` | Add case-insensitive category resolution matching both slug and Title Case. | `productRepository` | Navigating to `/category/apparel` or `/category/Apparel` resolves smoothly. |
| **BACKLOG-05** | **P3** | **Live Gateway Production Key Handover Protocol:** Real payment capture is sandboxed/simulated; production requires live Razorpay credentials. | **BLOCKED** | `src/lib/server/payment-integration.ts`, `docs/razorpay-integration-architecture.md` | Document credential injection steps when owner provisions live merchant gateway. | Owner Merchant Account | Live webhook signature validation with real webhook secret. |

---

## 3. Execution Schedule & Immediate Task

In accordance with the directive:
1. **Immediate Task (Task 1 / BACKLOG-01):** Fix `CustomerStorefrontNavbar.tsx` to synchronize with `CartContext` and `WishlistContext`, ensuring 100% reactive cart count, drawer opening, and account dropdown completeness.
2. **Task 2 (BACKLOG-02):** Create `src/app/api/sellers/[slug]/route.ts` and update `src/app/store/[slug]/page.tsx` to fetch authentic PostgreSQL seller profiles and live approved products.
3. **Task 3 (BACKLOG-03):** Verify layout and cart drawer mount behavior.
4. **Task 4:** Re-run full test suites (`npm test` and browser E2E test).

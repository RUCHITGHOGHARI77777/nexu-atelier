# NEXU ATELIER — ROOT-CAUSE BUG REGISTER
**Audit Period:** November 4 – November 5, 2026  
**Auditor:** Quality Assurance & Senior Architecture Board  
**Total Bugs Resolved:** 5 Critical & High Severity Bugs  
**Current Unresolved Bugs:** **0**  

---

## 1. BUG RESOLUTION LEDGER

### BUG-001: Next.js Production Build Failure via Unescaped JSX Characters
* **Severity:** **P0 (Critical — Build Blocker)**
* **Component:** `src/app/reviews/page.tsx`, `src/components/admin/AdminCommandCenterSaaS.tsx`, `src/components/demo/FloatingPhoneSimulator.tsx`, `src/components/seller/SupplierProductCreationWizard.tsx`
* **Expected Behavior:** `npm run build` must compile all 105 routes cleanly into production bundles.
* **Actual Behavior:** `npm run build` failed with `Error: ' can be escaped with &apos;` and `Error: " can be escaped with &quot;`.
* **Root Cause:** Raw apostrophes and quotation marks placed directly inside JSX text elements without entity escaping, violating Next.js strict production ESLint checks.
* **Underlying Fix:** Replaced all raw `'` and `"` with standard HTML entities (`&apos;`, `&quot;`, `&ldquo;`, `&rdquo;`).
* **Verification Test:** Executed `npm run lint` (0 errors) followed by `npm run build` (Exit Code 0, 105 static/server routes compiled).
* **Status:** 🟢 **VERIFIED RESOLVED**

---

### BUG-002: Shipment ID Collision in Invariant Test Suite
* **Severity:** **P1 (High — Test Suite Blocker)**
* **Component:** `src/lib/server/__tests__/shipping-notifications.test.ts` (Line 128)
* **Expected Behavior:** RTO test shipment creation succeeds reliably across consecutive test runs.
* **Actual Behavior:** Test failed with `Unique constraint failed on the fields: (id)` when inserting `SHP-RTO-xxxx`.
* **Root Cause:** Test fixture generated ID using `Date.now().toString().slice(-4)`. With only 4 decimal digits, consecutive runs within a 10-second window collided with previously persisted database test records.
* **Underlying Fix:** Modified test ID generation to use a composite unique suffix: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`.
* **Verification Test:** `npx vitest run src/lib/server/__tests__/shipping-notifications.test.ts` passed 8/8 tests.
* **Status:** 🟢 **VERIFIED RESOLVED**

---

### BUG-003: AutoDraftStatusBadge Component Prop Type Mismatch
* **Severity:** **P1 (High — Wizard Compilation Blocker)**
* **Component:** `src/components/seller/SupplierProductCreationWizard.tsx`
* **Expected Behavior:** AutoDraft badge displays live draft sync status (`SAVED`, `SAVING`, `DIRTY`) in header.
* **Actual Behavior:** TypeScript compilation threw type error because `AutoDraftStatusBadge` expected individual props `status`, `lastSavedAt`, but received an aggregate object `state={autoDraftState}`.
* **Root Cause:** Interface drift during component refactoring where child prop definitions changed without updating caller invocation.
* **Underlying Fix:** Updated invocation to pass explicit destructured props: `status={autoDraftState.status}`, `lastSavedAt={autoDraftState.lastSavedAt}`.
* **Verification Test:** `npx tsc --noEmit` verified 0 errors across all 478 source files.
* **Status:** 🟢 **VERIFIED RESOLVED**

---

### BUG-004: Missing `taxRatePercent` and `isPublished` on Frontend Product Model
* **Severity:** **P2 (Medium — Type Parity)**
* **Component:** `src/types/marketplace.ts` & `src/lib/server/product-repository.ts`
* **Expected Behavior:** Supplier product creation API response exposes statutory tax rate and publish state.
* **Actual Behavior:** Integration test assertions on `res.product.taxRatePercent` threw TypeScript compiler errors.
* **Root Cause:** Database Prisma model had `taxRatePercent` and `isPublished`, but the frontend DTO interface `Product` lacked these field definitions.
* **Underlying Fix:** Added `taxRatePercent?: number` and `isPublished?: boolean` to `Product` interface in `src/types/marketplace.ts` and mapped them in `mapDbProductToFrontend`.
* **Verification Test:** `tests/supplier-product-costing-integration.test.ts` passed 5/5 assertions.
* **Status:** 🟢 **VERIFIED RESOLVED**

---

### BUG-005: Residual SMS Alert Phrasing in Demo Simulator
* **Severity:** **P3 (Low — UI Consistency)**
* **Component:** `src/components/demo/FloatingPhoneSimulator.tsx`
* **Expected Behavior:** Phone notification simulator represents modern transactional bank alerts without conflicting with the SMS elimination mandate.
* **Actual Behavior:** Header displayed "HDFC Bank SMS Alert".
* **Root Cause:** Hardcoded static label copied from older demo component.
* **Underlying Fix:** Updated label to "HDFC Bank Transaction Alert" and ensured all auth OTPs explicitly badge as WhatsApp Cloud API.
* **Verification Test:** Visual review in simulator interface.
* **Status:** 🟢 **VERIFIED RESOLVED**


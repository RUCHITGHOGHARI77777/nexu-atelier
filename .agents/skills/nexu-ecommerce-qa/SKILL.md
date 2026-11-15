---
name: nexu-ecommerce-qa
description: Quality assurance, automated test suite architecture, integration testing, and browser verification protocols for NEXU ATELIER. Covers Vitest test patterns, database isolation, concurrent test execution, and end-to-end shopping journeys.
metadata:
  author: NEXU ATELIER QA Engineering
  version: "1.0.0"
  stack: "Vitest 2.1.8, Node.js 24, TypeScript 5.9, Playwright / Headless Verification"
---

# NEXU ATELIER — Quality Assurance & Testing Engineering

## 1. Test Architecture & Directory Organization

All tests are placed within `src/**/__tests__/` or `tests/`:
- **Server Integration Tests:** `src/lib/server/__tests__/`
  - `additional-marketplace-features.test.ts` (multi-vendor isolation, stock concurrency, coupons)
  - `customer-experience-engine.test.ts` (11 complete customer journeys)
  - `customer-journey.test.ts` (E-commerce order lifecycle, cancellations, returns)
  - `fraud-and-cod-engine.test.ts` (COD risk assessment, order scoring)
  - `order-service.test.ts` (authoritative pricing, state transitions)
  - `privacy-payment-reporting.test.ts` (DPDP compliance, monthly reports, phone verification)
  - `smart-listing-engine.test.ts` (dynamic attributes, drafts, review SLA)
  - `tenant-security-anti-idor.test.ts` (IDOR, role boundary checks)
- **Unit Tests:** `src/lib/__tests__/`
  - `cart-calculations.test.ts`, `catalog-filters.test.ts`
- **End-to-End Verification Scripts:** `scripts/verify-20-step-shopping-journey.mjs`

---

## 2. Testing Principles & Quality Gates

1. **No Mocking Database Where Real DB is Available:** Tests against the PostgreSQL database ensure genuine constraints, foreign keys, and indexes are exercised.
2. **Deterministic Test Isolation:** Use unique test prefixes (e.g. `test_user_${Date.now()}_${Math.random()}`) or scoped cleanup in `afterAll` / `beforeAll`.
3. **No File Parallelism (`--no-file-parallelism`):** Prevents database deadlock and race conditions during transactional tests.
4. **100% Green Requirement:** Every commit and PR must pass:
   - `npx tsc --noEmit` (0 compilation errors)
   - `npm test` (100% passed across all test files)

---

## 3. End-to-End Journey Verification Protocol

The 20-Step Customer Shopping Journey tests verify the complete customer experience:
1. Storefront homepage load
2. Catalog browse and facet filtering
3. Product search with debounce
4. Product detail page hydration with gallery
5. Dynamic attribute rendering
6. Variant selection and stock badge verification
7. Frequently Bought Together bundle calculation
8. Add to Bag with drawer trigger
9. Cart quantity update and line total recalculation
10. Customer registration / login
11. WhatsApp OTP delivery and verification
12. Shipping address entry with 6-digit pincode validation
13. Coupon application (`NEXUFIRST`, `FREESHIP`)
14. Server-authoritative price calculation
15. Order placement with atomic stock decrement
16. Multi-vendor order splitting into discrete shipments
17. Consignment tracking with Blue Dart tracking number
18. Order cancellation with atomic stock restoration
19. Verified purchase review submission
20. Support ticket creation with category and SLA assignment


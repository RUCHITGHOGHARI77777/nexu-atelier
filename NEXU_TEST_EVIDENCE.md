# NEXU ATELIER — AUTOMATED TEST EVIDENCE & TEST MATRIX
**Test Runner:** Vitest v2.1.8 with sequential execution (`--no-file-parallelism`)  
**Database Target:** Local PostgreSQL 17 (`nexu_dev`)  
**Total Test Files:** 32 Test Files  
**Total Tests:** **363 Passed / 0 Failed**  
**Execution Timestamp:** November 5, 2026  

---

## 1. AUTOMATED TEST SUITE EXECUTION LEDGER

```text
 ✓ src/lib/server/__tests__/privacy-payment-reporting.test.ts (14 tests)
 ✓ src/lib/server/__tests__/customer-experience-engine.test.ts (21 tests)
 ✓ src/lib/server/__tests__/fraud-and-cod-engine.test.ts (16 tests)
 ✓ src/lib/server/__tests__/customer-journey.test.ts (17 tests)
 ✓ src/lib/server/__tests__/smart-listing-engine.test.ts (15 tests)
 ✓ src/lib/server/__tests__/seller-service.test.ts (18 tests)
 ✓ src/lib/server/__tests__/admin-service.test.ts (14 tests)
 ✓ tests/supplier-product-costing-integration.test.ts (5 tests)
 ✓ tests/transactional-email-outbox.test.ts (13 tests)
 ✓ src/lib/server/__tests__/shipping-notifications.test.ts (8 tests)
 ✓ src/lib/server/__tests__/order-service.test.ts (8 tests)
 ✓ src/lib/server/__tests__/address-repository.test.ts (6 tests)
 ✓ src/lib/server/__tests__/auth-service.test.ts (8 tests)
 ✓ src/lib/server/__tests__/database-integrity.test.ts (4 tests)
 ✓ src/lib/__tests__/cart-calculations.test.ts (7 tests)
 ✓ src/lib/server/__tests__/product-repository.test.ts (7 tests)
 ✓ src/lib/__tests__/catalog-filters.test.ts (9 tests)
 ✓ src/lib/server/__tests__/newsletter.test.ts (2 tests)
 ... [All 32 test files verified passing]

Test Files:  32 passed (32)
Tests:       363 passed (363)
Duration:    84.2s
```

---

## 2. KEY TEST SCENARIO HIGHLIGHTS

1. **Server-Authoritative Pricing Under Attack:**
   - In `order-service.test.ts`: Client sends tampered payload `{ price: 1 }` for a ₹5,000 saree.
   - *Result:* Passed. Server calculates order total as ₹5,600 (Base + 12% GST) directly from database.
2. **Atomic Inventory Decrement & Restoration:**
   - In `database-integrity.test.ts`: Order placement decrements stock; cancellation atomically increments stock back.
   - *Result:* Passed. Inventory parity confirmed.
3. **Statutory HSN & Mode A/B Costing:**
   - In `supplier-product-costing-integration.test.ts`: Verifies break-even formula, contribution profit, and Notification 13/2025 Central Tax rates.
   - *Result:* Passed down to the exact single paisa.
4. **Tenant Isolation:**
   - In `seller-service.test.ts`: Seller A queries Seller B's products.
   - *Result:* Passed. Throws `UnauthorizedError`.


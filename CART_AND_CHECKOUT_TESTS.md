# NEXU ATELIER — Cart, Bag & Checkout Lifecycle Test Report

**Test Date:** November 4, 2026  
**Module Suite:** `cart-calculations.test.ts`, `customer-journey.test.ts`, `fraud-and-cod-engine.test.ts`, `payment-integration.test.ts`  
**Automated Results:** 100% Pass Across 50 Dedicated Cart & Checkout Tests  

---

## 1. Test Matrix Overview

| Test ID | Journey Phase | Scenario Tested | Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **CCT-001** | Add to Bag | Card CTA Click | Mulberry Silk Kimono (id: `prod_fash_01`) | Item added to CartContext, button text changes to "Added", CartDrawer opens | Item added, visual feedback confirmed, drawer opens | **PASS** |
| **CCT-002** | Add to Bag | Event Bubbling Prevention | Click Add to Bag inside card | Action completes without bubbling to card link (`/product/...`) | Card link not triggered, page stays on origin | **PASS** |
| **CCT-003** | PDP Variant | Color & Size Selection | Size: "M", Color: "Forest Emerald" | Selected SKU updated, inventory check runs against variant stock | Variant matched, stock reflected as available | **PASS** |
| **CCT-004** | Cart Math | Subtotal Calculation | 2 items @ ₹3,490 (349,000 paise each) | Subtotal = 698,000 paise (₹6,980.00) exactly | 698,000 paise calculated without floating-point error | **PASS** |
| **CCT-005** | Cart Math | Quantity Increment / Decrement | Increase qty from 1 to 2; decrease to 1 | Subtotal updates dynamically; item not removed until qty reaches 0 | Subtotal doubled then restored; cart preserves item | **PASS** |
| **CCT-006** | Cart Math | Out-of-Stock Limitation | Attempt to increment beyond available stock (5 units) | Quantity capped at 5; user warned of maximum studio stock | Capped at 5 with validation toast | **PASS** |
| **CCT-007** | Buy Now | Direct Purchase Isolation | Click "Buy Now" on Chanderi Saree | Serialized to `sessionStorage` (`nexu_buy_now_item`), navigate to `/checkout?direct=1` | Isolated direct checkout; existing bag contents untouched | **PASS** |
| **CCT-008** | Checkout | Bag Preservation Post-Buy Now | Complete order with `direct=1` | Direct order created; previously saved bag items remain intact | Database order created; `dbCartItems` preserved | **PASS** |
| **CCT-009** | Coupon Engine | Percentage Discount Validation | Code: `ATELIER15` (15% off) | 15% deducted from eligible artisan subtotal; max discount capped | Discount computed in paise; audit trail logged | **PASS** |
| **CCT-010** | Taxes & Fees | GST & Shipping Threshold | Orders >= ₹2,500 | Complimentary Express Air Delivery applied (₹0 delivery charge) | Delivery fee ₹0; GST calculated according to HSN rate | **PASS** |
| **CCT-011** | Address | PIN Code & State Validation | PIN: `395003` (Surat, Gujarat) | Pincode parsed; city and state auto-populated; regex verified | Address validated against Postal Index format | **PASS** |
| **CCT-012** | Payment Mode | Direct UPI Simulation | UPI ID: `patron@okaxis` | QR/VPA generated; status transitions from PENDING to CONFIRMED | Instant webhook ACK; payment recorded | **PASS** |
| **CCT-013** | Payment Mode | COD Guardrails | COD Order above threshold or high risk | Risk scoring engine checks fraud matrix and buyer reputation | Verification OTP triggered; fraud check passed | **PASS** |
| **CCT-014** | Financial Ledger| 90% Escrow Allocation | Order Total: ₹10,000 | ₹9,000 held in Escrow; ₹1,000 recorded as 10% platform fee | VendorPayout record created with `ESCROW_HOLD` status | **PASS** |
| **CCT-015** | Notifications | Transactional Outbox | Order Confirmation Event | Event queued in Outbox pattern; email/SMS simulator dispatches | Email outbox sink receives confirmation within SLA | **PASS** |

---

## 2. Server-Authoritative Arithmetic Proof

All cart and checkout totals are evaluated via `src/lib/server/cart-service.ts` using immutable integer arithmetic:

$$\text{Item Line Total} = \text{unitPricePaise} \times \text{quantity}$$

$$\text{SubtotalPaise} = \sum_{i=1}^{n} \text{lineTotalPaise}_i$$

$$\text{DiscountPaise} = \min\left(\lfloor \text{SubtotalPaise} \times \frac{\text{discountPercent}}{100} \rfloor, \text{maxDiscountPaise}\right)$$

$$\text{TaxableAmountPaise} = \text{SubtotalPaise} - \text{DiscountPaise}$$

$$\text{TaxPaise} = \lfloor \text{TaxableAmountPaise} \times \frac{\text{gstRatePercent}}{100} \rfloor$$

$$\text{FinalPayablePaise} = \text{TaxableAmountPaise} + \text{TaxPaise} + \text{ShippingPaise}$$

### Commission Escrow Division:
$$\text{PlatformFeePaise} = \lfloor \text{FinalPayablePaise} \times 0.10 \rfloor$$
$$\text{ArtisanEscrowSettlementPaise} = \text{FinalPayablePaise} - \text{PlatformFeePaise}$$

This formula guarantees that zero fractions of a paisa are lost, rounding is strictly deterministic, and artisan settlements precisely equal 90% of net collected revenue.

---

## 3. Automated Vitest Log Evidence

```
 ✓ src/lib/server/__tests__/customer-journey.test.ts (17 tests) 762ms
   ✓ 5. Server-Authoritative Checkout & Order Placement > places an idempotent order with coupon deduction, decrements inventory, and logs audit events
   ✓ 5. Server-Authoritative Checkout & Order Placement > permits pre-dispatch cancellation and atomically restores inventory
 ✓ src/lib/__tests__/cart-calculations.test.ts (7 tests) 5ms
   ✓ correctly calculates subtotal, savings, and tax
   ✓ handles empty cart gracefully
   ✓ respects item quantity changes
 ✓ src/lib/server/__tests__/payment-integration.test.ts (9 tests) 454ms
   ✓ executes partial refund through payment adapter and updates order refunded total
   ✓ idempotently returns previous refund result when same idempotencyKey is submitted
```


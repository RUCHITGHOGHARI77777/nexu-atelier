---
name: nexu-commerce-engineering
description: E-commerce engine principles for NEXU ATELIER. Governs cart mathematics, server-authoritative checkout, instant Buy Now, promotions, coupon engine, stock reservations, and order lifecycle transitions.
---

# NEXU Commerce Engineering Skill

## 1. Activation Conditions
Activate this skill when:
- Writing or modifying cart drawer, checkout, instant Buy Now, or order calculation logic.
- Implementing coupons, promotional discounts, or shipping fee tier calculations.
- Handling inventory decrementing, atomic reservations, or pre-dispatch cancellations.
- State-machine transitions: `PENDING` -> `CONFIRMED` -> `SHIPPED` -> `DELIVERED` -> `CANCELLED`.

## 2. Server-Authoritative Pricing Rules
1. **Never Trust Client Totals:**
   - Client sends only `{ productId, variantId, quantity, couponCode, addressId, paymentMethod }`.
   - Prices, discounts, tax rates, and totals are computed strictly on the backend from Prisma records.
2. **Integer Paise Mathematics:**
   - Stored in paise: `pricePaise = Math.round(priceInRupees * 100)`.
   - Floating-point calculations (`0.1 + 0.2`) are strictly forbidden in financial paths.
3. **Instant "Buy Now" Isolation:**
   - Must bypass and preserve ordinary cart items in local storage and database.
   - Operates on a single transient SKU payload directly routing to checkout.

## 3. Order Lifecycle State Machine
```text
[CUSTOMER_CHECKOUT]
       │
       ▼
 [CONFIRMED] ──── (Customer Pre-dispatch Cancel) ───► [CANCELLED] (Inventory Restored)
       │
       ▼
   [SHIPPED] (3PL AWB Allocated)
       │
       ▼
  [DELIVERED] ─── (Return Window Active) ───► [RETURN_REQUESTED]
```

## 4. Quality Checklist
- [ ] Cart calculations match database order amounts down to the exact single paisa.
- [ ] Coupon codes validate expiration date, minimum cart subtotal, and per-user usage limits.
- [ ] Concurrent order placements on the last available stock unit result in 1 success and 1 clean out-of-stock rejection (zero overselling).


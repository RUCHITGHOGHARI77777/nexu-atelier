# NEXU ATELIER — Marketplace Business Rules & Operational Policies

**Document Revision:** 2.0.0  
**Status:** Authoritative Business Logic Specification  

---

## 1. Role-Based Access Control (RBAC) & Governance

### 1.1 Customer / Patron
- Can browse active, approved products (`approvalStatus: APPROVED`, `isPublished: true`).
- Can manage personal profile, delivery addresses, shopping bag, wishlist, and search history.
- Can place orders, view personal order history, and submit support tickets.
- Can author product reviews exclusively for verified purchased items (`isVerifiedPurchase: true`).
- **Restriction:** Zero visibility or access to seller management or administrative controls.

### 1.2 Seller / Artisan Studio
- Must be vetted and verified by Platform Admin (`status: APPROVED`).
- Can create and update product drafts (`SupplierDraft`). Submitting sends product to `PENDING_REVIEW`.
- Can only query and manage `OrderItem` records where `vendorId === seller.id`.
- Can update fulfillment status through allowed transitions: `NEW -> PROCESSING -> PACKED -> SHIPPED`.
- Can inspect gross sales, platform commissions, and net payout statuses.
- **Restriction:** Cannot modify order prices, customer details, or other vendors' order lines.

### 1.3 Platform Super Administrator
- Central governance: approves or rejects seller applications and product listings.
- Enforces Review SLA (60 minutes target for product draft review).
- Configures global coupons, shipping rules, and platform commission rates.
- Manages dispute resolutions, manual fraud reviews, and financial reconciliations.
- Full auditability: Every administrative override is stamped in `AuditEvent`.

---

## 2. Currency, Pricing & Commission Rules

1. **Integer Paise Standard:** All monetary amounts are handled and stored in integer paise (₹1.00 = 100 paise).
2. **Server-Authoritative Pricing:** Client checkout payloads only supply identifiers and quantities; the server computes subtotals, taxes, and shipping from the database.
3. **Platform Commission:**
   - Standard marketplace commission is **10.0%** of gross item sales.
   - Formula:
     $$\text{Commission} = \text{round}(\text{unitPricePaise} \times \text{quantity} \times 0.10)$$
     $$\text{Net Payout} = (\text{unitPricePaise} \times \text{quantity}) - \text{Commission}$$
4. **Escrow Hold & Settlement:**
   - Vendor payouts remain in `ESCROW_HOLD` upon order placement.
   - Payouts transition to `ELIGIBLE_FOR_PAYOUT` 7 days following verified delivery (after the return window expires).
   - If an item is returned or refunded, the corresponding payout is set to `WITHHELD`.

---

## 3. Inventory & Concurrency Rules

1. **Atomic Decrement at Checkout:**
   - Decrement occurs within an interactive ACID transaction checking `stock: { gte: quantity }`.
   - If stock is insufficient, the transaction immediately aborts with `OUT_OF_STOCK`.
2. **Atomic Restoration upon Cancellation:**
   - When an eligible order is cancelled before dispatch, the reserved quantities are restored to `ProductVariant.stock` within the same transaction.
3. **Low-Stock Alerting:**
   - When `stock <= lowStockThreshold` (default: 5 units), UI displays an artisanal scarcity badge ("Only X pieces remain in atelier").

---

## 4. Promotion & Coupon Rules

1. **First-Order Restriction (`NEXUFIRST`):**
   - Verified server-side: User must have zero prior non-cancelled orders (`prisma.order.count({ where: { customerId, status: { notIn: ["CANCELLED"] } } }) === 0`).
   - Grants 15% discount, capped at ₹2,500 (`250000` paise).
2. **Free Shipping Promotion (`FREESHIP`):**
   - Zeros the ₹250 standard shipping fee while preserving line item subtotals and tax calculations.
3. **Ensemble Bundle Discount:**
   - Curated `FrequentlyBoughtTogether` ensembles offer 3% off for 2 items and 5% off for 3 items.

---

## 5. Communications & OTP Policy

1. **WhatsApp OTP Exclusivity:**
   - WhatsApp Cloud API (v21.0) is the intended real-time OTP delivery channel.
   - SMS OTP is strictly prohibited and deprecated.
2. **OTP Security Parameters:**
   - 6 numeric digits generated cryptographically.
   - 5-minute validity window.
   - Maximum 3 verification attempts before permanent code lock.
   - 60-second cooldown between resend requests.
3. **Transactional Emails:**
   - High-fidelity HTML emails dispatched for welcome, order confirmation, shipment tracking, cancellation, and admin SLA alerts.

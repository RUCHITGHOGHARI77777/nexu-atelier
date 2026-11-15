---
name: nexu-financial-engine
description: Financial ledger, commission arithmetic, taxation, escrow payouts, and reconciliation engineering for NEXU ATELIER. Enforces integer paise mathematics, GST calculations, seller payouts, refund lifecycle, and reconciliation ledgers.
metadata:
  author: NEXU ATELIER Finance Engineering
  version: "1.0.0"
  stack: "PostgreSQL 17, Prisma, TypeScript"
---

# NEXU ATELIER — Financial Engine & Escrow Ledger

## 1. Core Financial Principles

1. **Integer Arithmetic Only:** All calculations occur in integer paise ($1\text{ INR} = 100\text{ paise}$). Never use floating-point math for stored values.
2. **Double-Entry Discipline:** Every currency movement has a corresponding credit and debit representation.
3. **Escrow Hold Model:** Customer payments are held in escrow until delivery confirmation and the 7-day return window expires.
4. **Server Authority:** Financial amounts cannot be influenced by client-side payloads.

---

## 2. Platform Commission & Seller Payout Formulas

For any line item sold:
$$\text{Gross Item Sales (Paise)} = \text{unitPricePaise} \times \text{quantity}$$
$$\text{Platform Commission (Paise)} = \text{round}\left(\text{Gross Item Sales} \times \frac{\text{commissionRatePercent}}{100}\right)$$
$$\text{Net Seller Payout (Paise)} = \text{Gross Item Sales} - \text{Platform Commission}$$

### Example Ledger Calculation
- Line Item: Hand-carved teak chair @ ₹18,000 (1,800,000 paise), quantity: 1
- Commission Rate: 10.0%
- Platform Commission: 180,000 paise (₹1,800)
- Net Seller Payout: 1,620,000 paise (₹16,200)
- Escrow Status: `ESCROW_HOLD` -> transitioned to `ELIGIBLE_FOR_PAYOUT` 7 days post-delivery.

---

## 3. Taxation & GST Engine

- **Standard GST Rates:** Artisan luxury products default to 12.0% or 18.0% GST based on `product.taxRatePercent`.
- **Inclusive vs Exclusive Calculation:**
  $$\text{Tax Amount (Paise)} = \text{round}\left(\text{subtotalPaise} \times \frac{\text{taxRatePercent}}{100}\right)$$
- Shipping fees and COD collection fees also apply appropriate service tax brackets where required.

---

## 4. Refund & Cancellation Ledger

- **Full Cancellation:**
  - Order status set to `CANCELLED`.
  - Payment record status set to `REFUNDED` or refund queued via `RefundRecord`.
  - Vendor payout record status set to `WITHHELD`.
  - Inventory atomically incremented back to `ProductVariant.stock`.
- **Partial Return / Item Refund:**
  - Specific `OrderItem` returned.
  - Refund amount calculated for that item line minus proportional discount.
  - Child `VendorPayout` updated to `WITHHELD` or reduced accordingly.
  - Parent `Order.refundedPaise` incremented.

---

## 5. Daily & Monthly Reconciliation

- The platform reconciles internal GMV against payment gateway logs via `FinancialReconciliation`:
  $$\text{Discrepancy} = |\text{Internal Captured} - \text{Gateway Captured}|$$
- If $\text{Discrepancy} > 0$, status is marked `DISCREPANCY_DETECTED` and escalates to finance admin.


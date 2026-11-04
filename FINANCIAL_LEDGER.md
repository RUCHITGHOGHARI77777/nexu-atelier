# NEXU ATELIER — Financial Ledger & Settlement Specification

## 1. Core Principles of Ledger Accounting

1. **Integer Minor Unit Representation:** Every monetary amount is recorded in **paise** (`Int` in Prisma schema).
2. **Double-Entry Reconciliation:** For every completed customer order, funds collected equal the sum of supplier payouts, platform commission, payment gateway fees, and statutory tax liabilities:
   $$\text{Customer Paid Total} = \sum \text{Seller Payouts} + \text{Platform Commission} + \text{Gateway Fee} + \text{Output GST}$$
3. **Escrow Hold State Machine:**
   - Online payments transition to `CAPTURED`.
   - COD orders transition to `ESCROW_HOLD` with `codCollectionStatus: PENDING`.
   - Seller settlement balance remains in `PENDING_SETTLEMENT` during the 7-day replacement window, transitioning to `SETTLED` once fulfilled and uncontested.
4. **Sandbox Separation:** Test transactions (`TXN-SANDBOX-*`) are recorded with `reconciliationStatus: DEMO_EXCLUDED` and filtered from statutory bank payout batches.

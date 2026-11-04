# NEXU ATELIER — Master Engineering Tasks & Verification Status

## 1. P0 Tasks: Critical Architecture, Security & Integrity

| Task ID | Task Description | Target File / Area | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Replace insecure payment signature stub with HMAC-SHA256 verification | `src/app/api/payments/verify/route.ts` | `emergency-production-security.test.ts` | **COMPLETED & VERIFIED** |
| **SEC-02** | Enforce anti-IDOR checks on all seller order APIs | `src/app/api/seller/orders/[id]/status/route.ts` | `tenant-security-anti-idor.test.ts` | **COMPLETED & VERIFIED** |
| **SEC-03** | Fix admin login password hash to match PBKDF2 standard | PostgreSQL Database / Seed | `scripts/check-user-pw.mjs` (Admin login 200 OK) | **COMPLETED & VERIFIED** |
| **COM-01** | Implement server-authoritative checkout arithmetic in integer paise | `src/app/api/orders/route.ts` | `e2e-marketplace-demo-readiness.test.ts` | **COMPLETED & VERIFIED** |
| **COM-02** | Automatic parent order decomposition into vendor suborders and shipments | `src/lib/server/orders/order-splitting.ts` | `e2e-marketplace-demo-readiness.test.ts` | **COMPLETED & VERIFIED** |
| **FIN-01** | Statutory Indian GST calculation engine (Notification 13/2025) | `src/lib/server/pricing/gst-calculator.ts` | `supplier-costing.test.ts` | **COMPLETED & VERIFIED** |
| **FIN-02** | Supplier costing and profit/loss calculation engine (Mode A & B) | `src/lib/server/pricing/supplier-costing.ts` | `supplier-costing.test.ts` | **COMPLETED & VERIFIED** |

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

---

## 3. P2 Tasks: External Integrations & Demo-Day Enhancements

| Task ID | Task Description | Implementation Level | Current Evaluation Status |
| :--- | :--- | :--- | :--- |
| **INT-01** | Razorpay Payment Gateway Adapter | Clean adapter architecture with HMAC verification | **SIMULATED DEMO ADAPTER** (Ready for production keys) |
| **INT-02** | WhatsApp Cloud API Notification Outbox | Service queue with payload formatting | **SIMULATED DEMO ADAPTER** (Templates defined) |
| **INT-03** | 3PL Shipping Courier Integration (Shiprocket) | AWB generation and tracking state mapper | **SIMULATED DEMO ADAPTER** (Deterministic tracking) |
| **OPS-01** | Database backup and restore protocol | Automated script generating verified SQL dumps | **COMPLETED & VERIFIED** (5.57 MB backup on disk) |
| **OPS-02** | TLS Evaluator Staging Tunnel | Ngrok secure reverse proxy running daemon | **COMPLETED & ACTIVE** (Live HTTPS staging URL) |

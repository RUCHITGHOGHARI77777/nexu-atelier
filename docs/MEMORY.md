# NEXU ATELIER — AI Context & Engineering Memory

## 1. Project Identity & Architecture Essentials
- **Application Name:** NEXU ATELIER
- **Primary Repository:** `RUCHITGHOGHARI77777/nexu-atelier` (Branch: `master`, Release Tag: `v1.0.0-demo-freeze`)
- **Framework:** Next.js 14.2.18 (App Router, Server Actions, Route Handlers)
- **Database:** PostgreSQL 17 managed via Prisma ORM 6.4.1
- **Database Name:** `nexu_ecommerce` (Local port 5432)
- **Current Live Evaluator Staging URL:** `https://trailing-ungreased-unhappily.ngrok-free.dev`

---

## 2. Seeded Accounts & Credentials
All seeded demonstration accounts use the password: `Password123!`

| Portal Role | Email Account | Associated Entity | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `patron@nexu.studio` | High-net-worth patron | Dynamic cart, instant Buy Now, order tracking, review submission |
| **Supplier** | `solstice@nexu.studio` | Solstice Studio (Artisan) | 6-step listing wizard, order fulfillment, costing calculator, payout ledger |
| **Administrator** | `admin@nexu.studio` | Platform Guardian | System KPIs, catalog approval, financial escrow settlement, audit trails |

---

## 3. Key Invariants & Architectural Memory

1. **Integer Arithmetic Rule:**
   - Always verify that financial columns are treated as paise integers (`₹1,499.00` = `149900`).
   - The GST calculation formula requires dividing by `(10000 + rateInBasisPoints)` before multiplying to avoid decimal truncation.
2. **Next.js App Router Route Traps:**
   - Order creation is served by `POST /api/orders` (returns 201 Created with JSON). Do NOT call `POST /api/checkout`, which is a page route.
   - Seller order status progression is served by `POST /api/seller/orders/[id]/status`.
   - Never run `npm run build` concurrently with `npm run dev` as Next.js module caching will corrupt `webpack-runtime.js`.
3. **Tenant Query Enforcement:**
   - All seller data queries must filter by `vendorId: seller.id`. If a query touches `OrderItem`, use `vendorId`. If it touches `Shipment`, use `sellerId`.
4. **Password Hashing Standard:**
   - The application relies on Node.js `crypto.pbkdf2Sync` using `sha512`, 210,000 iterations, and a 32-byte salt formatted as `salt:hash` in hexadecimal.


---

## 4. Current Verified Platform Status
- **Test Suite Status:** 34 test files passed, 384 tests passed, 0 failed (100% Pass Rate).
- **TypeScript Health:** 0 compilation errors across 478 files (`npx tsc --noEmit`).
- **ESLint Quality:** 0 lint errors (`npm run lint`).
- **Production Build:** 105 pages and routes generated cleanly (`npm run build`).
- **Database Status:** PostgreSQL 17 active with 311 users, 12 sellers, 28 products, 778 orders, 788 shipments, 7,179 audit logs.
- **Database Snapshot:** `backups/nexu_db_backup_2026-11-04T22-08-42-820Z.sql` (5.57 MB).
- **Live Evaluator Staging:** `https://trailing-ungreased-unhappily.ngrok-free.dev` (Active background tunnel).

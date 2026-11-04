# NEXU ATELIER — Engineering Rules of Engagement

## 1. Absolute Invariants (Zero Exceptions)

1. **Never Reset or Wipe the Production/Staging Database:**
   - The database contains 311 registered users, 12 verified artisan sellers, 28 curated products, 778 historical orders, and 7,179 audit logs.
   - Destructive commands (`prisma migrate reset`, `drop database`, raw TRUNCATE) are strictly prohibited.
2. **Integer Paise Financial Arithmetic:**
   - Never store or manipulate monetary figures as JavaScript floating-point numbers.
   - Every financial column in Prisma ends with `InPaise` or `Paise` (e.g. `priceInPaise`, `subtotalPaise`, `taxPaise`).
   - Display values are converted using `formatPrice(paise / 100)` exclusively in presentation components.
3. **Anti-IDOR Query Binding:**
   - Every database query in seller controllers and server actions MUST include an explicit `vendorId` constraint:
     ```typescript
     where: { id: resourceId, vendorId: authenticatedSeller.id }
     ```
   - Never trust resource IDs from URL parameters or request bodies without verifying tenant ownership.
4. **Server-Authoritative Commerce:**
   - The client is considered hostile. Product prices, discounts, tax rates, and totals must NEVER be accepted from the client request payload during checkout.
5. **Truthful Integration Reporting:**
   - Never forge live external API calls or pretend mock adapters are connected to live production gateways.
   - Always label features accurately: **LIVE IN PRODUCTION**, **SIMULATED DEMO ADAPTER**, or **ROADMAP / NOT CONFIGURED**.

---

## 2. Code Quality & Architecture Standards

1. **TypeScript Strictness:**
   - `noImplicitAny`, `strictNullChecks`, and strict type assertions are enabled across the entire repository.
   - The project must compile with zero errors on `npx tsc --noEmit`.
2. **Next.js App Router Best Practices:**
   - Use React Server Components (RSC) for data fetching and static markup.
   - Mark interactive components explicitly with `'use client'`.
   - Never import server-only modules (`@prisma/client`, `crypto`, `bcrypt`) into client components.
3. **Database Consistency:**
   - Multi-step state transitions (order creation, inventory reduction, shipment splitting) must be wrapped in `prisma.$transaction`.
   - Updates must use optimistic or atomic concurrency: `inventoryCount: { decrement: quantity }`.
4. **State Machine Monotonicity:**
   - Order fulfillment statuses must progress strictly forward:
     `NEW` -> `PACKED` -> `SHIPPED` -> `DELIVERED`.
   - Backward transitions (e.g. `DELIVERED` to `NEW`) are rejected with an explicit error.

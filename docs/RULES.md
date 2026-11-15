# NEXU ATELIER — Engineering Rules of Engagement

## 1. Inviolable Core Invariants (Zero Exceptions)

1. **Preserve Existing Database Records & Seed Data:**
   - The PostgreSQL database (`nexu_ecommerce`) contains **311 registered users, 12 verified artisan sellers, 28 curated products, 778 historical orders, 788 shipments, and 7,179 audit events**.
   - NEVER execute destructive database commands: `prisma migrate reset`, `drop database`, raw `TRUNCATE`, or unverified data deletion scripts.
   - A verified 5.57 MB database snapshot exists at `backups/nexu_db_backup_2026-11-04T22-08-42-820Z.sql`.
2. **Integer Paise Financial Arithmetic:**
   - NEVER store or compute monetary amounts as JavaScript floating-point numbers (`0.1 + 0.2 != 0.3`).
   - Every financial column in Prisma ends with `InPaise` or `Paise` (e.g. `priceInPaise`, `subtotalPaise`, `taxPaise`, `totalPaise`, `commissionPaise`).
   - Rounding MUST only happen at the final terminal paisa calculation using `Math.round()`.
   - UI formatting is handled strictly at the presentation boundary via `formatPrice(paise / 100)`.
3. **Anti-IDOR Multi-Tenant Enclosure:**
   - Every database query in seller controllers and server actions MUST include an explicit `vendorId` constraint:
     ```typescript
     where: { id: resourceId, vendorId: authenticatedSeller.id }
     ```
   - Never trust resource IDs from URL parameters or request bodies without asserting tenant ownership.
4. **Server-Authoritative Commerce:**
   - The client browser is considered hostile. Product prices, discounts, tax rates, and order totals must NEVER be accepted from the client request payload during checkout.
5. **Truthful Integration Status:**
   - Never forge live external API calls or claim simulated demo adapters are live production services.
   - Always label features accurately: **LIVE IN PRODUCTION**, **SIMULATED DEMO ADAPTER**, or **ROADMAP / NOT CONFIGURED**.
6. **No Secret Leaks:**
   - Never commit `.env` files, plaintext API keys, passwords, private customer records, or JWT secrets to documentation or Git repositories.

---

## 2. Engineering & Code Standards

1. **TypeScript Strictness:**
   - Strict mode is enforced (`noImplicitAny: true`, `strictNullChecks: true`).
   - The codebase must compile with **0 errors** on `npx tsc --noEmit`.
   - Avoid generic `any` casting; use strongly-typed interfaces for payloads and responses.
2. **Next.js App Router Best Practices:**
   - Use React Server Components (RSC) for data-fetching views.
   - Add `'use client'` strictly to interactive UI boundaries (e.g., Cart Drawer, Buy Now Modal, Costing Calculator).
   - Never import server-only modules (`@prisma/client`, `crypto`, `bcrypt`) into client components.
3. **Database Consistency & Concurrency:**
   - Multi-step state transitions (order creation, inventory deduction, shipment generation) must be wrapped inside `prisma.$transaction`.
   - Inventory decrements must use atomic operations:
     ```typescript
     inventoryCount: { decrement: quantity }
     ```
4. **Monotonic State Transitions:**
   - Order and shipment statuses must advance strictly forward:
     `NEW` -> `PACKED` -> `SHIPPED` -> `DELIVERED`.
   - Backward transitions (e.g., `DELIVERED` -> `NEW`) must be rejected with an explicit error.
   - Moving to `SHIPPED` strictly requires a courier name and non-empty tracking number.

# 3. TECHNICAL ARCHITECTURE & SYSTEMS ENGINEERING REPORT

## System Components
1. **Next.js 14 App Router Framework:**
   - Server-first paradigm with React Server Components (RSC).
   - Minimal client bundle size with progressive enhancement.
2. **PostgreSQL 17 Database Engine:**
   - ACID-compliant relational storage.
   - Enforced foreign keys, compound indexes, and optimistic stock locking.
3. **Prisma ORM 6.4:**
   - Type-safe database queries with zero manual SQL string concatenation.
   - Complex relational transactions executed via `prisma.$transaction`.
4. **Decoupled Financial & Statutory Services:**
   - Integer paise pricing engine (`src/lib/server/pricing/gst-calculator.ts`).
   - CBIC Notification 13/2025 Central Tax (Rate) rules mapped to HSN codes.
5. **Multi-Vendor Order Decomposition Engine:**
   - Autonomous shipment creation per artisan workshop.

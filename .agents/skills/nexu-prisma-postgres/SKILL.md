---
name: nexu-prisma-postgres
description: Version-pinned Prisma ORM and PostgreSQL engineering guidelines for NEXU ATELIER. Covers relational schema design, foreign keys, compound indexes, ACID transactions, atomic inventory concurrency, integer paise arithmetic, migrations, connection pooling, and error handling.
metadata:
  author: NEXU ATELIER Engineering Team
  version: "1.0.0"
  stack: "Prisma ORM 6.4.1 / 5.x compatible, PostgreSQL 17.10, Node.js 24.x, TypeScript 5.x"
---

# NEXU ATELIER — Database Engineering: Prisma ORM & PostgreSQL

## 1. Runtime Environment & Version Pinning

- **Engine:** PostgreSQL 17.10 (x86_64 Windows production server running on standard port 5432).
- **Client & CLI:** `@prisma/client@6.4.1` and `prisma@6.4.1`.
- **API Guardrail:** Maintain full compatibility with standard Prisma relational APIs. Do **NOT** invoke experimental Prisma 7 or Prisma 8 preview syntax or unstable extensions unless explicitly approved.
- **Connection URI:** Managed via `DATABASE_URL` in `.env`.

---

## 2. Relational Schema Architecture & Constraints

### 2.1 Primary & Foreign Keys
- Primary keys must use collision-resistant identifiers: `@id @default(cuid())` or deterministic domain identifiers (e.g., `ORD-YYYY-UUID` for orders).
- Foreign keys must enforce clear relational referential actions:
  - `onDelete: Cascade` for dependent child items (e.g., `OrderItem -> Order`, `CartItem -> Cart`, `ReviewMedia -> ProductReview`).
  - `onDelete: SetNull` for historical reference integrity (e.g., `OrderItem -> Product`, `Shipment -> OrderItem`).
  - `onDelete: Restrict` where financial records or payouts must never be orphaned.

### 2.2 Compound Keys & Unique Constraints
- Prevent race conditions and duplicates using database-level unique constraints:
  - `@@unique([categoryId, slug])` in `CategoryAttribute`
  - `@@unique([sellerId, draftKey])` in `SupplierDraft`
  - `@@unique([productId, customerId, orderItemId])` in `ProductReview`
  - `@@unique([customerId, productId])` in `WishlistItem` and `RecentlyViewedItem`
  - `@@unique([provider, eventId])` in `WebhookEvent` to enforce webhook idempotency

### 2.3 Indexing Strategy for High-Throughput E-Commerce
Every frequently filtered, sorted, or joined column must have explicit B-tree indexes:
- Status filters: `@@index([status])`, `@@index([approvalStatus])`, `@@index([fulfillmentStatus])`
- Tenant isolation: `@@index([vendorId])`, `@@index([sellerId])`, `@@index([customerId])`
- Temporal ordering: `@@index([createdAt])`, `@@index([updatedAt])`
- Slug lookups: `@@index([slug])`

---

## 3. Financial Precision: Integer Paise Rule

### 3.1 Strict Integer Rule
- **Never use floating point numbers (`FLOAT`, `DOUBLE`, `REAL`) for monetary values.** Floating point math causes rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`).
- All monetary columns in PostgreSQL are typed as `Int` storing values in **paise** (1 INR = 100 paise):
  - `basePricePaise`, `shippingFeePaise`, `estimatedTaxPaise`, `subtotalPaise`, `totalPaise`, `discountPaise`, `grossAmountPaise`, `commissionPaise`, `netPayoutPaise`.
- Display formatting is computed solely at presentation time:
  ```ts
  export function formatPaiseToInr(paise: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(paise / 100));
  }
  ```

---

## 4. ACID Transactions & Concurrency Safeguards

### 4.1 Interactive Transactions
Complex operations involving order placement, inventory decrements, payouts, and ledger updates must execute within `prisma.$transaction(async (tx) => { ... })`:
```ts
const result = await prisma.$transaction(async (tx) => {
  // 1. Decrement inventory atomically
  const updatedVariant = await tx.productVariant.updateMany({
    where: {
      id: variantId,
      stock: { gte: quantity }, // Prevents overselling race conditions
    },
    data: {
      stock: { decrement: quantity },
    },
  });

  if (updatedVariant.count === 0) {
    throw new Error("OUT_OF_STOCK_OR_CONCURRENT_LOCK");
  }

  // 2. Create authoritative order record
  const order = await tx.order.create({ ... });

  // 3. Record ledger and audit trail
  await tx.auditEvent.create({ ... });

  return order;
}, {
  maxWait: 5000, // 5s max wait to acquire connection
  timeout: 10000, // 10s execution timeout
});
```

### 4.2 Atomic Inventory Restoration
When orders are cancelled prior to dispatch, restore stock atomically inside a transaction:
```ts
await prisma.$transaction(async (tx) => {
  for (const item of order.items) {
    if (item.selectedSku) {
      await tx.productVariant.updateMany({
        where: { sku: item.selectedSku },
        data: { stock: { increment: item.quantity } },
      });
    }
  }
  await tx.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
});
```

---

## 5. Migrations & Drift Management

1. **Development Migrations:** Use `npx prisma migrate dev --name <migration_name>` during schema alterations.
2. **Production Deployments:** Use `npx prisma migrate deploy` in CI/CD pipelines. Never run `migrate dev` or `db push` on live production databases.
3. **Rollback Planning:**
   - Always draft reverse SQL scripts in `prisma/migrations/<timestamp>_rollback.sql` for complex DDL operations.
   - Do not drop columns destructively in a single release; follow expand-and-contract:
     1. Add nullable new column.
     2. Write to both old and new.
     3. Backfill old data.
     4. Switch reads to new column.
     5. Remove old column in subsequent migration.

---

## 6. Prisma Error Handling Standards

Handle PostgreSQL and Prisma known error codes explicitly:
- **`P2002` (Unique constraint failed):** Translate to user-friendly conflict response (e.g., "An account with this email already exists" or "Duplicate coupon code").
- **`P2025` (Record not found):** Return 404 or structured not-found exception.
- **`P2003` (Foreign key constraint violation):** Ensure parent record exists before inserting dependent records.
- **`P2034` (Transaction failed due to write conflict / deadlock):** Implement exponential backoff retry for transient write conflicts.

---

## 7. Connection Pooling & Resource Health

- For serverless or high-concurrency environments, use a pooled connection string with `pgbouncer=true` and explicit connection limit parameters:
  `postgresql://user:pass@host:5432/dbname?connection_limit=20&pool_timeout=10`
- Always disconnect or manage Prisma singleton instances via `globalThis.prisma = prisma` to prevent connection exhaustion during Next.js Hot Module Replacement (HMR).


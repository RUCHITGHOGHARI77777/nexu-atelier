---
name: nexu-prisma5-postgresql
description: Version-pinned Prisma ORM (v5/v6) and PostgreSQL 17 engineering rules for NEXU ATELIER. Covers relational schema design, connection pooling, ACID transactions, atomic inventory concurrency, and error handling.
---

# NEXU Prisma & PostgreSQL Engineering Skill

## 1. Activation Conditions
Activate this skill when:
- Writing or editing `prisma/schema.prisma` models, indexes, or relations.
- Executing database migrations (`prisma migrate dev` / `prisma migrate deploy`).
- Implementing multi-statement ACID transactions via `prisma.$transaction`.
- Diagnosing database lock contention, connection timeouts, or unique constraint failures.

## 2. PostgreSQL Relational Standards
1. **Model & Field Conventions:**
   - PascalCase for model names (`Order`, `OrderItem`, `PaymentRecord`).
   - camelCase for field names (`subtotalPaise`, `customerEmail`).
   - Always map to snake_case tables if working with legacy SQL views (`@@map("orders")`).
2. **Indexing Strategy:**
   - Every foreign key must carry an index `@@index([customerId])`, `@@index([sellerId])`.
   - Compound indexes for high-frequency queries: `@@index([status, createdAt])`.
   - Natural unique keys: `@@unique([categoryId, slug])`.
3. **Atomic Inventory Operations:**
   ```typescript
   await prisma.productVariant.update({
     where: { id: variantId, stock: { gte: quantity } },
     data: { stock: { decrement: quantity } }
   });
   ```

## 3. Transactional Safety & Isolation
- Group all checkout operations within `prisma.$transaction(async (tx) => { ... }, { isolationLevel: 'Serializable' | 'ReadCommitted', timeout: 10000 })`.
- Ensure clean error handling: catch `PrismaClientKnownRequestError` and map codes (e.g. `P2002` for Unique Constraint, `P2025` for Record Not Found) to human-readable API responses.

## 4. Quality Checklist
- [ ] No raw unparameterized SQL strings (`$queryRawUnsafe` strictly prohibited).
- [ ] Connection string includes connection pooling parameters (`?connection_limit=20&pool_timeout=10`).
- [ ] All financial columns use integer types (`Int` or `BigInt` for paise).

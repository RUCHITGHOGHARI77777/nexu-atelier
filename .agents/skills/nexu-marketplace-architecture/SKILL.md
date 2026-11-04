---
name: nexu-marketplace-architecture
description: Master multi-vendor marketplace architectural patterns for NEXU ATELIER. Governs tenant isolation, supplier ownership boundaries, parent order to seller suborder splitting, discrete 3PL shipments, and platform governance.
---

# NEXU Marketplace Architecture Skill

## 1. Activation Conditions
Activate this skill when:
- Designing or modifying multi-tenant database models or repository layers.
- Splitting a customer parent order into discrete vendor suborders or discrete shipments.
- Enforcing anti-IDOR tenant boundaries between sellers, customers, and admins.
- Structuring platform governance, catalog moderation, and supplier onboarding.

## 2. Core Architectural Principles
1. **Strict Tenant Separation:**
   - A seller only has read/write authority over their own products, variants, and suborders.
   - Cross-tenant queries must always enforce `sellerId == session.sellerId`.
2. **Parent-to-Suborder Splitting:**
   - Single customer cart checkout produces 1 `Order` (Parent Order).
   - Server-side order creation divides line items by `sellerId` and dispatches discrete `Shipment` entities with individual AWBs.
3. **Database Relational Integrity:**
   - All references rely on indexed foreign keys with `onDelete: Restrict` or `onDelete: Cascade` where lifecycle matches.
   - Historical item names and prices are frozen in `OrderItem` snapshots to survive future catalog modifications.

## 3. Step-by-Step Order Splitting Workflow
1. Client submits cart items with `productId`, `variantId`, `quantity`.
2. Server loads authoritative product records from PostgreSQL via Prisma.
3. Group order items by `sellerId`:
   ```typescript
   const sellerGroups = new Map<string, CartItem[]>();
   for (const item of items) {
     const list = sellerGroups.get(item.product.sellerId) || [];
     list.push(item);
     sellerGroups.set(item.product.sellerId, list);
   }
   ```
4. Within a single Prisma transaction (`prisma.$transaction`):
   - Decrement variant inventories atomically with non-negative constraints.
   - Create parent `Order` record with authoritative integer paise totals.
   - Create child `OrderItem` records with `sellerId` stamped.
   - Create individual `Shipment` records for each unique seller group.
   - Insert `AuditEvent` records for order placement and supplier notification.

## 4. Error Handling & Quality Checklist
- [ ] No seller can view another seller's suborder items or sales numbers.
- [ ] Customer can never see backend supplier procurement or margin data.
- [ ] Partial suborder cancellations only restore inventory for that specific seller's items.

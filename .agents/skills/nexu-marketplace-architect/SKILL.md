---
name: nexu-marketplace-architect
description: Architectural principles for NEXU ATELIER multi-vendor platform. Governs seller separation, product catalog governance, vendor ownership, multi-vendor parent orders, seller-specific suborders/shipments, and tenant boundary enforcement.
metadata:
  author: NEXU ATELIER Systems Architecture
  version: "1.0.0"
  stack: "Next.js 14 App Router, PostgreSQL, Prisma, TypeScript"
---

# NEXU ATELIER — Multi-Vendor Marketplace Architecture

## 1. Core Architectural Model

NEXU ATELIER is an enterprise multi-vendor e-commerce platform owned and governed centrally by the platform owner, hosting independent verified artisan studios, workshops, and luxury makers.

```mermaid
flowchart TD
    Customer([Public Customer]) -->|Single Checkout| ParentOrder[Parent Order (Customer View)]
    ParentOrder --> Item1[Item: Studio A]
    ParentOrder --> Item2[Item: Workshop B]
    ParentOrder --> Item3[Item: Studio A]
    
    subgraph MultiVendorSplitting["Server-Authoritative Order Routing"]
        Item1 --> ShipmentA[Shipment 1: Studio A]
        Item3 --> ShipmentA
        Item2 --> ShipmentB[Shipment 2: Workshop B]
        
        ShipmentA --> PayoutA[Vendor Payout: Studio A]
        ShipmentB --> PayoutB[Vendor Payout: Workshop B]
    end
```

---

## 2. Three Distinct Roles & Boundaries

### 2.1 Public Customer
- Browse editorial collections, search, filter, and discover products.
- Single unified cart and checkout across multiple vendors.
- Single customer-facing parent order with clear multi-shipment tracking.
- Customer support tickets, verified reviews, and returns.
- **Strict Boundary:** No internal admin or seller UI elements visible in customer views.

### 2.2 Supplier / Seller
- Manage studio profile, origin hub, and maker story.
- Submit product drafts with category-specific dynamic attributes for admin approval.
- Access only their own allocated `OrderItem` rows (`where: { vendorId: seller.id }`).
- Generate shipment labels, Blue Dart / courier tracking numbers, and process fulfillment transitions (`NEW -> PROCESSING -> PACKED -> SHIPPED`).
- Review gross sales, 10% platform commission deductions, and net payout statuses.

### 2.3 Platform Super Administrator
- Central governance, seller onboarding approval, and KYC verification.
- Review and approve/reject supplier product drafts within guaranteed SLAs.
- Global category attribute management, coupon configurations, and promotional campaigns.
- Risk management, fraud review, COD verification, and dispute resolution.
- Financial reconciliation across payment providers and escrow settlements.

---

## 3. Multi-Vendor Order Routing & Fulfillment Model

### 3.1 Parent Order vs. Seller Suborders / Shipments
1. **Parent Order (`Order`):**
   - Single customer-facing reference (`ORD-YYYY-XXXXXXXXXXXX`).
   - Represents the unified charge, shipping fee, tax, and discount.
   - Overall order status aggregates child shipment statuses (e.g. if all shipments are DELIVERED, order is DELIVERED; if mixed, IN_PRODUCTION / SHIPPED).

2. **Discrete Seller Line Items (`OrderItem`):**
   - Each item captures immutable price and title snapshots, `vendorId`, and `vendorName`.
   - Links to a dedicated `Shipment` record per vendor.

3. **Isolated Shipments (`Shipment`):**
   - Created per unique `vendorId` in the order.
   - Assigned dedicated 3PL tracking numbers (e.g., Blue Dart Air Express).
   - Tracked via independent `ShipmentTrackingEvent` audit trails.

4. **Escrow & Vendor Payouts (`VendorPayout`):**
   - Generated automatically per seller suborder.
   - Formula:
     $$\text{Gross Sales} = \sum (\text{unitPricePaise} \times \text{quantity})$$
     $$\text{Commission} = \text{round}(\text{Gross Sales} \times 0.10)$$
     $$\text{Net Payout} = \text{Gross Sales} - \text{Commission}$$
   - Held in `ESCROW_HOLD` until delivery confirmation and return window expiration.

---

## 4. Architectural Rules Checklist
- [x] Every product is strictly owned by a verified `vendorId`.
- [x] Customers experience a unified single payment and order confirmation.
- [x] Sellers only query and mutate their own items.
- [x] Fulfillment is independent: Seller A's dispatch delay does not block Seller B.
- [x] Commission arithmetic uses integer paise with server-side validation.
- [x] Full event sourcing and audit logs exist for all order state transitions.


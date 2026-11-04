# NEXU ATELIER — ARCHITECTURE MAP & SYSTEM TOPOLOGY
**Platform:** NEXU ATELIER Luxury Multi-Vendor Marketplace  
**Engine:** Next.js 14 App Router + PostgreSQL 17 + Prisma ORM  
**Date:** November 5, 2026  

---

## 1. HIGH-LEVEL SYSTEM TOPOLOGY

```mermaid
flowchart TD
    subgraph Clients["Three Distinct Actor Personas"]
        CUST["Patron / Customer\n(Mobile & Desktop Storefront)"]
        SELL["Artisan / Seller\n(Supplier Hub & P&L Engine)"]
        ADMN["Platform Admin\n(Governance & Financial Vault)"]
    end

    subgraph EdgeLayer["Edge & Middleware Layer (Next.js 14)"]
        MID["Middleware (Role Guarding & Session Check)\n/src/middleware.ts"]
        CDN["Static Asset Server & Image Optimizer\n/public/ & /api/upload/image"]
    end

    subgraph AppRouter["Application Router (Pages & APIs)"]
        subgraph StorefrontRoutes["Public & Customer Domain"]
            HOME["/ (Homepage)"]
            SHOP["/shop (Catalog & Filters)"]
            PDP["/product/[slug] (PDP & Zoom)"]
            BAG["/cart & /checkout (Checkout Engine)"]
            HIST["/account/orders (Order History & Tracking)"]
        end

        subgraph SellerRoutes["Supplier Hub Domain"]
            SHUB["/seller (Dashboard & Telemetry)"]
            SWIZ["/seller/products/new (6-Step Listing Wizard)"]
            SORD["/seller/orders (Discrete Suborders)"]
            SPAY["/seller/payouts (Settlement Ledger)"]
        end

        subgraph AdminRoutes["Admin Governance Domain"]
            AADM["/admin (Platform Command Center)"]
            AMOD["/admin/products (Moderation Queue & SLA)"]
            AKYC["/admin/sellers (KYC & Bank Verification)"]
            AFIN["/admin/finances (Escrow Vault & Payouts)"]
            ALOG["/admin/audit-logs (Immutable Audit Trail)"]
        end

        subgraph ServerAPIs["Server-Authoritative APIs"]
            API_ORD["/api/checkout/order"]
            API_TAX["/api/tax/hsn"]
            API_AUTH["/api/auth/otp/send & verify"]
            API_HOOK["/api/webhooks/razorpay & shipping"]
        end
    end

    subgraph Services["Core Business Logic Services (/src/lib/server/)"]
        ORD_SVC["OrderService\n(Server-Authoritative Pricing)"]
        TAX_SVC["TaxHsnDirectory\n(Statutory GST & Slabs)"]
        COST_SVC["SupplierCostingEngine\n(P&L & Break-even)"]
        SHIP_SVC["ShippingService\n(Discrete AWB Allocation)"]
        AUTH_SVC["AuthService\n(PBKDF2 & Anti-IDOR)"]
    end

    subgraph Database["PostgreSQL 17 Database Layer (Prisma ORM)"]
        DB_USERS[("Users & Profiles")]
        DB_PROD[("Products, Variants & Attributes")]
        DB_ORD[("Orders & OrderItems")]
        DB_SHIP[("Shipments & Tracking Events")]
        DB_PAY[("PaymentRecords & Escrow Ledgers")]
        DB_AUDIT[("AuditEvents & NotificationOutbox")]
    end

    subgraph Integrations["External Service Adapters"]
        RZP["Razorpay Gateway\n(Demo Mode active / Live ready)"]
        WA["WhatsApp Cloud API\n(Simulator Outbox / Meta ready)"]
        MAIL["Transactional Email\n(Outbox Sink / Resend ready)"]
        LOGIS["3PL Courier\n(Internal AWB / Shiprocket ready)"]
    end

    CUST --> MID
    SELL --> MID
    ADMN --> MID

    MID --> StorefrontRoutes
    MID --> SellerRoutes
    MID --> AdminRoutes
    MID --> ServerAPIs

    StorefrontRoutes --> ServerAPIs
    SellerRoutes --> ServerAPIs
    AdminRoutes --> ServerAPIs

    ServerAPIs --> ORD_SVC
    ServerAPIs --> TAX_SVC
    ServerAPIs --> COST_SVC
    ServerAPIs --> SHIP_SVC
    ServerAPIs --> AUTH_SVC

    ORD_SVC --> DB_ORD
    ORD_SVC --> DB_PROD
    SHIP_SVC --> DB_SHIP
    AUTH_SVC --> DB_USERS

    ORD_SVC --> RZP
    AUTH_SVC --> WA
    ORD_SVC --> MAIL
    SHIP_SVC --> LOGIS
```

---

## 2. MULTI-VENDOR SUBORDER SPLITTING TOPOLOGY

```text
[CUSTOMER CHECKOUT: 1 Cart with 3 Items from 2 Sellers]
                           │
                           ▼
                  [PARENT ORDER CREATION]
               Order ID: ORD-2026-X8F92A
               Total: ₹8,450 (In Escrow Hold)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [SELLER 1 SUBORDER]         [SELLER 2 SUBORDER]
   Seller: Jaipur Silks        Seller: Kashmir Crafts
   Items: Silk Sari (₹5,200)   Items: Pashmina Shawl (₹3,250)
   Shipment: SHP-2026-A101     Shipment: SHP-2026-B202
   Carrier: Bluedart Air       Carrier: Delhivery Express
   AWB: BD-AIR-173000-01       AWB: DEL-EXP-173000-02
             │                           │
             ▼                           ▼
   [DELIVERY CONFIRMED]        [DELIVERY CONFIRMED]
   Escrow Released: ₹4,836     Escrow Released: ₹3,022
   (after 7% Commission)       (after 7% Commission)
```

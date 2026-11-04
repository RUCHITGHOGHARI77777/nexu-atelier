# NEXU ATELIER — FEATURE MATRIX & IMPLEMENTATION AUDIT
**Standard:** Strict Verification Without Arbitrary Percentages  
**Permitted Statuses:** `Verified working` | `Implemented, not verified` | `Partially working` | `Demo only` | `Requires credentials` | `Blocked` | `Not implemented` | `Requires owner decision`  
**Date:** November 5, 2026  

---

## 1. CUSTOMER STOREFRONT FEATURES

| Feature Name | Primary Persona | What It Does | Code Location | Status | External Dependency | Test Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Editorial White Homepage** | Customer | Curated luxury hero, artisan showcases, trust wall | `src/app/page.tsx` | **Verified working** | None | `customer-journey.test.ts` |
| **Faceted Catalog Search** | Customer | Multi-filter search (price, category, materials, sort) | `src/app/shop/page.tsx` | **Verified working** | PostgreSQL full-text index | `catalog-filters.test.ts` |
| **PDP & Variant Selection** | Customer | Zoom gallery, variant SKU pricing, stock status | `src/app/product/[slug]/page.tsx` | **Verified working** | None | `product-repository.test.ts` |
| **Shopping Bag Drawer** | Customer | Live cart drawer, coupon code application, line items | `src/components/cart/CartDrawer.tsx` | **Verified working** | None | `cart-calculations.test.ts` |
| **Instant "Buy Now"** | Customer | Bypasses general cart; direct 1-click checkout | `src/components/product/InstantBuyNowButton.tsx`| **Verified working** | None | `order-service.test.ts` |
| **Server Checkout Engine** | Customer | 3-step checkout with server-authoritative totals | `src/app/checkout/page.tsx` | **Verified working** | None | `order-service.test.ts` |
| **Razorpay Payments** | Customer | Online payments via UPI, Cards, Netbanking | `src/lib/server/payment-service.ts` | **Demo only** | Live Razorpay Credentials | `privacy-payment-reporting.test.ts` |
| **Cash on Delivery (COD)** | Customer | Local COD option with anti-fraud threshold | `src/lib/server/fraud-service.ts` | **Verified working** | None | `fraud-and-cod-engine.test.ts` |
| **Customer Order History** | Customer | Invoices, itemized breakdown, tracking links | `src/app/account/orders/page.tsx` | **Verified working** | None | `customer-experience-engine.test.ts` |
| **Public AWB Tracking** | Customer | Search tracking status by courier AWB number | `src/app/track-order/page.tsx` | **Verified working** | Internal AWB engine | `shipping-notifications.test.ts` |
| **WhatsApp OTP Login** | Customer | Phone number verification via 6-digit OTP | `src/lib/server/whatsapp-service.ts` | **Partially working** | Meta WhatsApp Cloud API | `auth-service.test.ts` |
| **Customer Support Tickets**| Customer | Submit inquiry and view response history | `src/app/account/tickets/[id]/page.tsx`| **Verified working** | None | `customer-experience-engine.test.ts` |

---

## 2. SUPPLIER / SELLER HUB FEATURES

| Feature Name | Primary Persona | What It Does | Code Location | Status | External Dependency | Test Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Supplier Onboarding** | Seller | Register store, submit studio details, GSTIN, PAN | `src/app/seller/apply/page.tsx` | **Verified working** | None | `seller-service.test.ts` |
| **6-Step Product Wizard** | Seller | Guided listing: Identity, Images, Variants, Costing | `src/components/seller/SupplierProductCreationWizard.tsx`| **Verified working** | None | `supplier-product-costing-integration.test.ts` |
| **Costing & P&L Calculator**| Seller | 4-tier cost inputs, Mode A/B profit calculation | `src/lib/supplier-costing.ts` | **Verified working** | None | `supplier-product-costing-integration.test.ts` |
| **Statutory GST/HSN Engine**| Seller | Auto-detects GST slab (5%, 12%, 18%) via CBIC HSN | `src/lib/tax-hsn-directory.ts` | **Verified working** | Notification 13/2025 Central Tax | `supplier-product-costing-integration.test.ts` |
| **Inventory Management** | Seller | Low-stock alerts, variant stock, reservation state | `src/app/seller/inventory/page.tsx` | **Verified working** | None | `database-integrity.test.ts` |
| **Suborder Fulfillment** | Seller | View discrete suborders, generate packing slips | `src/app/seller/orders/page.tsx` | **Verified working** | None | `shipping-notifications.test.ts` |
| **3PL AWB Allocation** | Seller | Mark "Ready to Dispatch" and receive carrier AWB | `src/lib/server/shipping-service.ts` | **Partially working** | Live Shiprocket/Delhivery API | `shipping-notifications.test.ts` |
| **Seller Payouts & Escrow** | Seller | View net payouts after commission and TCS deductions | `src/app/seller/payouts/page.tsx` | **Verified working** | None | `admin-service.test.ts` |

---

## 3. ADMIN GOVERNANCE & PLATFORM OPERATIONS

| Feature Name | Primary Persona | What It Does | Code Location | Status | External Dependency | Test Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Executive SaaS Dashboard** | Admin | Real-time GMV, net revenue, active sellers | `src/components/admin/AdminCommandCenterSaaS.tsx`| **Verified working** | None | `admin-service.test.ts` |
| **Product Moderation Queue** | Admin | Review, approve, or reject vendor listings | `src/app/admin/products/page.tsx` | **Verified working** | None | `smart-listing-engine.test.ts` |
| **Seller KYC Approval** | Admin | Verify GSTIN and bank details; activate store | `src/app/admin/sellers/page.tsx` | **Verified working** | None | `admin-service.test.ts` |
| **Global Order Monitoring** | Admin | Inspect parent orders, suborders, and disputes | `src/app/admin/orders/page.tsx` | **Verified working** | None | `order-service.test.ts` |
| **Financial Vault & Escrow** | Admin | Trigger seller payout releases upon delivery | `src/app/admin/finances/page.tsx` | **Verified working** | None | `admin-service.test.ts` |
| **Audit Logs (Immutable)** | Admin | Cryptographic activity log of administrative events | `src/app/admin/audit-logs/page.tsx` | **Verified working** | None | `database-integrity.test.ts` |
| **Fraud Risk Engine** | Admin | Order risk scoring and automated cancellation | `src/lib/server/fraud-service.ts` | **Verified working** | None | `fraud-and-cod-engine.test.ts` |


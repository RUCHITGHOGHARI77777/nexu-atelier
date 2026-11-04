# NEXU ATELIER — Master Feature Register & Implementation Ledger

## 1. Governance & Architecture

This register serves as the authoritative single source of truth for all functional capabilities across NEXU ATELIER.

---

## 2. Master Feature Table

| Feature Identifier | Feature Name | Domain / Role | Route / Component | Functional Specification | Test Evidence | Implementation Status |
|---|---|---|---|---|---|:---:|
| **FEAT-CUST-01** | Flagship Editorial Homepage | Customer | `/` | Brand pillars, curated lookbooks, responsive hero | Visual regression suite | **Verified Complete** |
| **FEAT-CUST-02** | Faceted Catalog Discovery | Customer | `/shop` | Category, price, studio, stock filtering | `catalog-filters.test.ts` | **Verified Complete** |
| **FEAT-CUST-03** | Product Variant Matrix | Customer | `/product/[slug]` | Multi-attribute size & color selection with atomic stock check | `product-detail-matrix.test.ts` | **Verified Complete** |
| **FEAT-CUST-04** | Instant Buy Now Isolation | Customer | `/checkout?direct=1` | Isolated checkout flow bypassing and preserving ordinary bag | `instant-buynow-isolation.test.ts` | **Verified Complete** |
| **FEAT-CUST-05** | Dynamic Shopping Bag | Customer | `/cart` | Coupon redemption, multi-currency support, tax estimation | `cart-calculations.test.ts` | **Verified Complete** |
| **FEAT-CUST-06** | Multi-Step Checkout Stepper | Customer | `/checkout` | PIN validation, courier speed, payment method selector | `checkout-service.test.ts` | **Verified Complete** |
| **FEAT-CUST-07** | Payment Simulation & Truth | Customer | `InteractivePaymentModal` | Clear sandbox isolation (`TXN-SANDBOX-*`), COD escrow | `payment-integration.test.ts` | **Verified Complete** |
| **FEAT-CUST-08** | Cash on Delivery (COD) Flow | Customer | `/checkout` | Doorstep collection status tracking, risk verification | `fraud-and-cod-engine.test.ts` | **Verified Complete** |
| **FEAT-CUST-09** | Live Consignment Tracking | Customer | `/track-order` | 7-stage tracking milestone visualizer | `order-tracking-lookup.test.ts` | **Verified Complete** |
| **FEAT-CUST-10** | Verified Customer Reviews | Customer | `/reviews` | Verified purchase gate, helpful voting, score meters | `review-service.test.ts` | **Verified Complete** |
| **FEAT-CUST-11** | Customer Ticketing Concierge | Customer | `/account/tickets` | Concierge inquiries, resolution SLA tracking | `customer-experience-engine.test.ts` | **Verified Complete** |
| **FEAT-CUST-12** | WhatsApp OTP Authentication | Customer | `FirebaseAuthModal` | WhatsApp Business Cloud API OTP, SMS disabled | `whatsapp-otp-system.test.ts` | **Verified Complete** |
| **FEAT-SUP-01** | Supplier Business Dashboard | Supplier | `/seller` | Live GMV, order volume, pending balance, health score | `seller-service.test.ts` | **Verified Complete** |
| **FEAT-SUP-02** | Smart Product Listing Wizard | Supplier | `/seller/products/new` | 6-step guided wizard with image slots & auto SKU generator | `supplier-product-lifecycle.test.ts` | **Verified Complete** |
| **FEAT-SUP-03** | Live Costing & P&L Calculator | Supplier | `SupplierProductCreationWizard` | 4-tier cost inputs, contribution profit, break-even price | `supplier-costing.test.ts` | **Verified Complete** |
| **FEAT-SUP-04** | Statutory GST & HSN Directory | Supplier | `tax-hsn-directory.ts` | 5%, 12%, 18% scenarios, Notification 13/2025-CT(R) | `supplier-product-costing-integration.test.ts` | **Verified Complete** |
| **FEAT-SUP-05** | Variant Inventory Management | Supplier | `/seller/inventory` | Variant SKU stock, low-stock threshold triggers | `inventory-service.test.ts` | **Verified Complete** |
| **FEAT-SUP-06** | Suborder Order Fulfillment | Supplier | `/seller/orders` | Multi-vendor suborder routing, branded packing slip | `packaging-slip-printer.test.ts` | **Verified Complete** |
| **FEAT-SUP-07** | Financial Settlement Ledger | Supplier | `/seller/payouts` | Itemized sales, commission deductions, bank payouts | `financial-reporting-service.test.ts` | **Verified Complete** |
| **FEAT-ADM-01** | Super Admin Command Center | Admin | `/admin` | Real-time GMV, active orders, live revenue, platform alerts | `admin-service.test.ts` | **Verified Complete** |
| **FEAT-ADM-02** | Supplier KYB Governance | Admin | `/admin/sellers` | Supplier onboarding applications, document review, verify | `admin-governance.test.ts` | **Verified Complete** |
| **FEAT-ADM-03** | Product Moderation Queue | Admin | `/admin/products` | Listing queue, 60m SLA tracking, rejection reasons | `smart-listing-engine.test.ts` | **Verified Complete** |
| **FEAT-ADM-04** | Multi-Vendor Suborder Splitting | Shared | `orderService.createOrder` | Parent order creation with atomic suborder attribution | `multivendor-order-flow.test.ts` | **Verified Complete** |
| **FEAT-ADM-05** | Content Management & Settings | Admin | `/admin/settings` | Commission policies, statutory tax rates, banners | `whitelabel-theme-preset.test.ts` | **Verified Complete** |
| **FEAT-ADM-06** | Platform Security & Anti-IDOR | Shared | `zero-client-trust.ts` | Tenant boundary enforcement, cryptographic signatures | `tenant-security-anti-idor.test.ts` | **Verified Complete** |


# NEXU ATELIER — Unique Screen Catalog & Interface Taxonomy

## 1. Catalog Scope

This catalog maps every unique screen template across the customer, supplier, and platform admin domains to its primary functional purpose and verified live App Router URL.

---

## 2. Customer Domain Screens (14 Unique Templates)

| # | Screen Template | App Router URL | Primary Functional Capabilities | Verified State |
|---|---|---|---|:---:|
| **C1** | Flagship Editorial Homepage | `/` | Announcement strip, brand pillars, guild spotlight, curated collections, newsletter, sticky white luxury nav | **HTTP 200 OK** |
| **C2** | Faceted Catalog & Archive | `/shop` | Category facets, price range filter, artisan studio filter, stock filter, sorting (price, newest, rating) | **HTTP 200 OK** |
| **C3** | Collections & Lookbooks | `/collections` | Seasonal lookbooks, curatorial narratives, collection piece grids | **HTTP 200 OK** |
| **C4** | Deep Product Detail Page (PDP) | `/product/[slug]` | Multi-image lightbox zoom, variant matrix, size chips, stock counter, delivery estimator, reviews, Q&A, Buy Now | **HTTP 200 OK** |
| **C5** | Full Shopping Bag | `/cart` | Itemized unit prices, quantity increment/decrement, coupon engine (DEMO20), free delivery tracker, checkout CTA | **HTTP 200 OK** |
| **C6** | Multi-Step Checkout Stepper | `/checkout` | Step 1: Address autofill & PIN validation; Step 2: Courier speed; Step 3: Payment method selector (UPI, Card, COD) | **HTTP 200 OK** |
| **C7** | Order Placed Confirmation | `/checkout/confirmation` | Order summary, GST tax invoice download, consignment link, courier dispatch countdown | **HTTP 200 OK** |
| **C8** | Patron Account Hub | `/account` | Membership tier overview, quick stats, active consignment tracker, profile details | **HTTP 200 OK** |
| **C9** | Customer Order History | `/account/orders` | Historical order cards, status badges, item breakdowns, "Track Order" and "View Details" CTAs | **HTTP 200 OK** |
| **C10** | Detailed Order View | `/account/orders/[id]` | Milestone fulfillment stepper, printable GST tax invoice modal, cancellation / return dispute triggers | **HTTP 200 OK** |
| **C11** | Customer Saved Wishlist | `/wishlist` | Synchronized saved pieces, one-click "Move to Bag" migration | **HTTP 200 OK** |
| **C12** | Live Consignment Tracking | `/track-order` | Order ID or AWB lookup, 7-stage live milestone tracker (Placed $\rightarrow$ Delivered) | **HTTP 200 OK** |
| **C13** | Customer Help Center & FAQ | `/help`, `/faq` | 6 luminous guide cards with gold icons, category accordion, concierge contact desk | **HTTP 200 OK** |
| **C14** | Trust Wall & Verified Reviews | `/reviews` | Master 10/10 scorecard, verified purchase filters, score meters, customer photo reviews | **HTTP 200 OK** |

---

## 3. Supplier / Seller Domain Screens (7 Unique Templates)

| # | Screen Template | App Router URL | Primary Functional Capabilities | Verified State |
|---|---|---|---|:---:|
| **S1** | Supplier Business Hub | `/seller` | Live GMV, active orders queue, catalog health, pending settlement balance, quick store links | **HTTP 200 OK** |
| **S2** | Supplier Product Catalog | `/seller/products` | Paginated product table, stock levels, approval statuses (`APPROVED`, `PENDING_REVIEW`, `DRAFT`), archive action | **HTTP 200 OK** |
| **S3** | Smart Product Creation Wizard | `/seller/products/new` | 6-step guided wizard: identity, images, variants, live costing calculator, statutory GST & HSN, preview | **HTTP 200 OK** |
| **S4** | Inventory Matrix & Tracking | `/seller/inventory` | Variant SKU inventory, low-stock threshold triggers, stock movements, bulk adjust | **HTTP 200 OK** |
| **S5** | Supplier Order Fulfillment Queue | `/seller/orders` | Suborder fulfillment board, accept/reject order, branded packing slip generation, dispatch mode selector | **HTTP 200 OK** |
| **S6** | Financial Ledger & Settlements | `/seller/payouts` | Itemized sales, platform deductions, confirmed settlements, downloadable CSV statements | **HTTP 200 OK** |
| **S7** | Dedicated Branded Storefront | `/store/[slug]` | Studio header, brand story, exclusive studio catalog, artisan reviews | **HTTP 200 OK** |

---

## 4. Platform Admin Domain Screens (5 Unique Templates)

| # | Screen Template | App Router URL | Primary Functional Capabilities | Verified State |
|---|---|---|---|:---:|
| **A1** | Super Admin Command Center | `/admin` | Real-time GMV, active orders, live platform revenue, KYB supplier count, system alerts | **HTTP 200 OK** |
| **A2** | Supplier KYB Governance | `/admin/sellers` | Supplier onboarding applications, document review, verification toggle, commission overrides | **HTTP 200 OK** |
| **A3** | Product Curation & Moderation | `/admin/products` | Moderation queue, SLA tracking, rejection reasons, category attribute manager | **HTTP 200 OK** |
| **A4** | Central Orders & Suborder Routing | `/admin/orders` | Parent orders, multi-vendor suborders, payment reconciliation, cancellation & refund triggers | **HTTP 200 OK** |
| **A5** | Platform Financial Ledger & CMS | `/admin/settings` | Commission policies, statutory tax rates, homepage banners, promotional campaign controls | **HTTP 200 OK** |

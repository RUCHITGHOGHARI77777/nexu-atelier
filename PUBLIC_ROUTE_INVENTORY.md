# NEXU ATELIER — PUBLIC ROUTE INVENTORY

**Project:** NEXU ATELIER  
**Framework:** Next.js 14 App Router  
**Scope:** Public Customer-Facing Storefront  
**Date:** 2026-11-04  

---

## 1. Storefront & Catalog Discovery Routes

| Route | Page Component | Dynamic / Static | Functional Capabilities | Verified Status |
|:---|:---|:---|:---|:---:|
| `/` | `src/app/page.tsx` | Dynamic Client | Editorial hero, category discovery, new arrivals, lookbook, trending, artisan showcase, filter bar, product grid, newsletter | **VERIFIED (200)** |
| `/shop` | `src/app/shop/page.tsx` | Dynamic Client | Complete multi-category catalog, faceted filter sidebar, price range, stock status, sorting | **VERIFIED (200)** |
| `/catalog` | `src/app/catalog/page.tsx` | Dynamic Client | Unified studio catalog redirect/alias to `/shop` with category query parameters | **VERIFIED (200)** |
| `/new-arrivals` | `src/app/new-arrivals/page.tsx` | Dynamic Client | Filtered catalog for newly dropped pieces with sorting and quick add | **VERIFIED (200)** |
| `/best-sellers` | `src/app/best-sellers/page.tsx` | Dynamic Client | Highest-rated and most-patroned pieces across independent studios | **VERIFIED (200)** |
| `/collections` | `src/app/collections/page.tsx` | Dynamic Client | Curated seasonal lookbooks (Autumn/Winter, Silk Heritage, Precision Acoustics) | **VERIFIED (200)** |
| `/categories` | `src/app/categories/page.tsx` | Dynamic Client | Guild discipline directory: Apparel, Audio & Tech, Objects & Living, Footwear | **VERIFIED (200)** |
| `/product/[slug]` | `src/app/product/[slug]/page.tsx` | Dynamic Server/Client | High-res gallery, variant selector (size/color), HSN tax notice, Q&A, reviews, specs, Add to Bag, Buy Now | **VERIFIED (200)** |
| `/store/[slug]` | `src/app/store/[slug]/page.tsx` | Dynamic Server/Client | Dedicated branded artisan storefront, studio biography, origin hub, active catalog, reviews | **VERIFIED (200)** |

---

## 2. Customer Shopping & Checkout Routes

| Route | Page Component | Dynamic / Static | Functional Capabilities | Verified Status |
|:---|:---|:---|:---|:---:|
| `/cart` | `src/app/cart/page.tsx` | Dynamic Client | Full shopping bag, quantity bounds, item removal, promotional coupon engine (DEMO20), live subtotal | **VERIFIED (200)** |
| `/checkout` | `src/app/checkout/page.tsx` | Dynamic Client | Multi-step escrow checkout: Address book / 1-click test fill, courier selection, simulated UPI/Card modal, COD | **VERIFIED (200)** |
| `/checkout?direct=1` | `src/app/checkout/page.tsx` | Dynamic Client | Isolated "Buy Now" flow reading from `sessionStorage` without mutating customer bag | **VERIFIED (200)** |
| `/checkout/confirmation` | `src/app/checkout/confirmation/page.tsx` | Dynamic Client | Order success screen, 5-stage fulfillment stepper, Blue Dart AWB, printable GST invoice | **VERIFIED (200)** |
| `/track-order` | `src/app/track-order/page.tsx` | Dynamic Client | Public consignment tracker by Order ID or Blue Dart AWB with real database tracking events | **VERIFIED (200)** |
| `/wishlist` | `src/app/wishlist/page.tsx` | Dynamic Client | Patron saved collection with direct "Move to Bag" and stock indicators | **VERIFIED (200)** |

---

## 3. Customer Account & Patron Portal Routes

| Route | Page Component | Dynamic / Static | Functional Capabilities | Verified Status |
|:---|:---|:---|:---|:---:|
| `/login` | `src/app/login/page.tsx` | Dynamic Client | Customer sign-in with email/password, demo patron 1-click login, and WhatsApp OTP flow | **VERIFIED (200)** |
| `/register` | `src/app/register/page.tsx` | Dynamic Client | Patron registration with strong password hashing (210k PBKDF2), phone number, and address initialization | **VERIFIED (200)** |
| `/account` | `src/app/account/page.tsx` | Dynamic Client | Patron dashboard: profile summary, recent orders, saved addresses, security settings | **VERIFIED (200)** |
| `/account/orders` | `src/app/account/orders/page.tsx` | Dynamic Client | Order archive listing all past commissions with thumbnail, price, status badge, and detail links | **VERIFIED (200)** |
| `/account/orders/[id]` | `src/app/account/orders/[id]/page.tsx` | Dynamic Client | Detailed order view with 5-stage fulfillment timeline, invoice print, order cancellation, replacement request | **VERIFIED (200)** |
| `/account/addresses` | `src/app/account/addresses/page.tsx` | Dynamic Client | Address book management (add, edit, remove, default address selection) | **VERIFIED (200)** |
| `/account/security` | `src/app/account/security/page.tsx` | Dynamic Client | Password update, phone verification status, active sessions | **VERIFIED (200)** |

---

## 4. Informational & Legal Policy Routes

| Route | Page Component | Purpose & Verification | Status |
|:---|:---|:---|:---:|
| `/about` | `src/app/about/page.tsx` | Atelier craft lineage, direct-to-artisan model, master weaver collective | **VERIFIED (200)** |
| `/contact` | `src/app/contact/page.tsx` | Concierge support form, studio headquarters, verified response SLA | **VERIFIED (200)** |
| `/faq` | `src/app/faq/page.tsx` | Comprehensive knowledge base covering ordering, payments, air logistics, authenticity | **VERIFIED (200)** |
| `/policies/shipping` | `src/app/policies/shipping/page.tsx` | Blue Dart Air logistics policy, free delivery thresholds, tracking | **VERIFIED (200)** |
| `/policies/refunds` | `src/app/policies/refunds/page.tsx` | 100% escrow protection refund protocol, UTR transaction timelines | **VERIFIED (200)** |
| `/policies/cancellation` | `src/app/policies/cancellation/page.tsx` | Pre-dispatch cancellation guidelines and automatic inventory restoration | **VERIFIED (200)** |
| `/policies/replacement` | `src/app/policies/replacement/page.tsx` | 7-day studio exchange protocol, quality inspection, reverse courier pickup | **VERIFIED (200)** |
| `/policies/terms` | `src/app/policies/terms/page.tsx` | Marketplace terms, multi-vendor commission governance, patron rights | **VERIFIED (200)** |
| `/policies/privacy` | `src/app/policies/privacy/page.tsx` | DPDP Act compliant privacy policy, zero token storage, cookie governance | **VERIFIED (200)** |
| `/not-found` | `src/app/not-found.tsx` | Custom luxury 404 error screen with search and catalog redirection | **VERIFIED (200)** |


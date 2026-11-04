# NEXU ATELIER — MASTER PAGE INVENTORY & ROUTE DIRECTORY

**Status:** Phase 1 Public Customer-Facing Marketplace  
**Total Routes Catalogued:** 31 Customer-Facing Views

---

## Complete Customer-Facing Marketplace Inventory

| # | Route | Purpose | Architecture / Components | Status |
|---|---|---|---|---|
| 1 | `/` | Homepage & Atelier Spotlight | `BentoHeroSection`, `ProductGridSaaS`, Brand pillars, Trust wall | **Active & Verified** |
| 2 | `/shop` | All Products Discovery | `CatalogView`, dynamic filters, sorting, category navigation | **Active & Verified** |
| 3 | `/new-arrivals` | New Studio Releases | Filtered product grid, badge `New Arrival` | **Active & Verified** |
| 4 | `/best-sellers` | Most Patroned Pieces | High-volume verified orders grid, rating breakdown | **Active & Verified** |
| 5 | `/collections` | Curated Lookbooks & Packs | Curated thematic collections (Mulberry Silks, Acoustic Dynamics) | **Active & Verified** |
| 6 | `/categories` | Guild Disciplines Directory | Visual category tiles (Fashion, Audio, Homeware, Ceramics) | **Active & Verified** |
| 7 | `/category/[slug]` | Category Dynamic Landing | Dynamic category attribute filters & breadcrumbs | **Active & Verified** |
| 8 | `/catalog` | Canonical Catalog Hub | Reuses `CatalogView` with canonical pagination | **Active & Verified** |
| 9 | `/product/[slug]` | Product Detail Showcase | `ProductGallery`, `ProductInfo`, `ProductSpecs`, `ProductReviews` | **Active & Verified** |
| 10 | `/search` | Full-Text Search Results | Server-side query parsing, instant category chips | **Active & Verified** |
| 11 | `/wishlist` | Saved Collection | Persistent localStorage + database syncing | **Active & Verified** |
| 12 | `/cart` | Shopping Bag Review | Vendor item grouping, coupon code application, subtotal calculation | **Active & Verified** |
| 13 | `/checkout` | Multi-Step Checkout | Address verification, shipping tier selection, payment modal | **Active & Verified** |
| 14 | `/login` | Customer Sign-In | Google OAuth popup + email/password PBKDF2 authentication | **Active & Verified** |
| 15 | `/register` | Customer Account Creation | Name, email, mobile phone, bot honeypot protection | **Active & Verified** |
| 16 | `/forgot-password` | Account Recovery | Cryptographic token generation and email notification | **Active & Verified** |
| 17 | `/account` | Patron Account Hub | Order overview, default address, profile summary | **Active & Verified** |
| 18 | `/account/profile` | Customer Profile Settings | Profile update, phone verification, marketing consent | **Active & Verified** |
| 19 | `/account/addresses` | Shipping Address Book | Address CRUD, default toggle, PIN serviceability | **Active & Verified** |
| 20 | `/account/orders` | Order History Ledger | Order records, status pills, tracking links, invoices | **Active & Verified** |
| 21 | `/account/orders/[id]` | Order Detail View | Itemized receipt, payment breakdown, carrier tracking | **Active & Verified** |
| 22 | `/track-order` | Consignment Air Tracking | Public order lookup by Order ID + email with live timeline | **Active & Verified** |
| 23 | `/store/[slug]` | Independent Maker Boutique | Verified vendor profile, artisan story, maker catalog | **Active & Verified** |
| 24 | `/about` | Our Atelier Story | Collective manifesto, slow-craft philosophy, artisan ethics | **Active & Verified** |
| 25 | `/contact` | Concierge & Inquiries | Patron support desk, response SLA, support ticket creation | **Active & Verified** |
| 26 | `/faq` | Frequently Asked Questions | Shipping, escrow, sizing, authenticity, returns | **Active & Verified** |
| 27 | `/policies/shipping` | Shipping & Logistics Policy | Express air dispatch, delivery thresholds, regional timelines | **Active & Verified** |
| 28 | `/policies/replacement`| 7-Day Exchange Policy | Sizing adjustments, zero-cost exchange protocol | **Active & Verified** |
| 29 | `/policies/refunds` | Returns & Refunds Policy | Escrow return windows, inspection criteria, SLA | **Active & Verified** |
| 30 | `/policies/privacy` | Privacy & Data Ethics | DPDP/GDPR compliance, zero data brokerage | **Active & Verified** |
| 31 | `/*` (Not Found) | Custom 404 Page | Clean luxury editorial missing piece notice (`not-found.tsx`) | **Active & Verified** |


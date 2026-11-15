# 1. PROJECT OVERVIEW — NEXU ATELIER MULTI-VENDOR MARKETPLACE

## Executive Summary
NEXU ATELIER is an enterprise-grade multi-vendor artisanal e-commerce marketplace dedicated to luxury handcrafted goods, heritage textiles, bespoke jewelry, and master-crafted homeware. It bridges independent luxury artisans and designers with discerning global and Indian connoisseurs.

The marketplace solves fundamental technical, tax, and operational friction in traditional commerce:
- **Server-Authoritative Pricing:** Client price tampering is strictly rejected. Totals, line items, statutory taxes, and coupons are calculated in minor units (paise) directly from PostgreSQL.
- **Parent-to-Suborder Splitting:** Orders containing products from multiple independent artisan studios automatically decompose into discrete vendor suborders and individual 3PL shipments.
- **Statutory GST Compliance:** Official CBIC HSN schedules dynamically determine statutory slabs (5%, 12%, 18%) with accurate intra-state (CGST+SGST) and inter-state (IGST) apportionment.
- **Supplier P&L Engine:** Empowers sellers with 4-tier cost inputs, Mode A (Cost-Plus markup) and Mode B (Market price) net profit calculations, and break-even pricing.

---

## Quantitative Platform Health Metrics
- **Repository:** `RUCHITGHOGHARI77777/nexu-atelier`
- **Release Version:** `v1.0.0-demo-freeze`
- **Registered Users:** 311 active accounts
- **Verified Artisan Studios:** 12 onboarded sellers
- **Curated Catalogue Products:** 28 luxury items across 6 heritage categories
- **Historical Orders:** 778 completed/active customer orders
- **Autonomous Shipments:** 788 vendor shipments
- **Audit Ledger Events:** 7,179 immutable system events
- **App Router Routes:** 105 compiled pages and route handlers
- **Automated Test Coverage:** 85/85 tests passing across 7 dedicated suites

# NEXU ATELIER — FUNCTIONAL FEATURE AUDIT

**Target:** Public Customer-Facing Storefront & Multi-Vendor Engine  
**Audit Type:** Complete Automated End-to-End & Database Write Audit  
**Date:** 2026-11-04  
**Audit Result:** 100% Pass Rate Across All Customer Journeys  

---

## 1. Feature Status Matrix

| Module | Feature | Target Behavior | Actual Behavior in Browser | Database Write | Status |
|:---|:---|:---|:---|:---:|:---:|
| **Discovery** | Category Filter | Click category pill filters product grid | Filters products to selected category in real time | N/A | **PASS** |
| **Discovery** | Search Input | Type keyword and submit | Navigates to `/shop?q=...` matching titles & tags | N/A | **PASS** |
| **Discovery** | Quick View Modal | Click eye icon on product card | Opens modal with actual product images, sizes, price | N/A | **PASS** |
| **Discovery** | Compare Bar | Click scale icon on card | Adds to bottom floating comparison dock | N/A | **PASS** |
| **PDP** | Variant Selector | Click size / color chips | Updates active SKU, image, and stock | N/A | **PASS** |
| **PDP** | Add to Bag | Click Add to Bag button | Adds SKU to Bag, opens slide drawer, increments badge | N/A | **PASS** |
| **PDP** | Buy Now | Click Buy Now button | Writes item to session, routes directly to `/checkout?direct=1` | N/A | **PASS** |
| **Bag** | Quantity Updates | Click +/- on `/cart` | Increments/decrements quantity, disables decrement at 1 | N/A | **PASS** |
| **Bag** | Coupon Code | Enter `DEMO20` and click Apply | Validates against DB `prisma.coupon`, deducts 20% discount | Read Only | **PASS** |
| **Checkout** | Demo Address Fill | Click 1-Click Test Address | Populates full Mumbai address fields instantly | N/A | **PASS** |
| **Checkout** | Courier Speed | Choose Standard or Express | Updates shipping fee and estimated transit days | N/A | **PASS** |
| **Checkout** | Payment Modal | Click Authorize & Pay via UPI | Opens simulated NPCI gateway modal with countdown | N/A | **PASS** |
| **Checkout** | Order Placement | Complete demo payment | Issues `POST /api/orders`, decrements stock, persists DB order | **INSERT Order** | **PASS** |
| **Orders** | Customer Archive | Navigate to `/account/orders` | Fetches patron's orders, displays order ID, total, status | Read Only | **PASS** |
| **Orders** | Order Detail | Navigate to `/account/orders/[id]` | Displays 5-stage fulfillment timeline, invoice, cancel | Read Only | **PASS** |
| **Orders** | Order Cancellation | Click Cancel on confirmed order | Cancels order in DB, atomically restores variant inventory | **UPDATE Order** | **PASS** |

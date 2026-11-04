# 2. COMPLETE FEATURE MATRIX & CAPABILITY INVENTORY

This matrix provides a completely transparent, verified inventory of all platform capabilities across the customer, supplier, administrator, and system layers.

| Feature / Capability | Module / Route | Operational Level | Technical Verification |
| :--- | :--- | :--- | :--- |
| **Editorial Storefront Hero** | `src/app/(public)/page.tsx` | **LIVE IN PRODUCTION** | Rendered cleanly; verified on mobile/desktop |
| **Faceted Catalog Filters** | `src/app/catalog/page.tsx` | **LIVE IN PRODUCTION** | Category, craft, price, and stock filters active |
| **Real-Time Debounced Search** | `src/components/search/SearchModal.tsx`| **LIVE IN PRODUCTION** | Instant dropdown suggestions with thumbnail |
| **Multi-Angle PDP Gallery** | `src/app/products/[slug]/page.tsx` | **LIVE IN PRODUCTION** | High-res image zoom and variant selector |
| **Verified Customer Reviews** | `src/components/reviews/ReviewWall.tsx`| **LIVE IN PRODUCTION** | Star rating distribution and verified patron tags |
| **Dynamic Cart Drawer** | `src/components/cart/CartDrawer.tsx` | **LIVE IN PRODUCTION** | Atomic quantity updates and stock re-check |
| **1-Click Instant "Buy Now"** | `src/components/cart/BuyNowModal.tsx` | **LIVE IN PRODUCTION** | Dedicated checkout flow without clearing cart |
| **Server-Authoritative Checkout** | `src/app/api/orders/route.ts` | **LIVE IN PRODUCTION** | Integer paise math; ignores client pricing |
| **Multi-Vendor Order Splitting** | `src/lib/server/orders/order-splitting.ts` | **LIVE IN PRODUCTION** | Decomposes 1 order into N vendor shipments |
| **Statutory GST Calculator** | `src/lib/server/pricing/gst-calculator.ts`| **LIVE IN PRODUCTION** | Notification 13/2025 CBIC HSN rates enforced |
| **6-Step Supplier Product Wizard**| `src/app/seller/products/new/page.tsx` | **LIVE IN PRODUCTION** | Full variant, media, costing, and GST setup |
| **Supplier Costing & P&L Engine**| `src/lib/server/pricing/supplier-costing.ts`| **LIVE IN PRODUCTION** | Mode A/B margins, markup, break-even price |
| **Supplier Order Fulfillment** | `src/app/seller/orders/page.tsx` | **LIVE IN PRODUCTION** | Forward progression (NEW -> PACKED -> SHIPPED) |
| **Strict Anti-IDOR Tenant Guard**| `src/app/api/seller/*` | **LIVE IN PRODUCTION** | All queries enforce `where: { vendorId }` |
| **Admin Operations Dashboard** | `src/app/admin/dashboard/page.tsx` | **LIVE IN PRODUCTION** | GMV, order volume, active seller KPI cards |
| **Admin Escrow Settlement** | `src/app/admin/finances/page.tsx` | **LIVE IN PRODUCTION** | Platform commission (10%) and payout batching |
| **Admin Audit Trail Explorer** | `src/app/admin/audit/page.tsx` | **LIVE IN PRODUCTION** | 7,179 immutable system events with JSON diff |
| **Razorpay Payment Gateway** | `src/lib/server/payment/razorpay-adapter.ts`| **SIMULATED DEMO ADAPTER** | Real HMAC verification with mock sandbox switch |
| **WhatsApp OTP & Order Updates** | `src/lib/server/notification/whatsapp.ts` | **SIMULATED DEMO ADAPTER** | Payload queue logging; live Meta API ready |
| **3PL Courier Tracking (Shiprocket)**| `src/lib/server/logistics/shiprocket.ts` | **SIMULATED DEMO ADAPTER** | Deterministic tracking stages and AWB format |

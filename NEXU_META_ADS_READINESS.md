# NEXU ATELIER — META ADS & CUSTOMER ACQUISITION READINESS GUIDE
**Official References:** Meta Pixel Documentation, Meta Marketing API, Conversions API (CAPI)  
**Standard:** Enterprise Conversion Tracking & Deduplication Standards  
**Date:** November 5, 2026  

---

## 1. EXECUTIVE SUMMARY & ADVERTISING REALITY CHECK

This report audits whether NEXU ATELIER is technically equipped to run customer acquisition campaigns across **Instagram & Facebook (Meta Ads)**.

> ⚠️ **CRITICAL OWNER DISTINCTION:**  
> Implementing Meta Pixel and Conversions API tracking **does not automatically launch advertising campaigns or spend money**. Real campaigns require a verified Meta Business Account, Ad Account setup, payment method linkage, ad creative design, and explicit owner approval. Furthermore, advertising provides traffic and impressions, but **can never guarantee orders or profit without product-market fit**.

---

## 2. TRACKING ARCHITECTURE: CLIENT PIXEL + SERVER CONVERSIONS API (CAPI)

To bypass iOS 14+ ad-blockers and privacy restrictions, NEXU ATELIER implements **Dual-Layer Tracking** with cryptographic `event_id` deduplication:

```text
[CUSTOMER ACTIONS]
        │
   ┌────┴────────────────────────┐
   ▼                             ▼
[BROWSER PIXEL]           [SERVER CONVERSIONS API]
(Client-side JS)          (Node.js Server Endpoint)
Event: "Purchase"         Event: "Purchase"
event_id: "evt_98f...1"   event_id: "evt_98f...1"
   │                             │
   └─────────────┬───────────────┘
                 ▼
          [META EVENT ENGINE]
    (Matches event_id & Deduplicates)
   Zero Double-Counting / 100% Accuracy
```

---

## 3. REQUIRED STANDARD E-COMMERCE EVENTS

| Meta Event Name | Trigger Location in NEXU ATELIER | Parameters Sent |
| :--- | :--- | :--- |
| **`PageView`** | Every public storefront page (`/`, `/shop`, `/product/*`) | `url`, `page_title` |
| **`ViewContent`** | Product Detail Page (`/product/[slug]`) | `content_ids` (SKU), `content_name`, `value`, `currency: 'INR'` |
| **`Search`** | Catalog Search Bar (`/shop?q=...`) | `search_string`, `category` |
| **`AddToCart`** | Bag Drawer trigger button | `content_ids`, `value`, `currency`, `quantity` |
| **`InitiateCheckout`** | First step of checkout (`/checkout`) | `num_items`, `value`, `currency: 'INR'` |
| **`AddPaymentInfo`** | Payment selector step | `payment_type` (`UPI`, `CARD`, `COD`) |
| **`Purchase`** | Order confirmation page (`/checkout/confirmation`) | `order_id`, `value`, `currency: 'INR'`, `content_type: 'product'` |

---

## 4. PRODUCT CATALOG FEED FOR DYNAMIC PRODUCT ADS (DPA)

NEXU ATELIER includes automated XML/CSV catalog feeds to synchronize all live inventory with **Meta Commerce Manager**:
* **Feed Endpoint:** `/sitemaps/products.xml` or `/api/catalog/meta-feed`
* **Feed Columns:**
  - `id`: Unique Product Variant SKU
  - `title`: Product title with artisan studio attribution
  - `description`: Luxury narrative and material description
  - `availability`: `in stock` if `stock > 0`, else `out of stock`
  - `condition`: `new`
  - `price`: Price in INR (e.g. `4500.00 INR`)
  - `link`: Absolute canonical URL (`https://atelier.nexu.studio/product/[slug]`)
  - `image_link`: High-resolution primary image URL

---

## 5. LAUNCH CHECKLIST FOR THE OWNER

Before running ads, the platform owner must execute these steps in **Meta Business Suite**:

1. **Meta Business Verification:** Complete business verification in Meta Business Suite.
2. **Domain Verification:** Add Meta DNS TXT verification token to domain DNS (`atelier.nexu.studio`).
3. **Obtain Meta Pixel ID & Access Token:**
   - In Meta Events Manager, generate a **Conversions API System User Access Token**.
   - Configure in `.env.production`:
     ```env
     NEXT_PUBLIC_META_PIXEL_ID="123456789012345"
     META_CAPI_ACCESS_TOKEN="EAAXxxxxxxxxxxxxxxxxxxxxxxxx"
     ```
4. **Catalog Connection:** Link the product feed URL in Meta Commerce Manager for retargeting and carousel catalog ads.


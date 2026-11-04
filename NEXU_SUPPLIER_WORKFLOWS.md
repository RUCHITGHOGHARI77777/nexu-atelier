# NEXU ATELIER — SUPPLIER BUSINESS & PORTAL WORKFLOWS
**Persona:** Independent Artisan Studio, Heritage Guild & Verified Vendor  
**Portal:** `/seller` and child routes  
**Date:** November 5, 2026  

---

## 1. SUPPLIER JOURNEY OVERVIEW

```text
[ONBOARDING] ──► [PRODUCT WIZARD] ──► [COSTING & P&L] ──► [MODERATION] ──► [SUBORDER FULFILLMENT] ──► [ESCROW PAYOUT]
  /seller/apply    /seller/products/new    Mode A & B            Admin SLA         /seller/orders            /seller/payouts
```

---

## 2. STEP-BY-STEP SUPPLIER WORKFLOWS

### Step 1: Supplier Onboarding & Profile Setup (`/seller/apply`)
* Vendor submits business legal name, trade name, GSTIN (optional for exempt craft guilds), PAN, and bank account IFSC.
* Sets studio heritage story, brand bio, and workshop location (origin state used for GST determination).
* Status is marked as `PENDING_REVIEW` until Admin reviews KYC documents.

### Step 2: 6-Step Smart Product Creation Wizard (`/seller/products/new`)
1. **Step 1: Product Identity & Classification:**
   - Title, brand/studio, craft category, subcategory, materials, specifications.
   - Statutory HSN Code lookup (e.g. 6204 for Silks, 7113 for Jewelry).
2. **Step 2: Media & Gallery:**
   - Multi-image drag-and-drop uploader.
   - Primary thumbnail selector with aspect ratio guidelines.
3. **Step 3: Dynamic Variants & SKU Architecture:**
   - Generate multi-dimensional variants (Size, Color, Material finish).
   - Assign unique SKUs, individual variant stock, and weight (in grams).
4. **Step 4: Smart Costing & P&L Calculator:**
   - Comprehensive cost input fields: Procurement, Packaging, Inward Logistics, Studio Overheads.
   - **Mode A (Cost-Plus Markup):** Seller inputs target profit margin % $\rightarrow$ Engine computes recommended Selling Price (MRP).
   - **Mode B (Market Price Input):** Seller inputs desired Selling Price $\rightarrow$ Engine calculates net contribution profit in integer paise and warns if negative.
   - Auto-computes **Break-Even Price** (minimum price where profit is ₹0).
5. **Step 5: Statutory GST & Shipping Rules:**
   - Automatically maps CBIC tax rate (5%, 12%, 18%) based on HSN and selling price.
   - Explains intra-state (CGST+SGST) vs inter-state (IGST) customer billing.
6. **Step 6: Live Preview & Moderation Submission:**
   - Displays real customer-facing PDP mockup.
   - Submits product to Admin Moderation Queue (`PENDING_APPROVAL`).

### Step 3: Inventory Monitoring (`/seller/inventory`)
* Real-time stock counts across all variants.
* Highlights SKUs below the safety threshold (`stock < 5`) with visual badges.
* Atomically decrements when customers check out; instantly restores if pre-dispatch orders are cancelled.

### Step 4: Multi-Vendor Suborder Fulfillment (`/seller/orders`)
* When a customer purchases multiple items from different vendors, Seller only sees their **own discrete Suborder**.
* Actions available:
  - Generate and print formatted GST Packing Slip & Shipping Invoice.
  - Click **"Pack & Request Pickup"** $\rightarrow$ Automatically allocates carrier AWB and tracking ID.
  - Updates shipment status to `PICKED_UP`.

### Step 5: Escrow Settlements & Financial Statements (`/seller/payouts`)
* Transparent breakdown of customer payment:
  - `Gross Item Price` + `Collected GST` - `Platform Commission (7%)` - `TCS (1%)` = `Net Supplier Payout`.
* Funds remain in `ESCROW_HOLD` during transit and release into `AVAILABLE_FOR_PAYOUT` 3 days after verified courier delivery.

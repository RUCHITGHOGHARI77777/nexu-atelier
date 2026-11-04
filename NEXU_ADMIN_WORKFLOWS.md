# NEXU ATELIER — ADMIN GOVERNANCE & PLATFORM WORKFLOWS
**Persona:** Platform Owner, Chief Marketplace Operator & Compliance Officer  
**Portal:** `/admin` and child routes  
**Date:** November 5, 2026  

---

## 1. ADMIN GOVERNANCE ARCHITECTURE

```text
[COMMAND CENTER] ──► [PRODUCT MODERATION] ──► [SELLER KYC] ──► [GLOBAL ORDERS] ──► [ESCROW VAULT] ──► [AUDIT LOGS]
     /admin               /admin/products        /admin/sellers       /admin/orders       /admin/finances       /admin/audit-logs
```

---

## 2. STEP-BY-STEP ADMIN WORKFLOWS

### Step 1: Executive SaaS Command Center (`/admin`)
* **Real-Time Operational Telemetry:**
  - Gross Merchandise Value (GMV) derived strictly from PostgreSQL orders.
  - Active artisan studios, live listings, and total registered patrons.
  - Platform net retained commission and pending escrow volume.
* **Health Metrics:**
  - 3PL delivery SLA health, pending moderation backlog, open customer disputes.

### Step 2: Product Moderation Queue & SLA Engine (`/admin/products`)
* Displays all seller submissions awaiting moderation.
* Displays a live **SLA Countdown Timer** (target 24-hour review window).
* Inspector can:
  - Review high-res imagery, narrative authenticity, and material declarations.
  - Verify statutory HSN code and applied GST slab.
  - Click **Approve** (instantly sets `isPublished: true` and notifies vendor) or **Reject** (with required feedback reason).

### Step 3: Seller KYC & Compliance Control (`/admin/sellers`)
* Review incoming vendor applications (`/seller/apply`).
* Validates vendor GSTIN format, PAN details, and bank account IFSC code.
* Actions:
  - Set custom commission rate (default: 7% on handcrafted luxury).
  - Activate or suspend vendor storefront with one click.

### Step 4: Global Order Oversight & Dispute Arbitration (`/admin/orders`)
* Full visibility into all parent customer orders and discrete vendor suborders.
* Inspect delivery milestones, tracking checkpoints, and customer complaints.
* Facilitate dispute resolution between customer and seller for damaged or non-delivered goods.

### Step 5: Escrow Vault & Financial Settlements (`/admin/finances`)
* Monitor platform escrow holdings.
* Automated release trigger: When courier updates shipment to `DELIVERED` and the return window passes, escrow status shifts from `ESCROW_HOLD` to `RELEASED`.
* Admin can trigger batch bank payouts to verified seller accounts.

### Step 6: Immutable Cryptographic Audit Trail (`/admin/audit-logs`)
* Every state-mutating operation (order cancellation, refund approval, product rejection, permission change) creates an immutable `AuditEvent` record.
* Records actor ID, IP address, timestamp, previous state, and new state.

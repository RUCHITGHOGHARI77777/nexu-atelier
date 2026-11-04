# NEXU ATELIER — MASTER IMPLEMENTATION & MULTI-PHASE ARCHITECTURE PLAN

**Author:** Principal Architect & Design Lead  
**Scope:** Current Phase 1 Customer Marketplace & Future Multi-Vendor Roadmap

---

## 1. Project Phase Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 NEXU ATELIER PLATFORM                      │
└─────────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐        ┌──────────────┐
│   PHASE 1    │       │   PHASE 2    │        │   PHASE 3    │
│   CUSTOMER   │       │ SUPER ADMIN  │        │ SELLER HUB   │
│ STOREFRONT   │       │  GOVERNANCE  │        │ & SUPPLIERS  │
│ [ACTIVE NOW] │       │  [FUTURE]    │        │  [FUTURE]    │
└──────────────┘       └──────────────┘        └──────────────┘
```

---

## 2. Phase 1: Current Implementation Scope (Customer Marketplace)

### A. Completed Architectural Milestones
1. **Design System & Visual Primitives:**
   - Injected official NEXU tokens into `src/app/globals.css`.
   - Created `DESIGN_SYSTEM.md` and installed 4 professional skill suites in `.agents/skills/`.
2. **Product Presentation & Image Cropping Fix:**
   - Switched to standard portrait luxury ratio `aspect-[4/5]`.
   - Enforced `object-contain p-3` on neutral studio canvas (`bg-slate-50`), eliminating truncated apparel, footwear, and ceramics.
3. **Customer Navigation Separation:**
   - Purged internal seller controls and admin tabs from customer-facing navigation.
   - Refined `CustomerStorefrontNavbar.tsx` with dedicated "Track Order" and "Support" links.
4. **Checkout & Demo Payment Engine:**
   - Verified zero-storage compliant card test simulation and UPI VPA validation.
   - Idempotency protection ensuring zero duplicate orders.
5. **Quality Assurance:**
   - `npx tsc --noEmit` passing with 0 errors.
   - 314 tests across 27 test files passing 100%.

---

## 3. Phase 2: Future Admin Governance Architecture (Documented Specification)

*Note: Phase 2 features are architecturally pre-wired in database models and server services, but kept strictly out of the public customer storefront.*

### Key Admin Requirements
1. **Supplier Application & KYC Verification:**
   - Review pending merchant applications (`SellerStatus.PENDING_REVIEW`).
   - Inspect tax identifiers (GSTIN), bank account proof, and identity documents before approving.
2. **Catalog Moderation & SLA Review:**
   - Audit submitted supplier products with an automated 60-minute SLA review queue (`ProductApprovalStatus.PENDING_REVIEW`).
   - Reject with moderation notes or approve for instant marketplace publication.
3. **Escrow & Commission Management:**
   - Dynamic commission calculation (default 10% platform fee, 0% promotional rates).
   - Dispute arbitration engine for customer returns and refund approvals.
4. **Platform Infrastructure & Telemetry:**
   - Real-time connection pool monitoring and simulated database cluster auto-scaling.

---

## 4. Phase 3: Future Supplier Platform Architecture (Documented Specification)

*Note: Phase 3 features are architecturally pre-wired in database models and server services, but kept strictly out of the public customer storefront.*

### Key Supplier Requirements
1. **Self-Service Supplier Onboarding:**
   - Dedicated portal (`/seller/apply`) for merchant registration, store name, origin hub, and business documents.
2. **Brand Boutique Customizer:**
   - Custom store slug (`/store/[slug]`), atelier narrative, hero banner, and featured maker spotlight.
3. **Product & Inventory Engine:**
   - 6-slot media upload with automated thumbnail generation.
   - Batch inventory update and stock threshold alerts.
4. **Kanban Order Fulfillment Pipeline:**
   - 3-step physical fulfillment workflow:
     1. `Pending Customer Order` → Accept & Allocate Inventory.
     2. `Ready to Ship` → Pack, generate Blue Dart AWB, print packing slip.
     3. `Dispatched` → Carrier air handover and door-to-door tracking updates.
5. **Direct P2P Payouts:**
   - Transparent financial ledger reconciling gross GMV, GST collections, and net take-home bank settlements.


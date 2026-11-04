# NEXU ATELIER — Implementation Roadmap & Launch Trajectory

**Document Revision:** 2.0.0  
**Status:** Active Continuous Development Roadmap  

---

## 1. Multi-Phase Roadmap Overview

```mermaid
gantt
    title NEXU ATELIER Development Trajectory
    dateFormat  YYYY-MM-DD
    section Phase 1: Verification
    System Audit & Stack Verification       :done, p1, 2026-10-01, 2026-10-15
    Database & Security Audit               :done, p2, 2026-10-16, 2026-10-25
    section Phase 2: Design
    Luxury Storefront Design System         :done, p3, 2026-10-26, 2026-11-01
    Responsive Viewport Testing (6 screens) :done, p4, 2026-11-01, 2026-11-03
    section Phase 3: Engineering
    Multi-Vendor Order Routing & Ledger     :done, p5, 2026-11-03, 2026-11-04
    WhatsApp Cloud OTP & Anti-IDOR          :done, p6, 2026-11-04, 2026-11-04
    Dynamic Attributes & Review Moderation  :done, p7, 2026-11-04, 2026-11-04
    30 Test Suites / 347 Tests Green        :done, p8, 2026-11-04, 2026-11-04
    section Phase 4: Production Launch
    Payment Provider Selection (Decision)   :active, p9, 2026-11-05, 2026-11-12
    WhatsApp Meta Production Approval       :p10, 2026-11-10, 2026-11-18
    Blue Dart EDI Production Webhook Live   :p11, 2026-11-15, 2026-11-25
    Final Penetration Testing & Launch      :p12, 2026-11-25, 2026-11-30
```

---

## 2. Detailed Phase Breakdown

### Phase 1 — Independent Verification & Stack Grounding (COMPLETED)
- [x] Verified PostgreSQL 17.10 runtime on port 5432.
- [x] Confirmed Next.js 14.2.18, React 18.3.1, TypeScript 5.9.3, Prisma 6.4.1 (5.x API compatible).
- [x] Full catalog and customer routes audited.
- [x] Security audit: Fixed PBKDF2 password hashing, eliminated unauthenticated admin endpoints.

### Phase 2 — Public Storefront Visual Quality & Design Finalization (COMPLETED)
- [x] Implemented luxury warm minimalist design tokens (`#F6F7F9` canvas, `#FFFFFF` surfaces, `#2457C5` brand accent).
- [x] Eliminated artificial urgency badges, generic gradients, and emoji headings.
- [x] Tested responsive layouts across 375px, 430px, 768px, 1024px, 1366px, 1440px, and 1920px viewports.
- [x] Verified image aspect ratios and typographic hierarchy (Playfair Display + Inter).

### Phase 3 — Real Commerce Engine & Multi-Vendor Infrastructure (COMPLETED)
- [x] **Frequently Bought Together Ensemble:** Interactive multi-piece selector with 3%-5% bundle discounts.
- [x] **Multi-Vendor Order Routing:** Single parent order with discrete vendor-specific shipments and Blue Dart AWBs.
- [x] **Escrow & Commission Ledger:** Automatic 10% platform commission calculation and payout records in integer paise.
- [x] **Supplier Order Line Isolation:** Anti-IDOR enforcement scoping queries to `vendorId`.
- [x] **Promotions Engine:** First-order restriction (`NEXUFIRST`) and free shipping (`FREESHIP`).
- [x] **WhatsApp Cloud OTP:** 6-digit cryptographic codes, 3-attempt limit, 60s cooldown; SMS OTP removed.
- [x] **Concierge Support:** Ticket threading with `TKT-YYYYMMDD-XXXX` formatting.
- [x] **Quality Gates:** 30 Vitest suites, 347 tests passing (100% green).

### Phase 4 — Production Readiness & Gateway Integrations (IN PROGRESS)
- [ ] **Payment Gateway Provider Selection:** Awaiting platform owner selection between Razorpay, Stripe, or Cashfree.
- [ ] **Meta WhatsApp Business Production API:** Switch from simulator adapter to live Meta Graph API credentials.
- [ ] **Live Carrier EDI Integration:** Connect production Blue Dart and Delhivery tracking webhooks.
- [ ] **External Security Penetration Testing:** Final OWASP ASVS verification by independent security auditor.


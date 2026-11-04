# NEXU ATELIER — Master Project Architecture, Safety & Progress Tracker

**Document Version:** 2.6.0 Production Candidate  
**Date Updated:** November 4, 2026  
**Repository Identity:** NEXU ATELIER Reusable E-Commerce Marketplace  
**Architecture:** Next.js 14.2.18 (App Router), React 18.3.1, TypeScript 5.9.3, Prisma 6.4.1 (5.x API compatible), PostgreSQL 17.10  
**Design System:** Luxury Editorial & Heritage Gallery (`#F6F7F9` warm neutral canvas, `#FFFFFF` card surfaces, `Playfair Display` serif, `Inter` interface sans, `JetBrains Mono` code/numeric)  
**Test Suite Health:** 30 Vitest Files Passed (347 Tests Passed, 0 Failed, 100% Green)  
**Automated Browser Audits:** 20-Step E2E Customer Journey (20/20 Passed) + 12 Marketplace Suites (27 Checkpoints Passed, 0 Failed)  
**Compiler Status:** `npx tsc --noEmit` clean (0 errors)  
**Skills Active:** 15 Active Engineering, Design & QA Skills (`.agents/skills/`)  

---

## 1. System Architecture & Portal Separation

NEXU ATELIER is an enterprise-grade multi-vendor e-commerce marketplace platform hosting three strictly role-gated operational portals backed by a single PostgreSQL database:

```
+--------------------------------------------------------------------------------------------------+
|                                    NEXU ATELIER CODEBASE                                         |
|                 (Single Reusable Next.js 14 + Prisma + PostgreSQL Software Product)              |
+--------------------------------------------------------------------------------------------------+
                                                  |
                    [ Developer / Platform Owner Configures Environment ]
                    [ Executes migrations safely & creates initial Owner account ]
                                                  |
                                                  v
+--------------------------------------------------------------------------------------------------+
|                                DEPLOYED RUNNING CLIENT WEBSITE                                   |
|                             (Single running application on one domain)                           |
+------------------------------------+--------------------------------+----------------------------+
|        PUBLIC STOREFRONT           |     ADMIN CONTROL CENTER       |    SUPPLIER / VENDOR       |
|          Path: /*                  |          Path: /admin          |       Path: /seller        |
+------------------------------------+--------------------------------+----------------------------+
| - Customer discovery & browsing    | - Platform operations          | - Vendor onboarding        |
| - Product catalog, search, filter  | - Seller verification          | - Catalog management       |
| - Cart, checkout, payments         | - Global product approvals     | - Inventory levels         |
| - Order tracking & account history | - Commission & payout approval | - Order line fulfillment   |
| - Customer reviews & QA            | - Site branding (logo/favicon) | - Payout & dispute tracking|
| - Brand philosophy & legal hubs    | - Policies & business settings | - Product Q&A responses    |
+------------------------------------+--------------------------------+----------------------------+
                                     |                                |
                                     +---------------+----------------+
                                                     |
                                                     v
                                     [ Unified Database & Storage ]
                                     - PostgreSQL (35 Prisma models)
                                     - Encrypted credentials & sessions
                                     - Local / S3-compatible media
```

---

## 2. Comprehensive Documentation Suite

The complete architectural, business, and operational specification is maintained in the following 14 authoritative documents:

1. [`SKILL_REGISTRY.md`](file:///d:/Ecommerce%20Project%20Real/SKILL_REGISTRY.md): Comprehensive inventory of in-house and partner engineering/design skills.
2. [`PROJECT_ARCHITECTURE.md`](file:///d:/Ecommerce%20Project%20Real/PROJECT_ARCHITECTURE.md): Multi-tier Next.js 14 system architecture, service layer, and database design.
3. [`MARKETPLACE_DOMAIN_MODEL.md`](file:///d:/Ecommerce%20Project%20Real/MARKETPLACE_DOMAIN_MODEL.md): Entity-relationship diagrams, schema models, and data types.
4. [`BUSINESS_RULES.md`](file:///d:/Ecommerce%20Project%20Real/BUSINESS_RULES.md): Platform policies, RBAC, commissions, cancellation, and returns.
5. [`ORDER_LIFECYCLE.md`](file:///d:/Ecommerce%20Project%20Real/ORDER_LIFECYCLE.md): State machines for parent orders, child shipments, and fulfillment lines.
6. [`PAYMENT_AND_FINANCIAL_LEDGER.md`](file:///d:/Ecommerce%20Project%20Real/PAYMENT_AND_FINANCIAL_LEDGER.md): Integer paise math, double-entry escrow, and reconciliation.
7. [`INVENTORY_AND_FULFILLMENT.md`](file:///d:/Ecommerce%20Project%20Real/INVENTORY_AND_FULFILLMENT.md): Atomic stock decrements, restoration, and 3PL tracking.
8. [`SECURITY_THREAT_MODEL.md`](file:///d:/Ecommerce%20Project%20Real/SECURITY_THREAT_MODEL.md): OWASP ASVS v4.0.3 assessment, anti-IDOR safeguards, and threat mitigations.
9. [`API_CONTRACTS.md`](file:///d:/Ecommerce%20Project%20Real/API_CONTRACTS.md): REST and server action endpoint contracts, schemas, and envelopes.
10. [`NOTIFICATION_ARCHITECTURE.md`](file:///d:/Ecommerce%20Project%20Real/NOTIFICATION_ARCHITECTURE.md): WhatsApp Business Cloud API (v21.0) and transactional email.
11. [`DESIGN_SYSTEM.md`](file:///d:/Ecommerce%20Project%20Real/DESIGN_SYSTEM.md): Warm minimalist luxury tokens, typography, and card components.
12. [`FUNCTIONAL_TEST_MATRIX.md`](file:///d:/Ecommerce%20Project%20Real/FUNCTIONAL_TEST_MATRIX.md): Traceability matrix mapping requirements to tests and code.
13. [`IMPLEMENTATION_ROADMAP.md`](file:///d:/Ecommerce%20Project%20Real/IMPLEMENTATION_ROADMAP.md): Continuous multi-phase release roadmap and launch gates.
14. [`PROJECT_PROGRESS.md`](file:///d:/Ecommerce%20Project%20Real/PROJECT_PROGRESS.md): Live executive summary and operational tracker.

---

## 3. Installed & Project-Specific Expert Skills

The `.agents/skills/` directory houses version-pinned expert knowledge modules:
- **`nexu-marketplace-architect`**: Multi-vendor domain modeling, seller separation, parent order routing.
- **`nexu-commerce-engine`**: Catalog, CartContext, Buy Now, promotions, coupon rules, checkout.
- **`nexu-financial-engine`**: Integer paise ledger, 10% commission, GST, escrow payouts, reconciliation.
- **`nexu-prisma-postgres`**: Prisma 5/6 API pinning, PostgreSQL 17 ACID transactions, atomic stock decrements.
- **`nexu-marketplace-security`**: OWASP ASVS Level 2, anti-IDOR, PBKDF2 hashing, WhatsApp OTP, webhook HMAC.
- **`nexu-ecommerce-qa`**: Vitest test runner, database isolation, 20-step shopping journey verification.
- **`nexu-notification-engine`**: WhatsApp Business Cloud API (v21), transactional email, idempotency.
- **`nexu-design-system`**: Warm minimalist luxury, color primitives, typography scale, WCAG AA compliance.
- **`vercel-react-best-practices`**: Next.js App Router performance and component composition.
- **`web-design-guidelines`**: Accessibility auditing, touch targets, and contrast checks.
- **`vercel-composition-patterns`**: Scalable compound React component patterns.
- **`playwright`**: E2E browser automation and regression testing.
- **`ui-ux-pro-max`**: Comprehensive design tokens, palettes, and UX patterns.
- **`frontend-design` & `design-taste-frontend`**: Visual direction and editorial restraint.

---

## 4. Automated Verification & Testing Evidence

### Unit & Integration Test Suite (`npm test`)
- **Total Test Files:** 30 files (100% pass)
- **Total Tests Executed:** 347 tests (100% pass)
- **Execution Time:** ~60s
- **Coverage Areas:** Order calculations, catalog filtering, auth sessions, password recovery, smart listings, fraud scoring, payment security, IDOR protection, admin engines, multi-vendor order isolation, frequently bought together ensemble, first-order coupons, free shipping rules, and database consistency.

### Headless Browser 20-Step Customer Journey (`scripts/verify-20-step-shopping-journey.mjs`)
- **Total Steps Executed:** 20 steps (100% pass, 0 failed)
- **Verified Complete Workflow:** Homepage -> Banner -> Catalog -> Filters -> Typeahead Search -> PDP -> Gallery -> Variants -> Pincode SLA -> Add to Bag -> Cart Drawer -> Paise Recalculation -> Coupon Engine -> Multi-Step Checkout -> Address Selection -> Delivery Tiers -> Payment Modes -> Authoritative DB Order Creation -> Order Confirmation (5-stage stepper) -> Consignment Tracking.

### Headless Browser Marketplace Audit (`scripts/verify-complete-marketplace.mjs`)
- **Total Test Suites:** 12 suites
- **Total Checkpoints Passed:** 27 checkpoints (0 failed)
- **Tested Dimensions:** Desktop (1440x900), Tablet (768x1024), Mobile (375x812)

---

## 5. Current Repository Status & Next Steps

| Workstream | Status | Notes |
| :--- | :--- | :--- |
| **Public Storefront** | **PRODUCTION READY** | All links reconciled, 0 dead ends, luxury aesthetic active across 24 routes |
| **Multi-Vendor Engine** | **VERIFIED** | Multi-vendor order splitting, seller isolation, Blue Dart AWBs, escrow ledger |
| **Backend APIs** | **VERIFIED** | Authoritative calculations, idempotency, rate limiting, and audit logging active |
| **Database** | **HEALTHY** | PostgreSQL 17.10 with 35 Prisma models; zero migration drift |
| **Documentation** | **14 / 14 COMPLETE**| Authoritative specifications created and cross-linked |

### Immediate Next Operations
1. Maintain continuous test execution during feature iterations.
2. Select live payment gateway partner (Razorpay / Stripe / Cashfree) upon platform owner review.
3. Configure live production Meta WhatsApp Cloud API credentials upon business verification.

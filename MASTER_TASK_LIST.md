# NEXU ATELIER — MASTER TASK LIST & DEVELOPMENT ROADMAP

**Document Version:** 2.0.0  
**Last Updated:** November 4, 2026  
**Repository Working Directory:** `D:\Ecommerce Project Real`  
**Current Test Coverage:** 337 / 337 Vitest tests passing (100%)  
**TypeScript Diagnostic Status:** 0 errors  

---

## 1. Executive Roadmap by Phase

### PHASE 1 — Independent Verification
- [x] **Route Audit:** Verify all 31 public customer-facing routes return HTTP 200 OK.
- [x] **404 Routing:** Verify custom luxury 404 page for non-existent paths.
- [x] **Automated Regression Suite:** 100% test pass rate across 27 initial suites (314 tests).
- [x] **Visual Evidence Capture:** High-resolution screenshots of all 3 portals across 6 device viewports.
- [x] **Delivery of Audit Report:** Authored and committed `FINAL_VERIFICATION_REPORT.md`.

### PHASE 2 — Design Improvement & Visual Polish
- [x] **White-First Luxury Standard:** Pure white cards (`#FFFFFF`), gallery canvas (`#F6F7F9`), dark text (`#17191F`), signature NEXU Blue (`#2457C5`).
- [x] **Removal of Artificial Elements:** Eliminated body radial gradients, dark login cards, neon pills, and excessive animations.
- [x] **Typography Hierarchy:** Editorial Playfair serif / Inter sans font pairings with tracking and letter-spacing standards.
- [x] **Responsive Layouts:** Zero horizontal scroll verified on 375px, 430px, 768px, 1366px, 1440px, and 1920px viewports.
- [ ] **Interactive Micro-interactions:** Refine hover states and subtle ease-out page transitions.

### PHASE 3 — Real Customer Marketplace
- [x] **Product Discovery:** Debounced search, category filters, and live PostgreSQL product catalog.
- [x] **Variant Selection Matrix:** Dynamic color swatches, size matrices, and per-SKU inventory validation.
- [x] **Bag & Cart Drawer:** Quantity increments, coupon validation, and multi-currency display (INR, USD, EUR, GBP).
- [x] **Multi-Step Checkout Flow:** Address validation with Indian PIN code verification, delivery tiers, and itemized GST tax cards.
- [x] **Customer Accounts:** Profile management, saved addresses CRUD, order history, and data privacy controls.
- [x] **Order Tracking:** Bidirectional tracking console with 10-milestone lifecycle and return tracking.
- [x] **Customer Reviews & QA:** Verified buyer reviews, rating distribution, helpfulness reactions, and bot honeypot protection.

### PHASE 4 — Real Seller Platform (Supplier Hub)
- [x] **Supplier Onboarding:** Registration application with business details, tax ID, and bank account recording.
- [x] **Catalog & Product Management:** Product draft auto-saving, multi-image upload with magic byte verification, and revision history.
- [x] **Listing Quality Checker:** Real-time 0-100 listing score evaluating title spam, unit consistency, and attribute completeness.
- [x] **Correction Assistant:** Inline curator notes and field rejection guidance for `CHANGES_REQUESTED` products.
- [x] **Fulfillment Queue:** Order line status transitions (NEW -> CONFIRMED -> PROCESSING -> DISPATCHED -> DELIVERED).
- [x] **Packaging Slips:** Printable branded slips with QR codes and return policy details.
- [x] **Seller Financials:** Margin calculator, fee transparency, and escrow settlement history with bank UTRs.

### PHASE 5 — Real Admin Platform (Command Center)
- [x] **Executive Dashboard:** Live metrics for GMV, net revenue, active sellers, order statuses, and low-stock alerts.
- [x] **Seller Governance:** KYB verification toggles, commission rate overrides, and studio suspension controls.
- [x] **Product Moderation:** Multi-image review modal, category attribute inspection, and approve/reject/request-changes actions.
- [x] **Order Operations:** Centralized order status tracking, manual overrides, and item-level shipment tracking.
- [x] **Arbitration & Disputes:** Customer dispute resolution with authorized refund processing and audit logging.
- [x] **Settlement Engine:** Vendor payout release requiring verified 6+ character banking UTR references.
- [x] **White-Label Customizer:** Dynamic database-backed branding, announcements, and policy settings.

### PHASE 6 — Real Integrations & Notifications
- [x] **WhatsApp OTP Primary Verification:**
  - Meta WhatsApp Business Cloud API integration (`whatsappService.ts`) compliant with Graph API v20.0 authentication templates.
  - Secure OTP lifecycle (`otpService.ts`): crypto 6-digit codes, SHA-256 storage hash, 5-minute expiry, 60-second cooldown, 3-attempt lock, 5 hourly requests per phone limit.
  - Dedicated authentication endpoints (`/api/auth/otp/send`, `/api/auth/otp/verify`, `/api/auth/otp/login`).
  - Seamless 1-click passwordless customer authentication via WhatsApp.
- [x] **Complete SMS Deprecation:**
  - Removed all SMS gateway integrations, simulated endpoints, and text references.
  - Removed SMS environment variables. Zero SMS fallback calls exist.
- [x] **Automated Branded Transactional Emails:**
  - 21 responsive luxury HTML email templates (`email-templates.ts`) with plain-text alternatives.
  - Provider driver architecture (`email-adapter.ts`) supporting Resend API and safe masked Console development sink.
  - Complete customer notification coverage (Welcome, Verified, Order Confirmed, Payment Confirmed, Shipped, Delivery, Delivered, Cancelled, Refund, Password Reset, Security Alert).
  - Complete supplier notification coverage (New Order, Status, Approved, Changes Requested, Return Request, Settlement Paid).
  - Complete admin alert coverage (Supplier Application, Platform Alert, Transaction Failure, Dispute Escalation).
- [ ] **Live Gateway Credentials Binding:**
  - Razorpay production keys onboarding (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
  - Meta WhatsApp Business live system user token binding (`WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`).
  - Resend production API key binding (`RESEND_API_KEY`).
  - Shiprocket / Delhivery courier webhook binding (`/api/webhooks/shipping`).

### PHASE 7 — Security & Testing
- [x] **Role-Based Authorization & Isolation:** Server-side role checks (`CUSTOMER`, `SELLER`, `ADMIN`) across all routes and API handlers.
- [x] **Anti-IDOR Protection:** Strict ownership validation on orders, customer addresses, and supplier-isolated data queries.
- [x] **Monetary Precision:** Minor-unit integer paise math eliminating floating-point rounding errors across checkout, taxes, and payouts.
- [x] **Bot & Abuse Prevention:** Invisible honeypot traps on login, registration, contact forms, reviews, and OTP request endpoints.
- [x] **Automated Test Coverage:** 337 / 337 Vitest tests passing with 0 failures across 29 test suites.
- [ ] **Load & Performance Testing:** Lighthouse performance audit on public storefront and stress testing under high concurrency.

### PHASE 8 — Production Deployment
- [ ] **Cloud Database Migration:** Execute `npx prisma migrate deploy` on production managed PostgreSQL instance.
- [ ] **Production Next.js Build:** Execute `npm run build` and verify bundle size optimization.
- [ ] **Background Outbox Runner:** Configure cron or scheduled task to continuously execute `notificationService.processOutboxQueue()`.
- [ ] **Domain & SSL Configuration:** Connect canonical production domain (`https://nexuatelier.com`) with automated SSL.
- [ ] **Health Monitoring:** Bind `/api/health` endpoint to uptime monitoring service (BetterStack / DataDog).

---

## 2. Immediate Next Priority Tasks

1. **Phase 6 Verification:** Test live webhook ingestion endpoints for Razorpay and 3PL courier updates.
2. **Phase 7 Performance:** Run production build benchmark and verify static asset caching.
3. **Phase 8 Pre-flight:** Complete environment variable validation against `DEPLOYMENT_CHECKLIST.md`.

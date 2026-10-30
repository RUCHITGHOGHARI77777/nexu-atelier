# Nexu Atelier — Open-Source Multi-Vendor Marketplace & Public E-Commerce Platform

Nexu Atelier is an enterprise-grade, open-source multi-vendor commerce platform engineered with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, and **Prisma ORM**. It features an architectural clean white gallery design aesthetic, multi-tenant vendor isolation, authoritative server transactions, strict customer privacy boundaries, exact integer minor-unit financial calculations, a multi-vendor seller portal, a super admin operations console, production-ready **Payment Gateway**, **3PL Shipping Logistics**, **Transactional Notifications**, **Financial Reconciliation**, complete **Public Reviews, Ratings, Customer Reactions & Reputation Engine**, and a **Complete End-to-End Public Customer-Facing Experience**.

---

## 🏛️ System Architecture & Entity Relationships

```mermaid
erDiagram
    User ||--o| CustomerProfile : "has"
    User ||--o{ Session : "authenticates"
    User ||--o{ Address : "owns"
    User ||--o{ Order : "places"
    User ||--o{ Cart : "maintains"
    User ||--o| Seller : "operates"
    User ||--o{ ProductReview : "authors"
    User ||--o{ ReviewReaction : "votes"
    User ||--o{ ReviewReport : "reports"
    User ||--o{ SellerFeedback : "rates"

    Category ||--o{ Product : "classifies"
    Seller ||--o{ Product : "crafts"
    Product ||--o{ ProductImage : "displays"
    Product ||--o{ ProductVariant : "offers"
    Product ||--o{ ProductReview : "receives"

    ProductReview ||--o{ ReviewMedia : "attaches"
    ProductReview ||--o{ ReviewReaction : "collects"
    ProductReview ||--o{ ReviewReport : "flags"
    ProductReview ||--o| SellerReviewResponse : "replies"
    ProductReview ||--o{ ReviewModerationEvent : "audits"

    Order ||--o{ OrderItem : "contains"
    Order ||--o{ PaymentRecord : "tracks"
    Order ||--o{ AuditEvent : "logs"
    Order ||--o{ DisputeCase : "arbitrates"
    Order ||--o{ Shipment : "ships_via"
    Order ||--o{ RefundRecord : "refunds"
    Order ||--o| SellerFeedback : "receives"

    OrderItem ||--o| ProductReview : "qualifies_verified"
    OrderItem ||--o| VendorPayout : "generates"
    Seller ||--o{ OrderItem : "fulfills"
    Seller ||--o{ Shipment : "dispatches"
    Seller ||--o{ VendorPayout : "earns"
    Seller ||--o{ SellerReviewResponse : "authors"
    Seller ||--o{ SellerFeedback : "receives"
    Shipment ||--o{ ShipmentTrackingEvent : "tracks"

    WebhookEvent {
        string provider
        string eventId
        string status
    }
```

---

## 🛍️ Public E-Commerce Platform — End-to-End Customer Experience

### 1. Storefront & Discovery
- **Hero & Curated Collections:** Editorial banners, category showcases (Apparel, Footwear, Ceramics, Audio, Decor, Accessories), and featured artisan spotlights.
- **Natural Language Search & Faceted Filter Navigation:** Instant live search across product titles, subtitles, tags, and vendor names. Dynamic multi-criteria filters for category, price boundaries, in-stock availability, and vendor provenance.
- **Product Display Pages (PDP):**
  - High-resolution gallery carousel with thumbnail navigation and zoom modal.
  - Variant selectors (size, color, material) with real-time stock feedback and SKU updates.
  - Transparent pricing breakdowns with base price, MRP strike-through, discount percentage, and GST breakdown.
  - Provenance badges, maker studio biographies, artisan craft specifications, and estimated shipping windows.
  - Structured SEO with **Schema.org `Product` JSON-LD** and OpenGraph social metadata.
  - Dedicated `sitemap.xml` and `robots.txt` generation.

### 2. Customer Identity & Privacy Protection
- **Secure Authentication:** Server-side sessions with bcrypt-hashed passwords and HTTP-only cookie tokens (`nexu_customer_session`).
- **Profile & Address Book:** Comprehensive customer dashboard for managing profile details, multiple shipping addresses with 6-digit Indian PIN code validation, and default address selection.
- **Zero Client Secrets:** No credentials, access tokens, or sensitive user data stored in localStorage.
- **Reviewer Privacy Masking:** Public review author names are strictly masked (e.g. `Vikramaditya R.`) to preserve customer anonymity.

### 3. Server-Authoritative Cart & Multi-Vendor Checkout
- **Server Pricing Authority:** Client-side amounts are strictly ignored. All line-item prices, GST taxes (5% / 12% / 18%), tiered shipping fees (complimentary above ₹2,500), and coupon discounts are calculated in integer paise on the server.
- **Voucher & Coupon Engine:** Supports percentage-based and fixed-amount discounts with minimum order thresholds and maximum discount caps (`NEXUFIRST`, `ATELIER10`, `FESTIVE500`).
- **Idempotent Order Placement:** Checkout submission uses unique idempotency keys to prevent double-charging or duplicate order creation on network retries.
- **Inventory Concurrency Locks:** Atomic inventory decrement on order placement and automatic stock restoration upon pre-dispatch cancellation.

### 4. Orders, Logistics Tracking & After-Sales
- **Live Order Timeline:** Real-time tracking from `PENDING` -> `CONFIRMED` -> `IN_PRODUCTION` -> `DISPATCHED` -> `DELIVERED`.
- **Carrier Tracking:** Integrated 3PL courier tracking (Bluedart, Delhivery) with Air Waybill (AWB) numbers and checkpoint histories.
- **Pre-Dispatch Cancellation:** Customers can cancel unshipped orders directly from their account, triggering automatic inventory release and ledger audit logs.
- **14-Day Patron Protection & Dispute Requests:** Customers can request returns or lodge disputes on delivered items within 14 days directly from the order details page via `/api/orders/[id]/dispute`.

### 5. Transparent Policies & Support Center
- **Policy Pages:**
  - `/policies/shipping`: Logistics timelines, courier tiers, delivery guarantees, and non-serviceable pin code handling.
  - `/policies/privacy`: DPDP Act alignment, data retention boundaries, and customer anonymization protocols.
  - `/policies/terms`: Multi-vendor contract formation, minor-unit pricing rules, and marketplace governance.
  - `/policies/refunds`: 14-day return window, packaging standards, and minor-unit settlement procedures.
- **Customer Support & Knowledge:**
  - `/about`: The Nexu Atelier manifesto, artisan sovereignty, and provenance integrity standards.
  - `/contact`: Interactive concierge inquiry form creating tracked audit tickets (`TKT-XXXXXX`).
  - `/faq`: Searchable accordion covering ordering, shipping, craft authenticity, and returns.
  - `/help`: Customer resolution guides and action shortcuts.
  - `/promotions`: Live marketplace vouchers with 1-click clipboard copy.

---

## 🧭 Public Route Directory

| Route Path | Type | Description |
| :--- | :--- | :--- |
| `/` | Static | Public homepage with hero marquee, featured pieces, and maker showcases |
| `/catalog` | Static | Faceted search catalog with live filtering, category tabs, and sorting |
| `/product/[slug]` | SSG | Detailed Product Display Page with JSON-LD, gallery, reviews, and Craft Q&A |
| `/compare` | Static | Side-by-side product spec comparison table with 1-click cart addition |
| `/cart` | Static | Multi-vendor cart with subtotal breakdown, Saved for Later shelf, and progress bar |
| `/checkout` | Dynamic | Server-authoritative checkout with address selection and coupon entry |
| `/checkout/confirmation` | Static | Post-checkout receipt with order summary and next steps |
| `/account` | Static | Customer overview dashboard (orders, addresses, profile) |
| `/account/orders` | Static | Customer order history with status chips and total amounts |
| `/account/orders/[id]` | Dynamic | Order timeline, courier tracking AWB, cancellations, and disputes |
| `/account/addresses` | Static | Saved address management with PIN code validation |
| `/wishlist` | Static | Saved artisan pieces with 1-click cart addition |
| `/promotions` | Static | Active voucher catalog (`NEXUFIRST`, `ATELIER10`, `FESTIVE500`) |
| `/about` | Static | Atelier philosophy, provenance standards, and artisan collective |
| `/contact` | Static | Concierge contact form and customer support ticket creation |
| `/faq` | Static | Searchable FAQ accordion across logistics, craft, and returns |
| `/help` | Static | Customer Help Center and resolution guides |
| `/policies/shipping` | Static | Shipping logistics, courier partners, and PIN code policies |
| `/policies/cancellation` | Static | Pre-dispatch cancellation rights, stock releases, and refund SLAs |
| `/policies/privacy` | Static | Privacy policy, DPDP Act principles, and anonymization rules |
| `/policies/terms` | Static | Terms of service and multi-vendor marketplace governance |
| `/policies/refunds` | Static | 14-day patron return policy and refund disbursement standards |
| `/sitemap.xml` | Dynamic | Dynamic XML sitemap for search engine indexing |
| `/robots.txt` | Dynamic | Search crawler indexing rules |
| `/login` / `/register` | Static | Secure authentication and customer onboarding |
| `/forgot-password` | Static | Patron access key recovery and password reset dispatch |

### Core Tenets of Phase 6 — Gateway Integrations & Operational Rigor
1. **Provider-Neutral Payment Architecture (`IPaymentAdapter`):** Server-side payment initiation linked strictly to database-calculated order amounts (`order.totalPaise`). Integrates with Razorpay test mode and an offline deterministic sandbox adapter (`SandboxPaymentAdapter`). Verifies cryptographic HMAC SHA-256 signatures (`order_id|payment_id`). Browser-reported payment statuses are never trusted without server-side verification.
2. **Idempotent Webhook Ingress (`WebhookEvent`):** Raw request body HMAC SHA-256 signature verification. Replay attacks and duplicate webhook retries are deduplicated via unique compound keys `(provider, eventId)`. Tolerates out-of-order events and executes atomic payment captures or failure handling within database transactions.
3. **Authorized Refunds & Over-Refund Prevention (`RefundRecord`):** Admin-initiated refunds enforce that total refunds never exceed the order's net captured amount (`order.refundedPaise + amountPaise <= order.totalPaise`). Supports exact minor-unit partial refunds. Generates idempotent negative `PaymentRecord` entries and updates order `paymentStatus` to `REFUNDED` or `PARTIALLY_REFUNDED`.
4. **3PL Logistics & Carrier Shipping Adapter (`IShippingAdapter`):** Decoupled logistics boundary supporting 6-digit Indian PIN code serviceability checks, weight-based tiered shipping quotes, and automated AWB generation. Integrates a deterministic offline adapter (`Simulated3PLAdapter`) and an API contract adapter for Shiprocket (`ShiprocketShippingAdapter`).
5. **Multi-Seller Parcel Fulfillment & Delivery Lifecycle:** Orders spanning multiple artisan studios are partitioned into discrete, seller-specific `Shipment` records. Progression: `PENDING_FULFILLMENT` → `LABEL_CREATED` → `SHIPPED` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED` or `RTO_INITIATED` / `RTO_DELIVERED`. Clients cannot mark orders delivered; terminal states are protected against backward jumps.
6. **Transactional Notification Boundary (Outbox Engine):** Event-driven notification system recording `NotificationEvent` entries in PostgreSQL within business transactions. Deduplicates events via unique idempotency keys. Features formatted email templates for order confirmation, payment receipts, dispatch alerts with AWB tracking, out-for-delivery, delivery confirmation, and refund notices.
7. **Authoritative Financial Ledger & Discrepancy Reconciliation:** Scans internal orders, captured payment records, and provider settlements. Discrepancies (missing payments, amount mismatches, unrecorded refunds) are flagged in `FinancialReconciliation` audit reports for investigation without silent balance mutation.

### Core Tenets of Phase 7 — Public Reviews, Ratings, Customer Reactions & Seller Reputation
1. **Verified Purchase Qualification (`isVerifiedPurchase`):** Reviews are automatically correlated with completed, delivered `OrderItem` records where `order.customerId === user.id`. Strictly derived server-side—never falsified. Unverified customer reviews are explicitly designated without verified seals.
2. **One-Review-Per-Purchase Constraint:** Each purchased `OrderItem` can receive at most one review, enforced via unique compound constraints (`@@unique([productId, customerId, orderItemId])`).
3. **Self-Review Prevention (Vendor Exclusion):** Sellers are strictly prohibited from reviewing products in their own catalog (`product.vendorId !== seller.id`).
4. **Variant Snapshot Attribution:** Product reviews belong to the parent `Product` entity but retain a permanent snapshot of the variant purchased (`variantSku`, `variantName`), displayed on review cards.
5. **Privacy-Preserving Reviewer Masking:** Public APIs mask customer names into `First Name + Initial` (e.g. `Aarav M.`). Email addresses, telephone numbers, and street addresses are omitted from public review payloads.
6. **Customer Reactions with Deduplication:** Patrons can vote "Helpful" or "Unhelpful". Compound unique indices (`@@unique([reviewId, userId])`) guarantee 1 vote per customer with toggle-off and switch-vote mechanics. Authors are barred from voting on their own submissions.
7. **Official Seller Responses:** Verified product owners can author an official response to any review on their items (`SellerReviewResponse`). Unrelated sellers are rejected with 403 Forbidden.
8. **Abuse Reporting & Auto-Flagging:** Reviews receiving 3 or more reports with documented reason codes (`SPAM_OR_ADVERTISEMENT`, `HARASSMENT_OR_ABUSE`, etc.) are auto-transitioned to `REPORTED` status for admin adjudication.
9. **Strict Content Moderation Policy:** Critical reviews expressing dissatisfaction with fit, fabric, or shipping delays are legally protected and never removed for low ratings. Removals are exclusively restricted to objective policy violations (spam, hate speech, PII leaks). Every moderation action records an append-only `ReviewModerationEvent`.
10. **Dual-Dimension Seller Reputation:** Product craftsmanship ratings are strictly separated from seller service feedback (`SellerFeedback`). Scorecards track On-Time Dispatch Rate (OTDR), packaging care, delivery speed, customer communication, and response rate.

---

## 🧭 Routes & REST APIs

### Backend API Endpoints (Phase 7 Additions)
| Method | Endpoint | Description | Auth & Security |
|---|---|---|---|
| `GET` | `/api/products/[slug]/reviews` | Public reviews with star distribution, filters, sorting, and pagination | Public (Optional Session) |
| `POST` | `/api/products/[slug]/reviews` | Submits customer review with verified order verification | Authenticated Customer |
| `PUT` | `/api/reviews/[id]` | Updates authored review text/rating with edit flag | Authenticated Author |
| `POST` | `/api/reviews/[id]/reactions` | Toggles or switches helpful/unhelpful reaction vote | Authenticated Customer |
| `POST` | `/api/reviews/[id]/reports` | Flags review for moderation with policy reason code | Authenticated Customer |
| `POST` | `/api/seller/reviews/[id]/response` | Authors official seller reply to a product review | `SELLER` (Product Vendor) |
| `GET` | `/api/seller/reputation` | Seller scorecard, fulfillment metrics, and review feed | `SELLER` Role |
| `POST` | `/api/seller/feedback` | Submits order delivery feedback (packaging, delivery, comm.) | Authenticated Customer |
| `GET` | `/api/admin/reviews` | Review moderation queue for reported/flagged reviews | `ADMIN` Role |
| `PATCH` | `/api/admin/reviews/[id]/moderate` | Approves or removes reported review with audit logging | `ADMIN` Role |

### Backend API Endpoints (Phase 6 Additions)
| Method | Endpoint | Description | Auth & Security |
|---|---|---|---|
| `POST` | `/api/checkout/initiate-payment` | Initiates server-calculated payment order via active adapter | Authenticated Customer |
| `POST` | `/api/checkout/verify-payment` | Verifies cryptographic signature & captures payment atomically | Authenticated Customer |
| `POST` | `/api/webhooks/razorpay` | Ingests Razorpay webhook events with HMAC signature validation | Public (Webhook Signature) |
| `POST` | `/api/webhooks/shipping` | Ingests 3PL logistics tracking events with signature validation | Public (Webhook Signature) |
| `POST` | `/api/admin/refunds` | Authorizes exact minor-unit refund through payment adapter | `ADMIN` Role |
| `GET` | `/api/admin/refunds` | Retrieves itemized refund history for an order | `ADMIN` Role |
| `GET` | `/api/admin/reconciliation` | Retrieves historical reconciliation audit reports | `ADMIN` Role |
| `POST` | `/api/admin/reconciliation` | Executes live ledger reconciliation audit against provider records | `ADMIN` Role |
| `POST` | `/api/seller/orders/[id]/shipment` | Generates 3PL parcel shipment, assigns AWB, prints label | `SELLER` (Studio Owner) |

### Super Admin Console (`/admin/*`)
| Route | Purpose & Implementation |
|---|---|
| `/admin/reviews` | **Trust & Safety Community Moderation:** Moderation queue for flagged reviews with policy violation codes, reporter evidence inspection, and critical review protection. |
| `/admin/finances` | **Marketplace Treasury & Reconciliation Auditor:** Live GMV, platform fees, escrow reserves, settled payouts, and an on-demand **Reconciliation Audit Panel** detecting ledger discrepancies. |
| `/admin` | **Platform Operations Dashboard:** Live GMV, revenue, orders funnel, seller moderation pipeline, dispute status cards. |
| `/admin/sellers` | **Artisan Studio Directory & Governance:** Tabbed status filters (`PENDING`, `APPROVED`, etc.), approval and suspension with mandatory audit notes. |
| `/admin/products` | **Catalog Moderation Queue:** Editorial feedback, draft inspection, storefront preview links. |
| `/admin/orders` | **Global Order Operations:** Multi-vendor line inspection, parcel timelines, and administrative cancellations. |
| `/admin/disputes` | **Dispute Arbitration:** Return dispute evidence inspection and escrow refund authorization. |
| `/admin/coupons` | **Promotional Coupon Engine:** Percentage and fixed INR vouchers with minimum spend and caps. |
| `/admin/users` | **User Directory & RBAC:** Role switching (`CUSTOMER`, `SELLER`, `ADMIN`) with self-demotion prevention. |
| `/admin/audit-logs` | **Security Audit Trail:** Filterable append-only stream of administrative actions. |
| `/admin/settings` | **Platform Policy Configuration:** Dynamic commissions, free shipping thresholds, return windows. |

### Seller Portal (`/seller/*`)
| Route | Purpose & Implementation |
|---|---|
| `/seller/reputation` | **Artisan Reputation & Sentiment Dashboard:** Product rating averages, On-Time Dispatch Rate (OTDR), packaging and delivery satisfaction scores, review feed, and official seller response authoring. |
| `/seller` | **Studio Dashboard:** Live revenue, pending shipments, inventory alert banners, and studio health scorecard. |
| `/seller/products` | **Catalog & Pieces:** SKU management, stock levels, variant configurations, and piece archiving. |
| `/seller/inventory` | **Stock & Inventory:** Inline batch inventory editor and safe CSV bulk stock import. |
| `/seller/orders` | **Order Fulfillment:** Discrete item fulfillment lines, 3PL shipment label generation, and dispatch tracking. |
| `/seller/payouts` | **Payouts & Finance:** Escrow hold breakdown, fee accounting, and bank disbursement history. |

---

## 🔐 Pre-Seeded Accounts for Evaluation

| Email | Password | Role / Account Details | Evaluation Purpose |
|---|---|---|---|
| `admin@nexu.studio` | `AdminPass123!` | `ADMIN` (Devika Patel — Marketplace Director) | Full administrative access, review moderation queue, treasury reconciliation |
| `solstice@nexu.studio` | `Password123!` | `SELLER` (Solstice Loom Studio) | Approved seller: catalog, review responses, reputation scorecard, shipments |
| `voxel@nexu.studio` | `Password123!` | `SELLER` (Voxel Audio Laboratories) | Approved seller: secondary vendor testing multi-tenant isolation |
| `pending.artisan@nexu.studio` | `Password123!` | `SELLER` (Kutch Heritage Embroideries) | Pending seller: evaluate admin onboarding approval queue |
| `patron@nexu.studio` | `Password123!` | `CUSTOMER` (Aarav Mehta) | Default patron: reviews, reactions, order feedback, payment initiation |

---

## 🧪 Automated Testing & Verification (151 Tests Across 15 Suites)

The test suite runs **151 tests across 15 test suites** with Vitest:

- **`customer-journey.test.ts` (15 tests):**
  - Natural language catalog keyword search and category filtering.
  - Price sorting, stock availability filtering, and product variant selection.
  - Cart totals, GST calculations, and tiered free shipping thresholds (complimentary > ₹2,500).
  - Promotional coupon validation (`NEXUFIRST` 15% with cap, minimum order threshold rejection).
  - Customer address book CRUD and 6-digit Indian PIN code verification.
  - Server-authoritative checkout, coupon discount deduction, and atomic inventory decrement.
  - Customer order isolation (preventing unauthorized cross-user order access).
  - Pre-dispatch order cancellation with automated inventory restoration.
  - Post-delivery return/dispute case creation (`/api/orders/[id]/dispute`) within 14-day policy.
  - Verified buyer review qualification (only delivered items eligible for verified badge).
  - Review author privacy masking (`First Name + Last Initial`).
  - Single review per purchase enforcement and duplicate review prevention.
  - Insufficient stock and catalog exhaustion rejection during checkout.
  - Genuine 3PL shipment and AWB tracking checkpoint retrieval.
  - Transactional notification queueing on account access recovery requests.
- **`review-service.test.ts` (16 tests):**
  - Verified purchase qualification tied to delivered order items (`isVerifiedPurchase: true`).
  - Privacy-preserving reviewer name masking (`First Name + Initial`).
  - One-review-per-purchase constraint (`409 Conflict` on duplicate attempts).
  - Self-review prevention: Vendors barred from reviewing their own products (`403 Forbidden`).
  - Star rating boundary validation (rejects `< 1` or `> 5`).
  - Customer reaction voting (`HELPFUL` / `UNHELPFUL`) with 1-vote-per-user deduplication.
  - Reaction toggling off and switching votes.
  - Review author self-voting prevention.
  - Official seller response authoring restricted to verified product vendor.
  - Unauthorized third-party seller response rejection (`403 Forbidden`).
  - Abuse reporting with documented reason codes and threshold auto-flagging (`3+` reports).
  - Reporter self-reporting prevention and duplicate report rejection.
  - Admin content moderation: Approval, removal with aggregate rating recalculation, and reinstatement.
  - Comprehensive seller scorecard computation: Product rating average, OTDR, packaging, delivery, and response rate.
- **`payment-integration.test.ts` (9 tests):**
  - Cryptographic HMAC SHA-256 signature verification and atomic payment capture.
  - Server-authoritative payment order amount verification (client tampering rejection).
  - Tampered/invalid signature rejection.
  - Webhook signature validation and payment captured event processing.
  - Webhook replay protection and duplicate event deduplication.
  - Forged webhook signature rejection.
  - Partial refund execution through payment adapter.
  - Over-refund and double-refund prevention beyond order balance.
  - Idempotent refund request handling.
- **`shipping-notifications.test.ts` (8 tests):**
  - 6-digit Indian PIN code serviceability check and format validation.
  - Tiered weight-based shipping rate quote calculations.
  - Discrete multi-seller parcel shipment creation with AWB assignment.
  - Delivery lifecycle progression (`SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`).
  - Terminal state protection (preventing backward transitions).
  - Return-to-origin (RTO) courier failure handling and audit logging.
  - Outbox notification queueing, template rendering, and deduplication.
  - Automated financial ledger reconciliation audit and discrepancy detection.
- **`admin-service.test.ts` (14 tests):** Authorization, self-demotion immunity, real-time GMV, seller approvals/suspensions, catalog moderation, admin order cancellation, coupons, disputes.
- **`seller-service.test.ts` (21 tests):** Multi-tenant IDOR isolation, approval gating, SKU/inventory validation, batch updates, safe CSV import, fulfillment progression, integer minor-unit payouts.
- **`order-service.test.ts` (8 tests):** Authoritative database pricing, stock limits, tiered courier fees, idempotency key deduplication, customer isolation, cancellation rules.
- **`database-integrity.test.ts` (4 tests):** Atomic inventory decrement/restore, historical snapshot immutability, zero-drift minor units, structured audit events.
- **`product-repository.test.ts` (7 tests):** Database catalog queries, search, category filters, price clamping, sorting, variants, 404 handling.
- **`auth-service.test.ts` (8 tests):** User registration, duplicate email rejection, PBKDF2 hash verification, session token issuance, expiry, logout.
- **`address-repository.test.ts` (6 tests):** Input validation, CRUD, default address switching, customer isolation.
- **`cart-calculations.test.ts` (7 tests):** Quantity clamping, subtotal calculation, free shipping thresholds, multi-vendor parcel grouping.
- **`catalog-filters.test.ts` (9 tests):** Keyword search, category filtering, price clamping, availability toggle, deterministic sorting.

Run tests anytime:
```bash
npm test
```

---

## 🛠️ Database Setup & Development Guide

### Prerequisites
- Node.js `v18.17.0` or later (tested on Node v24 LTS)
- PostgreSQL 14+ running locally or remotely (tested on PostgreSQL 17.10)
- npm `v9.0.0` or later

### Environment Configuration (`.env`)
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MARKETPLACE_NAME="Nexu Atelier & Marketplace"
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# PostgreSQL Database Connection String
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nexu_ecommerce?schema=public"

# Authentication Cookie
AUTH_COOKIE_NAME=nexu_customer_session
AUTH_SESSION_TTL_DAYS=7

# Phase 6 Payment Gateway (Razorpay Sandbox / Test Mode)
PAYMENT_PROVIDER=SANDBOX
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=placeholder
RAZORPAY_WEBHOOK_SECRET=placeholder_webhook_secret

# Phase 6 3PL Shipping & Logistics (Shiprocket Sandbox)
SHIPPING_PROVIDER=SIMULATED_3PL
SHIPROCKET_EMAIL=logistics@nexu.studio
SHIPROCKET_PASSWORD=placeholder_password
SHIPROCKET_WEBHOOK_TOKEN=placeholder_token
SHIPPING_WEBHOOK_SECRET=simulated_shipping_secret_2026

# Phase 6 Transactional Notifications (Outbox Engine)
NOTIFICATION_PROVIDER=CONSOLE
```

### Commands
```bash
# 1. Apply versioned migrations to PostgreSQL
npx prisma migrate dev

# 2. Seed catalog, demo patrons, sellers, coupons, disputes, and settings
npm run db:seed

# 3. Run automated test suite (151 tests across 15 suites)
npm test

# 4. Check ESLint conformance
npm run lint

# 5. Build production bundle (80 static & dynamic routes)
npm run build

# 6. Start local development server
npm run dev
```

---

## 🚀 Recommended Phase 8: Advanced Search, Semantic Recommendations & Real-Time Presence

With Phase 7 establishing the database-backed Public Reviews, Verified Ratings, Customer Reactions, and Dual-Dimension Seller Reputation Engine, the platform is prepared for **Phase 8**:
1. **Semantic Vector Search & Natural Language Catalog Discovery:** Integrated embeddings for visual and textual likeness queries across artisan collections.
2. **Real-Time Studio Inventory & Drops Notifications:** WebSocket / SSE streaming for limited artisan drops and high-concurrency reservation locks.
3. **Automated Return-To-Origin (RTO) Predictive Modeling:** Machine learning scoring on high-risk cash-on-delivery shipments to prevent carrier returns.

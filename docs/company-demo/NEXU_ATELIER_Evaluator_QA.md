# NEXU ATELIER — Evaluator Q&A and Due Diligence Guide

This document provides transparent, technically verified answers to anticipated questions from external technical auditors, investors, and company evaluation committees.

---

### Q1: What makes NEXU ATELIER different from existing e-commerce platforms?
**Answer:**  
Most e-commerce solutions force an either-or choice:
1. **Single-Storefront Platforms (Shopify, WooCommerce):** Each artisan or workshop operates in a silo. Customers cannot buy across makers without checking out multiple times, managing multiple deliveries, and creating multiple accounts.
2. **Generic Mega-Marketplaces (Amazon, Flipkart):** These treat handcrafted luxury textiles and precision design as interchangeable commodities, taking aggressive 25–35% take rates, hiding maker origins, and subjecting studios to predatory algorithmic price wars.

**NEXU ATELIER** delivers a curated multi-vendor luxury architecture. It combines a single-basket unified customer checkout with strict, tenant-isolated supplier workspaces, statutory Indian GST compliance (Notification 13/2025-Central Tax), and fair 8–12% take rates designed to preserve artisan margins and brand identity.

---

### Q2: How does multi-vendor order management actually work behind the scenes?
**Answer:**  
When a customer submits a cart containing items from multiple studios (e.g. Studio A in Jaipur and Studio B in Kashmir):
1. **Single Atomic ACID Transaction:** The backend executes `prisma.$transaction`.
2. **Concurrent Inventory Decrement:** Stock is verified and atomically decremented for each product variant. If any item is out of stock, the entire transaction rolls back.
3. **Parent Order Creation:** A single parent order record is created (`Order` with ID `ORD-2026-XXXX`).
4. **Suborder Line Splitting:** Line items are created in `OrderItem` with explicit `vendorId` bindings (`vendorId: sellerA.id` and `vendorId: sellerB.id`).
5. **Discrete Shipment Creation:** A distinct `Shipment` record is created for each unique vendor involved, complete with individual carrier allocation, dispatch deadlines, and AWB tracking records.
6. **Supplier Workspace Isolation:** When Studio A logs in, `sellerService.getSellerOrderLines` queries `where: { vendorId: sellerA.id }`. Studio A never sees Studio B's items, pricing, or customer data.

---

### Q3: How do suppliers earn money, and what is their payout lifecycle?
**Answer:**  
Suppliers receive escrow-backed settlements based on net sales:
1. **Gross Customer Payment:** The customer pays the retail price inclusive of applicable GST.
2. **Platform Escrow Hold:** Funds are marked `ESCROW_HOLD` upon order placement or `CAPTURED` upon digital gateway authorization.
3. **Deductions:** The platform deducts:
   - Platform commission (typically 8–12% of the taxable base).
   - Payment gateway fee (2% of the customer gross payment).
   - Seller-borne outward shipping (if configured as seller-paid).
4. **Payout Eligibility:** Once the studio marks the item `DELIVERED` (or the statutory return window expires without dispute), funds transition to `ELIGIBLE` and can be settled directly to the artisan's verified bank account via automated NEFT/RTGS ledger.

---

### Q4: How is marketplace commission calculated under Indian GST laws?
**Answer:**  
Under the Central Goods and Services Tax (CGST) Act Section 15 and Indian retail standards:
1. **Customer Retail MRP** is inclusive of 12% GST for handloom and artisan apparel (> ₹1,000).
2. **Taxable Base** is derived from gross price minus coupon discounts:
   $$\text{Taxable Value} = \frac{\text{Gross Selling Price}}{1 + \text{Tax Rate}}$$
3. **Marketplace Commission** is computed strictly on the **taxable base**, not on the tax component.
4. **Payment Gateway Processing Fee (2%)** is calculated on the total gross transaction value paid by the customer.
5. All calculations are executed in **integer paise** ($1\text{ INR} = 100\text{ paise}$) using `Math.round` to eliminate floating-point rounding errors.

---

### Q5: How are payments secured, and how is client fraud prevented?
**Answer:**  
1. **Zero Client Trust:** The server never trusts client-submitted amounts, payment statuses, or currencies. When `/api/payments/verify` is called, the order amount is retrieved directly from `order.totalPaise` in PostgreSQL.
2. **Cryptographic HMAC Signatures:** For Razorpay, the signature is computed via:
   $$\text{HMAC-SHA256}(\text{razorpay\_order\_id} + "|" + \text{razorpay\_payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
   and verified using constant-time comparison (`crypto.timingSafeEqual`).
3. **Session Ownership Enforcement:** An authenticated customer can only verify payments for orders where `order.customerId === sessionUser.id`.
4. **Duplicate Capture Prevention:** Payment records are locked using database idempotency keys. Replay requests return previous capture data without triggering duplicate payouts.
5. **Demo Payment Gate:** In sandbox/demo mode, payment records are tagged `DEMO_EXCLUDED` and prohibited from creating real vendor payouts.

---

### Q6: How is customer personal data and privacy protected?
**Answer:**  
1. **HTTP-Only Session Cookies:** Authentication uses cryptographically random 32-byte tokens stored in `HttpOnly`, `SameSite=lax`, `Secure` cookies (`nexu_customer_session`). Client-side JavaScript cannot read or extract session tokens.
2. **Password Hashing:** Passwords are hashed using PBKDF2-HMAC-SHA512 with a unique 16-byte cryptographic salt and 210,000 iterations (OWASP recommendation).
3. **Anti-IDOR Access Control:** Endpoints querying `/api/orders/[id]` enforce customer session matches. Attackers guessing sequential or random order IDs receive `403 Forbidden` or `404 Not Found`.
4. **Redacted Supplier Views:** Suppliers receive only delivery addresses necessary for physical package dispatch. They cannot access customer payment instruments or global profile histories.

---

### Q7: What happens when an order contains products from multiple suppliers?
**Answer:**  
The customer experiences a single checkout and receives a single primary Order ID (`ORD-2026-XXXX`). Behind the scenes:
- Each supplier receives a discrete notification for only their portion of the order.
- Each supplier ships independently from their own workshop location (e.g. Blue Dart package from Jaipur; Delhivery package from Srinagar).
- The customer's order tracking page displays a multi-package accordion where each shipment has its own carrier name, AWB tracking link, and dispatch status.

---

### Q8: How are returns and eligible refunds handled?
**Answer:**  
1. **Line-Item Return Requests:** A customer can initiate a return on a specific item within the eligible window (e.g. 7 days post-delivery) via `/account/returns`.
2. **Supplier Review:** The assigned supplier inspects the return reason and photographic proof in their portal.
3. **Atomic Restocking:** When a return is approved and received, the item's quantity is atomically added back to the product variant stock in PostgreSQL.
4. **Refund Ledger:** The platform issues a refund record in `PaymentRecord` with status `REFUNDED`. Payouts to the supplier for that specific item are cancelled or debited from pending escrow balances.

---

### Q9: Which integrations are genuinely live, and which are simulated?
**Answer (Honest Technical Disclosure):**
- **LIVE:**
  - **PostgreSQL 17 Database:** Active, persistent connection handling all relational data, foreign keys, and transactions.
  - **Next.js 14 Application Engine:** Live server rendering 105 pages with client-side hydration.
  - **Authentication & RBAC:** Live PBKDF2 password authentication and session cookie rotation.
  - **Multi-Vendor Order & Costing Engine:** Live mathematical and database execution.
- **SIMULATED (DEMO MODE):**
  - **Razorpay Payments:** Authorizes transactions via server-authoritative mock/sandbox with cryptographic signature logic. Live production requires dropping real `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` into `.env`.
  - **WhatsApp OTP Engine:** Real database-backed OTP lifecycle (10-minute expiry, attempt tracking) logged to server console and on-screen simulator. Live traffic requires Meta Cloud API credentials.
  - **Transactional Email:** Fully formatted HTML templates logged to server outbox sink with byte sizing. Live delivery requires SMTP credentials (SendGrid / AWS SES).
  - **3PL Logistics:** Real shipment and tracking event models populated with simulated Blue Dart tracking numbers. Live carrier integration requires Shiprocket/Delhivery API keys.

---

### Q10: How will the platform scale to thousands of suppliers and millions of users?
**Answer:**  
1. **Stateless App Tier:** Next.js runs as a stateless containerized service on AWS ECS / Vercel Pro, horizontally scalable behind an Application Load Balancer.
2. **Database Optimization:** PostgreSQL tables feature compound B-Tree indexes on high-frequency query paths (`vendorId + fulfillmentStatus`, `customerId + createdAt`, `slug + isPublished`).
3. **Read Replicas & Connection Pooling:** Prisma accelerates database throughput using PgBouncer connection pooling and dedicated read replicas for public storefront traffic.
4. **Edge CDN Caching:** Static assets, category catalogs, and media are cached globally via Cloudflare CDN or AWS CloudFront with stale-while-revalidate headers.

---

### Q11: What remains to be done before public commercial launch?
**Answer:**  
The core software architecture is complete and audited. Before launching public commercial marketing:
1. **Third-Party Commercial Credentials:**
   - Activate live Razorpay merchant account and insert production keys.
   - Complete Meta Business Manager verification for WhatsApp Cloud API.
   - Configure AWS SES or SendGrid production SMTP domain DNS records (SPF, DKIM, DMARC).
   - Enter commercial Shiprocket corporate API credentials.
2. **Production Hosting Infrastructure:**
   - Deploy database to managed AWS RDS PostgreSQL 17 with automated multi-AZ failover and daily automated snapshots.
   - Set up Cloudflare Enterprise or Pro plan for DDoS mitigation, WAF rules, and SSL termination.

---

### Q12: What are the current technical limitations?
**Answer:**  
1. **Simulated Couriers:** Parcel status updates currently advance programmatically or via manual supplier dashboard input rather than real-time GPS courier webhooks.
2. **Single Currency Base:** All database calculations are pinned to Indian Rupee paise (`INR`). Multi-currency display is supported on the frontend, but bank settlements require INR bank accounts.
3. **Image Storage:** Product images currently reference high-resolution Unsplash CDNs and local assets; enterprise S3 bucket integration is ready in code but requires AWS IAM credentials.


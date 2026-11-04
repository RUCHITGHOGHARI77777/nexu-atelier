# NEXU ATELIER — EXTERNAL INTEGRATIONS DIRECTORY
**Standard:** Honest Classification (Zero-Simulation Misrepresentation)  
**Permitted Statuses:** `Implemented` | `Demo only` | `Configured` | `Live verified` | `Requires credentials` | `Not implemented`  
**Date:** November 5, 2026  

---

## 1. INTEGRATION STATUS MASTER DIRECTORY

| External Integration | Target Provider | Codebase Adapter | Current Mode | Production Readiness Status | Required Owner Secret |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Online Payment Gateway** | **Razorpay** | `src/lib/server/payment-service.ts` | **Demo only** | `Requires credentials` | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| **Cash on Delivery (COD)** | **Internal Engine** | `src/lib/server/fraud-service.ts` | **Live verified** | `Implemented` | None. Configurable limits active. |
| **Customer Auth OTP** | **WhatsApp Cloud API** | `src/lib/server/whatsapp-service.ts` | **Demo only** | `Requires credentials` | Meta System User Token & Phone Number ID |
| **SMS OTP Gateway** | *Eliminated* | *Removed* | *Removed* | `Not implemented (By Design)`| None. Deprecated to save costs. |
| **Transactional Email** | **Resend / AWS SES** | `src/lib/server/email-service.ts` | **Demo only** | `Requires credentials` | `RESEND_API_KEY` or SMTP credentials |
| **3PL Courier Tracking** | **Shiprocket / Delhivery**| `src/lib/server/shipping-service.ts` | **Demo only** | `Requires credentials` | Shiprocket API Client Token |
| **Media / Image Storage** | **AWS S3 / Cloudinary** | `src/app/api/upload/image/route.ts` | **Configured (Local)**| `Requires credentials` | S3 Bucket Credentials or Cloudinary URL |
| **Statutory Tax (GST/HSN)**| **Official CBIC** | `src/lib/tax-hsn-directory.ts` | **Live verified** | `Implemented` | None. Legal schedules hardcoded. |
| **Primary Relational DB** | **PostgreSQL 17** | `prisma/schema.prisma` | **Live verified** | `Implemented` | Production `DATABASE_URL` (SSL required) |

---

## 2. HOW DEMO SERVICES OPERATE TODAY

Every simulated service operates on **real internal business logic backed by PostgreSQL**:

1. **Razorpay Demo Mode:**
   - Triggers full database order creation.
   - Generates simulated transaction IDs (`DEMO-UTR-XXXXXXXXXXXX`).
   - Marks orders as `ESCROW_HOLD` or `CAPTURED`.
   - Invoices and emails explicitly badge payments as **DEMO TEST TRANSACTION**.
2. **WhatsApp Cloud API Simulator:**
   - Generates real 6-digit cryptographically random OTPs (`crypto.randomInt`).
   - Writes message event to `NotificationEvent` table using the Transactional Outbox pattern.
   - Displays real-time OTP notification on the floating on-screen phone widget (`FloatingPhoneSimulator.tsx`) so testers can complete sign-in without waiting for SMS.
3. **3PL Courier Lifecycle Simulation:**
   - Allocates unique tracking AWBs (e.g. `BD-AIR-173000...`).
   - Simulates shipment transitions: `MANIFEST_CREATED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `DELIVERED`.
   - Allows testing of RTO (Return to Origin) and automated customer refund triggers.


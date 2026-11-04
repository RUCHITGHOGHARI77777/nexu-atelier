# NEXU ATELIER — INTEGRATION STATUS & CREDENTIALS AUDIT
**Environment:** Staging / Production Readiness  
**Evaluation Standard:** Zero-Simulation Misrepresentation (Actual vs Simulated)  
**Status Date:** November 5, 2026  

---

## 1. INTEGRATION MASTER MATRIX

| Service / Integration | Implemented | Configured | Tested | Live Verified | Production Status | Owner Action Required |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **Razorpay Payment Gateway** | ✅ Yes | ⚠️ Sandbox | ✅ Yes | ❌ No | **DEMO / TEST MODE** | Provide Live `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` |
| **Cash on Delivery (COD)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | **ACTIVE (Local Engine)** | None. Configurable COD limit & risk threshold active. |
| **WhatsApp Cloud API (Meta)** | ✅ Yes | ⚠️ Simulator | ✅ Yes | ❌ No | **SIMULATED SINK** | Provide Meta Business Bearer Token & Phone Number ID |
| **Transactional Email Outbox** | ✅ Yes | ⚠️ Local Outbox | ✅ Yes | ❌ No | **LOCAL SINK QUEUE** | Provide `RESEND_API_KEY` or AWS SES SMTP credentials |
| **3PL Courier Logistics** | ✅ Yes | ⚠️ Internal AWB | ✅ Yes | ❌ No | **SIMULATED CARRIER** | Provide Shiprocket / Delhivery API client credentials |
| **Media / Image Uploads** | ✅ Yes | ✅ Local Storage | ✅ Yes | ⚠️ Partial | **LOCAL UPLOADS ACTIVE** | Provide Cloudinary URL or AWS S3 Bucket for CDN scale |
| **Statutory GST & HSN Engine** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | **OFFICIAL SCHEDULE LIVE**| None. Notification 13/2025-Central Tax hardcoded. |
| **PostgreSQL Database** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | **LOCAL POSTGRESQL 17 LIVE**| Map production PostgreSQL URL for cloud deployment. |

---

## 2. DETAILED SERVICE AUDIT & TRANSPARENCY

### A. Razorpay Payment Gateway
* **Implementation Status:** Implemented in `src/lib/server/payment-service.ts` and `src/app/api/webhooks/razorpay/route.ts`.
* **Current Mode:** **DEMO / SANDBOX MODE**.
* **Behavior:**
  - In demo mode, customer is shown a clear **"DEMO TRANSACTION"** notice.
  - Transactions generate a mock UTR (`DEMO-UTR-XXXXXXXXXXXX`) stored with status `CAPTURED` in `PaymentRecord`.
  - Webhook endpoint verifies HMAC-SHA256 signatures when `RAZORPAY_WEBHOOK_SECRET` is populated.
* **Live Verification Requirement:**
  - Owner must register a Razorpay merchant account, complete KYC, and inject production keys into `.env`:
    ```env
    RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
    RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
    RAZORPAY_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"
    ```

### B. WhatsApp Cloud API (Meta Business)
* **Implementation Status:** Implemented in `src/lib/server/whatsapp-service.ts` and `src/app/api/auth/otp/send/route.ts`.
* **Current Mode:** **SIMULATOR & DATABASE OUTBOX SINK**.
* **Behavior:**
  - Generates 6-digit cryptographically secure OTPs (`crypto.randomInt`).
  - Logs template payloads (`nexu_auth_code`, `en_US`) to test console and database table `NotificationEvent`.
  - Floats on-screen demo simulator (`FloatingPhoneSimulator.tsx`) so testers can copy the OTP instantly.
* **Live Verification Requirement:**
  - Requires approved WhatsApp Business Account (WABA), verified phone number, and template registration with Meta:
    ```env
    WHATSAPP_API_TOKEN="EAAXxxxxxxxxxxxxxxxxxxxx"
    WHATSAPP_PHONE_NUMBER_ID="xxxxxxxxxxxxxxx"
    WHATSAPP_BUSINESS_ACCOUNT_ID="xxxxxxxxxxxxxxx"
    ```

### C. Transactional Email System
* **Implementation Status:** Implemented in `src/lib/server/email-service.ts` with branded luxury HTML templates for order confirmation, dispatch, delivery, and supplier allocation.
* **Current Mode:** **LOCAL OUTBOX SINK QUEUE**.
* **Behavior:**
  - All email notifications are inserted into `NotificationEvent` table using the **Transactional Outbox Pattern**.
  - Emits console logs: `[Email Outbox Sink] To: p***@nexu.studio | Subject: ... | Bytes: 5835`.
  - No external emails leave the machine until an external SMTP/API provider is linked.
* **Live Verification Requirement:**
  - Provide Resend API key or AWS SES credentials:
    ```env
    RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
    # OR
    SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
    SMTP_PORT=587
    SMTP_USER="AKIAxxxxxxxx"
    SMTP_PASSWORD="xxxxxxxxxxxxxxxxxxxx"
    ```

### D. 3PL Courier Logistics (Bluedart, Delhivery, Shiprocket)
* **Implementation Status:** Implemented in `src/lib/server/shipping-service.ts` with discrete seller item splitting, unique AWB generation, delivery milestones, and RTO (Return to Origin) handling.
* **Current Mode:** **INTERNAL AWB LIFECYCLE SIMULATION**.
* **Behavior:**
  - Assigns unique tracking numbers (e.g. `BD-AIR-1730000000-xxxx`).
  - Progresses orders from `MANIFEST_CREATED` -> `PICKED_UP` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
  - Full tracking history accessible on `/track-order` and `/account/orders`.
* **Live Verification Requirement:**
  - Link live Shiprocket or Delhivery merchant API credentials for automatic courier pickup scheduling and real-time GPS tracking.

### E. Media & Product Image Storage
* **Implementation Status:** Implemented in `src/app/api/upload/image/route.ts` with MIME-type validation, size limits (max 5MB), and auto-generated UUID filenames.
* **Current Mode:** **LOCAL FILE SYSTEM STORAGE (`/public/uploads`)**.
* **Behavior:**
  - Files are written to disk under `public/uploads/` and served directly by Next.js static asset server.
  - Base64 data URI fallback supported for preview steps in the Supplier Product Wizard.
* **Production Recommendation:**
  - For serverless (e.g. Vercel / AWS Lambda), local file storage is ephemeral. Cloudflare R2, AWS S3, or Cloudinary should be plugged in for permanent media CDN:
    ```env
    AWS_S3_BUCKET="nexu-atelier-media"
    AWS_S3_REGION="ap-south-1"
    AWS_ACCESS_KEY_ID="AKIAxxxxxxxx"
    AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxx"
    ```

### F. Statutory Tax & GST System
* **Implementation Status:** Implemented in `src/lib/tax-hsn-directory.ts` and `src/app/api/tax/hsn/route.ts`.
* **Current Mode:** **OFFICIAL STATUTORY CBIC SCHEDULE ACTIVE (100% LIVE)**.
* **Behavior:**
  - Official CBIC schedules & **Notification 13/2025-Central Tax (Rate), dated 17 September 2025** integrated.
  - Accurate HSN code classification (6204: 5%/12%, 7113: 3%, 6403: 12%/18%, etc.).
  - Automatic intra-state (CGST + SGST) vs inter-state (IGST) splitting.
  - Zero external API dependency required; fully offline, deterministic, and legally compliant.

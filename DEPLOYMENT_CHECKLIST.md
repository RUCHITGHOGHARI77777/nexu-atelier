# NEXU ATELIER — PRODUCTION DEPLOYMENT & GO-LIVE CHECKLIST

**Document Version:** 1.0.0  
**Target Environment:** Production Cloud (Node.js 20+ / Docker / Vercel / AWS ECS)  
**Database:** PostgreSQL 17+ (Managed RDS / Supabase / Neon)  
**Last Updated:** November 4, 2026  

---

## 1. Environment Variables Configuration Checklist

Verify all environment variables are populated in your production secrets manager:

### Core Platform & Domain
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL="https://nexuatelier.com"`
- [ ] `NEXT_PUBLIC_MARKETPLACE_NAME="NEXU ATELIER"`
- [ ] `AUTH_COOKIE_NAME="nexu_customer_session"`
- [ ] `AUTH_SESSION_TTL_DAYS=7`

### Database
- [ ] `DATABASE_URL` (SSL-enabled connection string, e.g., `postgresql://user:pass@host:5432/nexu?sslmode=require`)

### Transactional Email (Resend)
- [ ] `RESEND_API_KEY` (Live key starting with `re_`)
- [ ] `EMAIL_FROM="NEXU ATELIER <concierge@nexuatelier.com>"`
- [ ] `ADMIN_NOTIFICATION_EMAIL="admin@nexuatelier.com"`
- [ ] Verified DNS records (SPF, DKIM, DMARC) on sending domain

### WhatsApp OTP & Verification (Meta Cloud API)
- [ ] `WHATSAPP_API_TOKEN` (Meta System User permanent access token with `whatsapp_business_messaging` permission)
- [ ] `WHATSAPP_PHONE_NUMBER_ID` (Registered WhatsApp Business phone number ID)
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` (WABA ID)
- [ ] `WHATSAPP_API_VERSION="v20.0"`
- [ ] `WHATSAPP_OTP_TEMPLATE_NAME="nexu_auth_code"` (Approved Meta authentication template)
- [ ] `WHATSAPP_OTP_TEMPLATE_LANG="en_US"`

### Payment Gateway (Razorpay)
- [ ] `PAYMENT_PROVIDER="RAZORPAY"`
- [ ] `RAZORPAY_KEY_ID` (Live merchant key ID)
- [ ] `RAZORPAY_KEY_SECRET` (Live merchant key secret)
- [ ] `RAZORPAY_WEBHOOK_SECRET` (Configured in Razorpay Webhooks dashboard)

### 3PL Courier Logistics (Shiprocket / Delhivery)
- [ ] `SHIPPING_PROVIDER="SHIPROCKET"`
- [ ] `SHIPROCKET_EMAIL`
- [ ] `SHIPROCKET_PASSWORD`
- [ ] `SHIPPING_WEBHOOK_SECRET`

---

## 2. Database Migration & Initialization Checklist

- [ ] Connect to production PostgreSQL instance.
- [ ] Run migration deployment:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Verify 35 tables created cleanly without errors.
- [ ] Verify fail-closed seed protection (`prisma/seed.ts` blocks accidental resets in production).

---

## 3. Production Build & Bundle Verification Checklist

- [ ] Execute clean production build:
  ```bash
  npm run build
  ```
- [ ] Confirm 0 TypeScript compilation errors (`tsc --noEmit`).
- [ ] Verify static pages generation (31 customer routes + 404).
- [ ] Verify dynamic API route bundling without missing dependencies.

---

## 4. Security & Compliance Verification

- [ ] **Role Isolation:** Verify `/admin` routes reject unauthenticated sessions or users with `role: "CUSTOMER"` or `"SELLER"`.
- [ ] **Supplier Data Isolation:** Verify `/seller` routes filter queries strictly by `vendorId === session.sellerId`.
- [ ] **IDOR Protection:** Verify customer order queries reject cross-tenant IDs.
- [ ] **Financial Precision:** Verify all monetary figures compute in integer minor units (paise).
- [ ] **Bot Honeypots:** Verify hidden honeypot fields drop automated submissions on contact, review, and auth routes.
- [ ] **Rate Limiting:** Sliding-window rate limiters active on `/api/auth/*` and `/api/auth/otp/*`.
- [ ] **Zero SMS Dependencies:** Confirm zero SMS fallback requests exist.

---

## 5. Background Automation & Outbox Processor Setup

- [ ] Set up recurring background cron or serverless trigger to process pending outbox events every 60 seconds:
  ```bash
  # Example crontab or cloud runner
  * * * * * curl -X POST -H "Authorization: Bearer $INTERNAL_CRON_SECRET" https://nexuatelier.com/api/admin/automations/process-outbox
  ```

---

## 6. Post-Deployment Smoke Test Protocol

1. **Public Storefront:**
   - [ ] Load `https://nexuatelier.com/` (Verify 200 OK, fonts, luxury layout).
   - [ ] Search catalog for artisan pieces (`/shop`).
   - [ ] Open product detail page (`/product/*`) and test variant selector.
   - [ ] Add item to bag and test multi-currency conversion.
2. **WhatsApp OTP Verification:**
   - [ ] Request WhatsApp OTP on real test mobile number.
   - [ ] Confirm delivery of official template message within 10 seconds.
   - [ ] Submit 6-digit code and verify successful customer login.
3. **Checkout & Order Creation:**
   - [ ] Complete test checkout.
   - [ ] Verify customer receives branded Order Confirmed email.
   - [ ] Verify allocated seller receives New Order Allocated email.
   - [ ] Verify order appears on `/track-order` console.
4. **Seller Hub & Admin:**
   - [ ] Log in as seller and verify allocated order appears in fulfillment queue.
   - [ ] Log in as admin and verify financial metrics and transaction audit log.


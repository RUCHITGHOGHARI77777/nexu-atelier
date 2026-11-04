# NEXU ATELIER — KNOWN ISSUES & ENVIRONMENT INTEGRATION TRACKER

**Document Version:** 1.0.0  
**Last Updated:** November 4, 2026  
**Repository Working Directory:** `D:\Ecommerce Project Real`  

---

## 1. Critical Production Blockers
- **None (0 Blockers).**
- All 31 customer routes, Seller Hub, and Admin Command Center return HTTP 200 OK.
- Database schema is fully synced with PostgreSQL migrations.
- TypeScript compiler passes with 0 diagnostic errors (`tsc --noEmit`).
- Automated test suite is 100% passing (337 / 337 Vitest tests across 29 test suites).

---

## 2. Third-Party Credentials Required for Live Production

The platform includes production-ready driver adapters that automatically switch from safe staging simulators to live external APIs as soon as the respective environment variables are provided in `.env.production`:

| Service Provider | Capability | Required Environment Variables | Current Staging Behavior | Production Action Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Meta WhatsApp Business** | Primary OTP delivery & verification | `WHATSAPP_API_TOKEN`<br>`WHATSAPP_PHONE_NUMBER_ID`<br>`WHATSAPP_BUSINESS_ACCOUNT_ID` | Safe simulator mode: logs masked phone and debug OTP code | Create Meta System User access token & register WhatsApp Business number |
| **Resend** | Transactional HTML email outbox | `RESEND_API_KEY`<br>`EMAIL_FROM` | Safe masked console sink: logs recipient, subject, and byte size | Create Resend API key and verify DNS records (SPF, DKIM, DMARC) for sending domain |
| **Razorpay** | Online payments (UPI, Card, Net Banking) | `RAZORPAY_KEY_ID`<br>`RAZORPAY_KEY_SECRET`<br>`RAZORPAY_WEBHOOK_SECRET` | Sandbox / Mock simulator active for immediate testing | Complete Razorpay merchant KYC and obtain live production API keys |
| **Shiprocket / Delhivery** | 3PL courier rate quoting & AWB creation | `SHIPROCKET_EMAIL`<br>`SHIPROCKET_PASSWORD`<br>`SHIPPING_WEBHOOK_SECRET` | Deterministic 10-stage simulated 3PL carrier lifecycle | Connect live courier account credentials |
| **Managed PostgreSQL** | Persistent database | `DATABASE_URL` | Local PostgreSQL 17.10 instance | Provision managed PostgreSQL (AWS RDS / Supabase / Neon) and run `npx prisma migrate deploy` |

---

## 3. Deprecated & Removed Architectural Components

- **SMS OTP Gateway:**
  - **Status:** Completely deprecated and removed.
  - **Reason:** Replaced with Meta WhatsApp Business Cloud API for higher delivery reliability, direct copy-code buttons, and fraud reduction in Indian and international luxury commerce.
  - **Verification:** All SMS gateway calls, simulated endpoints, and text strings have been removed. No SMS fallback calls exist.

- **Non-Standard Seed Products:**
  - **Status:** Static `SEED_PRODUCTS` eliminated from production routes. All storefront data hydrates dynamically from PostgreSQL via Prisma.

---

## 4. Operational Considerations & Non-Critical Enhancements

1. **Background Outbox Runner:**
   - In production, configure an automated cron job or serverless function to invoke `notificationService.processOutboxQueue()` every 60 seconds to retry failed dispatches.
2. **Meta Cloud API Webhook:**
   - When deploying to production, bind the WhatsApp inbound webhook to `/api/webhooks/whatsapp` to capture delivery receipts (`read`, `delivered`, `failed`).
3. **Image Storage CDN:**
   - High-resolution product images are currently uploaded with magic-byte verification to local disk. For multi-instance horizontal scaling, bind an S3 or Cloudflare R2 bucket.


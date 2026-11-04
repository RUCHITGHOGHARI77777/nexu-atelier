# NEXU ATELIER — PRODUCTION DEPLOYMENT GUIDE & STAGING CHECKLIST
**Application Name:** NEXU ATELIER (Luxury Multi-Vendor Marketplace)  
**Supported Hosting Platforms:** Vercel, AWS ECS / EC2, Railway, DigitalOcean, Docker VPS  
**Database Requirement:** Managed PostgreSQL 15+ (Supabase, AWS RDS, Neon, or Self-Hosted)  

---

## 1. PRE-DEPLOYMENT STAGING CHECKLIST

Before promoting the application to production, complete each checklist item:

- [x] **Production Build Clean:** `npm run build` exits with code 0.
- [x] **Linting Validated:** `next lint` passes with 0 errors.
- [x] **Automated Test Suite Passed:** All Vitest suites pass (`npx vitest run`).
- [x] **Static Compilation Typecheck:** `npx tsc --noEmit` returns 0 errors.
- [ ] **Production Database Provisioned:** PostgreSQL instance created with SSL enabled.
- [ ] **Live Payment Credentials:** Razorpay live API key ID and secret injected.
- [ ] **Live WhatsApp Meta Credentials:** System user token and phone number ID linked.
- [ ] **Transactional Email Configured:** Resend or AWS SES API key active.
- [ ] **Object Storage Linked:** AWS S3 or Cloudinary bucket configured for media.
- [ ] **DNS & SSL Certificates:** Custom domain mapped (`atelier.nexu.studio` or `nexuatelier.com`) with TLS 1.3.

---

## 2. ENVIRONMENT VARIABLES CONFIGURATION

Create an environment configuration file (`.env.production`) on the deployment server:

```ini
# ==========================================
# 1. CORE APPLICATION CONFIGURATION
# ==========================================
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="https://atelier.nexu.studio"
NEXT_PUBLIC_MARKETPLACE_NAME="NEXU ATELIER"
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# ==========================================
# 2. POSTGRESQL DATABASE (SSL Required in Prod)
# ==========================================
DATABASE_URL="postgresql://nexu_user:STRONG_SECURE_PASSWORD@db.nexu.internal:5432/nexu_production?sslmode=require&schema=public"

# ==========================================
# 3. AUTHENTICATION & SECURITY SESSIONS
# ==========================================
AUTH_COOKIE_NAME="__Secure-nexu-session"
AUTH_SESSION_TTL_DAYS=30
SESSION_SECRET="GENERATE_A_64_CHAR_HEX_SECRET_FOR_COOKIE_SIGNING"

# ==========================================
# 4. RAZORPAY PAYMENT GATEWAY (Live Credentials)
# ==========================================
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"

# ==========================================
# 5. WHATSAPP CLOUD API (Meta Business Suite)
# ==========================================
WHATSAPP_API_TOKEN="EAAXxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_PHONE_NUMBER_ID="109xxxxxxxxxxxx"
WHATSAPP_BUSINESS_ACCOUNT_ID="201xxxxxxxxxxxx"
WHATSAPP_TEMPLATE_LANG="en_US"

# ==========================================
# 6. TRANSACTIONAL EMAIL (Resend / AWS SES)
# ==========================================
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM_ADDRESS="concierge@nexu.studio"
EMAIL_REPLY_TO="patron-care@nexu.studio"

# ==========================================
# 7. CLOUD MEDIA STORAGE (AWS S3 or Cloudinary)
# ==========================================
AWS_S3_BUCKET="nexu-atelier-assets"
AWS_S3_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="AKIAxxxxxxxxxxxxxxxx"
AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# OR
CLOUDINARY_URL="cloudinary://api_key:api_secret@nexu-cloud"

# ==========================================
# 8. 3PL CARRIER LOGISTICS (Shiprocket / Delhivery)
# ==========================================
SHIPROCKET_EMAIL="logistics@nexu.studio"
SHIPROCKET_PASSWORD="xxxxxxxxxxxx"
```

---

## 3. STEP-BY-STEP DEPLOYMENT RUNBOOK

### Option A: Standard Node.js VPS / Docker Deployment

1. **Clone & Install Dependencies:**
   ```bash
   git clone https://github.com/nexu-atelier/marketplace.git /var/www/nexu-atelier
   cd /var/www/nexu-atelier
   npm ci --production=false
   ```

2. **Execute Database Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Compile Production Build:**
   ```bash
   npm run build
   ```

4. **Launch with Process Manager (PM2):**
   ```bash
   pm2 start npm --name "nexu-atelier" -- start
   pm2 save
   pm2 startup
   ```

### Option B: Vercel Deployment

1. Connect Git repository to Vercel.
2. Select **Framework Preset:** `Next.js`.
3. Configure Environment Variables in Vercel Project Settings.
4. Set Build Command: `prisma generate && next build`.
5. Set Output Directory: `.next`.
6. Deploy!

---

## 4. SMOKE TESTING AFTER DEPLOYMENT

Once deployed to production:
1. Visit `https://your-domain.com/` and ensure the white luxury homepage loads in under 1.2 seconds.
2. Visit `/shop` and test searching for a product.
3. Test WhatsApp OTP verification on `/login`.
4. Add an item to bag, execute a test order, and verify invoice generation.
5. Log into the Seller portal (`/seller`) and verify the product creation wizard and costing calculator.
6. Log into Admin command center (`/admin`) and check platform financial telemetry.


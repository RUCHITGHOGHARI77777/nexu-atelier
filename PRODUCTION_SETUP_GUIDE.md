# 🚀 NEXU ATELIER — Real World Production & Live Setup Guide
### Engineered by Ruchit Ghoghari (RG Systems Architecture) with RG AI Autonomous Engineering

**Official Profiles & Connect:**
[Official Website](https://rgai.in) • [Direct Email](mailto:ruchitghoghari@rgai.in) • [LinkedIn](https://in.linkedin.com/in/ruchit-ghoghari) • [GitHub](https://github.com/RUCHITGHOGHARI77777) • [Instagram](https://www.instagram.com/ruchit_ghoghari_official_/) • [X (Twitter)](https://x.com/RuchitGhoghari) • [Reddit](https://www.reddit.com/user/RG_AI_777/)

---

This guide provides exact step-by-step instructions for deploying and running **NEXU ATELIER** in both **Instant Demo Mode** (for showcases, hackathons, portfolio reviews) and **Real Production Mode** (for live commercial multi-vendor operations).

---

## ⚡ Quick Start: Instant 1-Click Run (Demo Mode)

If you are inspecting or showcasing the project locally:

### On Windows:
Double-click `start-windows.bat`.
It automatically checks your Node.js runtime, generates the Prisma client, prepares demo credentials, and opens `http://localhost:3000` in your default browser.

### On macOS / Linux:
```bash
chmod +x start-linux-mac.sh
./start-linux-mac.sh
```

### Pre-Configured Demo Credentials:
- **Customer Account:** `patron@nexu.studio` | Password: `Password123!`
- **Seller / Artisan Account:** `solstice@nexu.studio` | Password: `Password123!`
- **Platform Super Admin:** `admin@nexu.studio` | Password: `AdminPass123!`
- **Universal Demo OTP (WhatsApp / COD):** `123456` *(Always valid in DEMO_MODE)*

---

## 🏗️ Real-World Production Setup (`DEMO_MODE=false`)

To transition the platform to a live, production multi-vendor marketplace with real money transactions, real WhatsApp OTP delivery, and real 3PL courier shipments, follow these steps:

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/RUCHITGHOGHARI77777/nexu-atelier.git
cd nexu-atelier
npm install
```

---

### Step 2: Configure Environment Variables (`.env`)
Create your production `.env` file based on `.env.example`:

```env
# Application Host URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_MARKETPLACE_NAME="Nexu Atelier"
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Switch Strict Production Mode (Disables sandbox simulators & 1-click test logins)
DEMO_MODE=false

# 1. Database Connection (PostgreSQL 14+ / Neon / Supabase / AWS RDS)
DATABASE_URL="postgresql://user:password@db-host:5432/nexu_production?schema=public&sslmode=require"

# 2. Cryptographic Security Ledger Secret (Min 32 characters HMAC-SHA256)
AUDIT_HMAC_SECRET="generate_a_cryptographically_secure_random_64char_string_here"

# 3. Authentication & Cookies
AUTH_COOKIE_NAME=nexu_prod_session
AUTH_SESSION_TTL_DAYS=7

# 4. Live Payment Gateway (Razorpay India)
PAYMENT_PROVIDER=RAZORPAY
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# 5. Live 3PL Logistics (Shiprocket)
SHIPPING_PROVIDER=SHIPROCKET
SHIPROCKET_EMAIL=operations@yourdomain.com
SHIPROCKET_PASSWORD=your_shiprocket_account_password
SHIPROCKET_WEBHOOK_TOKEN=your_shiprocket_webhook_token
SHIPPING_WEBHOOK_SECRET=your_secure_shipping_webhook_secret

# 6. Live WhatsApp OTP (Official Meta Cloud API)
WHATSAPP_API_TOKEN=EAAB...your_meta_system_user_permanent_token
WHATSAPP_PHONE_NUMBER_ID=109876543210987
WHATSAPP_BUSINESS_ACCOUNT_ID=98765432109876
WHATSAPP_API_VERSION=v20.0
WHATSAPP_OTP_TEMPLATE_NAME=nexu_auth_code
WHATSAPP_OTP_TEMPLATE_LANG=en_US

# 7. Live Transactional Email (Resend)
NOTIFICATION_PROVIDER=RESEND
RESEND_API_KEY=re_your_live_resend_api_key
EMAIL_FROM="Nexu Atelier <concierge@yourdomain.com>"
ADMIN_NOTIFICATION_EMAIL="admin@yourdomain.com"
```

---

### Step 3: Run Database Migrations & Initial Seed
Deploy schema to your live PostgreSQL database:
```bash
# Push Prisma schema to live database
npx prisma db push

# Generate optimized Prisma Client
npx prisma generate

# (Optional) Seed standard luxury categories and platform configuration
npm run seed
```

---

### Step 4: Run Pre-Flight Verification Tests
Execute the comprehensive test suite to confirm zero regressions:
```bash
npm run test
```
*Expected: 45 test files, 493 tests passing 100% green.*

---

### Step 5: Build Optimized Production Bundle
```bash
npm run build
```
*Expected: Compiles 117 static and server-rendered routes without errors.*

---

### Step 6: Start Production Server
```bash
npm run start
```
By default, the server listens on `http://localhost:3000` or the port defined by `PORT=...`.

---

## ☁️ Cloud Deployment Options

### Option A: Vercel (Recommended for Next.js)
1. Import repository on [Vercel](https://vercel.com).
2. Configure **Environment Variables** in Vercel project settings matching Step 2.
3. Build Command: `npm run build`
4. Output Directory: `.next`
5. Deploy. Vercel automatically configures edge routing and HTTPS certificates.

### Option B: Docker / VPS (Ubuntu / AWS EC2 / DigitalOcean)
Use PM2 to manage the production Node.js process:
```bash
npm install -g pm2
pm2 start npm --name "nexu-atelier" -- start
pm2 save
pm2 startup
```

---

## 📱 Multi-Device & Cross-Platform Responsive Standards

NEXU ATELIER was engineered according to the **Farfetch & Apple Store Warm Minimalist Luxury** design system:
- **Mobile Viewports (375px – 480px):** Single-column streamlined product cards, sticky bottom action bars, touch-friendly 44px+ tap targets, zero horizontal scrolling.
- **Tablet Viewports (768px – 1024px):** 2-to-3 column editorial grid, collapsable navigation drawer, split cart summary.
- **Desktop & 4K Viewports (1280px – 1920px+):** Full 4-column luxury gallery, sticky checkout sidebar, high-density Admin and Seller analytics matrices.

---

## 🛡️ Security & Privacy Notice (Public GitHub Ready)
- **Zero Secrets Committed:** All local database credentials, API tokens, and session cookies are strictly excluded via `.gitignore`.
- **Statutory Multi-Vendor Governance:** Sellers and suppliers cannot self-approve products or self-withdraw escrow funds; all public storefront changes and payouts require platform administrator authorization.
- **OWASP ASVS Compliant:** Cryptographic password hashing (PBKDF2 100,000+ iterations), scoped Prisma multi-tenant tenant isolation, and anti-IDOR checks.


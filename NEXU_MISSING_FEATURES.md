# NEXU ATELIER — MISSING FEATURES & EXTERNAL GAP REGISTER
**Scope:** Capabilities requiring owner credentials, external API keys, or operational setup before commercial launch  
**Status Date:** November 5, 2026  

---

## 1. EXTERNAL INTEGRATION GAPS & OWNER CREDENTIAL REQUIREMENTS

| Domain | Feature / Integration | Current Status | What Is Missing | Owner Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Payments** | Live Razorpay Settlements | **Demo only** (`DEMO-UTR`) | Production API Key & Secret | Complete Razorpay Merchant KYC and inject `RAZORPAY_KEY_ID` in `.env.production`. |
| **Authentication** | Handset WhatsApp OTP Delivery | **Partially working** (Simulator) | Meta WhatsApp Business API Token | Register Meta Business App, verify phone number, and inject `WHATSAPP_API_TOKEN`. |
| **Notifications** | Transactional Outbound Email | **Partially working** (Local Outbox) | Resend API Key / AWS SES SMTP | Create Resend account, verify domain DNS, and add `RESEND_API_KEY`. |
| **Logistics** | Real 3PL Courier Physical Pickups | **Partially working** (Internal AWB) | Shiprocket / Delhivery Client API | Create Shiprocket merchant account and configure webhook callbacks. |
| **Media Assets** | Distributed Multi-Region CDN | **Partially working** (Local Storage) | AWS S3 Bucket or Cloudinary URL | Create S3 bucket with public-read policy or link Cloudinary URL. |
| **Meta Ads** | Conversions API & Catalog Feed | **Requires configuration** | Meta Pixel ID & Access Token | Follow `NEXU_META_ADS_READINESS.md` to link Pixel and sync XML catalog feed. |

---

## 2. PENDING BUSINESS & OPERATIONAL DECISIONS (Owner Action Required)

1. **Commission Model Approval:**
   * Current default is **7% platform commission** on handcrafted goods, with zero fixed monthly listing fees. Owner must confirm if this rate applies to all categories.
2. **Escrow Hold Period:**
   * Current platform setting holds seller funds until **3 days post-delivery** to allow customer return inspection. Owner must confirm whether this window should be 3, 7, or 14 days.
3. **Return & Refund Shipping Liability:**
   * If customer initiates a return for buyer remorse vs damaged goods, who bears the return shipping fee (Seller vs Platform vs Customer)?
4. **Cash on Delivery (COD) Surcharge:**
   * Default COD limit is ₹5,000 with a ₹50 handling charge. Owner must confirm whether COD should be enabled platform-wide.

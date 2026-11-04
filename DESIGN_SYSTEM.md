# NEXU ATELIER — MASTER DESIGN SYSTEM SPECIFICATION

**Version:** 2.4.0  
**Stack:** Next.js 14.2.18 App Router, React 18, Tailwind CSS 3.4, TypeScript 5.0, Prisma ORM, PostgreSQL 17.10  
**Design Philosophy:** Luxury Editorial Commerce (Customer), Serious B2B SaaS (Seller Hub), Authoritative Control Center (Super Admin).

---

## 1. DESIGN PHILOSOPHY & BRAND ARCHITECTURE

NEXU ATELIER operates on a strict three-tier role-separated experience model:

1. **Customer Storefront (`/`, `/shop`, `/product/[slug]`, `/cart`, `/checkout`)**
   - **Tone:** Luxury editorial, quiet minimalism, confident typography, high-headroom presentation.
   - **Visual Model:** 80–90% neutral whitespace (`#FFFFFF`, `#F6F7F9`, `#F8FAFC`) with subtle blue/slate accents (`#2457C5`).
   - **Prohibitions:** No artificial urgency countdowns ("Studio Allocation of the Day"), no unconfigured countdown timers, no B2B wholesale cards mixed into consumer retail grids, no cropped or clipped product photography.

2. **Seller Hub (`/seller`)**
   - **Tone:** Serious, high-efficiency business SaaS (inspired by Shopify Polaris, Linear).
   - **Visual Model:** Crisp neutral cards, clear information density, unified Kanban fulfillment pipeline (Pending → Accept → Pack & Label → Dispatch).
   - **Prohibitions:** No dark header contrast dissonance, no neon gradient metric cards, no malformed escape characters (`$\to$`, `\t`).

3. **Super Admin Command Center (`/admin`)**
   - **Tone:** Authoritative governance and compliance terminal (inspired by Stripe Dashboard, Vercel).
   - **Visual Model:** Unified neutral tab navigation, persistent active indicator tokens, verified PostgreSQL telemetry separated from simulated stress metrics.
   - **Prohibitions:** No rainbow gradient tabs, no arbitrary colorful buttons, no fake "1-Click Cluster Auto-Upgrade" claims without simulated attribution labels.

---

## 2. OFFICIAL COLOR TOKENS

Defined in `src/app/globals.css`:

```css
:root {
  /* Surfaces & Canvas */
  --nexu-surface: #FFFFFF;         /* Primary pure white surface */
  --nexu-canvas: #F6F7F9;          /* Page background / neutral canvas */
  --nexu-secondary: #F8FAFC;       /* Subtle card backing */

  /* Typography */
  --nexu-text-primary: #17191F;    /* Deep slate body & headings */
  --nexu-text-secondary: #64748B;  /* Supporting labels & descriptions */
  --nexu-text-muted: #94A3B8;      /* Captions & metadata */

  /* Borders & Dividers */
  --nexu-border-main: #E5E7EB;     /* Standard component borders */
  --nexu-border-strong: #D1D5DB;   /* Focused & hovered borders */

  /* Brand Accent */
  --nexu-accent: #2457C5;          /* Signature NEXU Blue */
  --nexu-accent-hover: #1D46A6;    /* Darkened hover state */
  --nexu-accent-subtle: #EEF4FF;   /* Light tint background */

  /* Semantics */
  --nexu-success: #15803D;         /* Verified maker, payment captured */
  --nexu-warning: #B45309;         /* Low stock, action pending */
  --nexu-danger: #B91C1C;          /* Cancelled, payment failed, dispute */
}
```

---

## 3. TYPOGRAPHY SYSTEM

- **Headings (Editorial):** Inter / Plus Jakarta Sans font stack with high tracking discipline (`tracking-tight`, `font-extrabold` / `font-black`).
- **Body:** Inter font stack (`text-sm`, `text-slate-600`, `leading-relaxed`).
- **Monospace (Prices, Reference Tokens, PIDs):** JetBrains Mono / SFMono (`font-mono`, uppercase tracking for UTRs like `DEMO-UTR-2026-XXXXXX`).

---

## 4. PRODUCT PHOTOGRAPHY & IMAGE FRAMING RULES

### Critical Image Cropping Fix
- **Aspect Ratio:** All product showcase containers enforce `aspect-[4/5]` portrait editorial ratio.
- **Fit Strategy:** Images utilize `object-contain p-2.5` to ensure garments, acoustic monitors, luxury glass flacons, and footwear are 100% visible from collar to hemline without cutoff.
- **Canvas Backdrop:** Neutral studio backing (`bg-slate-50` / `bg-zinc-50`) ensures seamless integration with photography of varying original dimensions.
- **Fail-Safe Loading:** Wrapped with `SafeImage` or `ImageWithFallback` to immediately handle broken remote URLs with clean studio photography fallbacks.

---

## 5. REUSABLE COMPONENT SPECIFICATIONS

### A. Navigation Architecture
- **Customer Navbar (`CustomerStorefrontNavbar.tsx`):**
  - Brand identity (`NEXU ATELIER`).
  - Search input with keyboard shortcut `/`.
  - Category navigation (`Catalog`, `Boutiques`, `Curated`, `Tracking`).
  - Cart drawer trigger with live badge.
  - Wishlist counter and Customer Account trigger.
- **Seller Navbar (`SellerPortalNavbar.tsx`):**
  - Merchant branding and GSTIN identifier.
  - Kanban pipeline counts (Pending, Ready to Ship, Delivered).
  - Quick action buttons (+ Add Product, View Brand Storefront).
- **Admin Navbar (`AdminPortalNavbar.tsx`):**
  - Unified slate-950 enterprise active states.
  - Real-time audit logs, merchant onboarding queue, and database telemetry.

### B. Payment & Verification Standards
- **UPI Simulator:**
  - Real-time VPA format validation (`^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}$`).
  - 10-second interactive timer with dual paths (Simulate Bank Success / Simulate Bank Failure).
  - Authoritative reference: `DEMO-UTR-2026-XXXXXX`.
- **Card Simulator:**
  - Zero-storage compliant (no CVV/PIN captured or persisted).
  - Verified test card triggers (`4242 •••• •••• 4242` for success, `4000 •••• •••• 0002` for decline).
- **Cash on Delivery:**
  - Phone verification and risk engine scoring.
  - Transaction state: `PENDING_COLLECTION`.

---

## 6. QUALITY ASSURANCE CHECKLIST

- [x] Zero TypeScript compilation errors (`npx tsc --noEmit`).
- [x] 100% Vitest test suite passing (314 tests across 27 files).
- [x] Multi-tenant isolation verified (Zero cross-seller catalog leakage).
- [x] Server-authoritative checkout totals computed in minor units (paise) with zero floating-point drift.
- [x] Idempotency keys enforced on order placement and refund execution.
- [x] Genuine Google OAuth popup flow and PBKDF2 salt-hashing maintained.


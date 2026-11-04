---
name: nexu-marketplace-design
description: Complete design system, customer marketplace architecture, visual tokens, and quality standards for NEXU ATELIER multi-vendor e-commerce platform.
metadata:
  author: NEXU ATELIER Architecture Team
  version: "1.0.0"
  stack: "Next.js 14 App Router, React 18, Tailwind CSS, TypeScript, Prisma, PostgreSQL"
---

# NEXU ATELIER — Marketplace Customer Experience & Master Design Skill

## 1. Brand Identity & Marketplace Philosophy

NEXU ATELIER is a premier multi-vendor e-commerce marketplace platform owned and governed centrally by the platform owner, hosting independent verified artisan studios, workshops, and luxury makers.

### Three-Phase Business Model
- **Phase 1 (Current Scope):** Public Customer Storefront. Pure, polished, trustworthy e-commerce discovery, curation, ordering, and tracking.
- **Phase 2 (Future Architecture):** Platform Owner / Super Admin Control Center.
- **Phase 3 (Future Architecture):** Independent Supplier / Seller Hub & Storefront Management.

### Storefront Core Law
The public customer experience must remain 100% focused on customer discovery and shopping. Under NO circumstances should internal seller management tools, supplier onboarding wizards, B2B wholesale quotation prompts, or platform administrative controls intrude into the customer shopping journeys.

---

## 2. Design Tokens & Visual Primitives

### Color Palette (Root Variables in `src/app/globals.css`)
- **Canvas / Background:** `#F6F7F9` (Clean, warm neutral off-white canvas)
- **Primary Surface:** `#FFFFFF` (Pure white card and modal containers)
- **Secondary Surface:** `#F8FAFC` (Subtle backing and section alternation)
- **Primary Text:** `#17191F` (Authoritative deep slate, not flat `#000000`)
- **Secondary Text:** `#64748B` (Refined descriptive body and metadata)
- **Muted Text:** `#94A3B8` (Captions, footnotes, placeholder hints)
- **Dividers & Borders:** `#E5E7EB` (Main border), `#D1D5DB` (Hover / focus ring)
- **Brand Accent:** `#2457C5` (Signature NEXU Blue, luxury precision)
- **Accent Hover:** `#1D46A6` (Deep cobalt interaction state)
- **Accent Subtle:** `#EEF4FF` (Tinted highlight pill background)
- **Status Green (Success):** `#15803D` (In-stock, maker verified, order confirmed)
- **Status Amber (Warning):** `#B45309` (Low stock alert, action required)
- **Status Red (Danger):** `#B91C1C` (Out of stock, payment declined)

### Neutral Surface Ratio
- Keep 85–90% of screen real estate as clean neutral whites, warm greys, and light canvas surfaces.
- Strictly avoid generic AI template tropes: no random neon purple/cyan gradients, no frosted glassmorphism across every card, no decorative emoji badges in headings.

---

## 3. Typography Hierarchy

- **Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`
- **Monospace Stack:** `JetBrains Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `monospace` (strictly reserved for prices, UTR codes, tracking IDs, and serial tokens)
- **Hero Title:** `text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950`
- **Section Heading:** `text-xl sm:text-2xl font-bold tracking-tight text-slate-900`
- **Card Title:** `text-sm sm:text-base font-semibold text-slate-900 line-clamp-2`
- **Body Text:** `text-sm text-slate-600 leading-relaxed max-w-[70ch]`
- **Metadata & Subtitles:** `text-xs text-slate-500 font-medium`

---

## 4. Photography & Product Presentation Standards

### The Portrait Framing Law
- **Aspect Ratio:** `aspect-[4/5]` portrait container on all retail product showcases.
- **Image Fitting:** `object-contain p-3` on neutral studio backdrops (`bg-slate-50` / `bg-zinc-50`).
- **Zero-Cropping Guarantee:** No garments, necklaces, flacons, shoes, or acoustic monitors may be clipped at the neckline, hemline, or sides.
- **Multi-Vendor Provenance:** Every card must display the verified Maker / Studio boutique link (`By Solstice Loom Studio → /store/solstice-loom-studio`).
- **Fail-Safe Loading:** All dynamic photography must resolve through `SafeImage` with fallback to vetted high-resolution studio assets.

---

## 5. Navigation & Layout Architecture

### Customer Storefront Navbar (`CustomerStorefrontNavbar.tsx`)
1. **Brand Identity:** Bold, minimal `NEXU ATELIER` wordmark linking to `/`.
2. **Catalog Discovery:** Fast search bar with keyboard shortcut `/` and direct category shortcuts (Catalog, Boutiques, Curated, Track Order).
3. **Cart & Wishlist:** Live drawer badges with atomic item counters.
4. **Patron Authentication:** Unified login / account modal with Google OAuth and email access.
5. **Role Cleanliness:** Customer navigation NEVER displays "Supplier Dashboard", "Admin Center", "Commission Rates", or "B2B Volume Quotations".

### Customer Marketplace Footer (`AppFooter.tsx`)
- Customer-centric customer service, studio directory, tracking, shipping policies, returns, and terms.
- Future portal links (e.g. "Sell on NEXU", "Platform Governance") remain discreet informational footers or gated routes, never intruding on retail shopping flows.

---

## 6. Interaction & Motion Principles

- **Hover States:** Subtle `-translate-y-0.5` or `-translate-y-1` elevation transitions with soft ambient shadows (`shadow-sm` to `shadow-md`).
- **Button Feedback:** `active:scale-98` with immediate visual response and loading spinners on asynchronous actions.
- **Drawer & Modal Overlays:** Smooth enter/exit fades (200ms `ease-out`) with background backdrop blur (`backdrop-blur-md`).
- **Focus Rings:** Accessible keyboard navigation rings (`focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`).

---

## 7. Accessibility (A11y) & WCAG AA Standards

- **Color Contrast:** All body text meets minimum 4.5:1 contrast against `#FFFFFF` and `#F6F7F9`.
- **Form Controls:** Every input possesses an explicit or `aria-label` associated descriptor.
- **Keyboard Navigation:** Full tab order through product cards, quick views, cart drawers, and checkout steps.
- **Screen Reader Support:** Clear alt text for product images, ARIA live regions for cart quantity updates and toast announcements.

---

## 8. Quality Assurance Checklist

- [ ] All 314 server and client test suites green (`npx vitest run --no-file-parallelism`).
- [ ] TypeScript compilation passes with 0 errors (`npx tsc --noEmit`).
- [ ] Product photography is 100% visible inside `aspect-[4/5]` without edge cutoff.
- [ ] Multi-vendor store links (`/store/[slug]`) resolve to authentic maker boutiques.
- [ ] Server-side pricing is strictly authoritative (paise integers in PostgreSQL).
- [ ] Checkout idempotency prevents duplicate order submission.
- [ ] Demo payment simulator enforces format validation and zero-storage compliance.


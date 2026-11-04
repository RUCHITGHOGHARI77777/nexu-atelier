# NEXU ATELIER — COMPREHENSIVE WHITE THEME AUDIT & DARK UI REMOVAL PLAN

**Audit Date:** November 4, 2026  
**Objective:** Audit every component, stylesheet, and layout across NEXU ATELIER for unwanted dark/black UI surfaces and map exact white-theme replacements according to the owner's white-first luxury editorial aesthetic.

---

## 1. Executive Summary of Audit Findings

A rigorous source scan of `D:\Ecommerce Project Real` across `src/components`, `src/app`, and stylesheets revealed **330 occurrences in `page.tsx` templates** and **148 occurrences in shared components** utilizing dark fills (`bg-zinc-950`, `bg-zinc-900`, `bg-black`, `bg-obsidian`, `bg-slate-950`, `bg-slate-900`).

### Root Causes of Theme Inconsistency:
1. **Gallery-White Config Preset Mismatch:**
   - In `/admin/whitelabel` and `tailwind.config.ts`, a "gallery-white" preset was configured in metadata, but individual component files had hardcoded Tailwind utility classes (`bg-zinc-950 text-white`) instead of CSS custom properties or light token utilities.
2. **High-Contrast "Luxury" Default Fallacy:**
   - E-commerce buttons (such as "Add to Bag", "Proceed to Checkout", "Authorize & Pay") were hardcoded to black under an outdated assumption that contrast required dark fills.
   - The owner's specification requires a **pure white editorial gallery look** (reminiscent of high-end galleries and minimalist fashion publications) where buttons are white or soft cream with refined dark charcoal borders and gold hover accents.
3. **Admin and Supplier Portal Divergence:**
   - The customer storefront had started moving toward light tones, but `AdminCommandCenterSaaS.tsx`, `SupplierPortalSaaS.tsx`, and associated navigation sidebars still used obsidian/slate-950 backdrops.

---

## 2. Component-by-Component Dark UI Audit & Replacement Mapping

| Component | File Path | Current Dark Pattern | White Theme Replacement |
|:---|:---|:---|:---|
| **Announcement Bar** | `src/components/layout/AnnouncementBar.tsx` | `bg-zinc-950 text-zinc-300` | `bg-[#FAFAF8] text-[#171717] border-b border-[#E8E8E4]` with `#B78B45` gold accent indicators |
| **Header & Navbar** | `src/components/layout/Header.tsx`<br>`CustomerStorefrontNavbar.tsx` | `bg-zinc-950` cart badge, dark dropdowns | `bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E8E8E4]`, cart badge: `bg-[#F8F2E6] text-[#8A631E] border border-[#B78B45]/40` |
| **Mega Menu** | `src/components/layout/StorefrontMegaMenu.tsx` | `bg-zinc-950 text-white` category badges | `bg-[#FFFFFF] text-[#171717] border border-[#E8E8E4] shadow-sm`, category tag: `bg-[#FAFAF8] text-[#626262]` |
| **Primary Buttons** | `src/components/ui/Button.tsx` | `bg-zinc-950 text-white hover:bg-zinc-800` | `bg-[#FFFFFF] text-[#171717] border-1.5 border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] hover:bg-[#FAFAF8] shadow-xs active:scale-[0.98]` |
| **Secondary Buttons** | `src/components/ui/Button.tsx` | `bg-zinc-100 text-zinc-900` | `bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] hover:bg-[#F5F6F4]` |
| **Accent / Luxury Buttons** | `src/components/ui/Button.tsx` | `bg-amber-600 text-white` | `bg-[#F8F2E6] text-[#8A631E] border border-[#B78B45]/50 hover:bg-[#F3E8D2]` |
| **Product Cards** | `src/components/products/ProductCard.tsx`<br>`ProductCardSaaS.tsx` | `bg-zinc-950` "Add to Bag" on hover, black discount tags | `bg-[#FFFFFF] border border-[#E8E8E4] hover:shadow-md`, hover button: `bg-[#FFFFFF]/95 text-[#171717] border border-[#171717]`, discount: `bg-[#EAF6F0] text-[#21866F] border border-[#21866F]/30` |
| **Cart Drawer** | `src/components/cart/CartDrawer.tsx`<br>`CartDrawerSaaS.tsx` | `bg-zinc-950` checkout button & dark badges | Surface: `bg-[#FFFFFF]`, Checkout CTA: `bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] hover:bg-[#FAFAF8] hover:border-[#B78B45] hover:text-[#B78B45]` |
| **Checkout Stepper & Tabs** | `src/app/checkout/page.tsx`<br>`PaymentMethodSelector.tsx` | `bg-zinc-950 text-white` active tabs & pay button | Active tabs: `bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] shadow-xs`, Pay button: `bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45]` |
| **Simulated Payment Gateway** | `src/components/checkout/InteractivePaymentModal.tsx` | `bg-zinc-950` header & dark simulator frames | `bg-[#FFFFFF] border border-[#E8E8E4] shadow-2xl`, header: `bg-[#FAFAF8] text-[#171717] border-b border-[#E8E8E4]` |
| **Auth Identity Modal** | `src/components/auth/FirebaseAuthModal.tsx` | `bg-zinc-950` title block, black sign-in button | `bg-[#FFFFFF] text-[#171717] border border-[#E8E8E4]`, CTA: `bg-[#FFFFFF] border-1.5 border-[#171717] hover:border-[#B78B45]` |
| **Footer** | `src/components/layout/Footer.tsx`<br>`AppFooter.tsx` | `bg-zinc-950 text-zinc-400` block | `bg-[#FAFAF8] text-[#626262] border-t border-[#E8E8E4]`, headings: `text-[#171717]` |
| **Admin Command Center** | `src/components/admin/AdminCommandCenterSaaS.tsx`<br>`AdminNav.tsx` | `bg-obsidian-canvas`, dark sidebar `bg-zinc-900` | Canvas: `bg-[#FAFAF8]`, Sidebar: `bg-[#FFFFFF] border-r border-[#E8E8E4]`, Metric cards: `bg-[#FFFFFF] border border-[#E8E8E4]` |
| **Supplier Portal** | `src/components/supplier/SupplierPortalSaaS.tsx`<br>`SellerNav.tsx` | `bg-zinc-900` header, dark metric panels | Canvas: `bg-[#FAFAF8]`, Sidebar: `bg-[#FFFFFF] border-r border-[#E8E8E4]`, Tiles: `bg-[#FFFFFF] border border-[#E8E8E4]` |

---

## 3. Global Stylesheet & Token Migration Strategy

### Step 1: Update Tailwind Config (`tailwind.config.ts`)
- Replace obsidian palette defaults with editorial gallery palette:
  - `canvas`: `#FAFAF8`
  - `surface`: `#FFFFFF`
  - `section`: `#F5F6F4`
  - `border`: `#E8E8E4`
  - `text-primary`: `#171717`
  - `text-secondary`: `#626262`
  - `text-muted`: `#929292`
  - `accent-luxury`: `#B78B45`
  - `accent-emerald`: `#21866F`
  - `accent-emerald-soft`: `#EAF6F0`
  - `accent-gold-soft`: `#F8F2E6`

### Step 2: Update CSS Variables (`src/app/globals.css`)
- Set `:root` variables:
  - `--background: #FAFAF8;`
  - `--foreground: #171717;`
  - `--nexu-surface: #FFFFFF;`
  - `--nexu-canvas: #FAFAF8;`
  - `--nexu-border-main: #E8E8E4;`
- Update specular glass primitives (`.liquid-glass-card`, `.liquid-glass-surface`) to maintain pristine white translucency without dark borders or shadows.
- Calibrate focus rings: `:focus-visible { outline: 2px solid #B78B45; outline-offset: 2px; }`.

### Step 3: Component-Level Replacement Order
1. Core UI Primitives: `Button.tsx`, `Input.tsx`, `Badge.tsx`, `Alert.tsx`
2. Global Layout Shell: `Header.tsx`, `AnnouncementBar.tsx`, `Footer.tsx`, `StorefrontMegaMenu.tsx`
3. Storefront Core Flow: `ProductCard.tsx`, `CartDrawer.tsx`, `PaymentMethodSelector.tsx`, `InteractivePaymentModal.tsx`, `FirebaseAuthModal.tsx`
4. Pages: Homepage (`/`), Shop (`/shop`), PDP (`/product/[slug]`), Cart (`/cart`), Checkout (`/checkout`), Confirmation (`/checkout/confirmation`), Account (`/account/**`), Tracking (`/track`)
5. Portals: `AdminCommandCenterSaaS.tsx`, `SupplierPortalSaaS.tsx`, Admin & Seller Navs.


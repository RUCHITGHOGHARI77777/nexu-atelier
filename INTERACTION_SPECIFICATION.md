# NEXU ATELIER — INTERACTION & BEHAVIORAL SPECIFICATIONS

**Document Version:** 1.0.0  
**Scope:** Complete Customer Interaction System

---

## 1. Global Navigation & Discovery

### A. Desktop Navbar (`CustomerStorefrontNavbar.tsx`)
- **Sticky Behavior:** Fixed top with `backdrop-blur-2xl` and `bg-white/95`. Subtle bottom border `#E5E7EB`.
- **Search Interaction:**
  - Dedicated search input with `Search` icon.
  - Active focus shows clean `ring-2 ring-slate-900` without layout shifts.
  - Clear button `X` appears when query length > 0.
- **Category Filter Tabs:**
  - Pill links with smooth hover highlight (`hover:bg-slate-50`). Active state is `bg-slate-100 font-bold`.
- **Wishlist & Bag Counters:**
  - Real-time numerical counter pill badge.
  - Clicking Bag opens the slide-out Cart Drawer without navigating away.
- **Account Dropdown:**
  - For unauthenticated patrons: Triggers `FirebaseAuthModal` (Google OAuth / Email).
  - For authenticated patrons: Opens a clean user menu (`My Orders`, `Saved Addresses`, `Sign Out`).

### B. Mobile Navigation
- **Hamburger Button:** Expands a full-height slide-over drawer with 48px touch targets for each category.
- **Search Bar:** Stacks cleanly below the logo on mobile viewports.

---

## 2. Product Presentation & Shopping Interactions

### A. Product Cards (`ProductCardSaaS.tsx`)
- **Framing:** Strict `aspect-[4/5]` portrait container with `object-contain p-3` on `bg-slate-50`.
- **Hover Micro-interaction:**
  - Card elevates `-translate-y-1` with smooth ambient shadow `shadow-[0_20px_50px_rgb(37,99,235,0.08)]`.
  - Image scales subtly (`scale-105`) over 500ms `ease-out`.
  - Floating "Quick View" action fades in smoothly at bottom of media container.
- **Wishlist Heart:**
  - Top-right anchor. Clicking toggles heart fill (`fill-rose-600 text-rose-600`) and dispatches toast notification.
- **Dual Action Triggers:**
  - **"Add to Bag":** Adds piece to `StoreContext` / `CartContext`, increments counter, and displays confirmation toast.
  - **"Buy Now":** Adds piece and routes directly to `/checkout`.

### B. Product Detail Page (`/product/[slug]`)
- **Gallery Showcase:**
  - Multi-image vertical thumbnail strip on desktop. Clicking a thumbnail updates the main high-res viewport.
  - Active thumbnail features a prominent slate ring indicator.
- **Variant Selector (Color & Size):**
  - Color swatches with border ring on active selection.
  - Size pills with stock availability check. Out-of-stock sizes appear disabled with strikethrough.
- **Quantity Stepper:**
  - Minus / Plus buttons with stock ceiling bounding (cannot exceed available database stock).
- **Size Guide Trigger:**
  - Opens clean white modal with footwear (EU/UK/US/cm) and apparel sizing tables.

---

## 3. Cart & Multi-Step Checkout Interactions

### A. Shopping Bag
- **Optimistic Quantity Controls:** Clicking `+` or `-` updates quantity immediately; disables button when stock limit is reached.
- **Item Removal:** Removes line item with graceful fade and updates subtotal and tax amounts atomically.
- **Coupon Code Engine:** Input allows entry of valid coupon codes (e.g. `PATRON10`). Computes discount server-side.

### B. Interactive Checkout Flow
- **Step 1: Address Selection:**
  - Displays saved customer addresses with "Default" tag.
  - Includes "Add New Address" modal with Indian PIN code validation.
- **Step 2: Delivery Method:**
  - Standard Courier (Ground) vs Priority Air Express.
- **Step 3: Payment Simulation (`InteractivePaymentModal.tsx`):**
  - **UPI Intent:** Validates VPA format (`user@bank`), displays 10-second countdown with "Simulate Success" and "Simulate Timeout". Generates `DEMO-UTR-2026-XXXXXX`.
  - **Zero-Storage Card:** Pre-fills test numbers (`4242` for success, `4000` for decline). Never prompts for CVV/PIN.
  - **Cash on Delivery:** Runs fraud evaluation and marks order `PENDING_COLLECTION`.


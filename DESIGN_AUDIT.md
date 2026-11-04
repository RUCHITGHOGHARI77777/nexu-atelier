# NEXU ATELIER — LUXURY EDITORIAL DESIGN AUDIT

**Brand:** NEXU ATELIER  
**Aesthetic:** Warm Minimalist Luxury & Contemporary Artisan Editorial  
**References:** ZARA, COS, SSENSE, AESOP, APPLE, ACNE STUDIOS  
**Target Viewports:** 1920px (Desktop Wide), 1440px (Desktop Standard), 1366px (Laptop), 1024px (Tablet), 768px (Tablet Portrait), 390px (Mobile iPhone), 360px (Mobile Android)  
**Date:** 2026-11-04  

---

## 1. Visual Token Alignment

| Primitive | Specification | Implementation Verification |
|:---|:---|:---|
| **Background** | Clean ivory / slate-50 (`#f8fafc` / `#ffffff`) | Zero aggressive AI gradients. Pure editorial canvas. |
| **Typography (Display)** | `font-serif` (Playfair / editorial serif) | Applied to hero titles, catalog collection banners, and section headings. |
| **Typography (Body)** | `font-sans` (Inter / system sans) | Applied to descriptions, navigation, buttons, and labels for maximum legibility. |
| **Typography (Mono)** | `font-mono` (JetBrains / Roboto Mono) | Applied to currency prices, order IDs, timestamps, and stock badges. |
| **Color: Primary** | Zinc-950 (`#09090b`) | Primary action buttons, brand logo marks, heavy typography accents. |
| **Color: Neutral** | Slate-200 / Zinc-200 (`#e2e8f0` / `#e4e4e7`) | 1px precision borders, card separators, minimal divider lines. |
| **Color: Accent** | Amber-600 / Emerald-600 (`#d97706` / `#059669`) | Heritage artisan badges, stock indicators, escrow hold checkmarks. |

---

## 2. Component Audits & Design Decisions

### A. Navigation & Header
- **Positioning:** Fixed sticky top header (`sticky top-0 z-50 relative`) with white backdrop and subtle bottom border (`border-zinc-200`).
- **Mega Menu:** Dropdown opens directly beneath parent nav items with 250ms leave debounce and `onMouseEnter` cancellation, preventing sudden collapse while browsing.
- **Search:** Center search bar with 1px zinc-200 border, responsive flex shrinking, instant quick suggestions popup for popular searches.

### B. Product Cards
- **Aspect Ratio:** Exact 4:5 portrait ratio standard for high-end fashion and industrial design.
- **Hover Micro-interactions:** Subtle 105% smooth image zoom (`duration-500 ease-out`), desktop slide-up Quick Add button, floating action pill (Wishlist, Quick View, Compare).
- **Stock Badges:** Real database stock indicators (`Only {stock} Left` for $\le 3$), no hardcoded fake scarcity badges.

### C. Product Detail Page (PDP)
- **Gallery:** Multi-image thumbnail carousel with smooth zoom lightbox and color-variant switching.
- **Purchase Bar:** Size chips, quantity selector with $\ge 1$ bounding, direct Add to Bag with drawer slide-in, isolated Buy Now.
- **Artisan Provenance:** Dedicated maker studio card with origin hub and verified direct status.

### D. Cart & Checkout
- **Cart Bag:** Clean white card architecture with quantity +/- steppers, trash action, and prominent promotional coupon card.
- **Stepper Navigation:** 3-step checkout indicator (Address $\to$ Courier $\to$ Review & Payment) with explicit progress states.
- **Payment Modal:** Centered simulated gateway with NPCI UPI QR code, test card presets, and instantaneous test skip.

---
name: nexu-design-system
description: Premium editorial design system, typography scales, color primitives, card architectures, and accessibility guidelines for NEXU ATELIER. Enforces warm minimalist luxury aesthetic, zero artificial gradients, responsive viewports, and WCAG AA contrast standards.
metadata:
  author: NEXU ATELIER Creative Direction & Frontend Architecture
  version: "1.0.0"
  stack: "Next.js 14 App Router, React 18, Tailwind CSS 3.4, Framer Motion"
---

# NEXU ATELIER — Master Design System & Visual Standards

## 1. Aesthetic Philosophy: Warm Minimalist Luxury

NEXU ATELIER avoids generic SaaS / mass-market e-commerce clichés:
- **No generic purple/cyan neon gradients.**
- **No flashing countdown tickers or artificial FOMO pressure tactics.**
- **No frosted glassmorphism across every card.**
- **Embrace generous whitespace, warm neutral backdrops, crisp serif/sans typographic pairings, and tactile micro-interactions.**

---

## 2. Design Tokens & Color Primitives

Defined in `src/app/globals.css`:
```css
:root {
  /* Surfaces & Canvas */
  --canvas-bg: #F6F7F9;        /* Warm neutral canvas */
  --surface-primary: #FFFFFF;   /* Pure white card container */
  --surface-secondary: #F8FAFC; /* Subtle backing */
  --surface-tertiary: #F1F5F9;  /* Inactive / disabled backing */

  /* Text & Content */
  --text-primary: #17191F;      /* Deep slate / ink */
  --text-secondary: #64748B;    /* Refined metadata and body */
  --text-muted: #94A3B8;        /* Captions, subtle hints */

  /* Brand Accent */
  --accent-primary: #2457C5;    /* Signature NEXU Blue */
  --accent-hover: #1D46A6;      /* Deep cobalt active state */
  --accent-subtle: #EEF4FF;     /* Highlight badge background */

  /* Semantic Feedback */
  --status-success: #15803D;    /* Verified maker, in stock */
  --status-warning: #B45309;    /* Low stock, pending review */
  --status-danger: #B91C1C;     /* Out of stock, payment declined */

  /* Borders & Dividers */
  --border-subtle: #E2E8F0;
  --border-strong: #CBD5E1;
}
```

---

## 3. Typography Hierarchy

- **Primary Display & Headings:** `Playfair Display`, serif, tracking tight, refined editorial weight.
- **Interface & Body Text:** `Inter` or `Plus Jakarta Sans`, neutral geometric sans-serif for clarity.
- **Monospace Elements:** `JetBrains Mono` for order numbers, tracking AWBs, SKUs, and transaction IDs.

### Typographic Scale
- **Display 1 (Hero Title):** `text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight leading-[1.1]`
- **Heading 2 (Section Title):** `text-2xl md:text-3xl font-serif text-[#17191F]`
- **Heading 3 (Card Title):** `text-lg font-medium text-[#17191F]`
- **Body Regular:** `text-sm text-[#64748B] leading-relaxed`
- **Caption / Meta:** `text-xs uppercase tracking-wider text-[#94A3B8] font-semibold`

---

## 4. Component Standards

### 4.1 Product Card Architecture
Every product card must render:
1. Aspect-ratio preserved image container (3:4 or 4:5 luxury portrait ratio).
2. Studio / Maker origin pill (e.g., "Chanderi Weavers Guild").
3. Product title in high-contrast ink.
4. Integer paise price formatted in INR (`₹X,XXX`).
5. Compare-at price with strike-through when discounted.
6. Genuine star rating and review count from database.
7. Real-time availability pill (In Stock, Low Stock, or Sold Out).
8. Interactive actions: Quick View modal trigger, Wishlist toggle, and 1-Click Add to Bag.

### 4.2 Accessibility & Usability (WCAG 2.1 AA)
- Text contrast ratio must meet or exceed 4.5:1 against respective backgrounds.
- Interactive touch targets must be at least $44 \times 44$ pixels on mobile viewports.
- All form inputs must have visible associated `<label>` elements or accessible `aria-label` attributes.
- Responsive breakpoints tested across 375px (mobile), 768px (tablet), 1024px (small desktop), and 1440px+ (large display).


# NEXU ATELIER — Design System & Editorial Guidelines

## 1. Visual Philosophy: Warm Minimalist Luxury
NEXU ATELIER rejects cluttered, bright discount-driven e-commerce templates in favor of an editorial, high-fashion art gallery aesthetic. Every page communicates restraint, craftsmanship, and timeless elegance.

### Core Design Principles:
1. **White-First Editorial Canvas:** Pure white (`#FFFFFF`) and warm alabaster (`#FAFAF8`) create breathing room for high-resolution artisanal photography.
2. **Restrained Color Primitives:**
   - **Canvas Background:** `#FFFFFF` (Pure White) and `#FAFAF8` (Warm Alabaster)
   - **Muted Surfaces:** `#F4F4F0` (Gallery Stone) and `#E8E8E4` (Subtle Border Grey)
   - **Deep Typographic Ink:** `#1A1A1A` (Deep Charcoal) and `#4A4A4A` (Secondary Slate)
   - **Artisanal Accents:** `#8C7355` (Burnished Bronze) and `#2D4A3E` (Deep Forest Emerald)
3. **Zero Artificial Gradients:** No harsh neon gradients, flashing countdown timers, or intrusive discount banners.

---

## 2. Typography Hierarchy & Tokens

| Level | Font Family | Size / Line-Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display 1** | Cormorant Garamond | `3.5rem / 1.1` | `-0.02em` | Editorial Hero Headline |
| **Heading 1** | Cormorant Garamond | `2.5rem / 1.2` | `-0.01em` | Page & Section Titles |
| **Heading 2** | Cormorant Garamond | `1.75rem / 1.3` | `0em` | Product Titles, Modal Headers |
| **Subheading**| Montserrat | `1.125rem / 1.5` | `+0.05em` | Category Overlines, Uppercase Labels |
| **Body Primary**| Montserrat | `0.9375rem / 1.6`| `0em` | Product Descriptions, Editorial Prose |
| **Caption / Fine**| Montserrat | `0.75rem / 1.4` | `+0.08em` | HSN Codes, Metadata, Timestamps |

---

## 3. Component Architecture & Micro-Interactions

### 3.1 Product Card
- **Aspect Ratio:** Standardized 4:5 editorial portrait crop.
- **Hover Micro-Interaction:** Subtle 1.03x image zoom with a smooth 400ms cubic-bezier transition, secondary angle reveal, and subtle slide-up "Quick View" and "Add to Bag" action pill.
- **Pricing & Taxonomy:** Displays artisan studio name in muted uppercase caption, item title in Cormorant serif, and price formatted in Indian Rupees (`₹XX,XXX`) with tax inclusion badge.

### 3.2 1-Click Instant "Buy Now" Modal
- **Behavior:** Opens an isolated, focused checkout drawer directly from the PDP without modifying the persistent cart state.
- **Form Controls:** Clean single-line floating input fields, address selector, payment choice, and real-time integer paise breakdown.

### 3.3 Supplier Costing & Pricing Calculator
- **Visual Design:** Dual-mode interactive tabbed workspace featuring real-time sliders for raw material, artisan labor, packaging, and logistics.
- **Dynamic Gauges:** Live SVG donut gauges illustrating net profit margin percentage and color-coded break-even indicators.

---

## 4. Accessibility & Inclusivity (WCAG 2.1 AA)
- **Contrast Ratios:** All body text meets or exceeds the 4.5:1 contrast ratio against background surfaces (Deep Charcoal on Pure White is 14.8:1).
- **Keyboard Navigation:** Explicit, unobtrusive focus rings (`ring-1 ring-neutral-400`) on all interactive buttons, links, and form fields.
- **Screen Reader Support:** Semantic HTML5 tags (`<main>`, `<nav>`, `<article>`, `<aside>`), descriptive `aria-label` attributes on icon-only buttons, and `aria-live` announcements for dynamic bag updates.

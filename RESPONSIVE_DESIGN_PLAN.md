# NEXU ATELIER — RESPONSIVE DESIGN SPECIFICATION

**Version:** 1.0.0  
**Target Viewports:** 320px to 2560px+

---

## 1. Breakpoint Taxonomy

| Token | Breakpoint | Typical Hardware | Target Layout Strategy |
|---|---|---|---|
| **sm** | `640px` | Large mobile (iPhone Pro Max, Pixel) | 2-column product grid, stacked hero bento, full-width search |
| **md** | `768px` | Small tablets (iPad Mini, Surface Go) | 2-to-3 column grid, expanded breadcrumb trail |
| **lg** | `1024px` | Tablets landscape, laptops (MacBook Air 13") | 3-to-4 column grid, sticky product info sidebar, horizontal nav links |
| **xl** | `1280px` | Desktop displays | 4-column catalog grid, full bento layout, expanded filters sidebar |
| **2xl** | `1536px+` | Large monitors & studio displays | Max container constrained to `max-w-7xl` (`80rem` / `1280px`) to prevent ultra-wide distortion |

---

## 2. Page-Specific Responsive Adaptations

### A. Homepage & Bento Showcase
- **Mobile (`< 640px`):** Bento items stack vertically in a single fluid column. Primary CTA spans 100% width for effortless one-handed thumb interaction.
- **Desktop (`>= 1024px`):** Asymmetrical 7-column / 5-column bento composition. Curated piece on left, supporting atelier pillars on right.

### B. Catalog & Product Grids (`/shop`, `/catalog`)
- **Mobile (`< 640px`):** 2-column grid (`grid-cols-2 gap-3.5`). Action buttons switch to icon + text or compact stacked layout. Filters collapse into a slide-over bottom sheet.
- **Desktop (`>= 1024px`):** 3-to-4 column grid (`grid-cols-3` or `grid-cols-4 gap-6`). Left-hand sticky sidebar for faceted category, price range, and verified maker filters.

### C. Product Detail Page (`/product/[slug]`)
- **Mobile (`< 640px`):** Horizontal swipeable image carousel with indicator dots. Sticky bottom "Add to Bag" bar with instant price display.
- **Desktop (`>= 1024px`):** Split 12-column layout (`7 cols` for gallery + specs, `5 cols` for sticky purchase box).

### D. Cart & Multi-Step Checkout
- **Mobile (`< 640px`):** Single-column stepped flow. Order summary collapses into an expandable drawer.
- **Desktop (`>= 1024px`):** 2-column split (Form controls on left, sticky order summary and line item review on right).

---

## 3. Touch Target & Accessibility Guidelines

- **Minimum Hit Area:** Every clickable button, icon link, and filter chip enforces a minimum target area of `44px x 44px` on mobile viewports.
- **Typography Scaling:** Fluid typography utilizing Tailwind's `text-xs sm:text-sm lg:text-base` to guarantee legibility on small phone screens without manual zooming.

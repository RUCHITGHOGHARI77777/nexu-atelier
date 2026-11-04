# NEXU ATELIER — MOTION & ANIMATION GUIDELINES

**Version:** 1.0.0  
**Stack:** Tailwind CSS Transitions + CSS Keyframes + React Spring Physics

---

## 1. Motion Philosophy

In luxury editorial commerce, motion must feel **tactile, natural, and restrained**. Animation is used strictly to orient the patron and confirm their intent, never as gratuitous digital spectacle.

### Core Principles
1. **Physical Weight:** Elements accelerate and decelerate naturally using custom ease-out curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
2. **Subtle Elevation:** Cards elevate slightly (`-translate-y-1`) with soft diffused shadows rather than harsh bouncy movements.
3. **No Decorative Clutter:** Avoid spinning icons, oscillating banners, or constant pulsating borders on retail cards.

---

## 2. Motion Tokens & Easing Curves

```css
/* Timing Tokens */
--duration-instant: 100ms;   /* Button active tap feedback */
--duration-fast: 200ms;      /* Tooltip, dropdown, hover color changes */
--duration-normal: 300ms;    /* Card elevation, drawer slide, modal fade */
--duration-editorial: 500ms; /* Image zoom, hero entrance reveals */

/* Easing Curves */
--ease-editorial: cubic-bezier(0.16, 1, 0.3, 1); /* Custom smooth deceleration */
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 3. Glassmorphism Discipline

Glassmorphism (`backdrop-blur` + translucent background) is restricted strictly to **floating functional layers**:

- **Allowed Surfaces:**
  - Sticky Top Navigation Bar (`bg-white/95 backdrop-blur-2xl`)
  - Floating Quick View overlays (`bg-white/95 backdrop-blur-md`)
  - Cart Drawer & Dialog Backdrops (`bg-slate-950/40 backdrop-blur-sm`)
  - Sticky Checkout summary bar on mobile viewports
- **Forbidden Surfaces:**
  - Standard product cards (must remain solid `#FFFFFF` for contrast and image fidelity)
  - Text-heavy specification tables and legal documentation

---

## 4. Hardware Acceleration & Performance

- **Composite Properties Only:** Animate strictly `transform` and `opacity`. Never animate `width`, `height`, `margin`, or `padding` to prevent layout thrashing and repaint cycles.
- **Image Transitions:** Product photography scaling on hover is clamped to `scale-105` over 500ms with `will-change: transform`.

---

## 5. Accessibility & `prefers-reduced-motion`

All motion must respect system preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```


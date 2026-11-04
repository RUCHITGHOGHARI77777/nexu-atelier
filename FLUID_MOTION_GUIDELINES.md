# NEXU ATELIER — SPECULAR FLUID MOTION GUIDELINES

**Aesthetic Concept:** "Water-Like Flow" — Frictionless, natural, continuous, and soothing.  
**Design Philosophy:** Motion is not decorative distraction; it provides tactile clarity, structural continuity, and luxury feedback across the patron journey.

---

## 1. Core Physics & Timing Architecture

All motion adheres to calibrated time constants and organic bezier acceleration:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MOTION TIMING CHRONOLOGY                        │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│ Category                 │ Duration Range           │ Easing Curve     │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ Micro-interactions       │ 160ms – 220ms            │ ease-out         │
│ Button Hovers & Taps     │ 180ms – 260ms            │ cubic-bezier(...)│
│ Dropdowns & Popovers     │ 220ms – 300ms            │ cubic-bezier(...)│
│ Drawers & Side Panels    │ 280ms – 380ms            │ cubic-bezier(...)│
│ Page & View Transitions  │ 240ms – 400ms            │ ease-out         │
└──────────────────────────┴──────────────────────────┴──────────────────┘
```

### The Signature "Fluid Water" Curve:
```css
/* Cubic Bezier: Specular Fluid Stream */
--fluid-ease: cubic-bezier(0.16, 1, 0.3, 1);
--fluid-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```
- **Initial velocity:** Fast acceleration (immediate reaction to user touch/click).
- **Deceleration:** Long, gentle damping (like water settling into equilibrium).
- **Bounciness:** Strictly restrained (zero jarring oscillations).

---

## 2. Six Dimensions of Fluid Interaction

### A. Page & Route Transitions
- **Visual Cue:** Soft opacity fade combined with a subtle 4px upward float.
- **Duration:** 260ms.
- **Rule:** Never blank out the viewport or cause layout jumps. Navigation shell remains mounted while route contents cross-fade gracefully.

### B. Scroll Experience
- **Native Smooth Scrolling:** Enabled globally (`html { scroll-behavior: smooth; }`).
- **Scroll Reveals:** Sections enter viewport with a subtle `translateY(8px)` -> `translateY(0)` at `320ms`.
- **Zero Scroll Hijacking:** Patrons maintain 100% direct control over wheel and trackpad momentum.

### C. Hover Dynamics
- **Product Card Image Zoom:**
  - Transition: `transform 400ms var(--fluid-ease)`
  - Scale: `scale(1.03)` on hover (never exceeding 1.04 to prevent blur).
- **Card Surface Lift:**
  - Transition: `all 240ms var(--fluid-ease)`
  - Lift: `translateY(-3px)`, shadow expands from 4px to 16px soft shadow.
- **Underline Ripples:**
  - Links expand a hairline border from center outwards: `transform: scaleX(0) -> scaleX(1)`.

### D. Navigation & Menu Motion
- **Mega Menu Opening:**
  - Slide down: `translateY(-8px)` -> `translateY(0)` with opacity `0` -> `1`.
  - Duration: `240ms`.
- **Cart Drawer:**
  - Slide from right: `translateX(100%)` -> `translateX(0)`.
  - Duration: `320ms` with `--fluid-ease`.
  - Backdrop Blur: `0px` -> `8px` blur with `rgba(23, 23, 23, 0.2)`.

### E. Shopping Interaction Feedback
- **"Add to Bag" Feedback:**
  - Button momentarily scales to `0.97`, then displays an elegant checkmark and gold ripple before returning to idle.
  - Header Bag counter executes a soft pulse: `scale(1.2)` -> `scale(1)` in `200ms`.
- **Wishlist Heart:**
  - Heart icon morphs with a subtle pop `scale(1.25)` -> `scale(1)` with a soft rose/gold wash.

### F. Checkout Progression
- **Stepper Animation:**
  - Number indicator smoothly checks off with an emerald border glow.
  - Next step collapses previous accordion and smoothly unfolds next fields in `280ms`.
- **Payment Gateway Simulation:**
  - Simulated UPI push notification slides down from the top like an iOS banner in `220ms`.

---

## 3. Accessibility & Performance Enforcements

1. **Strict Reduced-Motion Support (`prefers-reduced-motion: reduce`):**
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
2. **GPU Hardware Acceleration:**
   - All animated elements declare `will-change: transform, opacity;` or utilize CSS `transform` / `opacity` exclusively to preserve 60fps on mobile.
   - Avoid animating layout-triggering properties (`width`, `height`, `margin`, `padding`, `top`, `left`).


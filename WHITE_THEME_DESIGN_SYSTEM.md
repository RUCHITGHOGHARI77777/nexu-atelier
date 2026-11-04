# NEXU ATELIER — WHITE THEME DESIGN SYSTEM SPECIFICATION

**Edition:** 2026 Sovereign White Edition  
**Aesthetic Core:** International Minimalist Luxury • Editorial White-First • High Specular Clarity  
**WCAG Compliance:** Strict 2.1 AA Contrast Ratios (Minimum 4.5:1 text against backgrounds)

---

## 1. Master Palette Tokens

The palette below is codified across all components, layout wrappers, and Tailwind utility extensions.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRIMARY BACKGROUND SYSTEM                       │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│ Token                    │ Hex Value                │ Semantic Purpose │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ surface                  │ #FFFFFF                  │ Pure Card / Form │
│ canvas (secondary)       │ #FAFAF8                  │ Page Background  │
│ section (alternate)      │ #F5F6F4                  │ Alternating Row  │
│ border-main              │ #E8E8E4                  │ Refined Divider  │
│ border-strong            │ #D4D4CF                  │ Input / Active   │
└──────────────────────────┴──────────────────────────┴──────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        TYPOGRAPHY CONTRAST SYSTEM                      │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│ Token                    │ Hex Value                │ Contrast Ratio   │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ text-primary (charcoal)  │ #171717                  │ 16.1 : 1 (AAA)   │
│ text-secondary (slate)   │ #626262                  │ 5.8 : 1 (AA)     │
│ text-muted (light slate) │ #767676                  │ 4.54 : 1 (AA)    │
└──────────────────────────┴──────────────────────────┴──────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                       LUXURY & STATUS ACCENT SYSTEM                    │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│ Token                    │ Hex Value                │ Semantic Purpose │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ accent-luxury (gold)     │ #B78B45                  │ Luxury Trim / Pin│
│ accent-gold-soft         │ #F8F2E6                  │ Gold Badge Fill  │
│ accent-gold-dark         │ #8A631E                  │ Gold Badge Text  │
│ status-emerald           │ #21866F                  │ Stock / Verified │
│ status-emerald-soft      │ #EAF6F0                  │ Emerald Badge BG │
│ status-rose              │ #C2410C                  │ Alert / Out-stock│
│ status-rose-soft         │ #FDF2E9                  │ Rose Badge BG    │
└──────────────────────────┴──────────────────────────┴──────────────────┘
```

---

## 2. Button Architecture (Prominent White-First Controls)

Per the design owner's instruction, controls remain prominent and clickable without heavy black fills:

### 1. Primary Action Button (`variant="primary"`)
- **Default State:**
  - Background: `#FFFFFF`
  - Border: `1.5px solid #171717`
  - Text: `#171717` (Font-weight: 700 / Semi-bold, Letter-spacing: +0.02em)
  - Shadow: `0 1px 3px rgba(0, 0, 0, 0.04)`
  - Radius: `12px` (rounded-xl) or `9999px` (rounded-full)
- **Hover State:**
  - Background: `#FAFAF8`
  - Border Color: `#B78B45` (Subtle Luxury Gold Shift)
  - Text Color: `#B78B45`
  - Transform: `translateY(-1px)`
  - Shadow: `0 4px 12px rgba(183, 139, 69, 0.12)`
  - Transition: `all 200ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Active State:**
  - Transform: `scale(0.98)`
- **Disabled State:**
  - Background: `#F5F6F4`
  - Border: `1px solid #E8E8E4`
  - Text: `#929292`
  - Cursor: `not-allowed`

### 2. Luxury Accent Button (`variant="accent"` / "Buy Now")
- **Default State:**
  - Background: `#F8F2E6`
  - Border: `1px solid #B78B45`
  - Text: `#8A631E` (Darkened Gold for AA contrast)
  - Shadow: `0 1px 2px rgba(183, 139, 69, 0.08)`
- **Hover State:**
  - Background: `#F3E8D2`
  - Border Color: `#8A631E`
  - Text Color: `#171717`
  - Transform: `translateY(-1px)`
  - Transition: `all 200ms ease-out`

### 3. Secondary / Outline Button (`variant="outline"`)
- **Default State:**
  - Background: `transparent`
  - Border: `1px solid #E8E8E4`
  - Text: `#171717`
- **Hover State:**
  - Background: `#FAFAF8`
  - Border Color: `#D4D4CF`
  - Text Color: `#171717`

### 4. Bag / Cart Trigger Button
- **Desktop Trigger:**
  - Background: `#FFFFFF`
  - Border: `1px solid #E8E8E4`
  - Counter Pill: `bg-[#F8F2E6] text-[#8A631E] border border-[#B78B45]/40`
  - Hover: `border-[#171717] shadow-xs`

---

## 3. Surface & Card Specifications

### 1. Standard Product Card (`.product-card`)
- Background: `#FFFFFF`
- Border: `1px solid #E8E8E4`
- Radius: `16px` (rounded-2xl)
- Padding: `0` (Image full bleed at top with `12px` rounded top corners)
- Hover Behavior:
  - Transform: `translateY(-3px)`
  - Shadow: `0 12px 30px rgba(0, 0, 0, 0.04)`
  - Border: `1px solid #D4D4CF`
  - Quick Action Overlay: Reveals `#FFFFFF/95` action pill with `#171717` border

### 2. Form Input Architecture (`.form-input`)
- Background: `#FFFFFF`
- Border: `1px solid #E8E8E4`
- Text: `#171717`
- Placeholder: `#929292`
- Focus State:
  - Border Color: `#B78B45`
  - Ring: `3px solid rgba(183, 139, 69, 0.15)`
  - Outline: `none`

### 3. Modal & Drawer Overlay System
- Backdrop: `rgba(23, 23, 23, 0.25)` with `backdrop-filter: blur(8px)` (eliminates heavy black overlay)
- Modal Window: `#FFFFFF` surface, `1px solid #E8E8E4`, `box-shadow: 0 24px 60px rgba(0, 0, 0, 0.08)`
- Drawer: `#FFFFFF` surface, `border-l border-[#E8E8E4]`, smooth slide-in from right.

---

## 4. Typography Scale & Hierarchy

- **Editorial Title 1 (Hero/Brand):** Serif / Display (`Playfair Display` or `Cinzel`), 44px–56px, line-height 1.1, `#171717`
- **Section Heading 2:** Sans-serif Semi-bold, 28px–36px, letter-spacing -0.02em, `#171717`
- **Card Title / Subheading:** Sans-serif Medium, 15px–18px, `#171717`
- **Body Regular:** Sans-serif, 14px–16px, line-height 1.6, `#626262`
- **Microcopy / Badges:** Mono / Sans, 11px–12px, uppercase tracking-widest, `#767676` or `#8A631E`

---

## 5. Status Badges

- **Verified In Stock:** Background `#EAF6F0`, Border `#21866F/30`, Text `#21866F`
- **Artisan Showcase / Limited Drop:** Background `#F8F2E6`, Border `#B78B45/40`, Text `#8A631E`
- **Escrow Protected:** Background `#FFFFFF`, Border `#E8E8E4`, Text `#171717`, Emerald Icon `#21866F`


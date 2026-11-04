# NEXU ATELIER — Master Design System Specification

## 1. Design Philosophy

NEXU ATELIER embodies warm minimalist luxury inspired by fine museum editorial design. We reject artificial gradients, synthetic glowing animations, and heavy dark card surfaces. Luminous white surfaces, delicate 1.5px/2px light borders, generous spatial proportions, and warm gold accents frame and honor handcrafted artisan pieces.

---

## 2. Master Color Tokens

| Token Name | Hex Code | Visual Application |
|---|---|---|
| `surface.pure` | `#FFFFFF` | Main cards, dialogue modals, drawers, input fields, button fills |
| `surface.canvas` | `#FAFAF8` | Master page background, secondary cards, unselected tabs |
| `surface.section` | `#F5F6F4` | Alternate section strips, table header rows |
| `border.light` | `#E8E8E4` | 1.5px structural borders, dividers, subtle card boundaries |
| `text.charcoal` | `#171717` | High-contrast luxury headings, bold numbers, primary labels |
| `text.secondary`| `#626262` | Body copy, secondary descriptions, specifications |
| `text.muted`    | `#767676` | Captions, timestamps, disabled indicators, micro-labels |
| `accent.gold`   | `#B78B45` | Luxury atelier badges, focus rings, primary hover shifts |
| `accent.goldSoft`| `#F8F2E6`| Background for luxury badges, active cart badge pills |
| `state.emerald` | `#21866F` | Positive contribution profit, confirmed orders, in-stock badges |
| `state.emeraldSoft`| `#EAF6F0`| Background for verified tags, success alerts |
| `state.rose`    | `#C94A4A` | Critical loss warnings, validation blockers, errors |

---

## 3. Interactive Component Standards

### 3.1 Primary Buttons
- Fill: `#FFFFFF`
- Border: `2px solid #171717`
- Typography: `#171717`, weight `700`, font size `12px` (`text-xs`)
- Shadow: `shadow-xs`
- Hover Shift: `hover:border-[#B78B45] hover:text-[#B78B45] hover:bg-[#FAFAF8]`
- Fluid Transition: `transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)`

### 3.2 Secondary & Outline Buttons
- Fill: `#FAFAF8`
- Border: `1px solid #E8E8E4`
- Typography: `#626262`, weight `600`
- Hover: `hover:bg-[#E8E8E4] hover:text-[#171717]`

### 3.3 Cards & Containers
- Surface: `#FFFFFF` with `1.5px solid #E8E8E4`
- Radius: `rounded-2xl` (`16px`)
- Padding: `p-6` (desktop), `p-4` (mobile)
- Zero large black cards across customer, seller, or admin portals.

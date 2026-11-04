# NEXU ATELIER — Design Reference Analysis & Architectural Comparison

## 1. Visual Architecture Analysis

An empirical comparison between historical visual artifacts (in `screenshots/` and `public/screenshots/`) and the live codebase confirms that the platform has successfully transitioned from an early prototype with fragmented dark panels and disparate branding into a cohesive, museum-grade **White & Light Editorial Design System**.

---

## 2. Key Structural Findings

### 2.1 Photographic Preservation
- In historical iterations, product photography risked being washed out or obscured by aggressive dark gradient backdrops.
- In the current white architecture, product photography (handloom silks, lost-wax brass, glazed ceramics) sits cleanly against `#FAFAF8` and `#FFFFFF` canvases, reproducing fabric textures, metallic lusters, and weave geometries with museum fidelity. Under no circumstances are natural photograph pixels modified.

### 2.2 Button & Interactive Element Hierarchy
- Earlier iterations relied on heavy black fills (`bg-zinc-950` / `bg-slate-900`) for primary action buttons.
- In the approved editorial system, buttons achieve superior tactile prominence using:
  ```css
  bg-white border-2 border-[#171717] text-[#171717] font-bold shadow-xs hover:border-[#B78B45] hover:text-[#B78B45] hover:bg-[#FAFAF8]
  ```
- Secondary actions utilize soft light fills (`bg-[#FAFAF8] border-[#E8E8E4] text-[#626262]`).

### 2.3 Fluid Motion Dynamics
- Transitions between wizard steps, modal lightboxes, and cart drawers adhere to a standardized physical spring curve:
  ```css
  transition: all 260ms cubic-bezier(0.16, 1, 0.3, 1);
  ```
- Complies strictly with WCAG `prefers-reduced-motion: reduce`.

### 2.4 Information Architecture Alignment Across Portals
- **Customer:** High visual elegance, large editorial photography, prominent reviews, frictionless checkout.
- **Supplier:** High density, dual-column input/summary ledger, real-time GST scenario previews, interactive margin calculators.
- **Admin:** Enterprise governance tables, audit logs, toggle controls, moderation SLA tracking.


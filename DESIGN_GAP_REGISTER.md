# NEXU ATELIER — Design Gap Register & Resolution Audit

## 1. Scope & Objective

This register records all visual, architectural, and branding discrepancies identified during the comprehensive audit and tracks their concrete resolutions.

---

## 2. Identified Discrepancies and Implemented Resolutions

| Item # | Identified Discrepancy | Location | Implemented Resolution | Verification Status |
|:---:|---|---|---|:---:|
| **G1** | Stray "AuraMart Enterprise" branding in preset selector and merchant UPI ID | `AdminCommandCenterSaaS.tsx`, `StoreContext.tsx` | Replaced all references with "NEXU ATELIER" and `nexu.atelier@icici`. Cleaned fallback toast messages. | **RESOLVED & VERIFIED** |
| **G2** | Lingering black backgrounds on marketing banners and hero escrow cards | `EditorialHeroSection.tsx`, `EditorialCampaignBanner.tsx` | Replaced `bg-zinc-950` with `#FAFAF8` canvas, `#E8E8E4` borders, and white fact cards. | **RESOLVED & VERIFIED** |
| **G3** | Dark theme styling on Customer Help Center | `src/app/help/page.tsx` | Fully rewritten with 6 pure white luxury cards, gold outline icons, and light `#FAFAF8` background. | **RESOLVED & VERIFIED** |
| **G4** | Single-page cumbersome product form in Supplier Hub | `src/app/seller/products/new/page.tsx` | Replaced with the 6-step `SupplierProductCreationWizard.tsx` featuring live costing, HSN lookup, and P&L ledger. | **RESOLVED & VERIFIED** |
| **G5** | Dark modal backdrop blur in payment simulation and product quick view | `InteractivePaymentModal.tsx`, `ProductQuickViewModal.tsx` | Replaced `bg-black/90` with luminous `bg-black/30 backdrop-blur-sm` and gallery-grade white lightbox containers. | **RESOLVED & VERIFIED** |
| **G6** | Missing Statutory GST HSN mapping for handicrafts | Listing form | Implemented `src/lib/tax-hsn-directory.ts` integrating **Notification 13/2025-Central Tax (Rate), dated 17 September 2025**. | **RESOLVED & VERIFIED** |

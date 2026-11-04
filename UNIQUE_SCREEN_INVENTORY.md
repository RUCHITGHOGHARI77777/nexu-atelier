# NEXU ATELIER — UNIQUE SCREEN INVENTORY & ARCHITECTURAL TAXONOMY

**Project:** NEXU ATELIER (`D:\Ecommerce Project Real`)  
**Design Paradigm:** White-First Editorial Luxury Marketplace  
**Color Profile:** Strict White/Light Palette (#FFFFFF, #FAFAF8, #F5F6F4, #E8E8E4, #171717)  
**Motion Profile:** Specular Fluid Motion (160ms–380ms ease-out transitions)

---

## 1. Inventory Summary & Classification

Across the project codebase and the 120+ screenshot states in `screenshots/`, every interface has been catalogued and grouped into **21 unique screen categories**. Repeated states (e.g. active dropdowns, filled vs. empty inputs, simulator overlays) are consolidated into their respective parent templates.

```
Total Unique Screen Templates: 21
Total Viewport Archetypes: 4 (Mobile 375/390px, Tablet 768px, Laptop 1366px, Desktop 1440/1920px)
Existing Dark/Black UI Areas Identified: 48 Component Blocks
Target Theme: 100% Coherent Premium White / Gallery Light
```

---

## 2. Exhaustive Unique Screen Directory

| ID | Unique Screen Template | Source Route / Component | Primary Screenshots | Dark Elements to Convert to White |
|:---|:---|:---|:---|:---|
| **SCR-01** | **Public Homepage** | `src/app/page.tsx`<br>`BentoHeroSection.tsx`<br>`EditorialHeroSection.tsx` | `storefront_homepage.png`<br>`customer_01_homepage.png`<br>`v2_01_storefront_homepage_desktop.png`<br>`audit_1440x900_desktop_standard.png` | Black announcement bar, dark hero button fills, black section banners, dark badge pills |
| **SCR-02** | **Header & Navigation Mega Menus** | `src/components/layout/Header.tsx`<br>`CustomerStorefrontNavbar.tsx`<br>`StorefrontMegaMenu.tsx` | `nexu_01_storefront_brand_switcher.png`<br>`v2_01_storefront_homepage_desktop.png` | Black "Bag" pill button, dark dropdown shadows, black badge counters, dark search trigger |
| **SCR-03** | **Catalog & Category Hub** | `src/app/shop/page.tsx`<br>`src/app/category/[slug]/page.tsx`<br>`src/app/guilds/page.tsx` | `01_public_catalog.png`<br>`customer_02_catalog.png`<br>`v2_02_catalog_archive_desktop.png`<br>`storefront_categories_hub.png` | Dark filter chips, black active page buttons, dark slider tracks, black drawer triggers |
| **SCR-04** | **Product Card Architecture** | `src/components/products/ProductCard.tsx`<br>`ProductCardSaaS.tsx`<br>`CatalogGrid.tsx` | `customer_02_catalog.png`<br>`demo_02_catalog_browse.png` | Black "Add to Bag" hover buttons, black "Quick View" floating pills, dark discount badges |
| **SCR-05** | **Product Detail Page (PDP)** | `src/app/product/[slug]/page.tsx`<br>`ProductGallery.tsx`<br>`ProductInfo.tsx` | `05_product_detail_page.png`<br>`customer_03_product_detail.png`<br>`v2_04_product_detail_robe_desktop.png`<br>`audit_pdp_mulberry_silk_1440x900.png` | Black "Add to Bag" primary button, black "Buy Now" button, dark thumbnail selection borders, dark specs block |
| **SCR-06** | **Product Social Trust, Reviews & QA** | `src/components/products/ProductReviews.tsx`<br>`ProductQA.tsx`<br>`SubmitReviewModal.tsx` | `phase12_01_public_trust_wall_hero.png`<br>`phase12_02_submit_review_modal_filled.png` | Black "Write Review" button, black "Ask Question" button, dark modal backdrop/header |
| **SCR-07** | **Search & Live Discovery** | `src/app/search/page.tsx`<br>`StorefrontFilterBar.tsx` | `storefront_search_discovery.png`<br>`phase1_02_filter_electronics.png` | Black search bar borders/buttons, black filter chips, dark query count banner |
| **SCR-08** | **Shopping Bag (Cart Page)** | `src/app/cart/page.tsx`<br>`src/lib/cart-calculations.ts` | `customer_04_cart.png`<br>`demo_05_cart_with_coupon.png`<br>`v2_05_shopping_bag_desktop.png`<br>`tax_01_cart_before_coupon.png` | Black "Proceed to Escrow Checkout" button, black coupon apply button, dark summary card accents |
| **SCR-09** | **Interactive Cart Drawer** | `src/components/cart/CartDrawer.tsx`<br>`CartDrawerSaaS.tsx` | `demo_04_cart_drawer_opened.png`<br>`phase1_05_cart_drawer.png`<br>`enterprise_03_cart_drawer_multicurrency.png` | Black drawer header, black checkout CTA button, dark backdrop opacity |
| **SCR-10** | **Multi-Step Escrow Checkout** | `src/app/checkout/page.tsx`<br>`PaymentMethodSelector.tsx` | `customer_05_checkout.png`<br>`demo_06_checkout_page.png`<br>`v2_06_checkout_patron_desktop.png`<br>`tax_03_checkout_step1.png`<br>`tax_04_checkout_step3.png` | Black stepper badges, black "Continue/Proceed" buttons, black payment method tabs, black "Confirm COD" button |
| **SCR-11** | **Interactive Payment Simulator Modal** | `src/components/checkout/InteractivePaymentModal.tsx` | `payment_stop_point_modal.png`<br>`phase2_05_upi_modal_idle.png`<br>`phase2_07_upi_approval_success.png` | Black modal header, dark QR simulation container, black "Authorize & Simulate" button |
| **SCR-12** | **Order Confirmation & GST Invoice** | `src/app/checkout/confirmation/page.tsx` | `customer_06_confirmation.png`<br>`demo_07_order_confirmation.png`<br>`phase9_05_clean_printable_gst_invoice.png`<br>`tax_05_confirmation.png` | Black order badge, dark action buttons ("Print Official Tax Invoice", "Track Shipment") |
| **SCR-13** | **Customer Order History Archive** | `src/app/account/orders/page.tsx` | `customer_08_account_orders.png`<br>`demo_08_account_orders.png` | Black "View Details" buttons, dark status pills, dark filter tabs |
| **SCR-14** | **Customer Order Details & Timeline** | `src/app/account/orders/[id]/page.tsx` | `demo_09_order_detail_view.png`<br>`phase2_09_delivery_tracker_stages.png` | Black tracking nodes, dark delivery details header, dark invoice download button |
| **SCR-15** | **Consignment Order Tracking** | `src/app/track/page.tsx` | `storefront_track_order.png`<br>`storefront_track_order_result.png`<br>`v2_10_consignment_tracking_desktop.png` | Black "Track Package" button, dark stage progress bar |
| **SCR-16** | **Customer Authentication Modal** | `src/components/auth/FirebaseAuthModal.tsx` | `phase2_01_firebase_auth_identity_modal.png`<br>`customer_10_reset_password.png` | Black modal title bar, black "Continue with Email/Phone" button, dark social login buttons |
| **SCR-17** | **Customer Account Hub & Settings** | `src/app/account/page.tsx`<br>`src/app/account/profile/page.tsx`<br>`src/app/account/addresses/page.tsx` | `customer_account_hub.png`<br>`customer_07_account_dashboard.png`<br>`customer_privacy_center.png` | Black sidebar active states, black "Save Changes" buttons, black "Add Address" CTA |
| **SCR-18** | **Customer Wishlist Hub** | `src/app/wishlist/page.tsx` | `customer_09_wishlist.png`<br>`customer_wishlist.png` | Black "Move All to Bag" button, black remove icon hover |
| **SCR-19** | **Editorial, About, FAQ & Concierge** | `src/app/about/page.tsx`<br>`src/app/faq/page.tsx`<br>`src/app/contact/page.tsx` | `v2_07_about_philosophy_desktop.png`<br>`v2_08_contact_concierge_desktop.png`<br>`v2_09_knowledge_base_faq_desktop.png` | Black accordions, dark contact submit button, black banner blocks |
| **SCR-20** | **Existing Supplier Portal Interfaces** | `src/app/seller/**`<br>`src/components/supplier/SupplierPortalSaaS.tsx`<br>`SellerNav.tsx` | `02_seller_products_dashboard.png`<br>`03_seller_new_product_form.png`<br>`phase3_01_supplier_portal_kpis.png`<br>`seller_mod1_01_profit_calculator_slider.png` | Black supplier sidebar, dark metric tiles, black "Publish Piece" button, dark modal headers |
| **SCR-21** | **Existing Admin Command Center Interfaces** | `src/app/admin/**`<br>`src/components/admin/AdminCommandCenterSaaS.tsx`<br>`AdminNav.tsx` | `04_admin_moderation_queue.png`<br>`admin_dashboard.png`<br>`admin_fraud_dashboard.png`<br>`admin_cod_dashboard.png`<br>`phase3_05_admin_command_center.png` | Black admin sidebar, black table headers, dark badge pills, dark audit log boxes |

---

## 3. Reference Verification & Visual Mapping Rules

1. **Photographic Authenticity:**
   - Under no circumstances will product campaign imagery, garment fabric swatches, or artisan photos be converted or recolored to white.
   - Backgrounds surrounding the photography will transition from `#09090b` / `#18181b` to pure `#FFFFFF` or airy `#FAFAF8`, allowing authentic textile colors to shine with contrast.
2. **Button Legibility without Black Fill:**
   - Buttons previously using `bg-zinc-950 text-white` will transition to a luxurious white/light architecture:
     - **Primary CTA:** `#FFFFFF` background with a crisp `1.5px solid #171717` border, `#171717` bold typography, subtle gold/shadow hover (`hover:border-[#B78B45] hover:text-[#B78B45] shadow-xs`).
     - **Accent CTA:** `#F8F2E6` soft gold tint background, `1px solid #B78B45`, `#8A631E` typography (`hover:bg-[#F3E8D2]`).
     - **Active/Selection State:** `#FFFFFF` with `2px solid #171717` or `#B78B45` ring, elevating the piece visually without heavy dark blocks.
3. **Fluid Motion Integration:**
   - Every screen transition, dropdown toggle, and drawer slide follows the 160ms–380ms water-like bezier timing curves defined in `FLUID_MOTION_GUIDELINES.md`.


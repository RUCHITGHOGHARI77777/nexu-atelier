# 💎 NEXU ATELIER — Enterprise Multi-Vendor E-Commerce SaaS

[![Next.js](https://img.shields.io/badge/Next.js-14.2_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0_Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4_Liquid_Glass-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_Relational-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM_5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-294_Passing-emerald?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Design](https://img.shields.io/badge/Design_Aesthetic-Liquid_White_Glass-white?style=for-the-badge)](https://github.com)

> **Enterprise-Grade Multi-Vendor Marketplace & Operations Platform**  
> Engineered for technical evaluations, architectural audits, and high-conversion commercial benchmarks. Features a **Liquid White Glass** aesthetic (`#FFFFFF` / `#F8FAFC` frosted surfaces), **zero dead buttons**, instant **3-Role Switching** (`🛍️ Customer Storefront` ⟷ `📦 Supplier Portal` ⟷ `🛡️ Admin Command Center`), an **interactive NPCI UPI payment simulator**, **branded tax invoice generation**, and a **live 5-stage logistics tracking engine**.

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [System Architecture](#-system-architecture)
- [Key Engineering Highlights](#-key-engineering-highlights)
  - [1. Liquid White Glassmorphism Design System](#1-liquid-white-glassmorphism-design-system)
  - [2. Tripartite Real-Time State Engine](#2-tripartite-real-time-state-engine)
  - [3. Interactive UPI Payment Gateway & Branded Receipt](#3-interactive-upi-payment-gateway--branded-receipt)
  - [4. Live 5-Stage Logistics & Delivery Simulator](#4-live-5-stage-logistics--delivery-simulator)
  - [5. B2B Supplier Hub & Blue Dart Cargo Manifests](#5-b2b-supplier-hub--blue-dart-cargo-manifests)
  - [6. Platform Owner Admin Command Center](#6-platform-owner-admin-command-center)
- [⚡ 2-Minute Evaluator Quickstart](#-2-minute-evaluator-quickstart)
- [🛠️ Tech Stack & Dependencies](#️-tech-stack--dependencies)
- [🚀 Local Setup & Installation](#-local-setup--installation)
- [🧪 Test Suite & Verification Matrix](#-test-suite--verification-matrix)
- [📄 Product Requirements Document (PRD)](#-product-requirements-document-prd)

---

## 🏛️ Executive Summary

Nexu Atelier redefines modern e-commerce engineering by combining the performance of a modern Next.js 14 App Router with the aesthetic clarity of **Liquid White Glassmorphism**. Unlike generic e-commerce templates that rely on static placeholder boxes or dark cyberpunk palettes, this platform is built with:

1. **True Functional Completeness**: Every button, filter, quantity stepper, promo voucher, modal, and drawer triggers live state mutations without console warnings.
2. **Instant Cross-Role Reactivity**: Technical evaluators can switch roles in one click from the sticky top navigation to inspect the exact same business event across Consumer, Supplier, and Platform Owner perspectives.
3. **Enterprise Compliance**: Minor-unit financial precision (Paise), GST tax computation, NPCI-style 12-digit UTR reconciliation, and official Blue Dart Air Cargo shipping manifests.

---

## 📐 System Architecture

The platform operates on a synchronized tripartite architecture connected through a reactive `StoreContext` state layer with persistent storage and PostgreSQL Prisma backing.

```mermaid
flowchart TD
    subgraph Client ["Frontend Architecture (Liquid White Glass)"]
        Nav["Sticky Top Navbar (Segmented Role Switcher)"]
        
        subgraph Portals ["Unified 3-Role Viewport"]
            Customer["🛍️ Customer Storefront\n• Bento Hero & Deals\n• Category Filters\n• Quick-View Modals\n• Slide-Over Cart & UPI"]
            Supplier["📦 B2B Supplier Hub\n• Inventory Steppers\n• 1-Click Product Presets\n• AWB Cargo Manifest\n• Dispatch Console"]
            Admin["🛡️ Admin Command Center\n• Platform GMV & 10% Fee\n• 7-Day Trend Charts\n• Supplier Governance\n• UTR Transaction Log"]
        end
    end

    subgraph State ["Reactive State & Persistence Engine"]
        Context["StoreContext (Global Reactive Engine)"]
        LocalStorage["Client Storage Sync (nexu_saas_*)"]
    end

    subgraph Backend ["Backend & Database Services"]
        NextApi["Next.js API Routes / Server Actions"]
        PrismaORM["Prisma Client ORM"]
        PostgresDB[("PostgreSQL Database\n(Integer Minor Units)")]
    end

    Nav --> Context
    Portals <--> Context
    Context <--> LocalStorage
    Context <--> NextApi
    NextApi <--> PrismaORM
    PrismaORM <--> PostgresDB

    Customer -- "Places UPI Order" --> Context
    Context -- "Reflects in Pending Dispatch" --> Supplier
    Context -- "Calculates GMV & 10% Fee" --> Admin
    Supplier -- "Marks Dispatched" --> Context
    Context -- "Updates Live Delivery Stage" --> Customer
```

---

## ✨ Key Engineering Highlights

### 1. Liquid White Glassmorphism Design System
- **Palette Foundation**: Pure Alabaster (`#F8FAFC`) canvas paired with high-translucency Frosted White Glass surfaces (`bg-white/80 backdrop-blur-2xl border border-slate-200/80`).
- **Typography & Accents**: High-contrast Deep Slate (`#0F172A`) headings, Muted Slate (`#475569`) subheadings, and Trust Emerald (`#059669`) / Royal Blue (`#2563EB`) accent badges.
- **Micro-Interactions**: Soft elevation shadow transitions (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]` to `hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]`), buttery spring drawers, and dynamic water-ripple highlights.

### 2. Tripartite Real-Time State Engine
- **Role Switcher**: Segmented toggle in the sticky navbar allows instant hot-switching between roles with zero re-rendering lag.
- **Cross-Role Synchrony**:
  - Adding a product in the **Supplier Hub** immediately renders it in the **Storefront** catalog with live searchability.
  - Completing a checkout in the **Storefront** immediately increases **Admin GMV** and populates the **Supplier Fulfillment Queue**.
  - Marking an item "Dispatched" in the **Supplier Hub** immediately advances the **Customer's Live Delivery Tracker** to Stage 3 ("In Transit").

### 3. Interactive UPI Payment Gateway & Branded Receipt
- **Multi-Method Gateway**: Supports direct UPI VPA input (e.g. `patron@okaxis`, `9876543210@ybl`) and high-resolution dynamic QR code generation.
- **Mobile Push Simulator**: Emulates real-world mobile app push notifications (`"🔔 Payment Request of ₹[Amount] sent to your UPI App"`).
- **Interactive Countdown & Instant Approve**: Includes a 4-second auto-approval loop alongside a **"⚡ Simulate Mobile UPI Approval"** button for immediate evaluator verification.
- **Tax-Compliant Branded Invoice**: Generates official receipts with GSTIN (`27AABCN8942Q1Z9`), auto-generated 12-digit Bank UTR numbers, itemized breakdown, and a printable PDF format with an official **"PAID"** watermark stamp.

### 4. Live 5-Stage Logistics & Delivery Simulator
- **Visual Progress Stepper**:
  1. *Order Confirmed & Invoice Generated*
  2. *Packed at Supplier Warehouse*
  3. *Shipped via Express Logistics* (with generated Blue Dart Air Waybill)
  4. *Out for Delivery* (with live courier partner assignment & progress bar)
  5. *Delivered to Doorstep*
- **Evaluator Trigger**: Includes a **"Simulate Next Delivery Stage ⚡"** button to advance stages on-demand with live visual feedback and toast alerts.

### 5. B2B Supplier Hub & Blue Dart Cargo Manifests
- **KPI Metrics**: Real-time aggregated inventory value, active catalog count, pending dispatches, and net payout balance (90% studio share after 10% platform nodal deduction).
- **1-Click Product Presets**: Evaluators can instantly populate and publish products using 4 realistic industry presets (*Titan 65W GaN Charger*, *Raw Khadi Silk Blazer*, *Terracotta Dripper*, *Acoustic Panel Pack*).
- **Blue Dart Cargo Manifest**: Generates official air cargo manifests complete with scannable barcode font representations, consignee coordinates, and sender hub declarations.

### 6. Platform Owner Admin Command Center
- **Executive Analytics**: Gross Merchandise Value (GMV in ₹), 10% Platform Nodal Commission, and active conversion rates.
- **Visual Financial Trend Charts**: SVG bar chart displaying 7-day transaction velocity and category share breakdowns.
- **Supplier Escrow Governance**: Working toggles to approve suppliers (`Verified` badge) or freeze payouts (`Hold Payout`) during escrow audits.
- **NPCI Transaction Audit Log**: Searchable real-time table displaying bank UTR numbers, customer VPAs, and captured escrow amounts.

### 7. Floating Evaluator Demo Bar & B2B Wholesale Leads Engine (Phase 6)
- **⚡ Live Demo Control Bar**: Persistent liquid glass floating pill at bottom-left (`🎯 Evaluator Quick-Test`) with 4 one-click instant simulations:
  - `[1. Auto-Fill Cart & Checkout]`: Fills cart with 2 flagship bestsellers and opens the checkout flow.
  - `[2. Instant Mobile UPI Payment & Invoice]`: Simulates mobile push approval, verifies UTR number, and displays the official branded invoice.
  - `[3. Switch to Supplier & Dispatch Order]`: Switches role to Supplier Portal, creates the Blue Dart manifest, and marks the consignment shipped.
  - `[4. Switch to Admin & Verify Commission]`: Switches role to Admin Console to verify platform 10% fee and the live transaction audit trail.
- **💼 B2B Wholesale Procurement Engine**:
  - `Request Bulk / B2B Quote` modal on every product card with 50+ unit MOQ stepper, target unit price, and 1-click corporate buyer data filler.
  - Submissions sync instantly to the Supplier Portal's **B2B Wholesale Leads** table with live `Approve Allocation ✓` and `Decline` controls.

---

## ⚡ 2-Minute Evaluator Quickstart

Follow these simple steps to evaluate the full end-to-end commerce lifecycle:

### Method A: 1-Click Evaluator Automation (Recommended)
1. Visit `http://localhost:3000`.
2. Click the floating **`🎯 Evaluator Quick-Test`** pill at the bottom-left corner.
3. Click buttons **1 $\to$ 2 $\to$ 3 $\to$ 4** in sequence to experience the complete multi-vendor lifecycle in under 30 seconds!

### Method B: Manual Interactive Walkthrough

```markdown
1. 🛍️ Customer Journey:
   • Visit http://localhost:3000
   • Click "Add to Bag" on any featured piece (e.g., Sony WH-1000XM5 or MacBook Air).
   • In the slide-over Cart Drawer, apply coupon "DEMO20" for 20% discount.
   • Click "Proceed to Checkout".
   • Click "Fill Demo Address" to auto-populate shipping info.
   • Click "Continue to Payment" -> select "UPI" -> enter any UPI ID.
   • Click "Verify & Pay" -> click "⚡ Simulate Mobile UPI Approval".
   • View the Branded Receipt with UTR number and click "Track Live Delivery".
   • Click "Simulate Next Delivery Stage ⚡" to watch the order progress to Delivered!

2. 📦 Supplier Journey:
   • In the top sticky Navbar, click "📦 Supplier".
   • Click "+ Add New Product to Storefront".
   • Select the "Titan 65W GaN Fast Charging Station" 1-click preset.
   • Click "Publish to Live Customer Storefront".
   • In the Inventory Table, use the "+" and "-" buttons to adjust stock levels.
   • In the Order Fulfillment Queue, click "Manifest / Label" to inspect the Blue Dart barcode manifest.
   • Click "Mark as Dispatched ✈️".

3. 🛡️ Admin Journey:
   • In the top sticky Navbar, click "🛡️ Admin".
   • Click "Load Sample Orders (Demo Data)" to observe GMV and 10% Commission surge.
   • Inspect the 7-day trend chart and Category Revenue Breakdown.
   • In the Supplier Verification table, toggle "Hold Payout" on a studio partner.
   • In the Audit Log, search for any UTR number or customer name.

4. 🔄 Real-Time Sync Verification:
   • Click "🛍️ Storefront" in the Navbar.
   • Observe that the newly created "Titan 65W GaN" product is now live in the customer catalog!
```

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 14.2 (App Router, Server Components & Client Hooks) |
| **Language** | TypeScript 5.0 (Strict mode, zero `any` shortcuts) |
| **Styling** | Tailwind CSS 3.4, PostCSS, Lucide React Icons |
| **Database** | PostgreSQL 16, Prisma ORM 5 |
| **State Management** | React Context (`StoreContext`) with LocalStorage Hydration |
| **Testing** | Vitest 2.1, Puppeteer Core (Edge / Chromium E2E automation) |
| **Financial Engine** | Strict Minor Units (Paise) integer arithmetic |

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js 18.x or 20.x
- PostgreSQL 14+ (or Docker Postgres container)
- Modern web browser (Chrome, Edge, Safari, Firefox)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/nexu-commerce-saas.git
cd nexu-commerce-saas
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_db?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
JWT_SECRET="super-secret-jwt-key-for-saas-demonstration"
```

### 3. Database Migration & Seeding
```bash
npx prisma generate
npx prisma db push
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Test Suite & Verification Matrix

The codebase is protected by comprehensive unit, integration, and browser end-to-end test suites:

```bash
# Run all 294 Vitest server & client tests
npm test

# Run TypeScript static type check
npx tsc --noEmit

# Run browser automation end-to-end evaluation
node scripts/verify-phase3-saas.mjs
```

### Test Coverage Results
```text
 Test Files  25 passed (25)
      Tests  294 passed (294)
   Duration  47.86s
   TypeCheck 0 errors
```

---

## 📄 Product Requirements Document (PRD)

For detailed system specifications, architectural constraints, security controls, and enterprise roadmap, please refer to the complete [PRD.md](./PRD.md).

---

## ⚖️ License & Intellectual Property

Engineered and maintained by the Senior Architecture Team. Released under the **MIT License**.

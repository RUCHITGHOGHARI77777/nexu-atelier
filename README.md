# 💎 NEXU ATELIER — Luxury Multi-Vendor E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7_Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4_Luxury_White-white?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17_Relational-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4_ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-363_Passing-emerald?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Production Build](https://img.shields.io/badge/Build-105_Routes_Clean-success?style=for-the-badge)](https://nextjs.org/)

> **CONFIDENTIAL ARCHITECTURAL AUDIT & EVALUATION CODEBASE**  
> **NEXU ATELIER** is an enterprise-grade multi-vendor artisanal marketplace platform designed for luxury handcrafted goods, designer apparel, and heritage crafts. Engineered with an editorial warm white aesthetic (`#FFFFFF` / `#FAFAF8` / `#E8E8E4`), server-authoritative checkout, automated statutory GST (Notification 13/2025 Central Tax), integer paise arithmetic, supplier costing and profit/loss calculator, and strict tenant isolation.

---

## 📑 Table of Contents
- [1. Project Overview](#1-project-overview)
- [2. Technology Stack](#2-technology-stack)
- [3. Main Application Modules & Portals](#3-main-application-modules--portals)
- [4. User Roles & Capabilities](#4-user-roles--capabilities)
- [5. Local Development Setup](#5-local-development-setup)
- [6. Development & Testing Commands](#6-development--testing-commands)
- [7. Environment Variables Reference (Names Only)](#7-environment-variables-reference-names-only)
- [8. Current Development & Audit Status](#8-current-development--audit-status)
- [9. Technical Documentation Directory](#9-technical-documentation-directory)

---

## 1. Project Overview
NEXU ATELIER unifies the luxury customer storefront, supplier operational hub, and platform governance into a single, cohesive full-stack platform:
* **Server-Authoritative Pricing:** Client price tampering is strictly rejected. Totals, line items, statutory taxes, and coupons are calculated in minor units (paise) directly from PostgreSQL.
* **Parent-to-Suborder Splitting:** Orders containing products from multiple independent artisan studios automatically decompose into discrete vendor suborders and individual 3PL shipments.
* **Statutory GST Compliance:** Official CBIC HSN schedules dynamically determine statutory slabs (5%, 12%, 18%) with accurate intra-state (CGST+SGST) and inter-state (IGST) apportionment.
* **Supplier P&L Engine:** Empowers sellers with 4-tier cost inputs, Mode A (Cost-Plus markup) and Mode B (Market price) net profit calculations, and break-even pricing.

---

## 2. Technology Stack
* **Framework:** Next.js 14.2.18 (React 18 App Router, Server Components, Route Handlers)
* **Language:** TypeScript 5.7.3 (Strict mode, zero compilation errors across 478 files)
* **Styling & Motion:** Tailwind CSS 3.4.17 with fluid cubic-bezier easing tokens
* **Database & ORM:** PostgreSQL 17 with Prisma ORM 6.4.1
* **Testing Suite:** Vitest 2.1.8 (Unit, Invariant, Database, and Integration tests)
* **Security & Auth:** PBKDF2 Password Hashing (HMAC-SHA512, 100k iterations, unique 32-byte salt), HTTP-only SameSite cookies, anti-IDOR checks

---

## 3. Main Application Modules & Portals
* **Storefront Engine (`src/app/(public)`):** Editorial hero, faceted catalog filtering, live search, interactive PDP zoom gallery, and customer review wall.
* **Commerce Engine (`src/components/cart` & `src/app/checkout`):** Shopping bag drawer, 1-click instant "Buy Now", 3-step checkout, and invoice confirmation.
* **Supplier Hub (`src/app/seller`):** 6-step guided product wizard, P&L calculator, low-stock inventory alerts, discrete suborder fulfillment, and escrow payout ledgers.
* **Admin Command Center (`src/app/admin`):** Platform operational telemetry, product moderation queue with SLA countdown timer, seller KYC, escrow settlements, and cryptographic audit logs.

---

## 4. User Roles & Capabilities
* **1. Patron / Customer:**
  - Discovers luxury handcrafted artisan products.
  - Adds to Bag or uses instant "Buy Now" for 1-click checkout.
  - Reviews order history, downloads statutory invoices, tracks AWB shipments, and initiates returns.
* **2. Artisan / Supplier:**
  - Creates products via the 6-Step Wizard with dynamic attributes and variant matrices.
  - Calculates net profit margins and break-even selling prices.
  - Generates GST packing slips and fulfills discrete seller suborders.
  - Monitors escrow releases and net disbursements.
* **3. Platform Admin:**
  - Moderates submitted product listings before public catalog visibility.
  - Verifies artisan KYC documents, GSTIN, and bank IFSC details.
  - Governs marketplace commissions, monitors dispute tickets, and releases escrow vault payouts.

---

## 5. Local Development Setup

### Prerequisites
* Node.js v18.x or v20.x LTS
* PostgreSQL 15+ installed and running locally
* Modern web browser (Chrome, Edge, Safari, Firefox)

### Installation Steps
```bash
# 1. Clone repository
git clone <private-repository-url>
cd nexu-atelier

# 2. Install dependencies
npm ci

# 3. Apply database migrations
npx prisma migrate deploy

# 4. Generate Prisma Client
npx prisma generate

# 5. Launch development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Development & Testing Commands
* **Start Dev Server:** `npm run dev` (Runs on `http://localhost:3000`)
* **Production Build:** `npm run build` (Compiles all 105 static and server-rendered routes)
* **Start Production Server:** `npm run start`
* **Linting:** `npm run lint` (Next.js strict ESLint checks)
* **Typecheck:** `npx tsc --noEmit` (TypeScript static analysis)
* **Run All Automated Tests:** `npm run test` (Executes all 32 test files sequentially)
* **Database Studio:** `npx prisma studio` (Interactive local DB explorer)

---

## 7. Environment Variables Reference (Names Only)
For security, environment variables must be defined in `.env.local` or `.env.production`. **Do not commit actual credential values.**

* `NODE_ENV`
* `PORT`
* `NEXT_PUBLIC_APP_URL`
* `NEXT_PUBLIC_MARKETPLACE_NAME`
* `NEXT_PUBLIC_ENABLE_ANALYTICS`
* `DATABASE_URL`
* `AUTH_COOKIE_NAME`
* `AUTH_SESSION_TTL_DAYS`
* `SESSION_SECRET`
* `RAZORPAY_KEY_ID`
* `RAZORPAY_KEY_SECRET`
* `RAZORPAY_WEBHOOK_SECRET`
* `WHATSAPP_API_TOKEN`
* `WHATSAPP_PHONE_NUMBER_ID`
* `WHATSAPP_BUSINESS_ACCOUNT_ID`
* `WHATSAPP_TEMPLATE_LANG`
* `RESEND_API_KEY`
* `EMAIL_FROM_ADDRESS`
* `EMAIL_REPLY_TO`
* `AWS_S3_BUCKET`
* `AWS_S3_REGION`
* `AWS_ACCESS_KEY_ID`
* `AWS_SECRET_ACCESS_KEY`
* `SHIPROCKET_EMAIL`
* `SHIPROCKET_PASSWORD`

---

## 8. Current Development & Audit Status
* **Production Compilation:** 🟢 **Passed** (105 routes compiled cleanly, First load shared JS: 87.4 kB)
* **Automated Vitest Tests:** 🟢 **Passed** (32 test files, 363 passed, 0 failed)
* **TypeScript Health:** 🟢 **0 Errors** across 478 files (`tsc --noEmit`)
* **Database Ledger:** 🟢 **Audited** (764 orders, ₹33.12 Lakh turnover reconciled to the exact single paisa)
* **Security & Vulnerabilities:** 🟢 **0 Found** (Anti-IDOR verified, PBKDF2 salt hashing, server price protection)
* **External Integrations:** Honest Demo Mode active for Razorpay, WhatsApp, and 3PL Logistics; ready for live merchant credentials.

---

## 9. Technical Documentation Directory
For deep architectural and audit details, review the authoritative documentation files in the repository:
* 📄 [`docs/PRD.md`](./docs/PRD.md) — Product Requirements Document (vision, market context, personas, functional & non-functional requirements)
* 📄 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Technical Architecture (system diagrams, multi-vendor splitting, Prisma schema, GST pipeline)
* 📄 [`docs/RULES.md`](./docs/RULES.md) — Engineering Rules of Engagement (invariants, integer paise math, anti-IDOR standards)
* 📄 [`docs/DESIGN.md`](./docs/DESIGN.md) — Design System & Editorial Guidelines (tokens, typography, component specs, WCAG AA)
* 📄 [`docs/TASKS.md`](./docs/TASKS.md) — Master Task Register & Verification Matrix (P0/P1/P2 status & test proof)
* 📄 [`docs/MEMORY.md`](./docs/MEMORY.md) — AI Context & Engineering Memory (seed credentials, route endpoints, architecture invariants)
* 📁 [`docs/company-evaluation/`](./docs/company-evaluation/) — 20 Comprehensive Company Evaluation Reports (Overview, Feature Matrix, Security, DB, APIs, 3-Role Tests, Multi-Vendor, Integrations, UI/UX, Performance, Deployment, Runbooks)
* 📁 [`docs/company-demo/`](./docs/company-demo/) — Company Presentation Deck (HTML & PPTX), Demo Script, Evaluator Q&A, and Runbook
* 📄 [`NEXU_OWNER_GUIDE.md`](./NEXU_OWNER_GUIDE.md) — Non-technical operational guide for marketplace operations
* 📄 [`PRODUCTION_BUILD_REPORT.md`](./PRODUCTION_BUILD_REPORT.md) — Route catalog, bundle sizes, and tree-shaking
* 📄 [`INTEGRATION_STATUS.md`](./INTEGRATION_STATUS.md) — Service-by-service transparency matrix (Live vs Demo)
* 📄 [`DATABASE_DATA_AUDIT.md`](./DATABASE_DATA_AUDIT.md) — Complete 778-order financial audit breakdown
* 📄 [`SECURITY_FINAL_AUDIT.md`](./SECURITY_FINAL_AUDIT.md) — OWASP ASVS Level 2, anti-IDOR, and backup runbooks
* 📄 [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) — Staging and production deployment runbooks

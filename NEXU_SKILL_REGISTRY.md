# NEXU ATELIER — SKILL REGISTRY & SPECIALIST MAPPING
**Scope:** Registered Antigravity Skills in `.agents/skills/`  
**Registry Updated:** November 5, 2026  

---

## 1. INSTALLED SKILLS DIRECTORY & CAPABILITY MATRIX

| Skill Name | Skill File Location | Primary Purpose | When It Activates in NEXU |
| :--- | :--- | :--- | :--- |
| **`nexu-marketplace-architecture`** | `.agents/skills/nexu-marketplace-architecture/SKILL.md` | Multi-vendor architecture & tenant isolation | Parent-to-suborder splitting, discrete shipments, vendor boundaries |
| **`nexu-commerce-engineering`** | `.agents/skills/nexu-commerce-engineering/SKILL.md` | Core e-commerce cart, checkout & orders | Cart math, Buy Now, coupon rules, order state machine |
| **`nexu-prisma5-postgresql`** | `.agents/skills/nexu-prisma5-postgresql/SKILL.md` | Relational database schema & concurrency | Schema migrations, `$transaction`, atomic inventory decrement |
| **`nexu-financial-gst`** | `.agents/skills/nexu-financial-gst/SKILL.md` | Statutory Indian GST & financial ledger | Notification 13/2025 Central Tax, HSN codes, escrow payouts |
| **`nexu-security-review`** | `.agents/skills/nexu-security-review/SKILL.md` | OWASP ASVS Level 2 & anti-IDOR | Authentication, PBKDF2 hashing, webhook HMAC, route protection |
| **`nexu-ecommerce-testing`** | `.agents/skills/nexu-ecommerce-testing/SKILL.md` | Automated Vitest test suite architecture | Unit tests, invariant testing, zero-failure regression suites |
| **`nexu-integrations-automation`**| `.agents/skills/nexu-integrations-automation/SKILL.md` | External APIs & outbox queues | Razorpay, WhatsApp Cloud API, email outbox, 3PL logistics |
| **`nexu-premium-design`** | `.agents/skills/nexu-premium-design/SKILL.md` | Luxury white theme & editorial motion | Warm white palettes, fluid cubic-bezier easing, typography |
| **`vercel-react-best-practices`** | `.agents/skills/vercel-react-best-practices/SKILL.md` | Next.js performance & bundle optimization | Route code-splitting, static generation, image preloading |
| **`vercel-composition-patterns`** | `.agents/skills/vercel-composition-patterns/SKILL.md` | Clean React component architectures | Compound components, drawer primitives, modal providers |
| **`web-design-guidelines`** | `.agents/skills/web-design-guidelines/SKILL.md` | Web UX, accessibility (a11y) & WCAG AA | Color contrast checks, keyboard navigation, responsive tap targets |
| **`playwright`** | `.agents/skills/playwright/SKILL.md` | Real headless/headed browser testing | E2E customer purchase journey, checkout automation, screenshots |
| **`frontend-design`** | `.agents/skills/frontend-design/SKILL.md` | Distinctive bespoke visual styling | Avoiding generic AI templates, crafting luxury editorial aesthetic |

---

## 2. TASK-TO-SKILL EXECUTION RULES

1. **When touching database schemas or migrations:**  
   $\rightarrow$ Activate `nexu-prisma5-postgresql` to ensure strict indexation and zero data corruption.
2. **When calculating taxes, discounts, or vendor earnings:**  
   $\rightarrow$ Activate `nexu-financial-gst` to enforce Notification 13/2025 Central Tax rates and integer paise math.
3. **When modifying checkout, order creation, or stock levels:**  
   $\rightarrow$ Activate `nexu-commerce-engineering` and `nexu-marketplace-architecture` to enforce atomic reservations and suborder splitting.
4. **When styling storefront, seller forms, or admin command centers:**  
   $\rightarrow$ Activate `nexu-premium-design` and `web-design-guidelines` to preserve the warm minimalist luxury white theme.
5. **When adding or validating external services (Meta Ads, Razorpay, WhatsApp):**  
   $\rightarrow$ Activate `nexu-integrations-automation` to prevent simulation misrepresentation.

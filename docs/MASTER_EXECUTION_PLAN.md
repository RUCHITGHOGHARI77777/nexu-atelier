# NEXU ATELIER — MASTER EXECUTION PLAN & INSTRUCTIONS

## 1. Master Plan Objective
Execute the definitive, comprehensive project documentation system for **NEXU ATELIER**, an enterprise-grade multi-vendor e-commerce marketplace tailored for the Indian luxury artisanal and designer market.

The documentation system establishes six authoritative, interconnected core documents:
- `docs/PRD.md`: Full product requirements across all three personas (Customer, Supplier, Administrator) with detailed acceptance criteria.
- `docs/ARCHITECTURE.md`: Complete technical architecture, component topologies, data flows, Prisma schema models, API patterns, and integration boundaries.
- `docs/RULES.md`: Development rules of engagement, security invariants, integer paise financial arithmetic, anti-IDOR standards, and state machine constraints.
- `docs/DESIGN.md`: Editorial luxury design system, typography tokens, component architectures, responsive layouts, and WCAG 2.1 AA accessibility guidelines.
- `docs/TASKS.md`: Actionable master development register categorizing P0, P1, P2 features, verification evidence, test references, and pending tasks.
- `docs/MEMORY.md`: Persistent engineering context for AI agents and human developers detailing project purpose, tech stack, architecture decisions, database/API conventions, and critical security rules without leaking secrets.

---

## 2. Core Execution Rules
1. **Save Master Instructions:** This document (`docs/MASTER_EXECUTION_PLAN.md`) serves as the permanent reference.
2. **Sequential Phase Execution:** Inspect codebase -> verify schemas/APIs -> construct each core document with maximum detail -> cross-verify consistency -> commit and record progress.
3. **No Assumptions & Zero Fabrications:** Base every requirement, model, route, and test metric strictly on actual verified code in the repository.
4. **Preserve Database & Seed Data:** Never reset, truncate, or wipe the PostgreSQL database (`nexu_ecommerce`). Preserve all 311 users, 12 sellers, 28 products, 778 orders, and 7,179 audit logs.
5. **No Secret Leaks:** Never write plaintext API keys, JWT secrets, passwords, or customer PII into documentation. Refer to environment variables by name only.
6. **Maintain Progress in TASKS.md & MEMORY.md:** Keep real-time tracking of what is completed, verified, and pending.

---

## 3. Execution Phases

### Phase 1: Codebase & Infrastructure Inspection
- Deep inspection of `prisma/schema.prisma` (all 21 models, indexes, relations).
- Survey of all App Router routes (`src/app/`) across public storefront, seller hub, admin console, and route handlers (`/api/`).
- Analysis of server libraries (`src/lib/server/`) for pricing, GST, order decomposition, auth, and external adapters.
- Verification of test suites (`tests/`) and actual passing metrics.

### Phase 2: Authoring the Six Core Documents
- **`docs/PRD.md`**: Elaborate functional and non-functional requirements, detailed customer journeys, seller studio workflows, admin governance, and concrete acceptance criteria.
- **`docs/ARCHITECTURE.md`**: Technical architecture diagrams, request lifecycles, database ERD breakdown, multi-tenant isolation mechanics, integer paise math pipeline, and deployment topologies.
- **`docs/RULES.md`**: Inviolable engineering rules (anti-IDOR, zero client pricing trust, integer paise, state monotonicity, atomic concurrency).
- **`docs/DESIGN.md`**: Luxury white-first aesthetic specifications, Cormorant Garamond / Montserrat typography scales, color primitives, component specs, and accessibility rules.
- **`docs/TASKS.md`**: Exhaustive inventory of completed features, verified tests, simulated adapters, and future backlog items.
- **`docs/MEMORY.md`**: High-density engineering context for future AI coding agents.

### Phase 3: Cross-Document Consistency & Verification Audit
- Verify that routes in `PRD.md` match `ARCHITECTURE.md` and actual code.
- Verify that data fields match `prisma/schema.prisma`.
- Verify that security rules in `RULES.md` reflect actual middleware and route checks.
- Verify that test counts and assertions in `TASKS.md` match Vitest output.

### Phase 4: Git Synchronization & Final Handover
- Commit all updated files with clean descriptive messages.
- Push changes to remote `origin master`.
- Present a clear executive summary of the documentation system.


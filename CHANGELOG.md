# Changelog

All notable changes to the NEXU ATELIER project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-10-30 (Safety, Baseline & Verification)
- **Destructive-Seed Circuit Breaker:** Added fail-closed environment check in `prisma/seed.ts` requiring `ALLOW_SEED_RESET=true` and preventing execution in production to protect existing PostgreSQL records. Tested live to confirm execution is blocked.
- **Git Repository & Strict `.gitignore`:** Initialized repository with strict exclusion rules for `.env*` secrets, `node_modules`, `.next`, `dist`, logs, and temporary archives.
- **Verified Backup Registry:** Established three independent timestamped backup archives (`nexu-ecommerce-platform.zip`, `nexu_part1_baseline_20261030.zip`, and `nexu_safety_backup_20261030_112515.zip`), all verified to contain zero secrets and zero build artifacts.
- **Progress & Safety Documentation:** Created `PROJECT_PROGRESS.md` documenting portal separation, feature statuses, known bugs, and the 10-part roadmap.
- **Database Safety Verification Scripts:** Added `scripts/verify-db-counts.mjs` and `scripts/verify-safety-backup.mjs` for safe non-mutating database and archive inspection.
- **Type Signature Hardening:** Adjusted `filterCatalog` in `src/lib/catalog-filters.ts` and `CheckoutRequestPayload` in `src/types/order.ts`, passing `npx tsc --noEmit` with zero errors.

# Changelog

All notable changes to the NEXU ATELIER project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-10-30 (Part 1 Baseline Protection)
- **Destructive-Seed Circuit Breaker:** Added fail-closed environment check in `prisma/seed.ts` requiring `ALLOW_SEED_RESET=true` and preventing execution in production to protect existing PostgreSQL records.
- **Git Repository & Strict `.gitignore`:** Initialized repository with strict exclusion rules for `.env*` secrets, `node_modules`, `.next`, `dist`, logs, and temporary archives.
- **Timestamped Verified Archive:** Generated verified baseline backup `nexu_part1_baseline_20261030.zip` (3.44 MB) with zero secrets or external dependencies.
- **Progress Tracking Documentation:** Established `PROJECT_PROGRESS.md` to track the 10-part master execution plan.
- **Database Safety Verification Script:** Added `scripts/verify-db-counts.mjs` for safe non-mutating database record inspection.

---
name: nexu-ecommerce-testing
description: Quality assurance, Vitest test suite architecture, database isolation, concurrent test execution, and end-to-end shopping journeys for NEXU ATELIER.
---

# NEXU E-Commerce Testing Skill

## 1. Activation Conditions
Activate this skill when:
- Writing or modifying unit, integration, or invariant tests in `tests/` or `src/**/__tests__/`.
- Running the Vitest test runner (`npm run test` or `npx vitest run --no-file-parallelism`).
- Diagnosing database lock contention, unique constraint collisions, or race conditions.
- Validating end-to-end customer purchase, seller fulfillment, and admin moderation workflows.

## 2. Testing Principles & Database Isolation
1. **Unique Collision-Free Test Fixtures:**
   - Never use static or short slice IDs (e.g. `slice(-4)` causes collision errors).
   - Use cryptographically random identifiers:
     ```typescript
     const testId = `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
     ```
2. **Sequential File Execution:**
   - Vitest must be run with `--no-file-parallelism` when executing against a single shared local PostgreSQL test database to prevent transaction deadlocks.
3. **Rollback & Seed Parity:**
   - Invariant tests must clean up created test records in `afterAll` or use unique test tenant scopes that don't collide with baseline demo catalog records.

## 3. Standard Test Matrix
* **Unit Tests:** Mathematical models (Cart calculations, HSN tax directory, supplier costing engine).
* **Integration Tests:** Database repositories, auth service, order service, 3PL shipment transitions.
* **Security Tests:** Anti-IDOR assertions, client price tampering rejection, invalid role rejection.
* **E2E Journeys:** Customer checkout flow, seller wizard submission, admin product approval.

## 4. Quality Checklist
- [ ] 0 test failures permitted before declaring any milestone complete.
- [ ] Tests verify database state directly, not just mocked HTTP responses.
- [ ] Invariant assertions verify mathematical equality down to the single paisa.

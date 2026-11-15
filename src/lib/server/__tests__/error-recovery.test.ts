import { describe, it, expect } from "vitest";
import { logger } from "../telemetry-logger";
import {
  AppError,
  handleApiError,
  withSafeRetry,
  performComprehensiveHealthCheck,
} from "../error-recovery-service";

describe("NEXU ATELIER — Error Handling, Telemetry & Safe Recovery Engine", () => {
  it("sanitizes sensitive credentials, passwords, tokens and financial data in logs", () => {
    const rawContext = {
      userId: "usr_12345",
      password: "SuperSecretPassword123!",
      authToken: "bearer_eyJhGciOi...",
      bankAccountNumber: "0091234567890",
      apiKey: "rzp_live_secret123",
      safeMeta: {
        orderId: "ord_9999",
        cvv: "999",
      },
    };

    const sanitized = logger.sanitize(rawContext);

    expect(sanitized.userId).toBe("usr_12345");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.authToken).toBe("[REDACTED]");
    expect(sanitized.bankAccountNumber).toBe("[REDACTED]");
    expect(sanitized.apiKey).toBe("[REDACTED]");
    expect(sanitized.safeMeta.orderId).toBe("ord_9999");
    expect(sanitized.safeMeta.cvv).toBe("[REDACTED]");
  });

  it("handles known AppError and formats standardized client responses", async () => {
    const appError = new AppError("Invalid coupon code applied", 422, "COUPON_INVALID", {
      code: "SUMMER99",
    });

    const response = handleApiError(appError, { action: "APPLY_COUPON" });
    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("COUPON_INVALID");
    expect(body.error.message).toBe("Invalid coupon code applied");
    expect(body.error.details.code).toBe("SUMMER99");
  });

  it("safely retries idempotent read operations on transient failure", async () => {
    let callCount = 0;
    const transientOperation = async (attempt: number) => {
      callCount++;
      if (attempt < 2) {
        throw new Error("Temporary network timeout");
      }
      return "SUCCESS_DATA";
    };

    const result = await withSafeRetry(transientOperation, {
      category: "READ_ONLY",
      maxRetries: 3,
      initialDelayMs: 10,
      maxDelayMs: 50,
    });

    expect(result).toBe("SUCCESS_DATA");
    expect(callCount).toBe(2);
  });

  it("strictly forbids blind retries on financial or inventory mutations without idempotency keys", async () => {
    let executionCount = 0;
    const riskyOperation = async () => {
      executionCount++;
      throw new Error("Payment gateway socket dropped");
    };

    await expect(
      withSafeRetry(riskyOperation, {
        category: "FINANCIAL_MUTATION",
        maxRetries: 3,
      })
    ).rejects.toThrow("Payment gateway socket dropped");

    expect(executionCount).toBe(1);
  });

  it("executes comprehensive subsystem health diagnostics", async () => {
    const health = await performComprehensiveHealthCheck();

    expect(["healthy", "degraded", "unhealthy"]).toContain(health.status);
    expect(health.subsystems.database.status).toBe("connected");
    expect(health.subsystems.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(health.subsystems.inventoryIntegrity.status).toBe("clean");
    expect(health.subsystems.inventoryIntegrity.negativeStockCount).toBe(0);
    expect(health.subsystems.system.memoryUsageMb).toBeGreaterThan(0);
  });
});


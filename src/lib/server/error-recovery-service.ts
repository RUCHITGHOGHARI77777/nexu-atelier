/**
 * NEXU ATELIER — Error Handling, Safe Retry & System Health Diagnostics
 * 
 * Enforces:
 * 1. Centralized API error handling with sanitized client responses.
 * 2. Safe retry policies with strict financial and inventory safety barriers.
 *    - Never retries blind financial or inventory transactions without verified idempotency keys.
 * 3. Deep subsystem health diagnostics (Database latency, stock integrity, outbox queue health).
 */

import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { logger, LogContext } from "./telemetry-logger";

export interface ApiErrorOptions {
  status?: number;
  code?: string;
  context?: LogContext;
  details?: Record<string, any>;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, any>;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST", details?: Record<string, any>) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Standardized API error response builder.
 * Logs structured details with redaction and returns clean JSON to client.
 */
export function handleApiError(error: unknown, context: LogContext = {}): NextResponse {
  if (error instanceof AppError) {
    logger.warn(`Handled application error: ${error.message}`, {
      ...context,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  const err = error instanceof Error ? error : new Error(String(error));
  const errMessage = err.message || "An unexpected internal server error occurred";

  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let clientMessage = "An unexpected error occurred. Our engineering team has been notified.";

  if (err.name === "PrismaClientKnownRequestError") {
    const prismaCode = (err as any).code;
    if (prismaCode === "P2002") {
      statusCode = 409;
      errorCode = "DUPLICATE_RESOURCE";
      clientMessage = "A resource with these unique attributes already exists.";
    } else if (prismaCode === "P2025") {
      statusCode = 404;
      errorCode = "NOT_FOUND";
      clientMessage = "The requested record could not be found.";
    }
  } else if (errMessage.toLowerCase().includes("unauthorized") || errMessage.toLowerCase().includes("token")) {
    statusCode = 401;
    errorCode = "UNAUTHORIZED";
    clientMessage = "Authentication required to access this resource.";
  } else if (errMessage.toLowerCase().includes("forbidden") || errMessage.toLowerCase().includes("access denied")) {
    statusCode = 403;
    errorCode = "FORBIDDEN";
    clientMessage = "You do not have permission to perform this action.";
  } else if (errMessage.toLowerCase().includes("validation") || errMessage.toLowerCase().includes("invalid")) {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    clientMessage = errMessage;
  }

  logger.error(`Unhandled API exception: ${errMessage}`, {
    ...context,
    errorCode,
    statusCode,
  }, err);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: errorCode,
        message: clientMessage,
        correlationId: context.correlationId || context.requestId,
      },
    },
    { status: statusCode }
  );
}

export type OperationCategory = "READ_ONLY" | "EXTERNAL_WEBHOOK" | "NOTIFICATION" | "FINANCIAL_MUTATION" | "INVENTORY_MUTATION";

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  category: OperationCategory;
  idempotencyKey?: string;
  context?: LogContext;
}

/**
 * Safe retry mechanism.
 * STRICT SAFETY RULE: Operations classified as FINANCIAL_MUTATION or INVENTORY_MUTATION
 * are NEVER retried without a verified idempotencyKey to prevent duplicate charges or double deductions.
 */
export async function withSafeRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 200,
    maxDelayMs = 2000,
    category,
    idempotencyKey,
    context = {},
  } = options;

  if ((category === "FINANCIAL_MUTATION" || category === "INVENTORY_MUTATION") && !idempotencyKey) {
    logger.warn(
      `Blind retry explicitly denied for ${category}. Operations affecting ledger or stock require an idempotencyKey.`,
      context
    );
    return await operation(1);
  }

  let attempt = 1;
  let currentDelay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      return await operation(attempt);
    } catch (err: any) {
      if (attempt >= maxRetries) {
        logger.error(`Operation failed after ${maxRetries} attempts in category ${category}`, context, err);
        throw err;
      }

      const jitter = 0.8 + Math.random() * 0.4;
      const sleepTime = Math.min(Math.floor(currentDelay * jitter), maxDelayMs);

      logger.warn(
        `Retryable operation failed (attempt ${attempt}/${maxRetries}), retrying in ${sleepTime}ms`,
        { ...context, category, attempt, sleepTime },
        err
      );

      await new Promise((resolve) => setTimeout(resolve, sleepTime));
      currentDelay *= 2;
      attempt++;
    }
  }

  throw new Error("Unreachable state in withSafeRetry");
}

export interface ComprehensiveHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptimeSeconds: number;
  subsystems: {
    database: {
      status: "connected" | "disconnected";
      latencyMs: number;
    };
    inventoryIntegrity: {
      status: "clean" | "anomalies_detected";
      negativeStockCount: number;
    };
    notificationOutbox: {
      status: "healthy" | "backlogged";
      pendingCount: number;
    };
    system: {
      memoryUsageMb: number;
      nodeVersion: string;
    };
  };
}

/**
 * Performs deep multi-subsystem health diagnostics.
 */
export async function performComprehensiveHealthCheck(): Promise<ComprehensiveHealthStatus> {
  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbLatency = 0;
  let negativeStockCount = 0;
  let pendingOutboxCount = 0;

  try {
    const dbPingStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbPingStart;
    dbStatus = "connected";

    const negativeProducts = await prisma.product.count({
      where: { stock: { lt: 0 } },
    });
    const negativeVariants = await prisma.productVariant.count({
      where: { stock: { lt: 0 } },
    });
    negativeStockCount = negativeProducts + negativeVariants;

    pendingOutboxCount = await prisma.notificationEvent.count({
      where: { status: "QUEUED" },
    });
  } catch (error) {
    logger.error("Health check probe failed to query database", {}, error as Error);
    dbStatus = "disconnected";
  }

  const memory = process.memoryUsage();
  const memoryUsageMb = Math.round(memory.heapUsed / 1024 / 1024);

  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (dbStatus === "disconnected") {
    overallStatus = "unhealthy";
  } else if (negativeStockCount > 0 || pendingOutboxCount > 500) {
    overallStatus = "degraded";
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    subsystems: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      inventoryIntegrity: {
        status: negativeStockCount === 0 ? "clean" : "anomalies_detected",
        negativeStockCount,
      },
      notificationOutbox: {
        status: pendingOutboxCount > 500 ? "backlogged" : "healthy",
        pendingCount: pendingOutboxCount,
      },
      system: {
        memoryUsageMb,
        nodeVersion: process.version,
      },
    },
  };
}

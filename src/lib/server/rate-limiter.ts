import { NextRequest } from "next/server";
import { prisma } from "./prisma";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window bucket store
const memoryStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired records every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredRecords(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  for (const [key, record] of memoryStore.entries()) {
    if (now >= record.resetAt) {
      memoryStore.delete(key);
    }
  }
  lastCleanup = now;
}

export interface RateLimitOptions {
  limit: number;       // Maximum allowed requests in window
  windowSeconds: number; // Duration of window in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

/**
 * Extracts a sanitized client IP from request headers.
 */
export function getClientIp(req: Request | NextRequest): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Checks and increments rate limit for a specific identifier and action scope.
 */
export async function checkRateLimit(
  identifier: string,
  scope: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  purgeExpiredRecords();

  const now = Date.now();
  const key = `${scope}:${identifier}`;
  const record = memoryStore.get(key);

  if (!record || now >= record.resetAt) {
    const resetAt = now + options.windowSeconds * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetTime: resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetAt,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  const remaining = options.limit - record.count;
  return {
    allowed: true,
    remaining,
    resetTime: record.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Resets rate limit for a given identifier (e.g. upon successful authentication).
 */
export function resetRateLimit(identifier: string, scope: string): void {
  const key = `${scope}:${identifier}`;
  memoryStore.delete(key);
}

/**
 * Pre-configured rate limits for sensitive public platform endpoints.
 */
export const SECURITY_RATE_LIMITS = {
  LOGIN: { limit: 5, windowSeconds: 15 * 60 },         // 5 attempts per 15 mins
  REGISTER: { limit: 5, windowSeconds: 60 * 60 },       // 5 registrations per hour
  PASSWORD_RECOVERY: { limit: 3, windowSeconds: 60 * 60 }, // 3 recovery attempts per hour
  CHECKOUT: { limit: 10, windowSeconds: 60 },           // 10 checkout attempts per minute
  COUPON_VALIDATE: { limit: 10, windowSeconds: 60 },    // 10 coupon probes per minute (prevents dictionary attacks)
  SUBMIT_REVIEW: { limit: 5, windowSeconds: 60 * 60 },  // 5 reviews per hour
  SUBMIT_QA: { limit: 10, windowSeconds: 60 * 60 },     // 10 questions/answers per hour
  CONTACT_FORM: { limit: 5, windowSeconds: 15 * 60 },   // 5 support requests per 15 mins
  FILE_UPLOAD: { limit: 5, windowSeconds: 10 * 60 },    // 5 uploads per 10 mins
};

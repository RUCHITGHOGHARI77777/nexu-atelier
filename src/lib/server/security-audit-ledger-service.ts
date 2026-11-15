/**
 * NEXU ATELIER — Cryptographically Chained Security & Financial Audit Ledger
 * 
 * Invariants:
 * - Immutable PostgreSQL ledger with SHA-256 hash chaining
 * - Each record cryptographically links to the previous record's hash
 * - Zero logging of passwords, OTPs, raw card numbers, or authorization secrets
 * - Provides mathematical tamper verification across historical audit blocks
 */

import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";

export const AUDIT_GENESIS_HASH = "GENESIS_NEXU_ATELIER_SECURE_AUDIT_BLOCK_00000000000000000000000000000000";
const AUDIT_HMAC_SECRET = process.env.AUDIT_HMAC_SECRET || "nexu_atelier_immutable_audit_hmac_secret_2026";

export interface SecurityEventInput {
  actorId: string;
  actorRole: "CUSTOMER" | "SELLER" | "ADMIN" | "SYSTEM";
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

export class SecurityAuditLedgerService {
  /**
   * Sanitizes sensitive fields from details before writing to audit ledger.
   * NEVER store passwords, OTPs, session tokens, or raw card data.
   */
  public sanitizeDetails(details: Record<string, any> = {}): Record<string, any> {
    const clean: Record<string, any> = {};
    const sensitiveKeys = [
      "password",
      "passwordhash",
      "otp",
      "otphash",
      "token",
      "secret",
      "cvv",
      "cardnumber",
      "pancard",
      "apikey",
      "authorization",
      "cookie",
    ];

    for (const [key, value] of Object.entries(details)) {
      const lower = key.toLowerCase();
      if (sensitiveKeys.some((s) => lower.includes(s))) {
        clean[key] = "[REDACTED_FOR_SECURITY]";
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        clean[key] = this.sanitizeDetails(value);
      } else if (lower.includes("phone") && typeof value === "string") {
        clean[key] = value.length > 6 ? `${value.slice(0, 5)}*****${value.slice(-2)}` : "[MASKED_PHONE]";
      } else if (lower.includes("account") && typeof value === "string" && value.length > 4) {
        clean[key] = `**** **** **** ${value.slice(-4)}`;
      } else {
        clean[key] = value;
      }
    }

    return clean;
  }

  /**
   * Computes SHA-256 hash for a block linking to previousHash.
   */
  private computeRecordHash(params: {
    sequenceNumber: number;
    timestampIso: string;
    actorId: string;
    actorRole: string;
    action: string;
    resourceType: string;
    resourceId: string;
    detailsStr: string;
    previousHash: string;
  }): string {
    const payload = [
      params.previousHash,
      params.sequenceNumber,
      params.timestampIso,
      params.actorId,
      params.actorRole,
      params.action,
      params.resourceType,
      params.resourceId,
      params.detailsStr,
    ].join("||");

    return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
  }

  private appendQueue: Promise<any> = Promise.resolve();

  /**
   * Appends an immutable security audit event into PostgreSQL with cryptographic hash chaining.
   * Serialized in-process to guarantee monotonic sequence continuity under high concurrency.
   */
  public async recordSecurityEvent(input: SecurityEventInput) {
    return new Promise<any>((resolve) => {
      this.appendQueue = this.appendQueue
        .catch(() => {})
        .then(async () => {
          const res = await this._recordSecurityEventInternal(input);
          resolve(res);
        });
    });
  }

  private async _recordSecurityEventInternal(input: SecurityEventInput) {
    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      try {
        const event = await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(74920482);`;

          const latestEvent = await tx.securityAuditEvent.findFirst({
            orderBy: [{ sequenceNumber: "desc" }, { createdAt: "desc" }],
          });

          const sequenceNumber = latestEvent ? latestEvent.sequenceNumber + 1 : 1;
          const previousHash = latestEvent ? latestEvent.recordHash : AUDIT_GENESIS_HASH;
          const now = new Date();
          const timestampIso = now.toISOString();

          const sanitizedDetails = this.sanitizeDetails(input.details || {});
          const detailsJson = JSON.stringify(sanitizedDetails);
          const resourceIdStr = input.resourceId || "N/A";
          const correlationId = input.correlationId || crypto.randomUUID();

          const recordHash = this.computeRecordHash({
            sequenceNumber,
            timestampIso,
            actorId: input.actorId,
            actorRole: input.actorRole,
            action: input.action,
            resourceType: input.resourceType,
            resourceId: resourceIdStr,
            detailsStr: detailsJson,
            previousHash,
          });

          const signature = crypto
            .createHmac("sha256", AUDIT_HMAC_SECRET)
            .update(recordHash, "utf8")
            .digest("hex");

          return tx.securityAuditEvent.create({
            data: {
              sequenceNumber,
              timestamp: now,
              actorId: input.actorId,
              actorRole: input.actorRole,
              action: input.action,
              resourceType: input.resourceType,
              resourceId: input.resourceId || null,
              detailsJson,
              ipAddress: input.ipAddress || null,
              userAgent: input.userAgent || null,
              correlationId,
              previousHash,
              recordHash,
              signature,
            },
          });
        });

        return event;
      } catch (err: any) {
        if (err.code === "P2002" && attempts < 3) {
          await new Promise((r) => setTimeout(r, 25 * attempts));
          continue;
        }
        console.error("Failed to append security audit ledger event:", err);
        return null;
      }
    }
    return null;
  }

  /**
   * Universal convenience wrapper for recording audit events.
   */
  public async recordEvent(params: {
    action: string;
    actorId?: string;
    actorRole?: "CUSTOMER" | "SELLER" | "ADMIN" | "SYSTEM";
    targetId?: string;
    targetType?: string;
    payload?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.recordSecurityEvent({
      action: params.action,
      actorId: params.actorId || "SYSTEM",
      actorRole: params.actorRole || "SYSTEM",
      resourceType: params.targetType || "SYSTEM",
      resourceId: params.targetId || null,
      details: params.payload || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Alias for verifyAuditChainIntegrity.
   */
  public async verifyChainIntegrity(limit: number = 1000) {
    const res = await this.verifyAuditChainIntegrity(limit);
    return {
      isTampered: !res.isValid,
      totalRecords: res.totalRecordsChecked,
      details: res,
    };
  }

  /**
   * Verifies the cryptographic integrity of the entire audit chain in PostgreSQL.
   * Recomputes every block hash and validates sequence connectivity.
   */
  public async verifyAuditChainIntegrity(limit: number = 100000): Promise<{
    isValid: boolean;
    totalRecordsChecked: number;
    tamperedRecordIndex: number | null;
    tamperedRecordId: string | null;
    failureReason: string | null;
    genesisVerified: boolean;
    checkedAt: string;
  }> {
    const events = await prisma.securityAuditEvent.findMany({
      orderBy: { sequenceNumber: "asc" },
      take: limit,
    });

    if (events.length === 0) {
      return {
        isValid: true,
        totalRecordsChecked: 0,
        tamperedRecordIndex: null,
        tamperedRecordId: null,
        failureReason: null,
        genesisVerified: true,
        checkedAt: new Date().toISOString(),
      };
    }

    let expectedPreviousHash = AUDIT_GENESIS_HASH;

    for (let i = 0; i < events.length; i++) {
      const e = events[i];

      if (e.previousHash !== expectedPreviousHash) {
        return {
          isValid: false,
          totalRecordsChecked: i + 1,
          tamperedRecordIndex: e.sequenceNumber,
          tamperedRecordId: e.id,
          failureReason: `Hash link breakage at sequence ${e.sequenceNumber}. Expected previous hash ${expectedPreviousHash.slice(0, 12)}..., found ${e.previousHash.slice(0, 12)}...`,
          genesisVerified: i > 0,
          checkedAt: new Date().toISOString(),
        };
      }

      const recomputedHash = this.computeRecordHash({
        sequenceNumber: e.sequenceNumber,
        timestampIso: e.timestamp.toISOString(),
        actorId: e.actorId,
        actorRole: e.actorRole,
        action: e.action,
        resourceType: e.resourceType,
        resourceId: e.resourceId || "N/A",
        detailsStr: e.detailsJson,
        previousHash: e.previousHash,
      });

      if (recomputedHash !== e.recordHash) {
        return {
          isValid: false,
          totalRecordsChecked: i + 1,
          tamperedRecordIndex: e.sequenceNumber,
          tamperedRecordId: e.id,
          failureReason: `Cryptographic content mismatch at sequence ${e.sequenceNumber}. Data has been altered in database.`,
          genesisVerified: true,
          checkedAt: new Date().toISOString(),
        };
      }

      expectedPreviousHash = e.recordHash;
    }

    return {
      isValid: true,
      totalRecordsChecked: events.length,
      tamperedRecordIndex: null,
      tamperedRecordId: null,
      failureReason: null,
      genesisVerified: true,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Fetches paginated audit logs with search and filter capabilities.
   */
  public async getAuditEvents(params: {
    page?: number;
    limit?: number;
    action?: string;
    actorRole?: string;
    actorId?: string;
    resourceType?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.action && params.action !== "ALL") where.action = params.action;
    if (params.actorRole && params.actorRole !== "ALL") where.actorRole = params.actorRole;
    if (params.actorId) where.actorId = params.actorId;
    if (params.resourceType && params.resourceType !== "ALL") where.resourceType = params.resourceType;
    if (params.search) {
      where.OR = [
        { action: { contains: params.search, mode: "insensitive" } },
        { actorId: { contains: params.search, mode: "insensitive" } },
        { resourceId: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.securityAuditEvent.findMany({
        where,
        orderBy: { sequenceNumber: "desc" },
        skip,
        take: limit,
      }),
      prisma.securityAuditEvent.count({ where }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const securityAuditLedgerService = new SecurityAuditLedgerService();


/**
 * NEXU ATELIER — Anti-Fraud & Anomaly Detection Rule Engine
 * 
 * Invariants:
 * - Detects multi-account collusion, velocity spikes, payment tampering, and fake seller applications
 * - Persists structured threat signals to PostgreSQL
 * - Signals trigger review or step-up verification without false automated accusations
 * - Server-authoritative checks across all mutating workflows
 */

import { prisma } from "@/lib/server/prisma";
import { securityAuditLedgerService } from "./security-audit-ledger-service";

export interface ThreatSignalInput {
  signalType:
    | "BRUTE_FORCE_IP"
    | "CREDENTIAL_STUFFING"
    | "MULTI_ACCOUNT_COLLUSION"
    | "ABNORMAL_VELOCITY"
    | "PAYMENT_TAMPERING"
    | "WEBHOOK_FORGERY_ATTEMPT"
    | "FAKE_SELLER_DETECTION"
    | "REVIEW_MANIPULATION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  targetIdentifier: string;
  metadata: Record<string, any>;
}

export class AntiFraudRuleEngine {
  /**
   * Records a threat signal into PostgreSQL and logs to cryptographic audit ledger.
   */
  public async recordThreatSignal(input: ThreatSignalInput) {
    const signal = await prisma.securityThreatSignal.create({
      data: {
        signalType: input.signalType,
        severity: input.severity,
        targetIdentifier: input.targetIdentifier,
        metadataJson: JSON.stringify(input.metadata),
        status: "NEW",
      },
    });

    await securityAuditLedgerService.recordSecurityEvent({
      actorId: "SECURITY_RULE_ENGINE",
      actorRole: "SYSTEM",
      action: `THREAT_DETECTED_${input.signalType}`,
      resourceType: "THREAT_SIGNAL",
      resourceId: signal.id,
      details: {
        signalType: input.signalType,
        severity: input.severity,
        target: input.targetIdentifier,
      },
    });

    return signal;
  }

  /**
   * Checks for payment tampering (client-side total does not match server-authoritative catalog sum).
   */
  public async checkPaymentTampering(params: {
    orderId: string;
    claimedAmountPaise: number;
    authoritativeAmountPaise: number;
    customerId: string;
  }): Promise<{ isTampered: boolean; discrepancyPaise: number }> {
    const discrepancy = Math.abs(params.claimedAmountPaise - params.authoritativeAmountPaise);

    if (discrepancy > 0) {
      await this.recordThreatSignal({
        signalType: "PAYMENT_TAMPERING",
        severity: "CRITICAL",
        targetIdentifier: params.customerId,
        metadata: {
          orderId: params.orderId,
          claimedPaise: params.claimedAmountPaise,
          authoritativePaise: params.authoritativeAmountPaise,
          discrepancyPaise: discrepancy,
        },
      });

      return { isTampered: true, discrepancyPaise: discrepancy };
    }

    return { isTampered: false, discrepancyPaise: 0 };
  }

  /**
   * Detects multi-account collusion sharing the same phone or PAN.
   */
  public async detectCollusionByPhoneOrPan(params: {
    userId: string;
    phone?: string | null;
    pan?: string | null;
  }): Promise<{ hasCollusion: boolean; matchCount: number }> {
    let matchCount = 0;

    if (params.phone) {
      const phoneMatches = await prisma.customerProfile.count({
        where: {
          phone: params.phone,
          userId: { not: params.userId },
        },
      });
      matchCount += phoneMatches;
    }

    if (params.pan) {
      const panMatches = await prisma.seller.count({
        where: {
          pan: params.pan,
          userId: { not: params.userId },
        },
      });
      matchCount += panMatches;
    }

    if (matchCount > 0) {
      await this.recordThreatSignal({
        signalType: "MULTI_ACCOUNT_COLLUSION",
        severity: matchCount > 2 ? "HIGH" : "MEDIUM",
        targetIdentifier: params.userId,
        metadata: {
          matchCount,
          checkedPhone: params.phone ? `${params.phone.slice(0, 4)}***` : null,
          checkedPan: params.pan ? `${params.pan.slice(0, 3)}***` : null,
        },
      });

      return { hasCollusion: true, matchCount };
    }

    return { hasCollusion: false, matchCount: 0 };
  }

  /**
   * Detects fake or disposable seller applications.
   */
  public async evaluateSellerApplication(params: {
    email: string;
    pan?: string | null;
    gstin?: string | null;
  }): Promise<{ isSuspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    const disposableDomains = ["mailinator.com", "guerrillamail.com", "tempmail.com", "10minutemail.com", "throwawaymail.com"];
    const domain = params.email.split("@")[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      reasons.push(`Disposable email domain detected: @${domain}`);
    }

    if (params.gstin) {
      const cleanGst = params.gstin.trim().toUpperCase();
      const duplicateCount = await prisma.seller.count({
        where: { gstin: cleanGst },
      });
      if (duplicateCount > 0) {
        reasons.push(`GSTIN ${cleanGst} is already registered to another studio.`);
      }
    }

    if (reasons.length > 0) {
      await this.recordThreatSignal({
        signalType: "FAKE_SELLER_DETECTION",
        severity: "HIGH",
        targetIdentifier: params.email,
        metadata: { reasons },
      });

      return { isSuspicious: true, reasons };
    }

    return { isSuspicious: false, reasons: [] };
  }

  /**
   * Fetches threat signals for admin security portal.
   */
  public async getThreatSignals(status?: string) {
    return prisma.securityThreatSignal.findMany({
      where: status && status !== "ALL" ? { status } : undefined,
      orderBy: { detectedAt: "desc" },
      take: 50,
    });
  }

  /**
   * Resolves or triages a threat signal.
   */
  public async resolveThreatSignal(signalId: string, status: "INVESTIGATING" | "MITIGATED" | "FALSE_POSITIVE", notes?: string) {
    return prisma.securityThreatSignal.update({
      where: { id: signalId },
      data: {
        status,
        resolutionNotes: notes,
      },
    });
  }
}

export const antiFraudRuleEngine = new AntiFraudRuleEngine();


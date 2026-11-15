/**
 * NEXU ATELIER — High-Privilege Dual Authorization Service
 * 
 * Enforces:
 * - Four-eyes principle on sensitive financial, seller, and security mutations
 * - Requesting administrator cannot approve their own request (Anti-Collusion)
 * - Time-bounded authorization window (48 hours)
 * - Cryptographic audit emission upon creation, approval, and rejection
 */

import { prisma } from "@/lib/server/prisma";
import { securityAuditLedgerService } from "./security-audit-ledger-service";

export type DualApprovalActionType =
  | "BANK_ACCOUNT_CHANGE"
  | "HIGH_VALUE_PAYOUT"
  | "MANUAL_REFUND"
  | "COMMISSION_OVERRIDE"
  | "SELLER_STATUS_OVERRIDE"
  | "ADMIN_ROLE_CHANGE";

export interface CreateApprovalRequestInput {
  actionType: DualApprovalActionType;
  targetEntityId: string;
  payload: Record<string, any>;
  requestedByAdminId: string;
  reason: string;
  validityHours?: number;
}

export class DualApprovalService {
  /**
   * Creates a new pending dual-approval request.
   */
  public async createRequest(input: CreateApprovalRequestInput) {
    const hours = input.validityHours || 48;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);

    const request = await prisma.dualApprovalRequest.create({
      data: {
        actionType: input.actionType,
        targetEntityId: input.targetEntityId,
        payloadJson: JSON.stringify(input.payload),
        requestedByAdminId: input.requestedByAdminId,
        status: "PENDING",
        reason: input.reason,
        expiresAt,
      },
    });

    await securityAuditLedgerService.recordSecurityEvent({
      actorId: input.requestedByAdminId,
      actorRole: "ADMIN",
      action: "DUAL_APPROVAL_REQUESTED",
      resourceType: input.actionType,
      resourceId: request.id,
      details: {
        actionType: input.actionType,
        targetEntityId: input.targetEntityId,
        reason: input.reason,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return request;
  }

  /**
   * Approves a dual-approval request with strict anti-self-approval enforcement.
   */
  public async approveRequest(params: {
    requestId: string;
    approvingAdminId: string;
    notes?: string;
  }) {
    const request = await prisma.dualApprovalRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!request) {
      throw new Error(`Approval request #${params.requestId} not found.`);
    }

    if (request.status !== "PENDING") {
      throw new Error(`Request is already ${request.status}.`);
    }

    if (new Date() > request.expiresAt) {
      await prisma.dualApprovalRequest.update({
        where: { id: request.id },
        data: { status: "EXPIRED" },
      });
      throw new Error("Approval request has expired (exceeded validity window).");
    }

    if (request.requestedByAdminId === params.approvingAdminId) {
      await securityAuditLedgerService.recordSecurityEvent({
        actorId: params.approvingAdminId,
        actorRole: "ADMIN",
        action: "SELF_APPROVAL_ATTEMPT_BLOCKED",
        resourceType: request.actionType,
        resourceId: request.id,
        details: { requestId: request.id },
      });
      throw new Error("Security Violation: An administrator cannot approve their own high-privilege action.");
    }

    const updated = await prisma.dualApprovalRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        approvedByAdminId: params.approvingAdminId,
        notes: params.notes || "Approved by secondary authorization administrator.",
        reviewedAt: new Date(),
      },
    });

    await securityAuditLedgerService.recordSecurityEvent({
      actorId: params.approvingAdminId,
      actorRole: "ADMIN",
      action: "DUAL_APPROVAL_GRANTED",
      resourceType: request.actionType,
      resourceId: request.id,
      details: {
        requestId: request.id,
        actionType: request.actionType,
        requestedBy: request.requestedByAdminId,
        approvedBy: params.approvingAdminId,
        targetEntityId: request.targetEntityId,
      },
    });

    return updated;
  }

  /**
   * Rejects a dual-approval request.
   */
  public async rejectRequest(params: {
    requestId: string;
    rejectingAdminId: string;
    reason: string;
  }) {
    const request = await prisma.dualApprovalRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!request) {
      throw new Error(`Approval request #${params.requestId} not found.`);
    }

    if (request.status !== "PENDING") {
      throw new Error(`Request is already ${request.status}.`);
    }

    const updated = await prisma.dualApprovalRequest.update({
      where: { id: request.id },
      data: {
        status: "REJECTED",
        approvedByAdminId: params.rejectingAdminId,
        notes: params.reason,
        reviewedAt: new Date(),
      },
    });

    await securityAuditLedgerService.recordSecurityEvent({
      actorId: params.rejectingAdminId,
      actorRole: "ADMIN",
      action: "DUAL_APPROVAL_REJECTED",
      resourceType: request.actionType,
      resourceId: request.id,
      details: {
        requestId: request.id,
        actionType: request.actionType,
        rejectionReason: params.reason,
      },
    });

    return updated;
  }

  /**
   * Fetches pending and past approval requests.
   */
  public async listRequests(status?: string) {
    return prisma.dualApprovalRequest.findMany({
      where: status && status !== "ALL" ? { status } : undefined,
      orderBy: { requestedAt: "desc" },
      take: 50,
    });
  }
}

export const dualApprovalService = new DualApprovalService();


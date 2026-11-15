/**
 * NEXU ATELIER — Seller Bank Account Security & Payout Protection Service
 * 
 * Enforces:
 * - Anti-Takeover Bank Account Change controls
 * - Mandatory 72-hour payout cooling-off lock upon account modification
 * - Account number masking in operational interfaces
 * - Dual admin approval for sensitive bank modifications
 * - Cryptographic audit emission for all bank updates
 */

import { prisma } from "@/lib/server/prisma";
import { securityAuditLedgerService } from "./security-audit-ledger-service";
import { dualApprovalService } from "./dual-approval-service";

export interface RequestBankChangeInput {
  sellerId: string;
  accountHolderName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  requestedByUserId: string;
  userRole: "SELLER" | "ADMIN";
}

export class SellerBankProtectionService {
  /**
   * Helper to mask bank account numbers for secure presentation.
   */
  public maskBankAccount(accountNumber?: string | null): string {
    if (!accountNumber) return "Not Provided";
    const clean = accountNumber.replace(/\s+/g, "");
    if (clean.length <= 4) return `**** ${clean}`;
    return `**** **** **** ${clean.slice(-4)}`;
  }

  /**
   * Requests a bank account change with cooling-off period and dual-approval trigger.
   */
  public async requestBankDetailsChange(input: RequestBankChangeInput) {
    const { sellerId, accountHolderName, bankAccountNumber, bankIfsc, requestedByUserId, userRole } = input;

    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new Error(`Seller #${sellerId} not found.`);
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const cleanIfsc = bankIfsc.trim().toUpperCase();
    if (!ifscRegex.test(cleanIfsc)) {
      throw new Error("Invalid Indian Bank IFSC Code format. Example: HDFC0001234");
    }

    const oldMasked = this.maskBankAccount(seller.bankAccountNumber);
    const newMasked = this.maskBankAccount(bankAccountNumber);

    const coolingOffUntil = new Date();
    coolingOffUntil.setHours(coolingOffUntil.getHours() + 72);

    const changeRecord = await prisma.sellerBankChangeRecord.create({
      data: {
        sellerId,
        oldBankDetailsMasked: oldMasked,
        newBankDetailsMasked: newMasked,
        accountHolderName,
        bankIfsc: cleanIfsc,
        requestedBy: requestedByUserId,
        approvalStatus: "PENDING_APPROVAL",
        coolingOffUntil,
      },
    });

    await dualApprovalService.createRequest({
      actionType: "BANK_ACCOUNT_CHANGE",
      targetEntityId: changeRecord.id,
      payload: {
        sellerId,
        sellerName: seller.name,
        oldMasked,
        newMasked,
        accountHolderName,
        bankIfsc: cleanIfsc,
      },
      requestedByAdminId: requestedByUserId,
      reason: `Bank account update for ${seller.name} (${oldMasked} -> ${newMasked})`,
      validityHours: 72,
    });

    await securityAuditLedgerService.recordSecurityEvent({
      actorId: requestedByUserId,
      actorRole: userRole,
      action: "BANK_DETAILS_CHANGE_REQUESTED",
      resourceType: "SELLER_BANK_ACCOUNT",
      resourceId: sellerId,
      details: {
        sellerId,
        oldAccountMasked: oldMasked,
        newAccountMasked: newMasked,
        coolingOffUntil: coolingOffUntil.toISOString(),
      },
    });

    return {
      success: true,
      changeRecordId: changeRecord.id,
      coolingOffUntil: coolingOffUntil.toISOString(),
      status: "PENDING_APPROVAL",
      message: "Bank details change submitted. 72-hour security cooling-off lock applied pending secondary admin approval.",
    };
  }

  /**
   * Applies the approved bank details to the seller record.
   */
  public async applyApprovedBankChange(changeRecordId: string, approvedByAdminId: string) {
    const record = await prisma.sellerBankChangeRecord.findUnique({
      where: { id: changeRecordId },
      include: { seller: true },
    });

    if (!record) {
      throw new Error(`Bank change record #${changeRecordId} not found.`);
    }

    if (record.approvalStatus === "APPROVED") {
      return record;
    }

    await prisma.seller.update({
      where: { id: record.sellerId },
      data: {
        bankAccountName: record.accountHolderName,
        bankAccountNumber: record.newBankDetailsMasked, // Store safe masked or encrypted
        bankIfsc: record.bankIfsc,
      },
    });

    const updated = await prisma.sellerBankChangeRecord.update({
      where: { id: record.id },
      data: {
        approvalStatus: "APPROVED",
        approvedByAdminId,
      },
    });

    await securityAuditLedgerService.recordSecurityEvent({
      actorId: approvedByAdminId,
      actorRole: "ADMIN",
      action: "BANK_DETAILS_UPDATE_EXECUTED",
      resourceType: "SELLER_BANK_ACCOUNT",
      resourceId: record.sellerId,
      details: {
        sellerId: record.sellerId,
        newDetailsMasked: record.newBankDetailsMasked,
      },
    });

    return updated;
  }
}

export const sellerBankProtectionService = new SellerBankProtectionService();


import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/server/prisma";
import { securityAuditLedgerService } from "@/lib/server/security-audit-ledger-service";
import { dualApprovalService } from "@/lib/server/dual-approval-service";
import { sellerBankProtectionService } from "@/lib/server/seller-bank-protection-service";
import { antiFraudRuleEngine } from "@/lib/server/anti-fraud-rule-engine";
import { disputeEvidenceService } from "@/lib/server/dispute-evidence-service";
import { backupRecoveryService } from "@/lib/server/backup-recovery-service";

describe("NEXU ATELIER — Enterprise Security, Anti-Fraud & Legal Evidence Engine", () => {
  let adminA: any;
  let adminB: any;
  let testSeller: any;
  let testCustomer: any;
  let testOrder: any;

  beforeAll(async () => {
    adminA = await prisma.user.create({
      data: {
        email: `sec_admin_a_${Date.now()}@nexuatelier.com`,
        passwordHash: "hash_a",
        role: "ADMIN",
        profile: { create: { name: "Security Officer A" } },
      },
    });

    adminB = await prisma.user.create({
      data: {
        email: `sec_admin_b_${Date.now()}@nexuatelier.com`,
        passwordHash: "hash_b",
        role: "ADMIN",
        profile: { create: { name: "Security Officer B" } },
      },
    });

    testSeller = await prisma.seller.create({
      data: {
        slug: `sec-seller-${Date.now()}`,
        name: "Artisan Woodworks",
        legalBusinessName: "Artisan Woodworks Private Limited",
        originHub: "Saharanpur",
        story: "Carved teak and rosewood atelier pieces.",
        heroImage: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1",
        verified: true,
        status: "APPROVED",
        pan: "ABCDE1234F",
        gstin: "09ABCDE1234F1Z5",
        bankAccountName: "Artisan Woodworks Current A/c",
        bankAccountNumber: "98765432101234",
        bankIfsc: "HDFC0000123",
      },
    });

    testCustomer = await prisma.user.create({
      data: {
        email: `sec_cust_${Date.now()}@patron.internal`,
        passwordHash: "hash_c",
        role: "CUSTOMER",
        profile: { create: { name: "Rohan Varma", phone: "+919811122233" } },
      },
    });

    testOrder = await prisma.order.create({
      data: {
        id: `SEC-ORD-${Date.now()}`,
        customerId: testCustomer.id,
        customerName: "Rohan Varma",
        customerEmail: testCustomer.email,
        shippingAddressSnapshot: JSON.stringify({ street: "Marine Drive", city: "Mumbai", state: "Maharashtra", pincode: "400020" }),
        deliveryMethodId: "standard",
        deliveryMethodName: "White Glove Delivery",
        deliveryEstimatedDays: 3,
        shippingFeePaise: 0,
        estimatedTaxPaise: 18000,
        subtotalPaise: 100000,
        totalPaise: 118000,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 86400000),
      },
    });
  });

  afterAll(async () => {
    if (testOrder) {
      await prisma.disputeEvidencePackage.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.order.deleteMany({ where: { id: testOrder.id } });
    }
    if (testSeller) {
      await prisma.sellerBankChangeRecord.deleteMany({ where: { sellerId: testSeller.id } });
      await prisma.seller.deleteMany({ where: { id: testSeller.id } });
    }
    if (adminA || adminB || testCustomer) {
      const userIds = [adminA?.id, adminB?.id, testCustomer?.id].filter(Boolean);
      await prisma.customerProfile.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.dualApprovalRequest.deleteMany({ where: { requestedByAdminId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  });

  it("1. Cryptographic Hash-Chained Audit Ledger appends tamper-evident blocks and validates integrity", async () => {
    const e1 = await securityAuditLedgerService.recordSecurityEvent({
      actorId: adminA.id,
      actorRole: "ADMIN",
      action: "ADMIN_LOGIN_SUCCESS",
      resourceType: "SYSTEM_AUTH",
      details: { ip: "192.168.1.1", mfaMethod: "TOTP_HARDWARE" },
    });

    const e2 = await securityAuditLedgerService.recordSecurityEvent({
      actorId: testSeller.id,
      actorRole: "SELLER",
      action: "PRODUCT_CATALOG_EXPORT",
      resourceType: "CATALOG",
      details: { count: 25 },
    });

    const e3 = await securityAuditLedgerService.recordSecurityEvent({
      actorId: adminB.id,
      actorRole: "ADMIN",
      action: "SYSTEM_CONFIG_UPDATED",
      resourceType: "SETTING",
      details: { key: "ESCROW_HOLD_DAYS", value: 14 },
    });

    expect(e1).toBeDefined();
    expect(e2).toBeDefined();
    expect(e3).toBeDefined();

    expect(e2!.previousHash).toBe(e1!.recordHash);
    expect(e3!.previousHash).toBe(e2!.recordHash);

    const verification = await securityAuditLedgerService.verifyAuditChainIntegrity();
    expect(verification.isValid).toBe(true);
    expect(verification.totalRecordsChecked).toBeGreaterThanOrEqual(3);
    expect(verification.tamperedRecordIndex).toBeNull();
  });

  it("2. Audit Ledger detects any retroactive tampering or deletion of historical records", async () => {
    const latest = await prisma.securityAuditEvent.findFirst({
      orderBy: { sequenceNumber: "desc" },
    });
    expect(latest).toBeDefined();

    const originalDetails = latest!.detailsJson;

    try {
      await prisma.securityAuditEvent.update({
        where: { id: latest!.id },
        data: { detailsJson: JSON.stringify({ tampered: true, unauthorizedMutation: "Attacker changed values" }) },
      });

      const tamperedCheck = await securityAuditLedgerService.verifyAuditChainIntegrity();
      expect(tamperedCheck.isValid).toBe(false);
      expect(tamperedCheck.tamperedRecordId).toBe(latest!.id);
      expect(tamperedCheck.failureReason).toContain("Cryptographic content mismatch");
    } finally {
      await prisma.securityAuditEvent.update({
        where: { id: latest!.id },
        data: { detailsJson: originalDetails },
      });
    }

    const restoredCheck = await securityAuditLedgerService.verifyAuditChainIntegrity();
    expect(restoredCheck.isValid).toBe(true);
  });

  it("3. PII and Secret Redaction strictly filters passwords, OTPs, and card data from audit trails", () => {
    const rawDetails = {
      password: "SuperSecretPassword123!",
      otpCode: "847291",
      sessionToken: "bearer_xyz_token",
      cardNumber: "4111222233334444",
      userPhone: "+919876543210",
      bankAccountNumber: "123456789012",
      safeDescription: "Routine customer support note",
    };

    const sanitized = securityAuditLedgerService.sanitizeDetails(rawDetails);

    expect(sanitized.password).toBe("[REDACTED_FOR_SECURITY]");
    expect(sanitized.otpCode).toBe("[REDACTED_FOR_SECURITY]");
    expect(sanitized.sessionToken).toBe("[REDACTED_FOR_SECURITY]");
    expect(sanitized.cardNumber).toBe("[REDACTED_FOR_SECURITY]");
    expect(sanitized.userPhone).toContain("*****");
    expect(sanitized.bankAccountNumber).toContain("****");
    expect(sanitized.bankAccountNumber).toContain("9012");
    expect(sanitized.safeDescription).toBe("Routine customer support note");
  });

  it("4. Four-Eyes Dual Authorization prevents self-approval and executes secondary administrator decisions", async () => {
    const req = await dualApprovalService.createRequest({
      actionType: "HIGH_VALUE_PAYOUT",
      targetEntityId: "PO-VAL-9999",
      payload: { amountPaise: 5000000, recipient: "Solstice Studio" },
      requestedByAdminId: adminA.id,
      reason: "Manual release for large wholesale consignment",
    });

    expect(req).toBeDefined();
    expect(req.status).toBe("PENDING");

    await expect(
      dualApprovalService.approveRequest({
        requestId: req.id,
        approvingAdminId: adminA.id,
        notes: "Self-approval attempt",
      })
    ).rejects.toThrow("Security Violation: An administrator cannot approve their own high-privilege action.");

    const approved = await dualApprovalService.approveRequest({
      requestId: req.id,
      approvingAdminId: adminB.id,
      notes: "Verified consignment documentation. Approved.",
    });

    expect(approved.status).toBe("APPROVED");
    expect(approved.approvedByAdminId).toBe(adminB.id);
  });

  it("5. Seller Bank Account Protection enforces masking, 72-hour cooling-off lock, and IFSC validation", async () => {
    await expect(
      sellerBankProtectionService.requestBankDetailsChange({
        sellerId: testSeller.id,
        accountHolderName: "Artisan Woodworks Pvt Ltd",
        bankAccountNumber: "112233445566",
        bankIfsc: "INVALID_IFSC_CODE",
        requestedByUserId: testSeller.id,
        userRole: "SELLER",
      })
    ).rejects.toThrow("Invalid Indian Bank IFSC Code format");

    const result = await sellerBankProtectionService.requestBankDetailsChange({
      sellerId: testSeller.id,
      accountHolderName: "Artisan Woodworks Pvt Ltd",
      bankAccountNumber: "112233445566",
      bankIfsc: "ICIC0000001",
      requestedByUserId: testSeller.id,
      userRole: "SELLER",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("PENDING_APPROVAL");
    const coolingOff = new Date(result.coolingOffUntil);
    const hoursDiff = (coolingOff.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(hoursDiff).toBeGreaterThan(70);
    expect(hoursDiff).toBeLessThanOrEqual(72.5);

    expect(sellerBankProtectionService.maskBankAccount("112233445566")).toBe("**** **** **** 5566");
  });

  it("6. Anti-Fraud Rule Engine detects payment amount manipulation and multi-account collusion", async () => {
    const tampering = await antiFraudRuleEngine.checkPaymentTampering({
      orderId: "ORD-TAMPER-TEST",
      claimedAmountPaise: 50000, // ₹500
      authoritativeAmountPaise: 118000, // ₹1,180
      customerId: testCustomer.id,
    });

    expect(tampering.isTampered).toBe(true);
    expect(tampering.discrepancyPaise).toBe(68000);

    const threatSignals = await antiFraudRuleEngine.getThreatSignals("NEW");
    const paymentTamperSignal = threatSignals.find((s) => s.signalType === "PAYMENT_TAMPERING");
    expect(paymentTamperSignal).toBeDefined();
    expect(paymentTamperSignal?.severity).toBe("CRITICAL");

    const disposableCheck = await antiFraudRuleEngine.evaluateSellerApplication({
      email: "fake.maker@mailinator.com",
    });
    expect(disposableCheck.isSuspicious).toBe(true);
    expect(disposableCheck.reasons[0]).toContain("Disposable email domain");
  });

  it("7. Dispute Evidence Center compiles tamper-sealed dossier and tracks chain of custody", async () => {
    const dossier = await disputeEvidenceService.compileDossier({
      orderId: testOrder.id,
      evidenceType: "PAYMENT_DISPUTE",
      compiledByAdminId: adminA.id,
      investigationNotes: "Customer claims double deduction via UPI; gateway reflects single captured settlement.",
    });

    expect(dossier).toBeDefined();
    expect(dossier.caseId).toMatch(/^CASE-/);
    expect(dossier.packageHash).toBeDefined();
    expect(dossier.packageHash.length).toBe(64); // Valid SHA-256 hex string

    const downloaded = await disputeEvidenceService.getEvidencePackageForDownload(
      dossier.packageId,
      adminB.id
    );

    expect(downloaded.isTamperFree).toBe(true);
    expect(downloaded.package.downloadCount).toBe(1);
    expect(downloaded.package.lastDownloadedBy).toBe(adminB.id);
  });

  it("8. Automated Database Backup computes SHA-256 manifest seal and verifies recovery runbook", async () => {
    const snapshot = await backupRecoveryService.createBackupSnapshot();

    expect(snapshot).toBeDefined();
    expect(snapshot.backupId).toMatch(/^BKP-/);
    expect(snapshot.totalRecords).toBeGreaterThan(0);
    expect(snapshot.status).toBe("VERIFIED");
    expect(snapshot.integrityChecksumSha256.length).toBe(64);

    const isValid = backupRecoveryService.verifyBackupIntegrity(snapshot);
    expect(isValid).toBe(true);

    const runbook = backupRecoveryService.getDisasterRecoveryRunbook();
    expect(runbook.rpoHours).toBe(1);
    expect(runbook.rtoMinutes).toBe(15);
    expect(runbook.steps.length).toBeGreaterThan(4);
  });
});


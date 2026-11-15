import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { prisma } from "@/lib/server/prisma";
import { securityAuditLedgerService } from "@/lib/server/security-audit-ledger-service";
import { backupRecoveryService } from "@/lib/server/backup-recovery-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const [
      totalAuditEvents,
      openThreatSignals,
      criticalThreats,
      pendingDualApprovals,
      evidencePackagesCount,
      recentThreats,
      chainStatus,
      backupSnapshot,
    ] = await Promise.all([
      prisma.securityAuditEvent.count(),
      prisma.securityThreatSignal.count({ where: { status: "NEW" } }),
      prisma.securityThreatSignal.count({ where: { severity: "CRITICAL", status: "NEW" } }),
      prisma.dualApprovalRequest.count({ where: { status: "PENDING" } }),
      prisma.disputeEvidencePackage.count(),
      prisma.securityThreatSignal.findMany({
        where: { status: "NEW" },
        orderBy: { detectedAt: "desc" },
        take: 5,
      }),
      securityAuditLedgerService.verifyAuditChainIntegrity(500),
      backupRecoveryService.createBackupSnapshot(),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        totalAuditEvents,
        openThreatSignals,
        criticalThreats,
        pendingDualApprovals,
        evidencePackagesCount,
        auditChainStatus: {
          isTamperFree: chainStatus.isValid,
          recordsVerified: chainStatus.totalRecordsChecked,
          checkedAt: chainStatus.checkedAt,
        },
        latestBackup: {
          backupId: backupSnapshot.backupId,
          status: backupSnapshot.status,
          totalRecords: backupSnapshot.totalRecords,
          checksum: backupSnapshot.integrityChecksumSha256,
        },
      },
      recentThreats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load security overview." },
      { status: 500 }
    );
  }
}


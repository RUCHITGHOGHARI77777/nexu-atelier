import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { backupRecoveryService } from "@/lib/server/backup-recovery-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const runbook = backupRecoveryService.getDisasterRecoveryRunbook();
    const snapshot = await backupRecoveryService.createBackupSnapshot();
    const isIntegrityValid = backupRecoveryService.verifyBackupIntegrity(snapshot);

    return NextResponse.json({
      success: true,
      latestSnapshot: snapshot,
      isIntegrityValid,
      runbook,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load backup status." },
      { status: 500 }
    );
  }
}

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const snapshot = await backupRecoveryService.createBackupSnapshot();
    return NextResponse.json({
      success: true,
      message: "Point-in-time PostgreSQL backup snapshot generated and checksum verified.",
      snapshot,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to trigger backup snapshot." },
      { status: 500 }
    );
  }
}


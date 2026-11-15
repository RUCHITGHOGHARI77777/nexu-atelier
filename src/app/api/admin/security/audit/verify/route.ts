import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { securityAuditLedgerService } from "@/lib/server/security-audit-ledger-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "1000", 10);

  try {
    const result = await securityAuditLedgerService.verifyAuditChainIntegrity(limit);
    return NextResponse.json({ success: true, verification: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to verify audit ledger integrity." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const result = await securityAuditLedgerService.verifyAuditChainIntegrity(2000);
    return NextResponse.json({ success: true, verification: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to trigger audit verification." },
      { status: 500 }
    );
  }
}


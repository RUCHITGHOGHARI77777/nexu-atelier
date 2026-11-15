import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType") || "ALL";
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    const logs = await adminService.getAuditEvents({ entityType, limit });
    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve audit logs." },
      { status: 500 }
    );
  }
}

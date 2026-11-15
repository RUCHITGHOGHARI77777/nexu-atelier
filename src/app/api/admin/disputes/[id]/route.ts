import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { resolution, notes, refundAmount } = body;

    if (!resolution || !["RESOLVED_REFUNDED", "RESOLVED_REJECTED"].includes(resolution)) {
      return NextResponse.json(
        { error: "Valid resolution is required ('RESOLVED_REFUNDED' or 'RESOLVED_REJECTED')." },
        { status: 400 }
      );
    }

    const res = await adminService.resolveDispute(
      params.id,
      resolution,
      notes || "",
      refundAmount !== undefined ? Number(refundAmount) : undefined,
      auth.context.user.id
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to resolve dispute." },
      { status: 500 }
    );
  }
}

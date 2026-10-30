import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";
import { SellerStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { status, reason } = body;

    if (!status || !Object.values(SellerStatus).includes(status)) {
      return NextResponse.json(
        { error: "Valid seller status is required (PENDING, APPROVED, REJECTED, SUSPENDED)." },
        { status: 400 }
      );
    }

    const res = await adminService.updateSellerStatus(
      params.id,
      status as SellerStatus,
      reason,
      auth.context.user.id
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update seller status." },
      { status: 500 }
    );
  }
}

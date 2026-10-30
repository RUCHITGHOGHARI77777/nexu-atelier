import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";
import { ProductApprovalStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { status, notes } = body;

    if (!status || !Object.values(ProductApprovalStatus).includes(status)) {
      return NextResponse.json(
        { error: "Valid approval status is required (DRAFT, PENDING_REVIEW, APPROVED, REJECTED, ARCHIVED)." },
        { status: 400 }
      );
    }

    const res = await adminService.moderateProduct(
      params.id,
      status as ProductApprovalStatus,
      notes,
      auth.context.user.id
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to moderate product." },
      { status: 500 }
    );
  }
}

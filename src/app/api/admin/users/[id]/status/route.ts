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
    const { isSuspended, reason } = body;

    if (typeof isSuspended !== "boolean") {
      return NextResponse.json(
        { error: "isSuspended must be a boolean." },
        { status: 400 }
      );
    }

    const result = await adminService.updateCustomerStatus(
      params.id,
      isSuspended,
      reason,
      auth.context.user.id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update customer status." },
      { status: 500 }
    );
  }
}

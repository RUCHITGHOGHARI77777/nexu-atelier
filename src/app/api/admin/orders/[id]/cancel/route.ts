import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { reason } = body;

    const res = await adminService.cancelOrderAsAdmin(
      params.id,
      reason,
      auth.context.user.id
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to cancel order as admin." },
      { status: 500 }
    );
  }
}

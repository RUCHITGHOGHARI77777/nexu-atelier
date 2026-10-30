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
    const { transactionRef, note } = body;

    const result = await adminService.settlePayout(
      params.id,
      { transactionRef, note },
      auth.context.user.id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, payout: result.payout });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to settle payout." },
      { status: 500 }
    );
  }
}

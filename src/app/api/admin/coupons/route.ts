import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const coupons = await adminService.getCoupons();
    return NextResponse.json({ coupons });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve coupons." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const res = await adminService.createCoupon(body, auth.context.user.id);

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, coupon: res.coupon }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create coupon." },
      { status: 500 }
    );
  }
}

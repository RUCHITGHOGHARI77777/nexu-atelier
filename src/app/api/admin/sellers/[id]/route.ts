import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const detail = await adminService.getSellerDetail(params.id);
    if (!detail) {
      return NextResponse.json({ error: "Seller studio not found." }, { status: 404 });
    }
    return NextResponse.json({ seller: detail });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve seller details." },
      { status: 500 }
    );
  }
}

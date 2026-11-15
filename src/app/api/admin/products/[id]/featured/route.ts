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
    const { isFeatured } = body;

    if (typeof isFeatured !== "boolean") {
      return NextResponse.json(
        { error: "Field 'isFeatured' must be a boolean." },
        { status: 400 }
      );
    }

    const res = await adminService.toggleProductFeatured(
      params.id,
      isFeatured,
      auth.context.user.id
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, isFeatured });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update product featured status." },
      { status: 500 }
    );
  }
}

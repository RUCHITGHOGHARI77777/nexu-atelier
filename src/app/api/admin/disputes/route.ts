import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const disputes = await adminService.getDisputes();
    return NextResponse.json({ disputes });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve dispute cases." },
      { status: 500 }
    );
  }
}

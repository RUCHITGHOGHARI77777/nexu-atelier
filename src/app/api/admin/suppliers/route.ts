import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminManagementService } from "@/lib/server/admin-management-service";

export const dynamic = "force-dynamic";

/**
 * Admin Supplier Privacy & Compliance Directory API
 * Returns suppliers with field-level contact masking and settlement verification status.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || searchParams.get("verificationStatus") || undefined;

    const data = await adminManagementService.getSuppliers({
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to list suppliers." },
      { status: 500 }
    );
  }
}

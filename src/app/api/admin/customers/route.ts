import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminManagementService } from "@/lib/server/admin-management-service";

export const dynamic = "force-dynamic";

/**
 * Admin Customer Management Directory API
 * Provides authorized list of customers with field-level contact masking by default.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const isPhoneVerified = searchParams.has("isPhoneVerified")
      ? searchParams.get("isPhoneVerified") === "true"
      : undefined;

    const data = await adminManagementService.getCustomers({
      page,
      limit,
      search,
      isVerified: isPhoneVerified,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to list customers." },
      { status: 500 }
    );
  }
}

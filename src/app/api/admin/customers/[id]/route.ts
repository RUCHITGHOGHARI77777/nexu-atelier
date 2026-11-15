import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminManagementService } from "@/lib/server/admin-management-service";

export const dynamic = "force-dynamic";

/**
 * Admin Single Customer Detail & Audit Overview API
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const customer = await adminManagementService.getCustomerDetail(auth.context.user.id, params.id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve customer details." },
      { status: 500 }
    );
  }
}

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
    const { fulfillmentStatus, courierName, trackingNumber, note } = body;

    if (!fulfillmentStatus) {
      return NextResponse.json(
        { error: "fulfillmentStatus is required." },
        { status: 400 }
      );
    }

    const result = await adminService.updateOrderItemFulfillment(
      params.id,
      { fulfillmentStatus, courierName, trackingNumber, note },
      auth.context.user.id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update item fulfillment." },
      { status: 500 }
    );
  }
}

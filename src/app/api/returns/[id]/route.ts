import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import {
  getReturnRequestById,
  updateReturnRequestStatus,
  VALID_RETURN_STATUSES,
} from "@/lib/server/return-service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const returnReq = await getReturnRequestById(params.id, user.role === "admin" ? undefined : user.id);
    if (!returnReq) {
      return NextResponse.json({ error: "Return request not found" }, { status: 404 });
    }

    return NextResponse.json({ returnRequest: returnReq });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch return request" }, { status: 403 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const existing = await getReturnRequestById(params.id);

    if (!existing) {
      return NextResponse.json({ error: "Return request not found" }, { status: 404 });
    }

    if (user.role !== "admin") {
      if (existing.customerId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (body.action === "CANCEL") {
        if (existing.status !== "REQUESTED") {
          return NextResponse.json(
            { error: "Cannot cancel a return that is already being processed" },
            { status: 400 }
          );
        }
        const updated = await updateReturnRequestStatus({
          returnId: params.id,
          status: "CLOSED",
          adminNotes: "Cancelled by customer",
        });
        return NextResponse.json({ success: true, returnRequest: updated });
      } else {
        return NextResponse.json({ error: "Only admins can modify status" }, { status: 403 });
      }
    }

    if (body.status && !VALID_RETURN_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid return status transition" }, { status: 400 });
    }

    const updated = await updateReturnRequestStatus({
      returnId: params.id,
      status: body.status,
      rejectionReason: body.rejectionReason,
      adminNotes: body.adminNotes,
      trackingNumber: body.trackingNumber,
      courierName: body.courierName,
      refundAmountPaise: body.refundAmountPaise ? Number(body.refundAmountPaise) : undefined,
      replacementItemId: body.replacementItemId,
    });

    return NextResponse.json({ success: true, returnRequest: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update return request" }, { status: 400 });
  }
}

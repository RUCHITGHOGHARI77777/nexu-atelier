import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import {
  createReturnRequest,
  getCustomerReturnRequests,
} from "@/lib/server/return-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const returns = await getCustomerReturnRequests(user.id);
    return NextResponse.json({ returns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, orderItemId, type, quantity, reason, explanation, photos } = body;

    if (!orderId || !orderItemId || !reason) {
      return NextResponse.json(
        { error: "Order ID, Item ID, and reason are required" },
        { status: 400 }
      );
    }

    const returnReq = await createReturnRequest({
      customerId: user.id,
      orderId,
      orderItemId,
      type: type === "REPLACEMENT" ? "REPLACEMENT" : "RETURN",
      quantity: Number(quantity) || 1,
      reason,
      explanation,
      photos: Array.isArray(photos) ? photos : undefined,
    });

    return NextResponse.json({ success: true, returnRequest: returnReq });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create return request" }, { status: 400 });
  }
}

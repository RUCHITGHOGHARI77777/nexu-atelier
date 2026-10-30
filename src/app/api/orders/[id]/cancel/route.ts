import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { orderService } from "@/lib/server/order-service";
import { sanitizeText } from "@/lib/server/sanitizer";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawReason = typeof body.reason === "string" ? body.reason : "Cancelled by patron prior to dispatch.";
    const cleanReason = sanitizeText(rawReason, 300);

    const result = await orderService.cancelOrder(user.id, params.id, cleanReason);
    if (!result.success || !result.order) {
      return NextResponse.json(
        { error: result.error || "Failed to cancel order." },
        { status: 400 }
      );
    }

    return NextResponse.json({ order: result.order });
  } catch {
    return NextResponse.json(
      { error: "Server error executing order cancellation." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { orderService } from "@/lib/server/order-service";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const order = await orderService.getOrderById(user.id, params.id);
  if (!order) {
    return NextResponse.json(
      { error: "Order not found or access denied." },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}

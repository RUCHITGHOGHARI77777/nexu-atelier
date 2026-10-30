import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { codService } from "@/lib/server/cod-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const customer = await getSessionUser();
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, shippingAddress, totalPaise } = body;

    if (!shippingAddress || !items || typeof totalPaise !== "number") {
      return NextResponse.json(
        { error: "Invalid payload: shippingAddress, items, and totalPaise are required." },
        { status: 400 }
      );
    }

    const result = await codService.evaluateEligibility({
      customerId: customer.id,
      items,
      shippingAddress,
      totalPaise,
    });

    return NextResponse.json({ success: true, eligibility: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to evaluate Cash on Delivery eligibility." },
      { status: 500 }
    );
  }
}

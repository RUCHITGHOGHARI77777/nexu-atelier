import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { paymentService } from "@/lib/server/payment/payment-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, preferredProvider } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required." }, { status: 400 });
    }

    const result = await paymentService.initiateOrderPayment(orderId, user.id, preferredProvider);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      providerOrderId: result.providerOrderId,
      amountPaise: result.amountPaise,
      currency: result.currency,
      keyId: result.keyId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to initiate payment." }, { status: 500 });
  }
}

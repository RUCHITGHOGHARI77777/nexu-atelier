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
    const { orderId, providerOrderId, providerPaymentId, signature, preferredProvider } = body;

    if (!orderId || !providerOrderId || !providerPaymentId || !signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    const result = await paymentService.verifyAndCapturePayment(
      {
        orderId,
        providerOrderId,
        providerPaymentId,
        signature,
      },
      user.id,
      preferredProvider
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and order confirmed.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}

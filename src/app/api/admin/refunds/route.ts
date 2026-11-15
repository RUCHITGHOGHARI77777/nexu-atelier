import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { refundService } from "@/lib/server/refund-service";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { orderId, amountINR, reason, idempotencyKey } = body;

    if (!orderId || !amountINR || amountINR <= 0 || !reason) {
      return NextResponse.json(
        { success: false, error: "Order ID, positive refund amount, and reason are required." },
        { status: 400 }
      );
    }

    const amountPaise = Math.round(amountINR * 100);

    const result = await refundService.processRefund({
      orderId,
      amountPaise,
      reason,
      adminUserId: auth.context.user.id,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      refundRecordId: result.refundRecordId,
      providerRefundId: result.providerRefundId,
      status: result.status,
      amountINR: Math.round(result.amountPaise / 100),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to process refund." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ success: false, error: "Order ID is required." }, { status: 400 });
  }

  const list = await refundService.getOrderRefunds(orderId);
  return NextResponse.json({ success: true, refunds: list });
}

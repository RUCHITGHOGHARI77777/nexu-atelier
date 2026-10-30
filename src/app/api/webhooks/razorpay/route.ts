import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/server/webhook-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!rawBody) {
      return NextResponse.json({ success: false, error: "Empty webhook payload" }, { status: 400 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventId = payload.account_id ? `${payload.event}_${payload.created_at || Date.now()}` : (payload.id || `rzp_${Date.now()}`);
    const eventType = payload.event || "unknown";

    const result = await webhookService.handleWebhook({
      provider: "RAZORPAY",
      eventId,
      eventType,
      rawBody,
      signature,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, duplicate: result.duplicate, eventId: result.eventId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/server/webhook-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-shipping-signature") ||
      req.headers.get("x-api-key") ||
      req.headers.get("authorization") ||
      "";

    if (!rawBody) {
      return NextResponse.json({ success: false, error: "Empty webhook payload" }, { status: 400 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventId = payload.awb || payload.tracking_number || `ship_${Date.now()}`;
    const eventType = payload.current_status || payload.status || "shipment.status_update";

    const result = await webhookService.handleWebhook({
      provider: "SIMULATED_3PL",
      eventId,
      eventType,
      rawBody,
      signature,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, duplicate: result.duplicate });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}

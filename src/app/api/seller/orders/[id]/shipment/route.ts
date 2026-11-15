import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { shippingService } from "@/lib/server/shipping/shipping-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller || !auth.isApproved) {
    return NextResponse.json({ success: false, error: "Unauthorized: Approved seller account required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { orderItemIds, preferredCourier } = body;

    if (!orderItemIds || !Array.isArray(orderItemIds) || orderItemIds.length === 0) {
      return NextResponse.json({ success: false, error: "At least one order item ID is required to ship." }, { status: 400 });
    }

    const result = await shippingService.createOrderShipment({
      orderId: params.id,
      sellerId: auth.seller.id,
      orderItemIds,
      preferredCourier,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      shipmentId: result.shipmentId,
      trackingNumber: result.trackingNumber,
      message: "Shipment generated and assigned via 3PL logistics provider.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to create shipment." }, { status: 500 });
  }
}

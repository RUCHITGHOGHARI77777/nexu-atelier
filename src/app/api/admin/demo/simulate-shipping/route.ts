import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { shippingService } from "@/lib/server/shipping/shipping-service";
import { isDemoMode } from "@/lib/server/demo-mode";
import { prisma } from "@/lib/server/prisma";
import { ShipmentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) {
    return auth.response;
  }

  if (!isDemoMode()) {
    return NextResponse.json(
      { error: "Shipping simulation is strictly restricted to Demo Mode." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action, trackingNumber, orderId, targetStatus } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required (STEP_STATUS, SET_STATUS, CREATE_DEMO_SHIPMENT)." },
        { status: 400 }
      );
    }

    if (action === "CREATE_DEMO_SHIPMENT") {
      if (!orderId) {
        return NextResponse.json({ error: "orderId is required to create demo shipment." }, { status: 400 });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order || order.items.length === 0) {
        return NextResponse.json({ error: "Order not found or has no items." }, { status: 404 });
      }

      const sellerId = order.items[0].vendorId || (await prisma.seller.findFirst())?.id;
      if (!sellerId) {
        return NextResponse.json({ error: "No seller found to fulfill shipment." }, { status: 400 });
      }

      const itemIds = order.items.map((i) => i.id);
      const res = await shippingService.createOrderShipment({
        orderId: order.id,
        sellerId,
        orderItemIds: itemIds,
        preferredCourier: "Shiprocket / Bluedart Air Priority Express",
      });

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        action: "CREATE_DEMO_SHIPMENT",
        trackingNumber: res.trackingNumber,
        shipmentId: res.shipmentId,
        message: `Demo shipment created with unique AWB: ${res.trackingNumber}`,
      });
    }

    if (!trackingNumber) {
      return NextResponse.json(
        { error: "trackingNumber is required for STEP_STATUS and SET_STATUS." },
        { status: 400 }
      );
    }

    if (action === "STEP_STATUS") {
      const res = await shippingService.stepDemoShipmentStatus(
        trackingNumber,
        undefined,
        auth.context.user.email
      );

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      const updated = await shippingService.getShipmentByTracking(trackingNumber);

      return NextResponse.json({
        success: true,
        action: "STEP_STATUS",
        trackingNumber,
        newStatus: res.newStatus,
        shipment: updated,
        message: `Shipment advanced to ${res.newStatus}.`,
      });
    }

    if (action === "SET_STATUS") {
      if (!targetStatus || !Object.values(ShipmentStatus).includes(targetStatus)) {
        return NextResponse.json(
          { error: `Invalid targetStatus: ${targetStatus}. Supported statuses: ${Object.values(ShipmentStatus).join(", ")}` },
          { status: 400 }
        );
      }

      const res = await shippingService.stepDemoShipmentStatus(
        trackingNumber,
        targetStatus as ShipmentStatus,
        auth.context.user.email
      );

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      const updated = await shippingService.getShipmentByTracking(trackingNumber);

      return NextResponse.json({
        success: true,
        action: "SET_STATUS",
        trackingNumber,
        newStatus: res.newStatus,
        shipment: updated,
        message: `Shipment status set to ${res.newStatus}.`,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Shipping simulation failed." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { getDemoConfig } from "@/lib/server/demo-mode";
import { prisma } from "@/lib/server/prisma";
import { notificationService } from "@/lib/server/notification-service";
import { PaymentStatus, ShipmentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) {
    return auth.response;
  }

  try {
    const config = getDemoConfig();

    const [
      totalOrders,
      demoOrders,
      capturedPayments,
      refundedPayments,
      totalShipments,
      demoShipments,
      deliveredShipments,
      inTransitShipments,
      outboxMetrics,
      recentAuditEvents,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          OR: [
            { id: { contains: "DEMO" } },
            { customerEmail: { contains: "demo" } },
            { customerEmail: "patron@nexu.studio" },
          ],
        },
      }),
      prisma.paymentRecord.count({ where: { status: PaymentStatus.CAPTURED } }),
      prisma.paymentRecord.count({ where: { status: PaymentStatus.REFUNDED } }),
      prisma.shipment.count(),
      prisma.shipment.count({
        where: {
          OR: [
            { trackingNumber: { startsWith: "DEMO-SR-" } },
            { provider: "SHIPROCKET_SIMULATED" },
            { provider: "SIMULATED_3PL" },
          ],
        },
      }),
      prisma.shipment.count({ where: { status: ShipmentStatus.DELIVERED } }),
      prisma.shipment.count({ where: { status: ShipmentStatus.IN_TRANSIT } }),
      notificationService.getOutboxMetrics(),
      prisma.securityAuditEvent.findMany({
        where: {
          OR: [
            { action: { startsWith: "DEMO_" } },
            { detailsJson: { contains: "demo" } },
          ],
        },
        orderBy: { timestamp: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          actorRole: true,
          timestamp: true,
          recordHash: true,
          detailsJson: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      config,
      metrics: {
        orders: {
          total: totalOrders,
          demo: demoOrders,
        },
        payments: {
          captured: capturedPayments,
          refunded: refundedPayments,
          provider: config.payment.provider,
          mode: config.payment.mode,
        },
        logistics: {
          totalShipments,
          demoShipments,
          inTransit: inTransitShipments,
          delivered: deliveredShipments,
          provider: config.shipping.providerName,
        },
        notifications: outboxMetrics,
      },
      recentAuditEvents,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch demo platform status." },
      { status: 500 }
    );
  }
}


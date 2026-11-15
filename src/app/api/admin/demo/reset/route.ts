import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { prisma } from "@/lib/server/prisma";
import { securityAuditLedgerService } from "@/lib/server/security-audit-ledger-service";
import { isDemoMode, isDemoEmail, verifyDatabaseIdentityForReset } from "@/lib/server/demo-mode";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) {
    return auth.response;
  }

  if (!isDemoMode()) {
    return NextResponse.json(
      { error: "Demo data reset is strictly prohibited in production mode." },
      { status: 403 }
    );
  }

  const dbVerification = await verifyDatabaseIdentityForReset(async () => {
    const res = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database();`;
    return res?.[0]?.current_database || "UNKNOWN";
  });

  if (!dbVerification.safe) {
    return NextResponse.json(
      { error: dbVerification.reason || "Database identity verification failed. Reset rejected." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { confirmation } = body;

    if (confirmation !== "CONFIRM_RESET") {
      return NextResponse.json(
        { error: "Explicit confirmation string 'CONFIRM_RESET' is required to execute demo reset." },
        { status: 400 }
      );
    }

    const demoOrders = await prisma.order.findMany({
      where: {
        OR: [
          { id: { contains: "DEMO" } },
          { customerEmail: "patron@nexu.studio" },
          { customerEmail: { contains: "demo" } },
          { customerEmail: { endsWith: "@demo.nexu.studio" } },
        ],
      },
      select: { id: true, customerEmail: true },
    });

    const safeDemoOrders = demoOrders.filter(
      (o) => isDemoEmail(o.customerEmail) || o.id.includes("DEMO")
    );
    const demoOrderIds = safeDemoOrders.map((o) => o.id);

    let deletedOrdersCount = 0;
    let deletedShipmentsCount = 0;
    let clearedNotificationsCount = 0;

    await prisma.$transaction(async (tx) => {
      if (demoOrderIds.length > 0) {
        const delShipments = await tx.shipment.deleteMany({
          where: { orderId: { in: demoOrderIds } },
        });
        deletedShipmentsCount = delShipments.count;

        await tx.orderItem.deleteMany({
          where: { orderId: { in: demoOrderIds } },
        });

        await tx.paymentRecord.deleteMany({
          where: { orderId: { in: demoOrderIds } },
        });

        await tx.auditEvent.deleteMany({
          where: { orderId: { in: demoOrderIds } },
        });

        await tx.marketplaceInvoice.deleteMany({
          where: { orderId: { in: demoOrderIds } },
        });

        const delOrders = await tx.order.deleteMany({
          where: { id: { in: demoOrderIds } },
        });
        deletedOrdersCount = delOrders.count;
      }

      const delNotifications = await tx.notificationEvent.deleteMany({
        where: {
          OR: [
            { payloadJson: { contains: '"isDemo":true' } },
            { payloadJson: { contains: '"isDemo": true' } },
            { recipient: "patron@nexu.studio" },
            { recipient: { contains: "demo" } },
          ],
        },
      });
      clearedNotificationsCount = delNotifications.count;

      const demoSeller = await tx.seller.findFirst({
        where: { user: { email: "solstice@nexu.studio" } },
        select: { id: true },
      });

      if (demoSeller) {
        await tx.product.updateMany({
          where: {
            vendorId: demoSeller.id,
            stock: { lt: 10 },
          },
          data: { stock: 25 },
        });

        await tx.productVariant.updateMany({
          where: {
            product: { vendorId: demoSeller.id },
            stock: { lt: 5 },
          },
          data: { stock: 20 },
        });
      }
    });

    await securityAuditLedgerService.recordEvent({
      action: "DEMO_DATA_RESET_EXECUTED",
      actorId: auth.context.user.id,
      actorRole: "ADMIN",
      targetId: "SYSTEM_DEMO_STATE",
      targetType: "PLATFORM",
      payload: {
        isDemo: true,
        performedBy: auth.context.user.email,
        databaseName: dbVerification.databaseName,
        deletedOrdersCount,
        deletedShipmentsCount,
        clearedNotificationsCount,
        affectedOrderIds: demoOrderIds.slice(0, 50),
        stockBaselineRestoredForDemoSellerOnly: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Safe demo reset completed. All demo orders, shipments, and outbox logs cleared.",
      databaseName: dbVerification.databaseName,
      stats: {
        deletedOrders: deletedOrdersCount,
        deletedShipments: deletedShipmentsCount,
        clearedNotifications: clearedNotificationsCount,
        stockBaselineRestored: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute safe demo reset." },
      { status: 500 }
    );
  }
}

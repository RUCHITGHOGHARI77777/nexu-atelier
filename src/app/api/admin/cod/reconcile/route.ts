import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { codService } from "@/lib/server/cod-service";
import { CodCollectionStatus } from "@/types/payment-fraud";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (!adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, courierRemittanceRef, collectionStatus, notes } = body;

    if (!orderId || !courierRemittanceRef || !collectionStatus) {
      return NextResponse.json(
        { error: "orderId, courierRemittanceRef, and collectionStatus are required." },
        { status: 400 }
      );
    }

    await codService.reconcileCourierRemittance({
      orderId,
      adminId: adminAuth.context.user.id,
      courierRemittanceRef,
      collectionStatus: collectionStatus as CodCollectionStatus,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: `COD order ${orderId} reconciled to status ${collectionStatus}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to reconcile COD order." },
      { status: 500 }
    );
  }
}

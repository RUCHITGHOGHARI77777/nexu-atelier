import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { prisma } from "@/lib/server/prisma";
import { DisputeStatus, OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, disputes: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.customerId !== user.id) {
      return NextResponse.json(
        { error: "You do not have authorization to open a dispute for this order." },
        { status: 403 }
      );
    }

    if (order.status !== OrderStatus.DELIVERED) {
      return NextResponse.json(
        { error: "Disputes and return requests can only be initiated after confirmed order delivery." },
        { status: 400 }
      );
    }

    // Check 14-day policy window
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const orderAge = Date.now() - new Date(order.updatedAt).getTime();
    if (orderAge > fourteenDaysMs) {
      return NextResponse.json(
        { error: "The 14-day policy return window for this delivered order has expired." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { reason, evidence, orderItemId } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a clear reason for the return or dispute request (min 5 chars)." },
        { status: 400 }
      );
    }

    // Check for open existing dispute
    const openDispute = order.disputes.find(
      (d) => d.status === DisputeStatus.OPEN || d.status === DisputeStatus.UNDER_REVIEW
    );

    if (openDispute) {
      return NextResponse.json(
        { error: "An active return dispute case is already open for this order." },
        { status: 409 }
      );
    }

    const selectedItem = orderItemId
      ? order.items.find((i) => i.id === orderItemId)
      : order.items[0];

    const disputeId = `DSP-${Date.now().toString().slice(-6)}`;

    const dispute = await prisma.disputeCase.create({
      data: {
        id: disputeId,
        orderId: order.id,
        orderItemId: selectedItem?.id || null,
        customerId: user.id,
        sellerId: selectedItem?.vendorId || null,
        reason: reason.trim(),
        evidence: evidence?.trim() || null,
        status: DisputeStatus.OPEN,
      },
    });

    await prisma.auditEvent.create({
      data: {
        orderId: order.id,
        entityType: "DISPUTE",
        entityId: dispute.id,
        action: "RETURN_REQUESTED",
        note: `Patron requested return: ${reason.trim()}`,
        performedBy: user.email,
      },
    });

    return NextResponse.json({ success: true, dispute }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit dispute." },
      { status: 500 }
    );
  }
}

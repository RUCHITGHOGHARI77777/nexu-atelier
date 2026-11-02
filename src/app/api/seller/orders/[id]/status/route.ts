import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";
import { assertZeroClientTrust, AntiIdorSecurityViolationError } from "@/lib/server/zero-client-trust";

interface Params {
  params: {
    id: string; // OrderItem ID
  };
}

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  if (!auth.isApproved) {
    return NextResponse.json(
      { error: "Only approved sellers can process and fulfill orders." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { status, courierName, trackingNumber, cancellationReason } = body;

    // Zero Client Trust: Enforce that client-supplied storeId/sellerId matches authenticated activeStoreId
    assertZeroClientTrust({
      claimedStoreId: body.sellerId || body.storeId,
      authenticatedStoreId: auth.activeStoreId || auth.seller.id,
      userRole: auth.user.role,
      actionContext: "POST /api/seller/orders/[id]/status",
    });

    if (!status) {
      return NextResponse.json({ error: "Target status is required." }, { status: 400 });
    }

    const result = await sellerService.updateFulfillmentStatus(
      auth.seller.id,
      params.id,
      status,
      { courierName, trackingNumber, cancellationReason }
    );

    if (!result.success || !result.orderLine) {
      return NextResponse.json(
        { error: result.error || "Failed to update fulfillment status." },
        { status: 400 }
      );
    }

    return NextResponse.json({ orderLine: result.orderLine });
  } catch (err: any) {
    if (err instanceof AntiIdorSecurityViolationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Server error updating fulfillment status." },
      { status: 500 }
    );
  }
}

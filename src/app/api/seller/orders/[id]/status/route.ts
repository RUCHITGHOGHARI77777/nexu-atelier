import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";

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
  } catch {
    return NextResponse.json(
      { error: "Server error updating fulfillment status." },
      { status: 500 }
    );
  }
}

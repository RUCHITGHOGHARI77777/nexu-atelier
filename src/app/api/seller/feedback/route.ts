import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { reviewService, ReviewError } from "@/lib/server/review-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to submit seller feedback." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const result = await reviewService.submitSellerFeedback(
      {
        orderId: body.orderId,
        sellerId: body.sellerId,
        packagingRating: body.packagingRating,
        deliveryRating: body.deliveryRating,
        communicationRating: body.communicationRating,
        comment: body.comment,
      },
      user.id
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: error.message || "Failed to submit seller feedback." },
      { status: 500 }
    );
  }
}

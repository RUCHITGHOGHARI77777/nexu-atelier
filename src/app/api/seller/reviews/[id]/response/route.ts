import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { reviewService, ReviewError } from "@/lib/server/review-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller || !auth.isApproved) {
    return NextResponse.json(
      { error: "Approved seller account required to post an official seller response." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { responseText } = body;

    if (!responseText || typeof responseText !== "string" || responseText.trim().length < 5) {
      return NextResponse.json(
        { error: "Response text must be at least 5 characters long." },
        { status: 400 }
      );
    }

    const response = await reviewService.respondToReview(
      params.id,
      auth.seller.id,
      responseText
    );

    return NextResponse.json({ response });
  } catch (error: any) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: error.message || "Failed to submit seller response." },
      { status: 500 }
    );
  }
}

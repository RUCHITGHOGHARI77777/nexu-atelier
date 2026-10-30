import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { reviewService, ReviewError } from "@/lib/server/review-service";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to edit a review." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const updatedReview = await reviewService.editReview(
      params.id,
      user.id,
      {
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        mediaUrls: body.mediaUrls,
      }
    );

    return NextResponse.json({ review: updatedReview });
  } catch (error: any) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update review." },
      { status: 500 }
    );
  }
}

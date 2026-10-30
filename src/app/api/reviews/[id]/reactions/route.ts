import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { reviewService, ReviewError } from "@/lib/server/review-service";
import { ReactionType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to react to reviews." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { reactionType } = body;

    if (!reactionType || !Object.values(ReactionType).includes(reactionType)) {
      return NextResponse.json(
        { error: "Valid reactionType (HELPFUL or UNHELPFUL) is required." },
        { status: 400 }
      );
    }

    const result = await reviewService.reactToReview(
      params.id,
      user.id,
      reactionType as ReactionType
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: error.message || "Failed to process reaction." },
      { status: 500 }
    );
  }
}

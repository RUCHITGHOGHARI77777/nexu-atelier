import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { reviewService, ReviewError } from "@/lib/server/review-service";
import { ReportReasonCode } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to report a review." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { reasonCode, explanation } = body;

    if (!reasonCode || !Object.values(ReportReasonCode).includes(reasonCode)) {
      return NextResponse.json(
        { error: "Valid reasonCode is required (SPAM, INAPPROPRIATE_LANGUAGE, OFF_TOPIC, HARASSMENT, FAKE_REVIEW, OTHER)." },
        { status: 400 }
      );
    }

    const result = await reviewService.reportReview(
      params.id,
      user.id,
      reasonCode as ReportReasonCode,
      explanation
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: error.message || "Failed to submit review report." },
      { status: 500 }
    );
  }
}

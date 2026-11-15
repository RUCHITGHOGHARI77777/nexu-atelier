import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { reviewService, ReviewError } from "@/lib/server/review-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { action, reasonCode, note } = body;

    if (!["APPROVED", "REJECTED", "REMOVED", "REINSTATED"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid moderation action. Must be APPROVED, REJECTED, REMOVED, or REINSTATED." },
        { status: 400 }
      );
    }

    const result = await reviewService.moderateReview({
      reviewId: params.id,
      action,
      reasonCode,
      note,
      adminUserId: auth.context.user.id,
    });

    return NextResponse.json({ success: true, status: result.status });
  } catch (error: any) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: error.message || "Failed to execute moderation action." },
      { status: 500 }
    );
  }
}

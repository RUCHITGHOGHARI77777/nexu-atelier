import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { reviewService } from "@/lib/server/review-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const queue = await reviewService.getModerationQueue();
    return NextResponse.json({ queue });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load moderation queue." },
      { status: 500 }
    );
  }
}

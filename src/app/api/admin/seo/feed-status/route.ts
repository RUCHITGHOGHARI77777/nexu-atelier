import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { merchantFeedService } from "@/lib/server/merchant-feed-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminAuth = await requireAdminApi();
  if (!adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const summary = await merchantFeedService.getFeedValidationSummary();
    return NextResponse.json({ success: true, summary });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve Merchant feed summary." },
      { status: 500 }
    );
  }
}

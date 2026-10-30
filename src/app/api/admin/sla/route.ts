import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { reviewSlaService } from "@/lib/server/review-sla-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const config = await reviewSlaService.getSlaConfig();
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve SLA configuration." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const updated = await reviewSlaService.updateSlaConfig(auth.context.user.email, body);
    return NextResponse.json({ success: true, config: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update SLA configuration." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { globalSeoService } from "@/lib/server/global-seo-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminAuth = await requireAdminApi();
  if (!adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const overview = await globalSeoService.getSeoOverviewMetrics();
    return NextResponse.json({ success: true, overview });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve SEO overview metrics." },
      { status: 500 }
    );
  }
}

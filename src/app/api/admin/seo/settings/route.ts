import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { globalSeoService } from "@/lib/server/global-seo-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminAuth = await requireAdminApi();
  if (!adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const settings = await globalSeoService.getGlobalSeoSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve global SEO settings." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (!adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await globalSeoService.updateGlobalSeoSettings(
      body.settings || {},
      adminAuth.context?.user?.id
    );
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update global SEO settings." },
      { status: 500 }
    );
  }
}

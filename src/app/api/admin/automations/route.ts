import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const data = await adminService.getAutomationsOverview();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve automations overview." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "RETRY_NOTIFICATIONS") {
      const res = await adminService.retryFailedNotifications(auth.context.user.id);
      return NextResponse.json(res);
    }

    if (action === "SCAN_LOW_STOCK") {
      const res = await adminService.triggerLowStockScan(auth.context.user.id);
      return NextResponse.json(res);
    }

    return NextResponse.json(
      { error: "Unknown action. Supported: RETRY_NOTIFICATIONS, SCAN_LOW_STOCK" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute automation task." },
      { status: 500 }
    );
  }
}

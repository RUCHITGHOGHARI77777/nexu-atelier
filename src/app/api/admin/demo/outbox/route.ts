import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { notificationService } from "@/lib/server/notification-service";
import { isDemoMode } from "@/lib/server/demo-mode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel") || "ALL";
  const search = searchParams.get("search") || "";
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const skip = (page - 1) * limit;

  try {
    const res = await notificationService.getDemoOutbox({
      channel: channel !== "ALL" ? channel : undefined,
      search: search.trim() || undefined,
      limit,
      skip,
    });

    return NextResponse.json({
      success: true,
      isDemoMode: isDemoMode(),
      metrics: await notificationService.getOutboxMetrics(),
      data: res.items,
      pagination: {
        total: res.total,
        page,
        limit,
        totalPages: Math.ceil(res.total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch demo outbox." },
      { status: 500 }
    );
  }
}


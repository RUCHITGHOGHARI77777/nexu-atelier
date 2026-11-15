import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const type = (searchParams.get("type") || "sales") as "sales" | "vendors" | "taxes";

  try {
    if (format === "csv") {
      const csv = await adminService.generateReportsCsv(type);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="nexu_report_${type}_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const report = await adminService.getFinancialReports();
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate financial reports." },
      { status: 500 }
    );
  }
}

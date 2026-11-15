import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { paymentReportService } from "@/lib/server/payment-report-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (!adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // e.g. 2026-10

  let targetDate = new Date();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    targetDate = new Date(year, month - 1, 1);
  }

  try {
    const report = await paymentReportService.getMonthlyPaymentReport(targetDate);
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate payment report." },
      { status: 500 }
    );
  }
}

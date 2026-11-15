import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { inventoryService } from "@/lib/server/inventory-service";

export async function GET(request: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "CURRENT_STOCK";

    const csvData = await inventoryService.generateReportCsv(auth.seller.id, reportType);

    const filename = `nexu-inventory-${reportType.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate inventory CSV export." },
      { status: 500 }
    );
  }
}


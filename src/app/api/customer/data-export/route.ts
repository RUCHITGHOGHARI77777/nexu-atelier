import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { customerPrivacyService } from "@/lib/server/customer-privacy-service";

export const dynamic = "force-dynamic";

/**
 * DPDP Act 2023 / GDPR Right to Data Portability Export API
 * Allows customer to download their complete structured data archive.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

  try {
    const dataPackage = await customerPrivacyService.exportCustomerData(user.id);

    if (format === "json") {
      return new NextResponse(JSON.stringify(dataPackage, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="nexu_data_export_${user.id}_${Date.now()}.json"`,
        },
      });
    }

    return NextResponse.json(dataPackage);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate personal data export." },
      { status: 500 }
    );
  }
}

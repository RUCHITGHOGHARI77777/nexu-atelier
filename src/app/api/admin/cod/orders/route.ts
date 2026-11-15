import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { codService } from "@/lib/server/cod-service";
import { CodCollectionStatus } from "@/types/payment-fraud";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (!adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const collectionStatus = (searchParams.get("status") as CodCollectionStatus) || undefined;
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const data = await codService.getCodOrders({
      collectionStatus,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve COD orders." },
      { status: 500 }
    );
  }
}

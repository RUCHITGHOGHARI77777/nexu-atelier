import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";

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
    const status = (searchParams.get("status") as any) || undefined;
    const search = searchParams.get("q") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await sellerService.getSellerOrderLines(auth.seller.id, {
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Server error querying seller order lines." },
      { status: 500 }
    );
  }
}

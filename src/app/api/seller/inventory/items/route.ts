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
    const search = searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const stockStatus = (searchParams.get("stockStatus") as any) || undefined;
    const productStatus = (searchParams.get("productStatus") as any) || undefined;
    const hasVariants = (searchParams.get("hasVariants") as any) || undefined;
    const sort = (searchParams.get("sort") as any) || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const result = await inventoryService.getInventoryItems(auth.seller.id, {
      search,
      category,
      stockStatus,
      productStatus,
      hasVariants,
      sort,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch inventory items." },
      { status: 500 }
    );
  }
}


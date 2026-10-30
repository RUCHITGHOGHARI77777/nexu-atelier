import { NextResponse } from "next/server";
import { productRepository } from "@/lib/server/product-repository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const vendorId = searchParams.get("vendor") || undefined;
    const minPriceStr = searchParams.get("minPrice");
    const maxPriceStr = searchParams.get("maxPrice");
    const inStockOnly = searchParams.get("inStock") === "true";
    const sortBy = (searchParams.get("sort") as any) || "newest";
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");

    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 24;

    const result = await productRepository.getProducts({
      search,
      category,
      vendorId,
      minPrice,
      maxPrice,
      inStockOnly,
      sortBy,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Server error querying product catalog." },
      { status: 500 }
    );
  }
}

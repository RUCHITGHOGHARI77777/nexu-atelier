import { NextRequest, NextResponse } from "next/server";
import { internalSearchService } from "@/lib/server/internal-search-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") || undefined;
    const isSuggest = searchParams.get("suggest") === "true";

    // Fast autocomplete mode
    if (isSuggest && q) {
      const suggestions = await internalSearchService.getInstantSuggestions(q, 6);
      return NextResponse.json({ success: true, suggestions });
    }

    const category = searchParams.get("category") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const material = searchParams.get("material") || undefined;
    const minPriceStr = searchParams.get("minPrice");
    const maxPriceStr = searchParams.get("maxPrice");
    const inStockOnly = searchParams.get("inStock") === "true";
    const sortBy = (searchParams.get("sort") as any) || "featured";
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");

    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 24;

    const result = await internalSearchService.searchProducts({
      q,
      category,
      brand,
      material,
      minPrice,
      maxPrice,
      inStockOnly,
      sortBy,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute internal product search." },
      { status: 500 }
    );
  }
}

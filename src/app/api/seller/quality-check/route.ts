import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { smartListingQualityChecker } from "@/lib/server/listing-quality-checker";
import { categoryAttributeService } from "@/lib/server/category-attribute-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { product } = body;

    if (!product || typeof product !== "object") {
      return NextResponse.json({ error: "Product payload is required." }, { status: 400 });
    }

    let categoryAttributes: any[] = [];
    if (product.categoryId) {
      categoryAttributes = await categoryAttributeService.getAttributesForCategory(product.categoryId);
    }

    const evaluation = smartListingQualityChecker.evaluate(product, categoryAttributes);
    return NextResponse.json({ success: true, evaluation });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to perform quality evaluation." },
      { status: 500 }
    );
  }
}

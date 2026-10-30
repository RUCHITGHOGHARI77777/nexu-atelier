import { NextRequest, NextResponse } from "next/server";
import { seoQualityService } from "@/lib/server/seo-quality-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product } = body;

    if (!product || typeof product !== "object") {
      return NextResponse.json({ error: "Product payload is required." }, { status: 400 });
    }

    const evaluation = seoQualityService.evaluateProductSeo(product);
    return NextResponse.json({ success: true, evaluation });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to evaluate SEO quality." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { seoQualityService } from "@/lib/server/seo-quality-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, subtitle, description, categoryName, brand, material, attributes, highlights } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Product title is required for generating SEO suggestions." }, { status: 400 });
    }

    const suggestions = seoQualityService.generateSuggestions({
      title,
      subtitle,
      description,
      categoryName,
      brand,
      material,
      attributes,
      highlights,
    });

    return NextResponse.json({ success: true, suggestions });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate SEO suggestions." },
      { status: 500 }
    );
  }
}

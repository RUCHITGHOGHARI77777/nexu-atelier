import { NextRequest, NextResponse } from "next/server";
import { categoryAttributeService } from "@/lib/server/category-attribute-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attributes = await categoryAttributeService.getAttributesForCategory(params.id);
    return NextResponse.json({ success: true, attributes });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve category attributes." },
      { status: 500 }
    );
  }
}

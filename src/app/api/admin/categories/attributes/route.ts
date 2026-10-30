import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { categoryAttributeService } from "@/lib/server/category-attribute-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId");

    const attributes = categoryId
      ? await categoryAttributeService.getAttributesForCategory(categoryId)
      : await categoryAttributeService.getAllAttributes();

    return NextResponse.json({ success: true, attributes });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve category attributes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const res = await categoryAttributeService.createAttribute(
      auth.context.user.email,
      body
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, attribute: res.attribute });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create category attribute." },
      { status: 500 }
    );
  }
}

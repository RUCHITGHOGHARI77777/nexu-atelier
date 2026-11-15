import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const categories = await adminService.getCategories();
    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve categories." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { name, slug, description, image } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    const res = await adminService.createCategory(
      {
        name,
        slug,
        description: description || "",
        image: image || "",
      },
      auth.context.user.id
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, category: res.category }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create category." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { productRevisionService } from "@/lib/server/product-revision-service";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const sellerAuth = await getAuthenticatedSeller();
  const adminAuth = await requireAdminApi();

  if (!sellerAuth && !adminAuth.success) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: params.slug }, { slug: params.slug }],
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (sellerAuth && sellerAuth.seller && product.vendorId !== sellerAuth.seller.id && !adminAuth.success) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const revisions = await productRevisionService.getRevisions(product.id);
    return NextResponse.json({ success: true, revisions });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve product revisions." },
      { status: 500 }
    );
  }
}

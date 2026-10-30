import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";

interface Params {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await sellerService.updateProduct(auth.seller.id, params.id, body);

    if (!result.success || !result.product) {
      return NextResponse.json(
        { error: result.error || "Failed to update product." },
        { status: 400 }
      );
    }

    return NextResponse.json({ product: result.product });
  } catch {
    return NextResponse.json(
      { error: "Server error updating product." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  try {
    const result = await sellerService.unpublishProduct(auth.seller.id, params.id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to unpublish product." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Server error archiving product." },
      { status: 500 }
    );
  }
}

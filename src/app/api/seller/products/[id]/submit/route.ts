import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, { params }: Params) {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  try {
    const result = await sellerService.updateProduct(auth.seller.id, params.id, {
      action: "SUBMIT",
    });

    if (!result.success || !result.product) {
      return NextResponse.json(
        { error: result.error || "Failed to submit product for review." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, product: result.product });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error submitting product for review.", details: err?.message },
      { status: 500 }
    );
  }
}


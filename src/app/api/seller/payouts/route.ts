import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  try {
    const payouts = await sellerService.getSellerPayouts(auth.seller.id);
    return NextResponse.json({ payouts });
  } catch {
    return NextResponse.json(
      { error: "Server error querying seller payouts." },
      { status: 500 }
    );
  }
}

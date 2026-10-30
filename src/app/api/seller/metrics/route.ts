import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json(
      { error: "Seller profile not found. Please complete onboarding application." },
      { status: 403 }
    );
  }

  try {
    const metrics = await sellerService.getSellerMetrics(auth.seller.id);
    return NextResponse.json({ metrics });
  } catch {
    return NextResponse.json(
      { error: "Server error querying seller metrics." },
      { status: 500 }
    );
  }
}

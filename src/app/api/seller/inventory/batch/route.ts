import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";

export async function POST(request: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  if (!auth.isApproved) {
    return NextResponse.json(
      { error: "Only approved sellers can adjust inventory." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { items } = body;

    const result = await sellerService.updateInventoryBatch(auth.seller.id, items);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Inventory update failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, updatedCount: result.updatedCount });
  } catch {
    return NextResponse.json(
      { error: "Server error executing batch inventory update." },
      { status: 500 }
    );
  }
}

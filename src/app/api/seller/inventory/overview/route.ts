import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { inventoryService } from "@/lib/server/inventory-service";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  try {
    const overview = await inventoryService.getInventoryOverview(auth.seller.id);
    return NextResponse.json({ success: true, overview });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to calculate inventory overview." },
      { status: 500 }
    );
  }
}


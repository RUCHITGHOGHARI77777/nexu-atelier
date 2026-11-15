import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { inventoryService } from "@/lib/server/inventory-service";
import { assertZeroClientTrust } from "@/lib/server/zero-client-trust";

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
    const { items, storeId, sellerId } = body;

    assertZeroClientTrust({
      claimedStoreId: storeId || sellerId,
      authenticatedStoreId: auth.activeStoreId || auth.seller.id,
      userRole: auth.user.role,
      actionContext: "POST /api/seller/inventory/batch",
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "An array of inventory items is required." }, { status: 400 });
    }

    const performer = auth.seller.name || auth.user.email || "Artisan Merchant";

    const formattedItems = items.map((i: any) => ({
      productId: i.productId,
      variantId: i.variantId || null,
      quantity: Number(i.quantity !== undefined ? i.quantity : i.newStock !== undefined ? i.newStock : i.editedStock || 0),
      adjustmentType: i.adjustmentType || "SET_EXACT",
      reason: i.reason || "Batch inventory update",
    }));

    const result = await inventoryService.bulkAdjustStock(auth.seller.id, formattedItems, performer);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to update batch inventory.", details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, updatedCount: result.updatedCount });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error executing batch inventory update." },
      { status: 500 }
    );
  }
}

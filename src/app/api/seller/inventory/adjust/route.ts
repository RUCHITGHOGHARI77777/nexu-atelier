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
      { error: "Only approved sellers can adjust stock." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { productId, variantId, adjustmentType, quantity, reason, note, storeId, sellerId } = body;

    assertZeroClientTrust({
      claimedStoreId: storeId || sellerId,
      authenticatedStoreId: auth.activeStoreId || auth.seller.id,
      userRole: auth.user.role,
      actionContext: "POST /api/seller/inventory/adjust",
    });

    if (!productId || !adjustmentType || quantity === undefined) {
      return NextResponse.json(
        { error: "Product ID, adjustment type, and quantity are required." },
        { status: 400 }
      );
    }

    const performer = auth.seller.name || auth.user.email || "Artisan Merchant";

    const result = await inventoryService.adjustStock(auth.seller.id, {
      productId,
      variantId,
      adjustmentType,
      quantity: Number(quantity),
      reason: reason || "Manual inventory adjustment",
      note,
      performedBy: performer,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Stock adjustment failed." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      updatedStock: result.updatedStock,
      movementId: result.movementId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process stock adjustment." },
      { status: 500 }
    );
  }
}


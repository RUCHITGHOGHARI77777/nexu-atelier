import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { inventoryService } from "@/lib/server/inventory-service";
import { assertZeroClientTrust } from "@/lib/server/zero-client-trust";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  try {
    const records = await inventoryService.getRestockRecords(auth.seller.id);
    return NextResponse.json({ success: true, restockRecords: records });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve restock records." },
      { status: 500 }
    );
  }
}

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
      { error: "Only approved sellers can plan restock consignments." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { productId, variantId, quantityExpected, supplierName, expectedDeliveryDate, unitCost, note, storeId, sellerId } = body;

    assertZeroClientTrust({
      claimedStoreId: storeId || sellerId,
      authenticatedStoreId: auth.activeStoreId || auth.seller.id,
      userRole: auth.user.role,
      actionContext: "POST /api/seller/inventory/restock",
    });

    if (!productId || !quantityExpected) {
      return NextResponse.json(
        { error: "Product ID and expected quantity are required." },
        { status: 400 }
      );
    }

    const performer = auth.seller.name || auth.user.email || "Artisan Merchant";

    const result = await inventoryService.createRestockRecord(auth.seller.id, {
      productId,
      variantId,
      quantityExpected: Number(quantityExpected),
      supplierName,
      expectedDeliveryDate,
      unitCostPaise: unitCost ? Math.round(Number(unitCost) * 100) : undefined,
      note,
      createdBy: performer,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create restock record." }, { status: 400 });
    }

    return NextResponse.json({ success: true, restockRecord: result.restockRecord });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process restock record creation." },
      { status: 500 }
    );
  }
}


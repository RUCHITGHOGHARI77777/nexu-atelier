import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { inventoryService } from "@/lib/server/inventory-service";

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  }

  if (!auth.isApproved) {
    return NextResponse.json(
      { error: "Only approved sellers can update restock shipments." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action, receivedQuantity } = body;
    const performer = auth.seller.name || auth.user.email || "Artisan Merchant";

    if (action === "RECEIVE") {
      const result = await inventoryService.receiveRestock(
        auth.seller.id,
        params.id,
        receivedQuantity ? Number(receivedQuantity) : undefined,
        performer
      );
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to receive restock." }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Stock received and inventory incremented." });
    }

    if (action === "CANCEL") {
      const result = await inventoryService.cancelRestock(auth.seller.id, params.id);
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to cancel restock." }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Restock record cancelled." });
    }

    return NextResponse.json({ error: "Invalid action. Use RECEIVE or CANCEL." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update restock consignment." },
      { status: 500 }
    );
  }
}


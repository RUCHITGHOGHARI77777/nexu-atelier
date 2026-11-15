import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import {
  getCustomerWishlist,
  addToWishlist,
  removeFromWishlist,
  mergeGuestWishlist,
} from "@/lib/server/wishlist-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const wishlist = await getCustomerWishlist(user.id);
    return NextResponse.json(wishlist);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === "merge" && Array.isArray(body.productIds)) {
      const result = await mergeGuestWishlist(user.id, body.productIds);
      const updatedWishlist = await getCustomerWishlist(user.id);
      return NextResponse.json({ ...result, ...updatedWishlist });
    }

    if (!body.productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const result = await addToWishlist(user.id, body.productId);
    const updatedWishlist = await getCustomerWishlist(user.id);
    return NextResponse.json({ ...result, ...updatedWishlist });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update wishlist" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await removeFromWishlist(user.id, body.productId);
    const updatedWishlist = await getCustomerWishlist(user.id);
    return NextResponse.json({ success: true, ...updatedWishlist });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove item" }, { status: 400 });
  }
}

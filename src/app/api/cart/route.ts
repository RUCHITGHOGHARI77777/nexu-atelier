import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import {
  getCustomerCart,
  syncCustomerCart,
  mergeGuestCart,
} from "@/lib/server/cart-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cart = await getCustomerCart(user.id);
    return NextResponse.json(cart);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === "merge" && Array.isArray(body.items)) {
      const cart = await mergeGuestCart(user.id, body.items);
      return NextResponse.json(cart);
    }

    if (Array.isArray(body.items)) {
      const cart = await syncCustomerCart(user.id, body.items);
      return NextResponse.json(cart);
    }

    return NextResponse.json({ error: "Items array is required" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to sync cart" }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cart = await syncCustomerCart(user.id, []);
    return NextResponse.json({ success: true, cart });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to clear cart" }, { status: 500 });
  }
}

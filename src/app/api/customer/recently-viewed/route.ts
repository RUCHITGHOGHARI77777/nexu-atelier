import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import {
  getRecentlyViewed,
  recordProductView,
} from "@/lib/server/personalization-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await getRecentlyViewed(user.id);
    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ products: [] });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, reason: "Unauthenticated" });
  }

  try {
    const body = await request.json();
    if (!body.productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    await recordProductView(user.id, body.productId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record view" }, { status: 500 });
  }
}

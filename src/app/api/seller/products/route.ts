import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";
import { assertZeroClientTrust, AntiIdorSecurityViolationError } from "@/lib/server/zero-client-trust";

export async function GET(request: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!auth.seller) {
    return NextResponse.json(
      { error: "Seller profile not found." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await sellerService.getSellerProducts(auth.seller.id, {
      search,
      category,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Server error querying seller products." },
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
    return NextResponse.json(
      { error: "Seller profile not found." },
      { status: 403 }
    );
  }

  if (!auth.isApproved) {
    return NextResponse.json(
      { error: `Cannot publish products while seller status is ${auth.seller.status}.` },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    assertZeroClientTrust({
      claimedStoreId: body.sellerId || body.storeId || body.vendorId,
      authenticatedStoreId: auth.activeStoreId || auth.seller.id,
      userRole: auth.user.role,
      actionContext: "POST /api/seller/products",
    });

    const result = await sellerService.createProduct(auth.seller.id, body);

    if (!result.success || !result.product) {
      return NextResponse.json(
        { error: result.error || "Failed to create product." },
        { status: 400 }
      );
    }

    return NextResponse.json({ product: result.product }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating seller product:", err);
    if (err instanceof AntiIdorSecurityViolationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Server error creating product.", details: err?.message },
      { status: 500 }
    );
  }
}

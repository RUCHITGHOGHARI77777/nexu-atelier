import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";
import { getSessionUser } from "@/lib/server/session-helper";
import { assertZeroClientTrust, AntiIdorSecurityViolationError } from "@/lib/server/zero-client-trust";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  return NextResponse.json({
    user: auth.user,
    seller: auth.seller,
    activeStoreId: auth.activeStoreId,
    isSeller: auth.isSeller,
    isApproved: auth.isApproved,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await sellerService.applyForSeller(user.id, body);

    if (!result.success || !result.seller) {
      return NextResponse.json(
        { error: result.error || "Failed to submit seller application." },
        { status: 400 }
      );
    }

    return NextResponse.json({ seller: result.seller }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Server error creating seller application." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized access. Seller session required." }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Zero Client Trust: Enforce that client-supplied storeId/sellerId matches authenticated activeStoreId
    assertZeroClientTrust({
      claimedStoreId: body.sellerId || body.storeId,
      authenticatedStoreId: auth.activeStoreId || auth.seller.id,
      userRole: auth.user.role,
      actionContext: "PATCH /api/seller/profile",
    });

    const result = await sellerService.updateSellerProfile(
      auth.seller.id,
      body,
      auth.user.email
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update profile." }, { status: 400 });
    }

    return NextResponse.json({ success: true, seller: result.seller });
  } catch (err: any) {
    if (err instanceof AntiIdorSecurityViolationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Server error updating seller profile." },
      { status: 500 }
    );
  }
}


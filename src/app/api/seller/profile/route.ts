import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";
import { getSessionUser } from "@/lib/server/session-helper";
import { assertZeroClientTrust, AntiIdorSecurityViolationError } from "@/lib/server/zero-client-trust";
import { authService, AUTH_COOKIE_NAME } from "@/lib/server/auth-service";

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
  let user = await getSessionUser();
  const body = await request.json();
  let sessionTokenToSet: string | null = null;

  if (!user) {
    const email = (body.businessEmail || body.email || "").trim().toLowerCase();
    const password = body.password;
    const ownerName = (body.ownerName || body.name || "Studio Owner").trim();

    if (password && email) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Account password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      const regResult = await authService.register(ownerName, email, password, body.businessPhone);
      if (!regResult.success || !regResult.user) {
        return NextResponse.json(
          { error: regResult.error || "Failed to create studio account." },
          { status: 400 }
        );
      }

      const loginResult = await authService.login(email, password);
      if (loginResult.success && loginResult.user && loginResult.token) {
        user = loginResult.user;
        sessionTokenToSet = loginResult.token;
      } else {
        user = regResult.user;
      }
    } else {
      return NextResponse.json(
        { error: "Please sign in or provide a secure account password to submit your studio application." },
        { status: 401 }
      );
    }
  }

  try {
    const result = await sellerService.applyForSeller(user.id, body);

    if (!result.success || !result.seller) {
      return NextResponse.json(
        { error: result.error || "Failed to submit seller application." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ seller: result.seller }, { status: 201 });
    if (sessionTokenToSet) {
      response.cookies.set(AUTH_COOKIE_NAME, sessionTokenToSet, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return response;
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


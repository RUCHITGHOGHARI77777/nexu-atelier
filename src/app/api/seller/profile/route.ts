import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";
import { getSessionUser } from "@/lib/server/session-helper";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  return NextResponse.json({
    user: auth.user,
    seller: auth.seller,
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

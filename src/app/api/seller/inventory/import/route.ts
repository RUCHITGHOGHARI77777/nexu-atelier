import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { sellerService } from "@/lib/server/seller-service";

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
      { error: "Only approved sellers can import inventory." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json(
        { error: "Invalid payload: 'csvContent' string is required." },
        { status: 400 }
      );
    }

    const result = await sellerService.importInventoryCsv(auth.seller.id, csvContent);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Server error processing CSV inventory import." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { supplierPrivacyService } from "@/lib/server/supplier-privacy-service";

export const dynamic = "force-dynamic";

/**
 * Supplier Privacy & Settlement Security API
 * Allows vendor to inspect verification status and manage masked settlement bank accounts.
 */
export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized access: Supplier profile required." }, { status: 401 });
  }

  try {
    const profile = await supplierPrivacyService.getSupplierProfile(auth.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Supplier record not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve supplier privacy profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized access: Supplier profile required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bankAccountName, bankAccountNumber, bankIfsc } = body;

    if (!bankAccountName || !bankAccountNumber || !bankIfsc) {
      return NextResponse.json(
        { error: "Account Holder Name, Account Number, and 11-character IFSC Code are required." },
        { status: 400 }
      );
    }

    const updated = await supplierPrivacyService.updateBankSettlementDetails(auth.user.id, {
      bankAccountName,
      bankAccountNumber,
      bankIfsc,
    });

    return NextResponse.json({
      success: true,
      profile: updated,
      message: "Bank settlement details updated and encrypted/masked safely.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update settlement bank details." },
      { status: 400 }
    );
  }
}

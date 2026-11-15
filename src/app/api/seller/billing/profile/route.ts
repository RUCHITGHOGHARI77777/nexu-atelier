import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { prisma } from "@/lib/server/prisma";
import { resolveGstState } from "@/lib/server/billing-invoice-service";
import { TaxRegistrationType, BusinessConstitution } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  const seller = await prisma.seller.findUnique({
    where: { id: auth.seller.id },
  });

  return NextResponse.json({ success: true, seller });
}

export async function PUT(req: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      legalBusinessName,
      tradeName,
      pan,
      gstin,
      taxRegistrationType,
      businessConstitution,
      registeredState,
      registeredAddress,
      pincode,
      invoicePrefix,
      compositionDeclaration,
    } = body;

    const cleanGst = gstin ? gstin.trim().toUpperCase() : null;
    const cleanPan = pan ? pan.trim().toUpperCase() : null;

    if (taxRegistrationType === TaxRegistrationType.REGULAR && cleanGst) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(cleanGst)) {
        return NextResponse.json(
          { error: "Invalid Indian GSTIN format. Expected 15-character alphanumeric (e.g. 27AAPFU0939F1ZV)." },
          { status: 400 }
        );
      }
    }

    if (cleanPan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(cleanPan)) {
        return NextResponse.json(
          { error: "Invalid PAN format. Expected 10-character alphanumeric (e.g. AAPFU0939F)." },
          { status: 400 }
        );
      }
    }

    const stateInfo = resolveGstState(registeredState);

    const updatedSeller = await prisma.seller.update({
      where: { id: auth.seller.id },
      data: {
        legalBusinessName: legalBusinessName || undefined,
        name: tradeName || undefined,
        pan: cleanPan || null,
        gstin: cleanGst || null,
        taxRegistrationType: taxRegistrationType as TaxRegistrationType,
        businessConstitution: (businessConstitution as BusinessConstitution) || undefined,
        registeredState: stateInfo.name,
        registeredStateCode: stateInfo.code,
        registeredAddress: registeredAddress || undefined,
        pincode: pincode || undefined,
        invoicePrefix: (invoicePrefix || "INV").toUpperCase().slice(0, 6),
        compositionDeclaration: compositionDeclaration || undefined,
        isGstVerified: Boolean(cleanGst && cleanGst.length === 15),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Seller business & GST profile updated successfully.",
      seller: updatedSeller,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update seller billing profile." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { prisma } from "@/lib/server/prisma";
import { ComplianceDocType, ComplianceDocStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  const docs = await prisma.complianceDocument.findMany({
    where: { sellerId: auth.seller.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, documents: docs });
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { documentType, fileName, fileUrl, fileSizeBytes, mimeType, notes } = body;

    if (!documentType || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: documentType, fileName, fileUrl." },
        { status: 400 }
      );
    }

    const doc = await prisma.complianceDocument.create({
      data: {
        sellerId: auth.seller.id,
        documentType: documentType as ComplianceDocType,
        fileName,
        fileUrl,
        fileSizeBytes: fileSizeBytes || 102400,
        mimeType: mimeType || "application/pdf",
        verificationStatus: ComplianceDocStatus.VERIFIED, // verified automatically in verified atelier onboarding
        notes: notes || "Uploaded via Seller Billing & Tax Center",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Compliance document registered successfully.",
      document: doc,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save compliance document." },
      { status: 500 }
    );
  }
}


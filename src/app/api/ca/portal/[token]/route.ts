import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { billingInvoiceService, getFinancialYear } from "@/lib/server/billing-invoice-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Access token is required." }, { status: 400 });
  }

  const invitation = await prisma.accountantAccessInvitation.findUnique({
    where: { token },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          legalBusinessName: true,
          slug: true,
          gstin: true,
          pan: true,
          taxRegistrationType: true,
          registeredState: true,
        },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid or expired CA access token." }, { status: 403 });
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: "This CA access link has expired." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const financialYear = searchParams.get("financialYear") || getFinancialYear();
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString(), 10);

  try {
    const caPackage = await billingInvoiceService.generateMonthlyCaPackage(
      invitation.sellerId,
      { financialYear, month }
    );

    return NextResponse.json({
      success: true,
      invitation: {
        accountantName: invitation.accountantName,
        firmName: invitation.firmName,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        financialYears: invitation.financialYears,
      },
      seller: invitation.seller,
      report: caPackage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load CA reports." },
      { status: 500 }
    );
  }
}


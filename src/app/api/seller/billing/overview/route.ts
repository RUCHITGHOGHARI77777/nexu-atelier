import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { prisma } from "@/lib/server/prisma";
import { getFinancialYear } from "@/lib/server/billing-invoice-service";
import { InvoiceDocumentType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  const sellerId = auth.seller.id;
  const currentFy = getFinancialYear();

  try {
    const [
      seller,
      recentSalesInvoices,
      recentCommissionInvoices,
      recentCreditNotes,
      complianceDocs,
      accountantInvitations,
      allInvoicesCount,
      allSettledPayouts,
    ] = await Promise.all([
      prisma.seller.findUnique({
        where: { id: sellerId },
        select: {
          id: true,
          name: true,
          slug: true,
          legalBusinessName: true,
          pan: true,
          gstin: true,
          taxRegistrationType: true,
          businessConstitution: true,
          registeredState: true,
          registeredStateCode: true,
          registeredAddress: true,
          pincode: true,
          invoicePrefix: true,
          compositionDeclaration: true,
          isGstVerified: true,
          commissionRatePercent: true,
          bankAccountName: true,
          bankAccountNumber: true,
          bankIfsc: true,
          status: true,
        },
      }),
      prisma.marketplaceInvoice.findMany({
        where: {
          sellerId,
          documentType: {
            in: [InvoiceDocumentType.TAX_INVOICE, InvoiceDocumentType.BILL_OF_SUPPLY],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.marketplaceInvoice.findMany({
        where: {
          sellerId,
          documentType: InvoiceDocumentType.COMMISSION_INVOICE,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.marketplaceInvoice.findMany({
        where: {
          sellerId,
          documentType: InvoiceDocumentType.CREDIT_NOTE,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.complianceDocument.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.accountantAccessInvitation.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.marketplaceInvoice.count({
        where: {
          sellerId,
          documentType: {
            in: [InvoiceDocumentType.TAX_INVOICE, InvoiceDocumentType.BILL_OF_SUPPLY],
          },
        },
      }),
      prisma.vendorPayout.findMany({
        where: { sellerId },
        select: {
          grossAmountPaise: true,
          commissionPaise: true,
          netPayoutPaise: true,
          status: true,
        },
      }),
    ]);

    let totalGrossSalesPaise = 0;
    let totalCommissionPaise = 0;
    let totalSettledPaise = 0;
    let totalEscrowPaise = 0;

    for (const p of allSettledPayouts) {
      totalGrossSalesPaise += p.grossAmountPaise;
      totalCommissionPaise += p.commissionPaise;
      if (p.status === "SETTLED") {
        totalSettledPaise += p.netPayoutPaise;
      } else {
        totalEscrowPaise += p.netPayoutPaise;
      }
    }

    return NextResponse.json({
      success: true,
      currentFinancialYear: currentFy,
      seller,
      summary: {
        totalSalesInvoices: allInvoicesCount,
        grossSalesINR: (totalGrossSalesPaise / 100).toFixed(2),
        commissionPaidINR: (totalCommissionPaise / 100).toFixed(2),
        settledPayoutsINR: (totalSettledPaise / 100).toFixed(2),
        pendingEscrowINR: (totalEscrowPaise / 100).toFixed(2),
      },
      recentSalesInvoices,
      recentCommissionInvoices,
      recentCreditNotes,
      complianceDocs,
      accountantInvitations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load seller billing overview." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { prisma } from "@/lib/server/prisma";
import { InvoiceDocumentType, InvoiceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const docType = searchParams.get("docType");
  const financialYear = searchParams.get("financialYear");
  const query = searchParams.get("query");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  const whereClause: any = {
    sellerId: auth.seller.id,
  };

  if (docType && docType !== "ALL") {
    whereClause.documentType = docType as InvoiceDocumentType;
  }

  if (financialYear && financialYear !== "ALL") {
    whereClause.financialYear = financialYear;
  }

  if (query) {
    whereClause.OR = [
      { invoiceNumber: { contains: query, mode: "insensitive" } },
      { customerName: { contains: query, mode: "insensitive" } },
      { orderId: { contains: query, mode: "insensitive" } },
    ];
  }

  try {
    const [invoices, totalCount] = await Promise.all([
      prisma.marketplaceInvoice.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.marketplaceInvoice.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices." },
      { status: 500 }
    );
  }
}


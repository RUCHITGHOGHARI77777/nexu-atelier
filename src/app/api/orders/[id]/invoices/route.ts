import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { billingInvoiceService } from "@/lib/server/billing-invoice-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await billingInvoiceService.generateOrderInvoices(id);

    return NextResponse.json({
      success: true,
      orderId: id,
      salesInvoices: result.salesInvoices,
      commissionInvoices: result.commissionInvoices,
      paymentReceipt: result.receipt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve order invoices." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await billingInvoiceService.generateOrderInvoices(id);
    return NextResponse.json({
      success: true,
      orderId: id,
      salesInvoices: result.salesInvoices,
      commissionInvoices: result.commissionInvoices,
      paymentReceipt: result.receipt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate order invoices." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { InvoiceDocumentType, TaxRegistrationType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.marketplaceInvoice.findFirst({
    where: {
      OR: [{ id }, { invoiceNumber: id }],
    },
    include: {
      seller: true,
      order: true,
    },
  });

  if (!invoice) {
    return new NextResponse("Invoice document not found.", { status: 404 });
  }

  let items: any[] = [];
  try {
    items = JSON.parse(invoice.itemsJson);
  } catch {
    items = [];
  }

  let shippingAddress: any = {};
  try {
    shippingAddress = invoice.shippingAddressSnapshot
      ? JSON.parse(invoice.shippingAddressSnapshot)
      : {};
  } catch {
    shippingAddress = { street: invoice.shippingAddressSnapshot || "Delivery Point" };
  }

  const isComposition = invoice.supplierTaxType === TaxRegistrationType.COMPOSITION;
  const isUnregistered = invoice.supplierTaxType === TaxRegistrationType.UNREGISTERED;
  const isCommission = invoice.documentType === InvoiceDocumentType.COMMISSION_INVOICE;
  const isReceipt = invoice.documentType === InvoiceDocumentType.PAYMENT_RECEIPT;
  const isCreditNote = invoice.documentType === InvoiceDocumentType.CREDIT_NOTE;

  let docTitle = "TAX INVOICE";
  let statutorySub = "Issued under Section 31 of Central Goods and Services Tax Act, 2017";

  if (isCommission) {
    docTitle = "TAX INVOICE — PLATFORM INTERMEDIATION";
    statutorySub = "Issued by E-Commerce Operator (ECO) under SAC 998313";
  } else if (isCreditNote) {
    docTitle = "CREDIT NOTE";
    statutorySub = "Issued under Section 34 of Central Goods and Services Tax Act, 2017";
  } else if (isComposition) {
    docTitle = "BILL OF SUPPLY";
    statutorySub = "Composition taxable person, not eligible to collect tax on supplies.";
  } else if (isUnregistered) {
    docTitle = "BILL OF SUPPLY / DELIVERY MEMO";
    statutorySub = "Supplies made by unregistered artisan under GST threshold limit.";
  } else if (isReceipt) {
    docTitle = "PAYMENT ACKNOWLEDGEMENT RECEIPT";
    statutorySub = "Electronic receipt of payment for customer order";
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} — ${invoice.invoiceNumber}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #171717;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 40px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .doc-type {
      text-align: right;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .doc-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 22px;
      font-size: 13px;
      line-height: 1.45;
    }
    .box {
      background: #f8fafc;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .box-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #475569;
      margin-bottom: 6px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-table {
      width: 320px;
      margin-left: auto;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .totals-table td {
      padding: 4px 8px;
    }
    .total-highlight {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }
    .disclaimer {
      font-size: 11px;
      color: #64748b;
      background: #fdfdfd;
      border: 1px dashed #cbd5e1;
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 24px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
    .signature {
      text-align: right;
    }
    .sig-line {
      width: 160px;
      border-top: 1px solid #64748b;
      margin-top: 36px;
      margin-bottom: 4px;
    }
    .btn-bar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #0f172a;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-primary {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .invoice-card { box-shadow: none; border: none; padding: 0; }
      .btn-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="btn-bar">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    <a class="btn btn-primary" href="/seller/billing">Back to Portal</a>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">NEXU ATELIER</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
          Curated Luxury Artisan E-Commerce Platform
        </div>
      </div>
      <div class="doc-type">
        <div class="doc-title">${docTitle}</div>
        <div class="doc-sub">${statutorySub}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="box">
        <div class="box-title">Document Reference</div>
        <div><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div>
        <div><strong>Date:</strong> ${invoice.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
        <div><strong>Financial Year:</strong> ${invoice.financialYear}</div>
        ${invoice.orderId ? `<div><strong>Order Ref:</strong> #${invoice.orderId}</div>` : ""}
        <div><strong>Place of Supply:</strong> ${invoice.placeOfSupplyState} (${invoice.placeOfSupplyStateCode})</div>
        <div><strong>Supply Nature:</strong> ${invoice.isInterState ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}</div>
      </div>

      <div class="box">
        <div class="box-title">${isCommission ? "Service Provider (ECO)" : "Supplier / Seller Details"}</div>
        <div><strong>${invoice.supplierLegalName}</strong></div>
        ${invoice.supplierTradeName !== invoice.supplierLegalName ? `<div>Trade: ${invoice.supplierTradeName}</div>` : ""}
        <div>${invoice.supplierAddress}</div>
        <div>State: ${invoice.supplierState} (Code ${invoice.supplierStateCode})</div>
        ${invoice.supplierGstin ? `<div><strong>GSTIN:</strong> ${invoice.supplierGstin}</div>` : "<div><strong>GST Status:</strong> " + (isComposition ? "Composition Taxpayer (0%)" : "Unregistered Artisan") + "</div>"}
        ${invoice.supplierPan ? `<div><strong>PAN:</strong> ${invoice.supplierPan}</div>` : ""}
      </div>
    </div>

    <div class="grid-2">
      <div class="box">
        <div class="box-title">Recipient / Customer</div>
        <div><strong>${invoice.customerName}</strong></div>
        ${invoice.customerEmail ? `<div>Email: ${invoice.customerEmail}</div>` : ""}
        ${invoice.customerPhone ? `<div>Phone: ${invoice.customerPhone}</div>` : ""}
        ${invoice.customerGstin ? `<div><strong>GSTIN:</strong> ${invoice.customerGstin}</div>` : "<div>Consumer / Retail (B2C)</div>"}
      </div>

      <div class="box">
        <div class="box-title">Delivery Address</div>
        <div>${shippingAddress.fullName || invoice.customerName}</div>
        <div>${shippingAddress.street || ""}</div>
        <div>${shippingAddress.city || ""}, ${shippingAddress.state || invoice.placeOfSupplyState} - ${shippingAddress.pincode || ""}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px;">#</th>
          <th>Description</th>
          <th style="width: 70px;">HSN/SAC</th>
          <th class="text-center" style="width: 45px;">Qty</th>
          <th class="text-right" style="width: 80px;">Rate (₹)</th>
          <th class="text-right" style="width: 85px;">Taxable (₹)</th>
          ${!isComposition && !isUnregistered ? `
            <th class="text-right" style="width: 60px;">GST %</th>
            <th class="text-right" style="width: 85px;">Tax Amt (₹)</th>
          ` : ""}
          <th class="text-right" style="width: 90px;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((itm: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong>${itm.productTitle || itm.description}</strong>
              ${itm.variantSku ? `<br><span style="font-size: 11px; color: #64748b;">SKU: ${itm.variantSku}</span>` : ""}
            </td>
            <td>${itm.hsnCode || "-"}</td>
            <td class="text-center">${itm.quantity || 1}</td>
            <td class="text-right">${((itm.unitPricePaise || itm.taxableAmountPaise || 0) / 100).toFixed(2)}</td>
            <td class="text-right">${((itm.taxableAmountPaise || 0) / 100).toFixed(2)}</td>
            ${!isComposition && !isUnregistered ? `
              <td class="text-right">${itm.gstRatePercent || 0}%</td>
              <td class="text-right">${((itm.totalTaxPaise || (itm.cgstPaise || 0) + (itm.sgstPaise || 0) + (itm.igstPaise || 0)) / 100).toFixed(2)}</td>
            ` : ""}
            <td class="text-right">${((itm.lineTotalPaise || 0) / 100).toFixed(2)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td>Subtotal / Taxable Value:</td>
        <td class="text-right">₹${(invoice.taxableAmountPaise / 100).toFixed(2)}</td>
      </tr>
      ${invoice.cgstPaise > 0 ? `
        <tr>
          <td>Central Tax (CGST):</td>
          <td class="text-right">₹${(invoice.cgstPaise / 100).toFixed(2)}</td>
        </tr>
      ` : ""}
      ${invoice.sgstPaise > 0 ? `
        <tr>
          <td>State Tax (SGST):</td>
          <td class="text-right">₹${(invoice.sgstPaise / 100).toFixed(2)}</td>
        </tr>
      ` : ""}
      ${invoice.igstPaise > 0 ? `
        <tr>
          <td>Integrated Tax (IGST):</td>
          <td class="text-right">₹${(invoice.igstPaise / 100).toFixed(2)}</td>
        </tr>
      ` : ""}
      ${invoice.shippingChargesPaise > 0 ? `
        <tr>
          <td>Shipping & Handling:</td>
          <td class="text-right">₹${(invoice.shippingChargesPaise / 100).toFixed(2)}</td>
        </tr>
      ` : ""}
      ${invoice.discountPaise > 0 ? `
        <tr>
          <td>Discount:</td>
          <td class="text-right">-₹${(invoice.discountPaise / 100).toFixed(2)}</td>
        </tr>
      ` : ""}
      <tr class="total-highlight">
        <td>Total Invoice Value:</td>
        <td class="text-right">₹${(invoice.netAmountPaise / 100).toFixed(2)}</td>
      </tr>
    </table>

    <div class="disclaimer">
      <strong>Statutory Declaration & Terms:</strong><br>
      ${invoice.legalDisclaimer || "Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged."}
      <br>Payment Status: <strong>${invoice.paymentStatus || "CONFIRMED"}</strong> | Method: <strong>${invoice.paymentMethod || "ESCROW"}</strong>
    </div>

    <div class="footer">
      <div>
        <strong>Verification Hash:</strong> ${invoice.id}<br>
        Generated electronically via NEXU ATELIER Platform Ledger.
      </div>
      <div class="signature">
        <div class="sig-line"></div>
        Authorised Signatory<br>
        <strong>${invoice.supplierLegalName}</strong>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}


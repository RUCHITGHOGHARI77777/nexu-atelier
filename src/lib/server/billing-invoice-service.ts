/**
 * NEXU ATELIER — Statutory GST, Invoicing, Billing, Accounting & CA Reporting Engine
 * 
 * Strict Compliance:
 * - Indian Goods and Services Tax (GST) Acts & Rules (CBIC)
 * - Notification 13/2025-Central Tax (Rate) dated 17 Sept 2025
 * - Section 10 Composition Levy Rules (Bill of Supply + Mandatory Declaration)
 * - Section 22 Unregistered Artisan Supplies (Commercial Bill of Supply, No Invented GSTIN)
 * - E-Commerce Operator (ECO) Intermediation under SAC 998313 (18% GST)
 * - Immutable PostgreSQL Invoice Ledger (Integer Paise Arithmetic)
 */

import { prisma } from "@/lib/server/prisma";
import {
  TaxRegistrationType,
  BusinessConstitution,
  InvoiceDocumentType,
  InvoiceIssuerType,
  InvoiceStatus,
  PaymentStatus,
  PayoutStatus,
} from "@prisma/client";
import { suggestGstRateForHsn, lookupHsn } from "@/lib/tax-hsn-directory";

export const NEXU_PLATFORM_ECO = {
  legalName: "NEXU ATELIER PRIVATE LIMITED",
  tradeName: "NEXU ATELIER",
  gstin: "27AABCN1234F1Z8",
  pan: "AABCN1234F",
  cin: "U74999MH2025PTC394821",
  state: "Maharashtra",
  stateCode: "27",
  address: "Atelier Tower, BKC, Bandra East, Mumbai, Maharashtra 400051",
  pincode: "400051",
  supportEmail: "concierge@nexuatelier.com",
  taxEmail: "tax.compliance@nexuatelier.com",
  defaultCommissionRatePercent: 10.0,
  platformSacCode: "998313", // Information technology and e-commerce intermediary platform services
  platformGstRatePercent: 18.0, // 9% CGST + 9% SGST or 18% IGST
};

export const GST_STATE_CODE_MAP: Record<string, { code: string; name: string }> = {
  "01": { code: "01", name: "Jammu and Kashmir" },
  "02": { code: "02", name: "Himachal Pradesh" },
  "03": { code: "03", name: "Punjab" },
  "04": { code: "04", name: "Chandigarh" },
  "05": { code: "05", name: "Uttarakhand" },
  "06": { code: "06", name: "Haryana" },
  "07": { code: "07", name: "Delhi" },
  "08": { code: "08", name: "Rajasthan" },
  "09": { code: "09", name: "Uttar Pradesh" },
  "10": { code: "10", name: "Bihar" },
  "11": { code: "11", name: "Sikkim" },
  "12": { code: "12", name: "Arunachal Pradesh" },
  "13": { code: "13", name: "Nagaland" },
  "14": { code: "14", name: "Manipur" },
  "15": { code: "15", name: "Mizoram" },
  "16": { code: "16", name: "Tripura" },
  "17": { code: "17", name: "Meghalaya" },
  "18": { code: "18", name: "Assam" },
  "19": { code: "19", name: "West Bengal" },
  "20": { code: "20", name: "Jharkhand" },
  "21": { code: "21", name: "Odisha" },
  "22": { code: "22", name: "Chhattisgarh" },
  "23": { code: "23", name: "Madhya Pradesh" },
  "24": { code: "24", name: "Gujarat" },
  "25": { code: "25", name: "Daman and Diu" },
  "26": { code: "26", name: "Dadra and Nagar Haveli" },
  "27": { code: "27", name: "Maharashtra" },
  "28": { code: "28", name: "Andhra Pradesh" },
  "29": { code: "29", name: "Karnataka" },
  "30": { code: "30", name: "Goa" },
  "31": { code: "31", name: "Lakshadweep" },
  "32": { code: "32", name: "Kerala" },
  "33": { code: "33", name: "Tamil Nadu" },
  "34": { code: "34", name: "Puducherry" },
  "35": { code: "35", name: "Andaman and Nicobar Islands" },
  "36": { code: "36", name: "Telangana" },
  "37": { code: "37", name: "Andhra Pradesh (New)" },
  "38": { code: "38", name: "Ladakh" },
};

/**
 * Normalizes state name to standardized name and 2-digit GST code.
 */
export function resolveGstState(stateOrCodeInput?: string | null): { code: string; name: string } {
  if (!stateOrCodeInput) {
    return { code: "27", name: "Maharashtra" };
  }

  const clean = stateOrCodeInput.trim().toLowerCase();

  if (/^\d{2}$/.test(clean) && GST_STATE_CODE_MAP[clean]) {
    return GST_STATE_CODE_MAP[clean];
  }

  for (const [code, val] of Object.entries(GST_STATE_CODE_MAP)) {
    if (
      val.name.toLowerCase() === clean ||
      clean.includes(val.name.toLowerCase()) ||
      val.name.toLowerCase().includes(clean)
    ) {
      return val;
    }
  }

  return { code: "27", name: "Maharashtra" };
}

/**
 * Calculates Indian Financial Year string from Date (e.g. "2026-27").
 */
export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Jan, 3 = April
  const year = date.getFullYear();
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

export interface InvoiceItemLineSnapshot {
  orderItemId: string;
  productId?: string;
  productTitle: string;
  variantSku?: string;
  hsnCode: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  taxableAmountPaise: number;
  gstRatePercent: number;
  cgstRatePercent: number;
  sgstRatePercent: number;
  igstRatePercent: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  discountPaise: number;
}

export class BillingInvoiceService {
  /**
   * Generates next sequential invoice number for a seller/platform, FY and document type.
   */
  public async getNextInvoiceNumber(
    financialYear: string,
    documentType: InvoiceDocumentType,
    prefix: string = "INV",
    sellerId?: string | null
  ): Promise<{ invoiceNumber: string; sequenceNumber: number }> {
    const filter: any = {
      financialYear,
      documentType,
    };
    if (sellerId) {
      filter.sellerId = sellerId;
    } else {
      filter.issuerType = InvoiceIssuerType.PLATFORM;
    }

    const count = await prisma.marketplaceInvoice.count({ where: filter });
    let sequenceNumber = count + 1;
    let invoiceNumber = `${prefix}/${financialYear}/${sequenceNumber.toString().padStart(4, "0")}`;

    let existing = await prisma.marketplaceInvoice.findUnique({ where: { invoiceNumber } });
    while (existing) {
      sequenceNumber++;
      invoiceNumber = `${prefix}/${financialYear}/${sequenceNumber.toString().padStart(4, "0")}`;
      existing = await prisma.marketplaceInvoice.findUnique({ where: { invoiceNumber } });
    }

    return { invoiceNumber, sequenceNumber };
  }

  /**
   * Generates or fetches all discrete invoices for an order:
   * 1. Seller Customer Sales Invoices (TAX_INVOICE or BILL_OF_SUPPLY)
   * 2. Platform Commission Invoices (COMMISSION_INVOICE)
   * 3. Customer Payment Receipt (PAYMENT_RECEIPT)
   */
  public async generateOrderInvoices(orderId: string): Promise<{
    salesInvoices: any[];
    commissionInvoices: any[];
    receipt: any | null;
  }> {
    const existingInvoices = await prisma.marketplaceInvoice.findMany({
      where: { orderId },
      include: { seller: true },
      orderBy: { createdAt: "asc" },
    });

    if (existingInvoices.length > 0) {
      return {
        salesInvoices: existingInvoices.filter(
          (inv) =>
            inv.documentType === InvoiceDocumentType.TAX_INVOICE ||
            inv.documentType === InvoiceDocumentType.BILL_OF_SUPPLY
        ),
        commissionInvoices: existingInvoices.filter(
          (inv) => inv.documentType === InvoiceDocumentType.COMMISSION_INVOICE
        ),
        receipt:
          existingInvoices.find(
            (inv) => inv.documentType === InvoiceDocumentType.PAYMENT_RECEIPT
          ) || null,
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: {
          include: { profile: true },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    let shippingAddress: any = {};
    try {
      shippingAddress = JSON.parse(order.shippingAddressSnapshot);
    } catch {
      shippingAddress = {
        fullName: order.customerName,
        street: "Delivery Address",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      };
    }

    const placeOfSupply = resolveGstState(shippingAddress.state);
    const financialYear = getFinancialYear(order.createdAt);

    const vendorGroups = new Map<string, typeof order.items>();
    for (const item of order.items) {
      const list = vendorGroups.get(item.vendorId) || [];
      list.push(item);
      vendorGroups.set(item.vendorId, list);
    }

    const createdSalesInvoices: any[] = [];
    const createdCommissionInvoices: any[] = [];

    for (const [vendorId, items] of vendorGroups.entries()) {
      const seller = await prisma.seller.findUnique({
        where: { id: vendorId },
      });

      const supplierState = resolveGstState(seller?.registeredState || seller?.originHub || "Maharashtra");
      const isInterState = supplierState.code !== placeOfSupply.code;
      const taxRegType = seller?.taxRegistrationType || TaxRegistrationType.REGULAR;

      let docType: InvoiceDocumentType = InvoiceDocumentType.TAX_INVOICE;
      const sellerTag = (seller?.invoicePrefix || "INV").toUpperCase();
      let prefix = sellerTag;
      let legalDisclaimer = "";

      if (taxRegType === TaxRegistrationType.COMPOSITION) {
        docType = InvoiceDocumentType.BILL_OF_SUPPLY;
        prefix = sellerTag === "INV" ? "BOS" : `${sellerTag}-BOS`;
        legalDisclaimer =
          seller?.compositionDeclaration ||
          "Composition taxable person, not eligible to collect tax on supplies.";
      } else if (taxRegType === TaxRegistrationType.UNREGISTERED) {
        docType = InvoiceDocumentType.BILL_OF_SUPPLY;
        prefix = sellerTag === "INV" ? "BOS" : `${sellerTag}-BOS`;
        legalDisclaimer =
          "Commercial Bill of Supply / Delivery Memo. Supplies made by an unregistered artisan under GST exemption threshold.";
      } else if (taxRegType === TaxRegistrationType.EXEMPT) {
        docType = InvoiceDocumentType.BILL_OF_SUPPLY;
        prefix = sellerTag === "INV" ? "BOS" : `${sellerTag}-BOS`;
        legalDisclaimer = "Bill of Supply for wholly exempt artisanal supplies.";
      } else {
        legalDisclaimer = "Tax Invoice issued under Section 31 of the CGST Act, 2017.";
      }

      const lineSnapshots: InvoiceItemLineSnapshot[] = [];
      let totalGrossPaise = 0;
      let totalTaxablePaise = 0;
      let totalCgstPaise = 0;
      let totalSgstPaise = 0;
      let totalIgstPaise = 0;

      for (const item of items) {
        const itemLineTotal = item.lineTotalPaise;
        totalGrossPaise += itemLineTotal;

        let hsn = "6204"; // Standard apparel/textile fallback
        if (item.product?.categoryId) {
        }

        const rateInfo = suggestGstRateForHsn(hsn, (item.unitPricePaise / 100));
        let applicableRatePercent = rateInfo.ratePercent;

        if (taxRegType !== TaxRegistrationType.REGULAR) {
          applicableRatePercent = 0;
        }

        let taxableAmount = itemLineTotal;
        let cgstRate = 0;
        let sgstRate = 0;
        let igstRate = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        let taxAmount = 0;

        if (applicableRatePercent > 0) {
          taxableAmount = Math.round((itemLineTotal * 100) / (100 + applicableRatePercent));
          taxAmount = itemLineTotal - taxableAmount;

          if (isInterState) {
            igstRate = applicableRatePercent;
            igstAmount = taxAmount;
          } else {
            cgstRate = applicableRatePercent / 2;
            sgstRate = applicableRatePercent / 2;
            cgstAmount = Math.floor(taxAmount / 2);
            sgstAmount = taxAmount - cgstAmount;
          }
        }

        totalTaxablePaise += taxableAmount;
        totalCgstPaise += cgstAmount;
        totalSgstPaise += sgstAmount;
        totalIgstPaise += igstAmount;

        lineSnapshots.push({
          orderItemId: item.id,
          productId: item.productId || undefined,
          productTitle: item.title,
          variantSku: item.selectedSku || undefined,
          hsnCode: hsn,
          quantity: item.quantity,
          unitPricePaise: item.unitPricePaise,
          lineTotalPaise: itemLineTotal,
          taxableAmountPaise: taxableAmount,
          gstRatePercent: applicableRatePercent,
          cgstRatePercent: cgstRate,
          sgstRatePercent: sgstRate,
          igstRatePercent: igstRate,
          cgstPaise: cgstAmount,
          sgstPaise: sgstAmount,
          igstPaise: igstAmount,
          totalTaxPaise: taxAmount,
          discountPaise: 0,
        });
      }

      const { invoiceNumber, sequenceNumber } = await this.getNextInvoiceNumber(
        financialYear,
        docType,
        prefix,
        seller?.id
      );

      const latestPayment = order.payments[0];

      const salesInvoice = await prisma.marketplaceInvoice.create({
        data: {
          invoiceNumber,
          financialYear,
          sequenceNumber,
          documentType: docType,
          issuerType: InvoiceIssuerType.SELLER,
          sellerId: seller?.id || null,
          orderId: order.id,
          customerId: order.customerId,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customer.profile?.phone || null,
          billingAddressSnapshot: JSON.stringify(shippingAddress),
          shippingAddressSnapshot: JSON.stringify(shippingAddress),
          placeOfSupplyState: placeOfSupply.name,
          placeOfSupplyStateCode: placeOfSupply.code,
          supplierState: supplierState.name,
          supplierStateCode: supplierState.code,
          isInterState,
          supplierLegalName: seller?.legalBusinessName || seller?.name || "Atelier Studio Partner",
          supplierTradeName: seller?.name || "Atelier Studio",
          supplierGstin: taxRegType === TaxRegistrationType.REGULAR ? (seller?.gstin || null) : null,
          supplierPan: seller?.pan || null,
          supplierAddress: seller?.registeredAddress || seller?.originHub || "India",
          supplierTaxType: taxRegType,
          customerGstin: null, // B2C Retail Order
          currency: "INR",
          grossTotalPaise: totalGrossPaise,
          taxableAmountPaise: totalTaxablePaise,
          cgstPaise: totalCgstPaise,
          sgstPaise: totalSgstPaise,
          igstPaise: totalIgstPaise,
          discountPaise: 0,
          shippingChargesPaise: 0,
          shippingGstPaise: 0,
          roundOffPaise: 0,
          netAmountPaise: totalGrossPaise,
          paymentMethod: latestPayment?.method || (order.isCod ? "COD" : "ESCROW"),
          paymentStatus: latestPayment?.status || order.paymentStatus,
          paymentTransactionId: latestPayment?.transactionRef || null,
          status: InvoiceStatus.ISSUED,
          legalDisclaimer,
          itemsJson: JSON.stringify(lineSnapshots),
          qrCodeData: `GSTIN:${seller?.gstin || "N/A"}|INV:${invoiceNumber}|DATE:${order.createdAt.toISOString().slice(0, 10)}|VAL:${(totalGrossPaise / 100).toFixed(2)}`,
        },
      });

      createdSalesInvoices.push(salesInvoice);

      const commissionRate = seller?.commissionRatePercent || NEXU_PLATFORM_ECO.defaultCommissionRatePercent;
      const commissionTaxablePaise = Math.round((totalGrossPaise * commissionRate) / 100);

      const isCommissionInterState = supplierState.code !== NEXU_PLATFORM_ECO.stateCode;
      let commCgstPaise = 0;
      let commSgstPaise = 0;
      let commIgstPaise = 0;
      const commTaxTotalPaise = Math.round((commissionTaxablePaise * NEXU_PLATFORM_ECO.platformGstRatePercent) / 100);

      if (isCommissionInterState) {
        commIgstPaise = commTaxTotalPaise;
      } else {
        commCgstPaise = Math.floor(commTaxTotalPaise / 2);
        commSgstPaise = commTaxTotalPaise - commCgstPaise;
      }

      const commissionNetPaise = commissionTaxablePaise + commTaxTotalPaise;

      const { invoiceNumber: commInvNumber, sequenceNumber: commSeqNumber } =
        await this.getNextInvoiceNumber(
          financialYear,
          InvoiceDocumentType.COMMISSION_INVOICE,
          "COM",
          null // Platform issuer
        );

      const commItems = [
        {
          orderItemId: `COMM-${order.id}-${vendorId}`,
          productTitle: `Marketplace Listing & Intermediation Services (${commissionRate}% on Order #${order.id})`,
          hsnCode: NEXU_PLATFORM_ECO.platformSacCode,
          quantity: 1,
          unitPricePaise: commissionTaxablePaise,
          lineTotalPaise: commissionNetPaise,
          taxableAmountPaise: commissionTaxablePaise,
          gstRatePercent: NEXU_PLATFORM_ECO.platformGstRatePercent,
          cgstRatePercent: isCommissionInterState ? 0 : 9.0,
          sgstRatePercent: isCommissionInterState ? 0 : 9.0,
          igstRatePercent: isCommissionInterState ? 18.0 : 0,
          cgstPaise: commCgstPaise,
          sgstPaise: commSgstPaise,
          igstPaise: commIgstPaise,
          totalTaxPaise: commTaxTotalPaise,
          discountPaise: 0,
        },
      ];

      const commissionInvoice = await prisma.marketplaceInvoice.create({
        data: {
          invoiceNumber: commInvNumber,
          financialYear,
          sequenceNumber: commSeqNumber,
          documentType: InvoiceDocumentType.COMMISSION_INVOICE,
          issuerType: InvoiceIssuerType.PLATFORM,
          sellerId: seller?.id || null,
          orderId: order.id,
          customerId: null,
          customerName: seller?.legalBusinessName || seller?.name || "Seller Partner",
          customerEmail: seller?.businessEmail || null,
          customerPhone: seller?.businessPhone || null,
          billingAddressSnapshot: seller?.registeredAddress || seller?.originHub || "",
          shippingAddressSnapshot: seller?.registeredAddress || seller?.originHub || "",
          placeOfSupplyState: supplierState.name,
          placeOfSupplyStateCode: supplierState.code,
          supplierState: NEXU_PLATFORM_ECO.state,
          supplierStateCode: NEXU_PLATFORM_ECO.stateCode,
          isInterState: isCommissionInterState,
          supplierLegalName: NEXU_PLATFORM_ECO.legalName,
          supplierTradeName: NEXU_PLATFORM_ECO.tradeName,
          supplierGstin: NEXU_PLATFORM_ECO.gstin,
          supplierPan: NEXU_PLATFORM_ECO.pan,
          supplierAddress: NEXU_PLATFORM_ECO.address,
          supplierTaxType: TaxRegistrationType.REGULAR,
          customerGstin: seller?.gstin || null,
          currency: "INR",
          grossTotalPaise: commissionNetPaise,
          taxableAmountPaise: commissionTaxablePaise,
          cgstPaise: commCgstPaise,
          sgstPaise: commSgstPaise,
          igstPaise: commIgstPaise,
          discountPaise: 0,
          shippingChargesPaise: 0,
          shippingGstPaise: 0,
          roundOffPaise: 0,
          netAmountPaise: commissionNetPaise,
          paymentMethod: "ESCROW_COMMISSION_OFFSET",
          paymentStatus: "SETTLED",
          status: InvoiceStatus.ISSUED,
          legalDisclaimer:
            "Tax Invoice issued by E-Commerce Operator under Section 31 of CGST Act for marketplace facilitation services (SAC 998313). Eligible for ITC by GST-registered suppliers.",
          itemsJson: JSON.stringify(commItems),
          qrCodeData: `GSTIN:${NEXU_PLATFORM_ECO.gstin}|INV:${commInvNumber}|SAC:${NEXU_PLATFORM_ECO.platformSacCode}|VAL:${(commissionNetPaise / 100).toFixed(2)}`,
        },
      });

      createdCommissionInvoices.push(commissionInvoice);
    }

    const latestPayment = order.payments[0];
    const { invoiceNumber: receiptNumber, sequenceNumber: receiptSeq } =
      await this.getNextInvoiceNumber(
        financialYear,
        InvoiceDocumentType.PAYMENT_RECEIPT,
        "RCP",
        null
      );

    const paymentReceipt = await prisma.marketplaceInvoice.create({
      data: {
        invoiceNumber: receiptNumber,
        financialYear,
        sequenceNumber: receiptSeq,
        documentType: InvoiceDocumentType.PAYMENT_RECEIPT,
        issuerType: InvoiceIssuerType.PLATFORM,
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customer.profile?.phone || null,
        billingAddressSnapshot: JSON.stringify(shippingAddress),
        shippingAddressSnapshot: JSON.stringify(shippingAddress),
        placeOfSupplyState: placeOfSupply.name,
        placeOfSupplyStateCode: placeOfSupply.code,
        supplierState: NEXU_PLATFORM_ECO.state,
        supplierStateCode: NEXU_PLATFORM_ECO.stateCode,
        isInterState: false,
        supplierLegalName: NEXU_PLATFORM_ECO.legalName,
        supplierTradeName: NEXU_PLATFORM_ECO.tradeName,
        supplierGstin: NEXU_PLATFORM_ECO.gstin,
        supplierAddress: NEXU_PLATFORM_ECO.address,
        grossTotalPaise: order.totalPaise,
        taxableAmountPaise: order.subtotalPaise,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: 0,
        shippingChargesPaise: order.shippingFeePaise,
        discountPaise: order.discountPaise || 0,
        netAmountPaise: order.totalPaise,
        paymentMethod: latestPayment?.method || (order.isCod ? "COD" : "PREPAID"),
        paymentStatus: latestPayment?.status || order.paymentStatus,
        paymentTransactionId: latestPayment?.transactionRef || null,
        status: InvoiceStatus.ISSUED,
        legalDisclaimer:
          "Payment acknowledgement receipt for order placed on NEXU ATELIER marketplace. Discrete tax invoices have been issued by the respective independent suppliers.",
        itemsJson: JSON.stringify([
          {
            productTitle: `Order #${order.id} Full Settlement (${order.items.length} artisan items)`,
            lineTotalPaise: order.totalPaise,
            quantity: 1,
          },
        ]),
      },
    });

    return {
      salesInvoices: createdSalesInvoices,
      commissionInvoices: createdCommissionInvoices,
      receipt: paymentReceipt,
    };
  }

  /**
   * Generates a Credit Note when an item or order is cancelled / returned.
   */
  public async generateCreditNote(params: {
    orderId: string;
    sellerId?: string;
    orderItemId?: string;
    reason: string;
    cancelledAmountPaise?: number;
  }): Promise<any> {
    const originalInvoice = await prisma.marketplaceInvoice.findFirst({
      where: {
        orderId: params.orderId,
        ...(params.sellerId ? { sellerId: params.sellerId } : {}),
        documentType: { in: [InvoiceDocumentType.TAX_INVOICE, InvoiceDocumentType.BILL_OF_SUPPLY] },
        status: InvoiceStatus.ISSUED,
        ...(params.cancelledAmountPaise ? { netAmountPaise: { gte: params.cancelledAmountPaise } } : {}),
      },
      orderBy: [
        { cgstPaise: "desc" },
        { documentType: "asc" },
        { createdAt: "asc" },
      ],
    });

    if (!originalInvoice) {
      throw new Error(`Original issued invoice for order #${params.orderId} not found.`);
    }

    const financialYear = getFinancialYear();
    const { invoiceNumber, sequenceNumber } = await this.getNextInvoiceNumber(
      financialYear,
      InvoiceDocumentType.CREDIT_NOTE,
      "CN",
      originalInvoice.sellerId
    );

    const reversalPaise = params.cancelledAmountPaise || originalInvoice.netAmountPaise;
    const ratio = reversalPaise / (originalInvoice.netAmountPaise || 1);

    const reversedTaxablePaise = Math.round(originalInvoice.taxableAmountPaise * ratio);
    const reversedCgstPaise = Math.round(originalInvoice.cgstPaise * ratio);
    const reversedSgstPaise = Math.round(originalInvoice.sgstPaise * ratio);
    const reversedIgstPaise = Math.round(originalInvoice.igstPaise * ratio);

    const creditNote = await prisma.marketplaceInvoice.create({
      data: {
        invoiceNumber,
        financialYear,
        sequenceNumber,
        documentType: InvoiceDocumentType.CREDIT_NOTE,
        issuerType: originalInvoice.issuerType,
        sellerId: originalInvoice.sellerId,
        orderId: params.orderId,
        orderItemId: params.orderItemId || null,
        customerId: originalInvoice.customerId,
        customerName: originalInvoice.customerName,
        customerEmail: originalInvoice.customerEmail,
        customerPhone: originalInvoice.customerPhone,
        billingAddressSnapshot: originalInvoice.billingAddressSnapshot,
        shippingAddressSnapshot: originalInvoice.shippingAddressSnapshot,
        placeOfSupplyState: originalInvoice.placeOfSupplyState,
        placeOfSupplyStateCode: originalInvoice.placeOfSupplyStateCode,
        supplierState: originalInvoice.supplierState,
        supplierStateCode: originalInvoice.supplierStateCode,
        isInterState: originalInvoice.isInterState,
        supplierLegalName: originalInvoice.supplierLegalName,
        supplierTradeName: originalInvoice.supplierTradeName,
        supplierGstin: originalInvoice.supplierGstin,
        supplierPan: originalInvoice.supplierPan,
        supplierAddress: originalInvoice.supplierAddress,
        supplierTaxType: originalInvoice.supplierTaxType,
        grossTotalPaise: reversalPaise,
        taxableAmountPaise: reversedTaxablePaise,
        cgstPaise: reversedCgstPaise,
        sgstPaise: reversedSgstPaise,
        igstPaise: reversedIgstPaise,
        discountPaise: 0,
        netAmountPaise: reversalPaise,
        status: InvoiceStatus.ISSUED,
        relatedInvoiceId: originalInvoice.id,
        cancellationReason: params.reason,
        legalDisclaimer: `Credit Note issued under Section 34 of CGST Act against original invoice ${originalInvoice.invoiceNumber}.`,
        itemsJson: JSON.stringify([
          {
            description: `Reversal / Return for ${params.reason}`,
            originalInvoiceNumber: originalInvoice.invoiceNumber,
            reversalAmountPaise: reversalPaise,
          },
        ]),
      },
    });

    return creditNote;
  }

  /**
   * Generates a complete Monthly CA Package for a seller, aligning with Indian GSTR-1 and books.
   */
  public async generateMonthlyCaPackage(
    sellerId: string,
    params: { financialYear: string; month: number } // month 1-12
  ): Promise<{
    financialYear: string;
    month: number;
    monthName: string;
    sellerProfile: any;
    salesRegister: any[];
    invoiceRegister: any[];
    creditNotesRegister: any[];
    taxSummaryHsn: any[];
    commissionStatements: any[];
    settlementsRegister: any[];
    summaryTotals: {
      totalGrossSalesPaise: number;
      totalTaxableSalesPaise: number;
      totalCgstPaise: number;
      totalSgstPaise: number;
      totalIgstPaise: number;
      totalTaxCollectedPaise: number;
      totalCreditNotesValuePaise: number;
      netTaxableSalesPaise: number;
      netTaxCollectedPaise: number;
      totalPlatformCommissionPaise: number;
      totalPlatformGstPaidPaise: number;
      netSellerSettledPaise: number;
    };
  }> {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        complianceDocs: true,
      },
    });

    if (!seller) {
      throw new Error(`Seller #${sellerId} not found.`);
    }

    const [startYearStr, endYearShort] = params.financialYear.split("-");
    const startYear = parseInt(startYearStr, 10);
    const calYear = params.month >= 4 ? startYear : startYear + 1;

    const startDate = new Date(calYear, params.month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(calYear, params.month, 0, 23, 59, 59, 999);
    const monthName = startDate.toLocaleString("en-US", { month: "long" });

    const salesInvoices = await prisma.marketplaceInvoice.findMany({
      where: {
        sellerId,
        documentType: {
          in: [
            InvoiceDocumentType.TAX_INVOICE,
            InvoiceDocumentType.BILL_OF_SUPPLY,
          ],
        },
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { sequenceNumber: "asc" },
    });

    const creditNotes = await prisma.marketplaceInvoice.findMany({
      where: {
        sellerId,
        documentType: InvoiceDocumentType.CREDIT_NOTE,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: "asc" },
    });

    const commissionInvoices = await prisma.marketplaceInvoice.findMany({
      where: {
        sellerId,
        documentType: InvoiceDocumentType.COMMISSION_INVOICE,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: "asc" },
    });

    const payouts = await prisma.vendorPayout.findMany({
      where: {
        sellerId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        orderItem: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const salesRegister: any[] = [];
    const hsnAggregator = new Map<string, any>();

    let totalGrossSalesPaise = 0;
    let totalTaxableSalesPaise = 0;
    let totalCgstPaise = 0;
    let totalSgstPaise = 0;
    let totalIgstPaise = 0;

    for (const inv of salesInvoices) {
      totalGrossSalesPaise += inv.grossTotalPaise;
      totalTaxableSalesPaise += inv.taxableAmountPaise;
      totalCgstPaise += inv.cgstPaise;
      totalSgstPaise += inv.sgstPaise;
      totalIgstPaise += inv.igstPaise;

      let items: InvoiceItemLineSnapshot[] = [];
      try {
        items = JSON.parse(inv.itemsJson);
      } catch {
        items = [];
      }

      for (const itm of items) {
        salesRegister.push({
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.createdAt.toISOString().slice(0, 10),
          invoiceType: inv.documentType,
          customerName: inv.customerName,
          placeOfSupplyState: inv.placeOfSupplyState,
          placeOfSupplyCode: inv.placeOfSupplyStateCode,
          reverseCharge: "N",
          hsnCode: itm.hsnCode || "6204",
          itemDescription: itm.productTitle,
          quantity: itm.quantity,
          ratePercent: itm.gstRatePercent,
          taxableValueINR: (itm.taxableAmountPaise / 100).toFixed(2),
          cgstINR: (itm.cgstPaise / 100).toFixed(2),
          sgstINR: (itm.sgstPaise / 100).toFixed(2),
          igstINR: (itm.igstPaise / 100).toFixed(2),
          cessINR: "0.00",
          totalInvoiceValueINR: (itm.lineTotalPaise / 100).toFixed(2),
        });

        const hsnKey = `${itm.hsnCode}_${itm.gstRatePercent}`;
        const existing = hsnAggregator.get(hsnKey) || {
          hsnCode: itm.hsnCode,
          description: itm.productTitle,
          quantity: 0,
          ratePercent: itm.gstRatePercent,
          grossTotalPaise: 0,
          taxableAmountPaise: 0,
          cgstPaise: 0,
          sgstPaise: 0,
          igstPaise: 0,
        };

        existing.quantity += itm.quantity;
        existing.grossTotalPaise += itm.lineTotalPaise;
        existing.taxableAmountPaise += itm.taxableAmountPaise;
        existing.cgstPaise += itm.cgstPaise;
        existing.sgstPaise += itm.sgstPaise;
        existing.igstPaise += itm.igstPaise;
        hsnAggregator.set(hsnKey, existing);
      }
    }

    const taxSummaryHsn = Array.from(hsnAggregator.values()).map((h) => ({
      hsnCode: h.hsnCode,
      description: h.description,
      totalUnits: h.quantity,
      ratePercent: h.ratePercent,
      grossTotalINR: (h.grossTotalPaise / 100).toFixed(2),
      taxableAmountINR: (h.taxableAmountPaise / 100).toFixed(2),
      cgstINR: (h.cgstPaise / 100).toFixed(2),
      sgstINR: (h.sgstPaise / 100).toFixed(2),
      igstINR: (h.igstPaise / 100).toFixed(2),
      totalTaxINR: ((h.cgstPaise + h.sgstPaise + h.igstPaise) / 100).toFixed(2),
    }));

    let totalCreditNotesValuePaise = 0;
    let reversedTaxablePaise = 0;
    let reversedTaxPaise = 0;

    const creditNotesRegister = creditNotes.map((cn) => {
      totalCreditNotesValuePaise += cn.netAmountPaise;
      reversedTaxablePaise += cn.taxableAmountPaise;
      reversedTaxPaise += cn.cgstPaise + cn.sgstPaise + cn.igstPaise;

      return {
        creditNoteNumber: cn.invoiceNumber,
        noteDate: cn.createdAt.toISOString().slice(0, 10),
        originalInvoiceId: cn.relatedInvoiceId,
        orderId: cn.orderId,
        reason: cn.cancellationReason || "Cancellation/Return",
        taxableValueINR: (cn.taxableAmountPaise / 100).toFixed(2),
        cgstINR: (cn.cgstPaise / 100).toFixed(2),
        sgstINR: (cn.sgstPaise / 100).toFixed(2),
        igstINR: (cn.igstPaise / 100).toFixed(2),
        totalReversedINR: (cn.netAmountPaise / 100).toFixed(2),
      };
    });

    let totalPlatformCommissionPaise = 0;
    let totalPlatformGstPaidPaise = 0;

    const commissionStatements = commissionInvoices.map((ci) => {
      totalPlatformCommissionPaise += ci.taxableAmountPaise;
      const gstPaid = ci.cgstPaise + ci.sgstPaise + ci.igstPaise;
      totalPlatformGstPaidPaise += gstPaid;

      return {
        commissionInvoiceNumber: ci.invoiceNumber,
        invoiceDate: ci.createdAt.toISOString().slice(0, 10),
        orderId: ci.orderId,
        platformProvider: ci.supplierLegalName,
        sacCode: NEXU_PLATFORM_ECO.platformSacCode,
        taxableCommissionINR: (ci.taxableAmountPaise / 100).toFixed(2),
        cgstINR: (ci.cgstPaise / 100).toFixed(2),
        sgstINR: (ci.sgstPaise / 100).toFixed(2),
        igstINR: (ci.igstPaise / 100).toFixed(2),
        totalChargedINR: (ci.netAmountPaise / 100).toFixed(2),
        itcEligibility: seller.taxRegistrationType === TaxRegistrationType.REGULAR ? "ELIGIBLE" : "INELIGIBLE_COMPOSITION",
      };
    });

    let netSellerSettledPaise = 0;
    const settlementsRegister = payouts.map((po) => {
      if (po.status === PayoutStatus.SETTLED) {
        netSellerSettledPaise += po.netPayoutPaise;
      }
      return {
        payoutId: po.id,
        orderItemId: po.orderItemId,
        grossSalesINR: (po.grossAmountPaise / 100).toFixed(2),
        commissionINR: (po.commissionPaise / 100).toFixed(2),
        netPayoutINR: (po.netPayoutPaise / 100).toFixed(2),
        status: po.status,
        settledDate: po.settledAt ? po.settledAt.toISOString().slice(0, 10) : "PENDING",
        transactionRef: po.transactionRef || "N/A",
      };
    });

    const netTaxableSalesPaise = Math.max(0, totalTaxableSalesPaise - reversedTaxablePaise);
    const totalTaxCollectedPaise = totalCgstPaise + totalSgstPaise + totalIgstPaise;
    const netTaxCollectedPaise = Math.max(0, totalTaxCollectedPaise - reversedTaxPaise);

    return {
      financialYear: params.financialYear,
      month: params.month,
      monthName,
      sellerProfile: {
        id: seller.id,
        legalBusinessName: seller.legalBusinessName || seller.name,
        tradeName: seller.name,
        gstin: seller.gstin,
        pan: seller.pan,
        taxRegistrationType: seller.taxRegistrationType,
        businessConstitution: seller.businessConstitution,
        registeredState: seller.registeredState || seller.originHub,
        registeredAddress: seller.registeredAddress,
        isGstVerified: seller.isGstVerified,
      },
      salesRegister,
      invoiceRegister: salesInvoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt.toISOString().slice(0, 10),
        documentType: inv.documentType,
        orderId: inv.orderId,
        customerName: inv.customerName,
        taxableValueINR: (inv.taxableAmountPaise / 100).toFixed(2),
        totalTaxINR: ((inv.cgstPaise + inv.sgstPaise + inv.igstPaise) / 100).toFixed(2),
        netAmountINR: (inv.netAmountPaise / 100).toFixed(2),
        paymentMethod: inv.paymentMethod,
        paymentStatus: inv.paymentStatus,
        status: inv.status,
      })),
      creditNotesRegister,
      taxSummaryHsn,
      commissionStatements,
      settlementsRegister,
      summaryTotals: {
        totalGrossSalesPaise,
        totalTaxableSalesPaise,
        totalCgstPaise,
        totalSgstPaise,
        totalIgstPaise,
        totalTaxCollectedPaise,
        totalCreditNotesValuePaise,
        netTaxableSalesPaise,
        netTaxCollectedPaise,
        totalPlatformCommissionPaise,
        totalPlatformGstPaidPaise,
        netSellerSettledPaise,
      },
    };
  }

  /**
   * Helper to convert an array of objects into RFC 4180 compliant CSV string.
   */
  public exportToCsv(data: Record<string, any>[]): string {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const escape = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(escape).join(",");
    const rows = data.map((row) => headers.map((h) => escape(row[h])).join(","));

    return [headerLine, ...rows].join("\r\n");
  }

  /**
   * Platform Owner / Admin Master Accounting Overview
   * Separates Platform Commission Revenue from Seller GMV.
   */
  public async getPlatformFinancialOverview(dateRange?: { start?: Date; end?: Date }) {
    const start = dateRange?.start || new Date(new Date().getFullYear(), 0, 1);
    const end = dateRange?.end || new Date();

    const [
      allOrders,
      commissionInvoices,
      payouts,
      allRefunds,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { totalPaise: true, subtotalPaise: true, status: true, paymentStatus: true },
      }),
      prisma.marketplaceInvoice.findMany({
        where: {
          documentType: InvoiceDocumentType.COMMISSION_INVOICE,
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.vendorPayout.findMany({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.refundRecord.findMany({
        where: { createdAt: { gte: start, lte: end }, status: "SUCCEEDED" },
      }),
    ]);

    let platformGmvPaise = 0;
    let netCompletedSalesPaise = 0;

    for (const o of allOrders) {
      if (o.status !== "CANCELLED") {
        platformGmvPaise += o.totalPaise;
      }
      if (o.paymentStatus === PaymentStatus.CAPTURED) {
        netCompletedSalesPaise += o.totalPaise;
      }
    }

    let commissionTaxablePaise = 0;
    let commissionCgstPaise = 0;
    let commissionSgstPaise = 0;
    let commissionIgstPaise = 0;
    let totalPlatformRevenuePaise = 0;

    for (const ci of commissionInvoices) {
      commissionTaxablePaise += ci.taxableAmountPaise;
      commissionCgstPaise += ci.cgstPaise;
      commissionSgstPaise += ci.sgstPaise;
      commissionIgstPaise += ci.igstPaise;
      totalPlatformRevenuePaise += ci.taxableAmountPaise; // Platform's earned revenue is the fee itself
    }

    let sellerEscrowLiabilitiesPaise = 0;
    let sellerSettledPayoutsPaise = 0;

    for (const po of payouts) {
      if (po.status === PayoutStatus.ESCROW_HOLD || po.status === PayoutStatus.ELIGIBLE_FOR_PAYOUT) {
        sellerEscrowLiabilitiesPaise += po.netPayoutPaise;
      } else if (po.status === PayoutStatus.SETTLED) {
        sellerSettledPayoutsPaise += po.netPayoutPaise;
      }
    }

    const totalRefundsPaise = allRefunds.reduce((sum, r) => sum + r.amountPaise, 0);

    return {
      period: { start, end },
      platformGmvPaise,
      netCompletedSalesPaise,
      totalRefundsPaise,
      platformRevenue: {
        taxableCommissionPaise: commissionTaxablePaise,
        cgstPaise: commissionCgstPaise,
        sgstPaise: commissionSgstPaise,
        igstPaise: commissionIgstPaise,
        totalGstLiabilityPaise: commissionCgstPaise + commissionSgstPaise + commissionIgstPaise,
        netRetainedRevenuePaise: totalPlatformRevenuePaise,
      },
      sellerSettlements: {
        escrowLiabilitiesPaise: sellerEscrowLiabilitiesPaise,
        settledPayoutsPaise: sellerSettledPayoutsPaise,
      },
    };
  }
}

export const billingInvoiceService = new BillingInvoiceService();

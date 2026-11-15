import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/server/prisma";
import {
  billingInvoiceService,
  resolveGstState,
  getFinancialYear,
  NEXU_PLATFORM_ECO,
} from "@/lib/server/billing-invoice-service";
import {
  TaxRegistrationType,
  BusinessConstitution,
  InvoiceDocumentType,
  InvoiceIssuerType,
  InvoiceStatus,
  OrderStatus,
  PaymentStatus,
  PayoutStatus,
} from "@prisma/client";

describe("NEXU ATELIER — Statutory GST, Invoicing, Billing & CA Reporting Engine", () => {
  let customerUser: any;
  let regularSeller: any;
  let compositionSeller: any;
  let unregisteredSeller: any;
  let regularProduct: any;
  let compositionProduct: any;
  let unregisteredProduct: any;
  let testOrder: any;
  let testCategory: any;

  beforeAll(async () => {
    customerUser = await prisma.user.create({
      data: {
        email: `tax_cust_${Date.now()}@atelier.internal`,
        passwordHash: "secure_hash",
        role: "CUSTOMER",
        profile: {
          create: {
            name: "Ananya Deshmukh",
            phone: "+919876543210",
          },
        },
      },
    });

    regularSeller = await prisma.seller.create({
      data: {
        slug: `solstice-silk-${Date.now()}`,
        name: "Solstice Handloom Studio",
        legalBusinessName: "Solstice Handloom Studio Private Limited",
        originHub: "Mumbai",
        story: "Heritage Mulberry silk and handwoven brocades.",
        heroImage: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1",
        verified: true,
        status: "APPROVED",
        pan: "AAPFS1234F",
        gstin: "27AAPFS1234F1Z8",
        taxRegistrationType: TaxRegistrationType.REGULAR,
        businessConstitution: BusinessConstitution.PRIVATE_LIMITED,
        registeredState: "Maharashtra",
        registeredStateCode: "27",
        registeredAddress: "Plot 42, Weavers Colony, Mumbai, Maharashtra 400015",
        invoicePrefix: "SOL",
        isGstVerified: true,
        commissionRatePercent: 10.0,
      },
    });

    compositionSeller = await prisma.seller.create({
      data: {
        slug: `mysore-brass-${Date.now()}`,
        name: "Mysore Brass Craft",
        legalBusinessName: "Mysore Brass Craft Enterprise",
        originHub: "Mysuru",
        story: "Lost-wax cast artisanal bronze and brass vessels.",
        heroImage: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1",
        verified: true,
        status: "APPROVED",
        pan: "ABCDE5678G",
        gstin: "29ABCDE5678G1Z2",
        taxRegistrationType: TaxRegistrationType.COMPOSITION,
        businessConstitution: BusinessConstitution.PROPRIETORSHIP,
        registeredState: "Karnataka",
        registeredStateCode: "29",
        registeredAddress: "Industrial Estate, Mysuru, Karnataka 570001",
        invoicePrefix: "MBC",
        compositionDeclaration: "Composition taxable person, not eligible to collect tax on supplies.",
        isGstVerified: true,
        commissionRatePercent: 12.0,
      },
    });

    unregisteredSeller = await prisma.seller.create({
      data: {
        slug: `jaipur-clay-${Date.now()}`,
        name: "Jaipur Terracotta Artisan",
        legalBusinessName: "Ram Lal Terracotta Potter",
        originHub: "Jaipur",
        story: "Traditional blue pottery and terracotta urns.",
        heroImage: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1",
        verified: true,
        status: "APPROVED",
        pan: "XYZPR9999K",
        gstin: null, // Unregistered: NO fake GSTIN
        taxRegistrationType: TaxRegistrationType.UNREGISTERED,
        businessConstitution: BusinessConstitution.INDIVIDUAL,
        registeredState: "Rajasthan",
        registeredStateCode: "08",
        registeredAddress: "Potters Lane, Jaipur, Rajasthan 302001",
        invoicePrefix: "JCP",
        isGstVerified: false,
        commissionRatePercent: 10.0,
      },
    });

    testCategory = await prisma.category.create({
      data: {
        name: "Tax Testing Category",
        slug: `tax-cat-${Date.now()}`,
        description: "Statutory tax testing category",
        image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1",
      },
    });

    regularProduct = await prisma.product.create({
      data: {
        title: "Pure Mulberry Silk Sari",
        slug: `silk-sari-${Date.now()}`,
        subtitle: "Handloom Zari Silk",
        description: "Heritage pure silk",
        categoryId: testCategory.id,
        vendorId: regularSeller.id,
        basePricePaise: 1000000, // ₹10,000
        stock: 15,
        isPublished: true,
        approvalStatus: "APPROVED",
      },
    });

    compositionProduct = await prisma.product.create({
      data: {
        title: "Lost-Wax Brass Urli",
        slug: `brass-urli-${Date.now()}`,
        subtitle: "Antique Finished Brass",
        description: "Cast bronze decorative bowl",
        categoryId: testCategory.id,
        vendorId: compositionSeller.id,
        basePricePaise: 500000, // ₹5,000
        stock: 20,
        isPublished: true,
        approvalStatus: "APPROVED",
      },
    });

    unregisteredProduct = await prisma.product.create({
      data: {
        title: "Jaipur Blue Pottery Vase",
        slug: `pottery-vase-${Date.now()}`,
        subtitle: "Hand-painted Blue Glaze",
        description: "Artisanal clay vessel",
        categoryId: testCategory.id,
        vendorId: unregisteredSeller.id,
        basePricePaise: 250000, // ₹2,500
        stock: 30,
        isPublished: true,
        approvalStatus: "APPROVED",
      },
    });
  });

  afterAll(async () => {
    if (testOrder) {
      await prisma.marketplaceInvoice.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.paymentRecord.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.order.deleteMany({ where: { id: testOrder.id } });
    }
    if (regularProduct) {
      await prisma.product.deleteMany({
        where: { id: { in: [regularProduct.id, compositionProduct.id, unregisteredProduct.id] } },
      });
    }
    if (regularSeller) {
      await prisma.complianceDocument.deleteMany({
        where: { sellerId: { in: [regularSeller.id, compositionSeller.id, unregisteredSeller.id] } },
      });
      await prisma.accountantAccessInvitation.deleteMany({
        where: { sellerId: { in: [regularSeller.id, compositionSeller.id, unregisteredSeller.id] } },
      });
      await prisma.seller.deleteMany({
        where: { id: { in: [regularSeller.id, compositionSeller.id, unregisteredSeller.id] } },
      });
    }
    if (customerUser) {
      await prisma.customerProfile.deleteMany({ where: { userId: customerUser.id } });
      await prisma.user.deleteMany({ where: { id: customerUser.id } });
    }
  });

  it("1. State code resolution maps standard Indian states and 2-digit GST codes accurately", () => {
    const mh = resolveGstState("Maharashtra");
    expect(mh.code).toBe("27");
    expect(mh.name).toBe("Maharashtra");

    const ka = resolveGstState("Karnataka");
    expect(ka.code).toBe("29");
    expect(ka.name).toBe("Karnataka");

    const dl = resolveGstState("07");
    expect(dl.code).toBe("07");
    expect(dl.name).toBe("Delhi");

    const rj = resolveGstState("Rajasthan");
    expect(rj.code).toBe("08");

    const fy = getFinancialYear(new Date("2026-11-08"));
    expect(fy).toBe("2026-27");
  });

  it("2. Multi-vendor order splits into discrete seller customer invoices, platform commission invoices, and unified payment receipt", async () => {
    const orderId = `TEST-ORD-TAX-${Date.now()}`;
    const shippingAddress = {
      fullName: "Ananya Deshmukh",
      street: "Senapati Bapat Marg, Lower Parel",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400013",
    };

    testOrder = await prisma.order.create({
      data: {
        id: orderId,
        customerId: customerUser.id,
        customerName: "Ananya Deshmukh",
        customerEmail: customerUser.email,
        shippingAddressSnapshot: JSON.stringify(shippingAddress),
        deliveryMethodId: "standard",
        deliveryMethodName: "White Glove Courier",
        deliveryEstimatedDays: 4,
        shippingFeePaise: 0,
        estimatedTaxPaise: 120000,
        subtotalPaise: 1750000, // 10000 + 5000 + 2500 = ₹17,500
        totalPaise: 1750000,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.CAPTURED,
        estimatedDeliveryDate: new Date(Date.now() + 4 * 86400000),
        items: {
          create: [
            {
              productId: regularProduct.id,
              productSlug: regularProduct.slug,
              title: regularProduct.title,
              vendorId: regularSeller.id,
              vendorName: regularSeller.name,
              unitPricePaise: 1000000,
              quantity: 1,
              lineTotalPaise: 1000000,
              imageSnapshot: regularSeller.heroImage,
            },
            {
              productId: compositionProduct.id,
              productSlug: compositionProduct.slug,
              title: compositionProduct.title,
              vendorId: compositionSeller.id,
              vendorName: compositionSeller.name,
              unitPricePaise: 500000,
              quantity: 1,
              lineTotalPaise: 500000,
              imageSnapshot: compositionSeller.heroImage,
            },
            {
              productId: unregisteredProduct.id,
              productSlug: unregisteredProduct.slug,
              title: unregisteredProduct.title,
              vendorId: unregisteredSeller.id,
              vendorName: unregisteredSeller.name,
              unitPricePaise: 250000,
              quantity: 1,
              lineTotalPaise: 250000,
              imageSnapshot: unregisteredSeller.heroImage,
            },
          ],
        },
        payments: {
          create: {
            amountPaise: 1750000,
            transactionRef: `TXN-${orderId}`,
            status: PaymentStatus.CAPTURED,
            method: "UPI",
          },
        },
      },
    });

    const result = await billingInvoiceService.generateOrderInvoices(testOrder.id);

    expect(result.salesInvoices.length).toBe(3);

    expect(result.commissionInvoices.length).toBe(3);

    expect(result.receipt).toBeDefined();
    expect(result.receipt.documentType).toBe(InvoiceDocumentType.PAYMENT_RECEIPT);
    expect(result.receipt.netAmountPaise).toBe(1750000);
  });

  it("3. Regular GST Seller invoice enforces Intra-state split (CGST+SGST) and GSTIN", async () => {
    const regularInvoice = await prisma.marketplaceInvoice.findFirst({
      where: {
        orderId: testOrder.id,
        sellerId: regularSeller.id,
        documentType: InvoiceDocumentType.TAX_INVOICE,
      },
    });

    expect(regularInvoice).toBeDefined();
    expect(regularInvoice?.documentType).toBe(InvoiceDocumentType.TAX_INVOICE);
    expect(regularInvoice?.supplierGstin).toBe("27AAPFS1234F1Z8");
    expect(regularInvoice?.isInterState).toBe(false); // Both seller and buyer in Maharashtra (27)
    expect(regularInvoice?.supplierTaxType).toBe(TaxRegistrationType.REGULAR);

    expect(regularInvoice?.cgstPaise).toBeGreaterThan(0);
    expect(regularInvoice?.sgstPaise).toBeGreaterThan(0);
    expect(regularInvoice?.igstPaise).toBe(0);
    expect(Math.abs((regularInvoice?.cgstPaise || 0) - (regularInvoice?.sgstPaise || 0))).toBeLessThanOrEqual(1);

    const totalTax = (regularInvoice?.cgstPaise || 0) + (regularInvoice?.sgstPaise || 0);
    expect((regularInvoice?.taxableAmountPaise || 0) + totalTax).toBe(regularInvoice?.netAmountPaise);
  });

  it("4. Composition seller invoice issues BILL_OF_SUPPLY with statutory declaration and 0% customer tax", async () => {
    const compInvoice = await prisma.marketplaceInvoice.findFirst({
      where: {
        orderId: testOrder.id,
        sellerId: compositionSeller.id,
        documentType: InvoiceDocumentType.BILL_OF_SUPPLY,
      },
    });

    expect(compInvoice).toBeDefined();
    expect(compInvoice?.documentType).toBe(InvoiceDocumentType.BILL_OF_SUPPLY);
    expect(compInvoice?.supplierTaxType).toBe(TaxRegistrationType.COMPOSITION);
    expect(compInvoice?.cgstPaise).toBe(0);
    expect(compInvoice?.sgstPaise).toBe(0);
    expect(compInvoice?.igstPaise).toBe(0);
    expect(compInvoice?.legalDisclaimer).toContain("Composition taxable person, not eligible to collect tax on supplies");
  });

  it("5. Unregistered artisan invoice issues Delivery Memo / Commercial Bill of Supply with NO fake GSTIN", async () => {
    const unregInvoice = await prisma.marketplaceInvoice.findFirst({
      where: {
        orderId: testOrder.id,
        sellerId: unregisteredSeller.id,
        documentType: InvoiceDocumentType.BILL_OF_SUPPLY,
      },
    });

    expect(unregInvoice).toBeDefined();
    expect(unregInvoice?.documentType).toBe(InvoiceDocumentType.BILL_OF_SUPPLY);
    expect(unregInvoice?.supplierTaxType).toBe(TaxRegistrationType.UNREGISTERED);
    expect(unregInvoice?.supplierGstin).toBeNull(); // No invented GSTIN
    expect(compInvoiceTaxPaise(unregInvoice)).toBe(0);
  });

  it("6. Platform commission invoices charge SAC 998313 with 18% GST", async () => {
    const commInvoiceRegular = await prisma.marketplaceInvoice.findFirst({
      where: {
        orderId: testOrder.id,
        sellerId: regularSeller.id,
        documentType: InvoiceDocumentType.COMMISSION_INVOICE,
      },
    });

    expect(commInvoiceRegular).toBeDefined();
    expect(commInvoiceRegular?.issuerType).toBe(InvoiceIssuerType.PLATFORM);
    expect(commInvoiceRegular?.supplierGstin).toBe(NEXU_PLATFORM_ECO.gstin);
    expect(commInvoiceRegular?.supplierLegalName).toBe(NEXU_PLATFORM_ECO.legalName);

    expect(commInvoiceRegular?.taxableAmountPaise).toBe(100000);

    const commTax = (commInvoiceRegular?.cgstPaise || 0) + (commInvoiceRegular?.sgstPaise || 0) + (commInvoiceRegular?.igstPaise || 0);
    expect(commTax).toBe(18000);
    expect(commInvoiceRegular?.netAmountPaise).toBe(118000);
  });

  it("7. Credit Note generation reverses taxable value and tax under Section 34 of CGST Act", async () => {
    const creditNote = await billingInvoiceService.generateCreditNote({
      orderId: testOrder.id,
      reason: "Customer returned silk sari due to studio fit variation",
      cancelledAmountPaise: 1000000,
    });

    expect(creditNote).toBeDefined();
    expect(creditNote.documentType).toBe(InvoiceDocumentType.CREDIT_NOTE);
    expect(creditNote.invoiceNumber).toMatch(/^CN\//);
    expect(creditNote.relatedInvoiceId).toBeDefined();
    expect(creditNote.cancellationReason).toContain("fit variation");
    expect(creditNote.cgstPaise).toBeGreaterThan(0);
    expect(creditNote.sgstPaise).toBeGreaterThan(0);
    expect(creditNote.netAmountPaise).toBe(1000000);
  });

  it("8. Monthly CA Reporting Package computes GSTR-1 Sales Register, Table 12 HSN Summary, and CSV exports", async () => {
    const caPackage = await billingInvoiceService.generateMonthlyCaPackage(
      regularSeller.id,
      { financialYear: "2026-27", month: 11 } // November
    );

    expect(caPackage).toBeDefined();
    expect(caPackage.salesRegister.length).toBeGreaterThan(0);
    expect(caPackage.creditNotesRegister.length).toBeGreaterThan(0);
    expect(caPackage.taxSummaryHsn.length).toBeGreaterThan(0);
    expect(caPackage.commissionStatements.length).toBeGreaterThan(0);

    const salesCsv = billingInvoiceService.exportToCsv(caPackage.salesRegister);
    expect(salesCsv).toContain("invoiceNumber");
    expect(salesCsv).toContain("taxableValueINR");
    expect(salesCsv).toContain("placeOfSupplyState");

    const hsnCsv = billingInvoiceService.exportToCsv(caPackage.taxSummaryHsn);
    expect(hsnCsv).toContain("hsnCode");
    expect(hsnCsv).toContain("ratePercent");

    const commCsv = billingInvoiceService.exportToCsv(caPackage.commissionStatements);
    expect(commCsv).toContain("998313");
  });

  it("9. Admin Platform Financial Overview strictly separates Platform Commission Revenue from Seller GMV", async () => {
    const adminOverview = await billingInvoiceService.getPlatformFinancialOverview();

    expect(adminOverview).toBeDefined();
    expect(adminOverview.platformGmvPaise).toBeGreaterThanOrEqual(1750000);
    expect(adminOverview.platformRevenue.taxableCommissionPaise).toBeGreaterThan(0);
    expect(adminOverview.platformRevenue.totalGstLiabilityPaise).toBeGreaterThan(0);
    expect(adminOverview.platformRevenue.netRetainedRevenuePaise).toBeLessThan(adminOverview.platformGmvPaise);
  });

  it("10. Accountant Invitation grants secure token access to monthly CA reporting", async () => {
    const invitation = await prisma.accountantAccessInvitation.create({
      data: {
        sellerId: regularSeller.id,
        email: "ca.auditor@firm.in",
        accountantName: "CA Ramesh Gupta",
        firmName: "Gupta & Associates CA",
        token: `test_token_${Date.now()}`,
        financialYears: "2026-27",
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });

    expect(invitation.token).toBeDefined();

    const found = await prisma.accountantAccessInvitation.findUnique({
      where: { token: invitation.token },
    });
    expect(found).toBeDefined();
    expect(found?.sellerId).toBe(regularSeller.id);

    const caData = await billingInvoiceService.generateMonthlyCaPackage(
      found!.sellerId,
      { financialYear: "2026-27", month: 11 }
    );
    expect(caData.salesRegister.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    try {
      if (testCategory?.id) {
        await prisma.product.deleteMany({ where: { categoryId: testCategory.id } }).catch(() => {});
        await prisma.category.delete({ where: { id: testCategory.id } }).catch(() => {});
      }
      if (regularSeller?.id) {
        await (prisma as any).sellerTaxProfile?.deleteMany({ where: { sellerId: regularSeller.id } }).catch(() => {});
        await (prisma as any).accountantAccessInvitation?.deleteMany({ where: { sellerId: regularSeller.id } }).catch(() => {});
        await prisma.seller.delete({ where: { id: regularSeller.id } }).catch(() => {});
      }
      if (compositionSeller?.id) {
        await (prisma as any).sellerTaxProfile?.deleteMany({ where: { sellerId: compositionSeller.id } }).catch(() => {});
        await prisma.seller.delete({ where: { id: compositionSeller.id } }).catch(() => {});
      }
      if (unregisteredSeller?.id) {
        await (prisma as any).sellerTaxProfile?.deleteMany({ where: { sellerId: unregisteredSeller.id } }).catch(() => {});
        await prisma.seller.delete({ where: { id: unregisteredSeller.id } }).catch(() => {});
      }
      if (customerUser?.id) {
        await (prisma as any).userProfile?.deleteMany({ where: { userId: customerUser.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: customerUser.id } }).catch(() => {});
      }
    } catch {
    }
  });
});

function compInvoiceTaxPaise(inv: any): number {
  return (inv?.cgstPaise || 0) + (inv?.sgstPaise || 0) + (inv?.igstPaise || 0);
}

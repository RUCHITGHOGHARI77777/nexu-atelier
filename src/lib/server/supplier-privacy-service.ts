/**
 * NEXU ATELIER — Supplier Privacy, Verification & Settlement Ledger Service
 * Enforces strict tenant isolation, masked settlement accounts, and verified earnings calculation.
 */

import { prisma } from "@/lib/server/prisma";
import { PayoutStatus } from "@prisma/client";

export interface UpdateBankDetailsInput {
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
}

export class SupplierPrivacyService {
  /**
   * Retrieves supplier's own business profile, verification status, and masked settlement data.
   */
  public async getSupplierProfile(userId: string) {
    const seller = await prisma.seller.findFirst({
      where: {
        OR: [{ userId }, { user: { id: userId } }],
      },
    });

    if (!seller) {
      throw new Error("No supplier studio record linked to this account.");
    }

    const rawAccount = seller.bankAccountNumber || "";
    const maskedAccount =
      rawAccount.length >= 4
        ? `•••• •••• ${rawAccount.slice(-4)}`
        : "Not Configured";

    return {
      id: seller.id,
      name: seller.name,
      slug: seller.slug,
      originHub: seller.originHub,
      story: seller.story,
      heroImage: seller.heroImage,
      status: seller.status,
      verified: seller.verified,
      rating: seller.rating,
      businessEmail: seller.businessEmail,
      businessPhone: seller.businessPhone,
      taxIdentifier: seller.taxIdentifier, // GSTIN
      isContactVerified: seller.isContactVerified,
      isBusinessVerified: seller.isBusinessVerified,
      bankAccountName: seller.bankAccountName || null,
      maskedBankAccount: maskedAccount,
      bankIfsc: seller.bankIfsc || null,
      commissionRatePercent: seller.commissionRatePercent,
      leadTimeDays: seller.leadTimeDays,
    };
  }

  /**
   * Updates supplier bank settlement details with verification and auditing.
   */
  public async updateBankSettlementDetails(userId: string, input: UpdateBankDetailsInput) {
    const seller = await prisma.seller.findFirst({
      where: {
        OR: [{ userId }, { user: { id: userId } }],
      },
    });

    if (!seller) {
      throw new Error("Supplier studio not found.");
    }

    const cleanAccount = input.bankAccountNumber.replace(/\s+/g, "");
    if (!/^\d{9,18}$/.test(cleanAccount)) {
      throw new Error("Invalid Indian bank account number. Must be between 9 and 18 digits.");
    }

    const cleanIfsc = input.bankIfsc.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      throw new Error("Invalid Indian IFSC code format (e.g. HDFC0001234).");
    }

    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        bankAccountName: input.bankAccountName.trim(),
        bankAccountNumber: cleanAccount,
        bankIfsc: cleanIfsc,
      },
    });

    await prisma.auditEvent.create({
      data: {
        entityType: "SELLER_BANK_DETAILS",
        entityId: seller.id,
        action: "BANK_DETAILS_UPDATED",
        note: `Settlement bank account updated for ${seller.name}: IFSC=${cleanIfsc}, Account ending •••• ${cleanAccount.slice(-4)}`,
        performedBy: userId,
      },
    });

    return {
      success: true,
      message: "Bank settlement details updated and verified.",
      bankAccountName: input.bankAccountName.trim(),
      maskedAccount: `•••• •••• ${cleanAccount.slice(-4)}`,
      maskedBankAccount: `•••• •••• ${cleanAccount.slice(-4)}`,
      bankIfsc: cleanIfsc,
    };
  }

  /**
   * Computes supplier-isolated financial earnings, commission deductions, and payout balances.
   */
  public async getSupplierFinances(userId: string, startDate?: Date, endDate?: Date) {
    const seller = await prisma.seller.findFirst({
      where: {
        OR: [{ userId }, { user: { id: userId } }],
      },
    });

    if (!seller) {
      throw new Error("Supplier studio not found.");
    }

    const wherePayout: any = { sellerId: seller.id };
    if (startDate || endDate) {
      wherePayout.createdAt = {};
      if (startDate) wherePayout.createdAt.gte = startDate;
      if (endDate) wherePayout.createdAt.lte = endDate;
    }

    const payouts = await prisma.vendorPayout.findMany({
      where: wherePayout,
      orderBy: { createdAt: "desc" },
    });

    let grossSalesPaise = 0;
    let commissionPaise = 0;
    let netEarningsPaise = 0;
    let settledPayoutsPaise = 0;
    let pendingPayableBalancePaise = 0;

    for (const po of payouts) {
      grossSalesPaise += po.grossAmountPaise;
      commissionPaise += po.commissionPaise;
      netEarningsPaise += po.netPayoutPaise;

      if (po.status === PayoutStatus.SETTLED) {
        settledPayoutsPaise += po.netPayoutPaise;
      } else if (
        po.status === PayoutStatus.ESCROW_HOLD ||
        po.status === PayoutStatus.ELIGIBLE_FOR_PAYOUT
      ) {
        pendingPayableBalancePaise += po.netPayoutPaise;
      }
    }

    return {
      sellerId: seller.id,
      sellerName: seller.name,
      currency: "INR",
      grossSalesPaise,
      commissionPaise,
      netEarningsPaise,
      settledPayoutsPaise,
      pendingPayableBalancePaise,
      payoutRecords: payouts.slice(0, 50).map((po) => ({
        id: po.id,
        grossPaise: po.grossAmountPaise,
        commissionPaise: po.commissionPaise,
        netPayoutPaise: po.netPayoutPaise,
        status: po.status,
        transactionRef: po.transactionRef,
        settledAt: po.settledAt,
        createdAt: po.createdAt,
      })),
    };
  }

  /**
   * Retrieves supplier-isolated order line items (Tenant isolation: zero access to other makers or card details).
   */
  public async getSupplierOrderLines(
    userId: string,
    options: { page?: number; limit?: number; status?: string } = {}
  ) {
    const seller = await prisma.seller.findFirst({
      where: {
        OR: [{ userId }, { user: { id: userId } }],
      },
    });

    if (!seller) {
      throw new Error("Supplier studio not found.");
    }

    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      vendorId: seller.id,
    };
    if (options.status) {
      where.fulfillmentStatus = options.status;
    }

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              shippingAddressSnapshot: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.orderItem.count({ where }),
    ]);

    return {
      orderLines: items.map((item) => {
        let city = "";
        let state = "";
        try {
          const parsed = JSON.parse(item.order.shippingAddressSnapshot);
          city = parsed.city || "";
          state = parsed.state || "";
        } catch {}

        return {
          id: item.id,
          orderId: item.orderId,
          orderStatus: item.order.status,
          paymentStatus: item.order.paymentStatus,
          orderCreatedAt: item.order.createdAt,
          title: item.title,
          productSlug: item.productSlug,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColorName,
          unitPricePaise: item.unitPricePaise,
          lineTotalPaise: item.lineTotalPaise,
          fulfillmentStatus: item.fulfillmentStatus,
          courierName: item.courierName,
          trackingNumber: item.trackingNumber,
          destinationCity: `${city}${city && state ? ", " : ""}${state}` || "India",
        };
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const supplierPrivacyService = new SupplierPrivacyService();

/**
 * NEXU ATELIER — Cash on Delivery (COD) Engine & Reconciliation Service
 * Evaluates multi-supplier eligibility, courier reconciliation, and risk boundaries.
 */

import { prisma } from "@/lib/server/prisma";
import {
  CodEligibilityResult,
  CodShipmentEligibility,
  CodOrderSummary,
  CodCollectionStatus,
} from "@/types/payment-fraud";

export interface EvaluateCodParams {
  customerId: string;
  items: Array<{
    productId?: string;
    selectedSku?: string;
    unitPricePaise: number;
    quantity: number;
    vendorId?: string;
    vendorName?: string;
    categoryId?: string;
  }>;
  shippingAddress: {
    fullName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  totalPaise: number;
}

export class CodService {
  /**
   * Evaluates Cash on Delivery eligibility for customer cart & address
   */
  public async evaluateEligibility(params: {
    customerId: string;
    items: Array<{
      productId?: string;
      selectedSku?: string;
      unitPricePaise: number;
      quantity: number;
      vendorId?: string;
      vendorName?: string;
      categoryId?: string;
    }>;
    shippingAddress: {
      fullName: string;
      street: string;
      apartment?: string;
      city: string;
      state: string;
      pincode: string;
      country?: string;
    };
    totalPaise: number;
  }): Promise<CodEligibilityResult> {
    const { customerId, items, shippingAddress, totalPaise } = params;

    // 1. Fetch platform settings
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: [
            "fraud_cod_enabled",
            "fraud_cod_min_value_paise",
            "fraud_cod_max_value_paise",
            "fraud_cod_fee_paise",
            "fraud_restricted_pincodes",
            "fraud_rto_threshold",
            "fraud_require_otp_above_score",
          ],
        },
      },
    });

    const getVal = (k: string, d: string) => settings.find((s) => s.key === k)?.value || d;

    const isCodEnabledGlobally = getVal("fraud_cod_enabled", "true") === "true";
    const minOrderValuePaise = parseInt(getVal("fraud_cod_min_value_paise", "50000"), 10);
    const maxOrderValuePaise = parseInt(getVal("fraud_cod_max_value_paise", "1500000"), 10);
    const codFeePaise = parseInt(getVal("fraud_cod_fee_paise", "5000"), 10);
    const rtoThreshold = parseInt(getVal("fraud_rto_threshold", "2"), 10);

    let restrictedPincodes: string[] = [];
    try {
      restrictedPincodes = JSON.parse(getVal("fraud_restricted_pincodes", "[]"));
    } catch {
      restrictedPincodes = [];
    }

    const ineligibilityReasons: string[] = [];

    // Check 1: Global Toggle
    if (!isCodEnabledGlobally) {
      ineligibilityReasons.push("Cash on Delivery is temporarily disabled across the platform.");
    }

    // Check 2: Minimum & Maximum Order Values
    if (totalPaise < minOrderValuePaise) {
      ineligibilityReasons.push(`Order value is below the minimum Cash on Delivery threshold of ₹${(minOrderValuePaise / 100).toLocaleString("en-IN")}.`);
    }
    if (totalPaise > maxOrderValuePaise) {
      ineligibilityReasons.push(`Order value exceeds the maximum Cash on Delivery limit of ₹${(maxOrderValuePaise / 100).toLocaleString("en-IN")}. Please select an online payment method.`);
    }

    // Check 3: PIN Code Serviceability
    const pin = (shippingAddress.pincode || "").trim();
    const pinRegex = /^[1-9][0-9]{5}$/;
    let serviceablePincode = true;

    if (!pin || !pinRegex.test(pin)) {
      serviceablePincode = false;
      ineligibilityReasons.push("Postal code is invalid. A valid 6-digit Indian PIN code is required for COD courier dispatch.");
    } else if (restrictedPincodes.includes(pin)) {
      serviceablePincode = false;
      ineligibilityReasons.push(`Cash on Delivery courier service is not currently available for PIN code ${pin}.`);
    }

    // Check 4: Customer Profile & Risk History
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: customerId },
    });

    const isPhoneVerified = Boolean(profile?.isPhoneVerified);
    const priorRefusals = profile?.codRefusalCount || 0;
    const priorRto = profile?.rtoCount || 0;

    if (priorRefusals >= 2) {
      ineligibilityReasons.push(`Cash on Delivery is restricted for this account due to ${priorRefusals} previous uncollected delivery refusals.`);
    } else if (priorRto >= rtoThreshold) {
      ineligibilityReasons.push(`Cash on Delivery is restricted due to high historical Return to Origin (RTO) rate (${priorRto} returned parcels).`);
    }

    // Check 5: Multi-Supplier Shipment Breakdown
    const vendorMap = new Map<string, { name: string; count: number; subtotal: number }>();
    for (const item of items) {
      const vId = item.vendorId || "unknown_vendor";
      const vName = item.vendorName || "Artisan Studio";
      const current = vendorMap.get(vId) || { name: vName, count: 0, subtotal: 0 };
      current.count += item.quantity;
      current.subtotal += item.unitPricePaise * item.quantity;
      vendorMap.set(vId, current);
    }

    const shipmentBreakdown: CodShipmentEligibility[] = [];
    let allShipmentsEligible = true;

    for (const [vId, vData] of vendorMap.entries()) {
      // Check if vendor has COD disabled (e.g. if commissionRate is custom or studio setting)
      const seller = await prisma.seller.findUnique({
        where: { id: vId },
        select: { id: true, name: true, status: true },
      });

      const isVendorEligible = seller?.status === "APPROVED";
      let reason: string | undefined;

      if (!isVendorEligible) {
        allShipmentsEligible = false;
        reason = `${vData.name} does not currently support Cash on Delivery courier dispatch.`;
        ineligibilityReasons.push(reason);
      }

      shipmentBreakdown.push({
        vendorId: vId,
        vendorName: vData.name,
        itemCount: vData.count,
        shipmentSubtotalPaise: vData.subtotal,
        isEligible: isVendorEligible,
        reason,
      });
    }

    // Check 6: OTP Requirement
    // Require OTP if phone is unverified or cart is > ₹5,000
    const requiresOtp = !isPhoneVerified || totalPaise > 500000;

    const isEligible = ineligibilityReasons.length === 0 && allShipmentsEligible && serviceablePincode;

    return {
      isEligible,
      ineligibilityReasons,
      codFeePaise: isEligible ? codFeePaise : 0,
      minOrderValuePaise,
      maxOrderValuePaise,
      requiresOtp,
      isPhoneVerified,
      serviceablePincode,
      shipmentBreakdown,
    };
  }

  /**
   * Retrieves COD orders with courier collection and remittance status for Admin
   */
  public async getCodOrders(options: {
    collectionStatus?: CodCollectionStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: CodOrderSummary[]; totalCount: number }> {
    const limit = options.limit || 25;
    const offset = options.offset || 0;

    const where: any = { isCod: true };
    if (options.collectionStatus) {
      where.codCollectionStatus = options.collectionStatus;
    }

    const [items, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          customer: {
            select: {
              email: true,
              profile: { select: { name: true, phone: true } },
            },
          },
          shipments: {
            take: 1,
            select: {
              carrierName: true,
              trackingNumber: true,
            },
          },
          payments: {
            where: { isCod: true },
            take: 1,
            select: {
              codCollectedAt: true,
              codRemittedAt: true,
              courierRemittanceRef: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const orders: CodOrderSummary[] = items.map((o: any) => ({
      orderId: o.id,
      orderNumber: o.id,
      customerName: o.customer?.profile?.name || o.customerName || "Patron",
      customerPhone: o.customer?.profile?.phone,
      totalPaise: o.totalPaise,
      codFeePaise: o.codFeePaise,
      collectionStatus: o.codCollectionStatus || "PENDING",
      courierName: o.shipments[0]?.carrierName,
      trackingNumber: o.shipments[0]?.trackingNumber,
      collectedAt: o.payments[0]?.codCollectedAt?.toISOString() || null,
      remittedAt: o.payments[0]?.codRemittedAt?.toISOString() || null,
      courierRemittanceRef: o.payments[0]?.courierRemittanceRef || null,
      createdAt: o.createdAt.toISOString(),
    }));

    return { orders, totalCount };
  }

  /**
   * Authorized courier remittance reconciliation
   * Only Platform Administrators can reconcile courier remittance.
   */
  public async reconcileCourierRemittance(params: {
    orderId: string;
    adminId: string;
    courierRemittanceRef: string;
    collectionStatus: CodCollectionStatus;
    notes?: string;
  }): Promise<void> {
    const { orderId, adminId, courierRemittanceRef, collectionStatus, notes } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (!order.isCod) {
      throw new Error(`Order ${orderId} is not a Cash on Delivery order.`);
    }

    const now = new Date();

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        codCollectionStatus: collectionStatus,
        paymentStatus: collectionStatus === "REMITTED" ? "CAPTURED" : order.paymentStatus,
      },
    });

    // Update or create PaymentRecord
    const existingPayment = order.payments.find((p) => p.isCod);
    if (existingPayment) {
      await (prisma as any).paymentRecord.update({
        where: { id: existingPayment.id },
        data: {
          codCollectionStatus: collectionStatus,
          courierRemittanceRef,
          status: collectionStatus === "REMITTED" ? "CAPTURED" : existingPayment.status,
          codCollectedAt: collectionStatus === "COLLECTED" || collectionStatus === "REMITTED" ? now : undefined,
          codRemittedAt: collectionStatus === "REMITTED" ? now : undefined,
        },
      });
    }

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        orderId,
        entityType: "Order",
        entityId: orderId,
        action: `COD_RECONCILIATION_${collectionStatus}`,
        performedBy: adminId,
        note: JSON.stringify({
          courierRemittanceRef,
          collectionStatus,
          notes,
          totalPaise: order.totalPaise,
        }),
      },
    });
  }
}

export const codService = new CodService();

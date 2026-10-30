/**
 * NEXU ATELIER — Order Fraud Detection & Risk Evaluation Service
 * Evaluates 10 distinct operational risk signals without false rank assumptions.
 */

import { prisma } from "@/lib/server/prisma";
import {
  FraudEvaluationInput,
  FraudRiskResult,
  FraudSignalBreakdown,
  FraudReviewRecord,
  RiskLevel,
  RiskAction,
  RiskReviewStatus,
} from "@/types/payment-fraud";

export class FraudDetectionService {
  /**
   * Evaluates order risk signals and records assessment in PostgreSQL
   */
  public async evaluateOrderRisk(input: FraudEvaluationInput): Promise<FraudRiskResult> {
    const {
      customerId,
      email,
      phone,
      shippingAddress,
      items,
      totalPaise,
      ipAddress,
      userAgent,
      paymentMethod,
    } = input;

    // 1. Fetch customer profile & historical activity
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: customerId },
    });

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Recent orders in past 24 hours
    const recentOrders = await prisma.order.findMany({
      where: {
        customerId,
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: {
        id: true,
        createdAt: true,
        totalPaise: true,
        status: true,
        items: { select: { id: true } },
      },
    });

    // Orders in last 7 days for failure/cancellation counts
    const recentCancelledOrders = await prisma.order.count({
      where: {
        customerId,
        createdAt: { gte: sevenDaysAgo },
        status: "CANCELLED",
      },
    });

    // Failed payments in last 24h
    const failedPaymentsCount = await prisma.paymentRecord.count({
      where: {
        order: { customerId },
        createdAt: { gte: twentyFourHoursAgo },
        status: "FAILED",
      },
    });

    // Duplicate order pattern: same total or same item count within 15 minutes
    const duplicateOrderDetected = recentOrders.some(
      (o) =>
        new Date(o.createdAt) >= fifteenMinutesAgo &&
        (o.totalPaise === totalPaise || o.items.length === items.length)
    );

    // Phone verification status
    const isPhoneVerified = Boolean(
      input.isPhoneVerified || profile?.isPhoneVerified
    );

    // Prior COD refusal and RTO counts
    const priorCodRefusalCount = profile?.codRefusalCount || 0;
    const priorRtoCount = profile?.rtoCount || 0;

    // Address completeness evaluation
    let addressScore = 100;
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!shippingAddress.pincode || !pinRegex.test(shippingAddress.pincode.trim())) {
      addressScore -= 40;
    }
    if (!shippingAddress.street || shippingAddress.street.trim().length < 8) {
      addressScore -= 30;
    }
    if (!shippingAddress.city || !shippingAddress.state) {
      addressScore -= 20;
    }
    if (!shippingAddress.fullName || shippingAddress.fullName.trim().length < 3) {
      addressScore -= 10;
    }
    addressScore = Math.max(0, addressScore);

    // Order value tier
    const isHighValueOrder = totalPaise > 5000000; // > ₹50,000

    // Signal breakdown
    const signals: FraudSignalBreakdown = {
      phoneVerified: isPhoneVerified,
      duplicateOrderDetected,
      priorFailedOrdersCount: recentCancelledOrders,
      priorCodRefusalCount,
      priorRtoCount,
      addressCompletenessScore: addressScore,
      isHighValueOrder,
      orderFrequencyLast24Hours: recentOrders.length,
      unusualSessionPatternDetected: !userAgent || userAgent.length < 10,
      repeatedPaymentFailuresCount: failedPaymentsCount,
    };

    // Calculate Risk Points
    let score = 0;
    const triggeredReasons: string[] = [];

    // Signal 1: Mobile verification
    if (!isPhoneVerified && totalPaise > 500000) {
      score += 25;
      triggeredReasons.push("High-value checkout without verified mobile number.");
    }

    // Signal 2: Duplicate order patterns
    if (duplicateOrderDetected) {
      score += 35;
      triggeredReasons.push("Rapid duplicate order pattern detected within past 15 minutes.");
    }

    // Signal 3: Repeated failed/cancelled orders
    if (recentCancelledOrders >= 2) {
      const penalty = Math.min(30, recentCancelledOrders * 12);
      score += penalty;
      triggeredReasons.push(`Customer has ${recentCancelledOrders} cancelled/failed orders in past 7 days.`);
    }

    // Signal 4: Previous COD refusal
    if (priorCodRefusalCount > 0) {
      const penalty = Math.min(45, priorCodRefusalCount * 25);
      score += penalty;
      triggeredReasons.push(`Account records ${priorCodRefusalCount} previous Cash on Delivery delivery refusals.`);
    }

    // Signal 5: Previous RTO history
    if (priorRtoCount > 0) {
      const penalty = Math.min(40, priorRtoCount * 20);
      score += penalty;
      triggeredReasons.push(`Account has ${priorRtoCount} prior Return to Origin (RTO) occurrences.`);
    }

    // Signal 6: Address completeness
    if (addressScore < 70) {
      score += 25;
      triggeredReasons.push("Shipping address appears incomplete, lacking detailed street or valid 6-digit postal code.");
    }

    // Signal 7: Extreme order value
    if (totalPaise > 10000000) { // > ₹1,00,000
      score += 30;
      triggeredReasons.push("High transaction value (> ₹1,00,000) requires administrative risk review.");
    } else if (totalPaise > 5000000) { // > ₹50,000
      score += 15;
      triggeredReasons.push("Above-average order value (> ₹50,000).");
    }

    // Signal 8: High order velocity
    if (recentOrders.length >= 4) {
      score += 25;
      triggeredReasons.push(`Elevated order frequency (${recentOrders.length} orders in past 24 hours).`);
    }

    // Signal 9: Session anomalies
    if (signals.unusualSessionPatternDetected) {
      score += 15;
      triggeredReasons.push("Anomalous or incomplete client browser signature detected.");
    }

    // Signal 10: Repeated gateway payment failures
    if (failedPaymentsCount >= 2) {
      score += 20;
      triggeredReasons.push(`Multiple recent gateway payment failures (${failedPaymentsCount} in 24 hours).`);
    }

    // Normalize final score 0-100
    const finalScore = Math.min(100, Math.max(0, score));

    // Determine Risk Level
    let riskLevel: RiskLevel = "LOW";
    if (finalScore >= 70) {
      riskLevel = "HIGH";
    } else if (finalScore >= 35) {
      riskLevel = "MEDIUM";
    }

    // Determine Recommended Action
    let recommendedAction: RiskAction = "ALLOW";
    if (priorCodRefusalCount >= 2 || priorRtoCount >= 2) {
      recommendedAction = "RESTRICT_COD";
    } else if (riskLevel === "HIGH") {
      if (finalScore >= 85) {
        recommendedAction = "MANUAL_REVIEW";
      } else {
        recommendedAction = "REQUIRE_ADDITIONAL_CONFIRMATION";
      }
    } else if (riskLevel === "MEDIUM") {
      if (!isPhoneVerified) {
        recommendedAction = "REQUIRE_OTP";
      } else {
        recommendedAction = "REQUIRE_ADDITIONAL_CONFIRMATION";
      }
    }

    // If COD is specifically selected and risk is high or COD refused, restrict COD
    if (paymentMethod === "COD" && (riskLevel === "HIGH" || priorCodRefusalCount > 0 || priorRtoCount > 1)) {
      recommendedAction = "RESTRICT_COD";
    }

    // Persist to PostgreSQL OrderRiskAssessment
    const record = await (prisma as any).orderRiskAssessment.create({
      data: {
        customerId,
        riskScore: finalScore,
        riskLevel,
        triggeredReasonsJson: JSON.stringify(triggeredReasons),
        recommendedAction,
        reviewStatus: "PENDING",
        signalsJson: JSON.stringify(signals),
      },
    });

    return {
      assessmentId: record.id,
      riskScore: finalScore,
      riskLevel,
      triggeredReasons,
      recommendedAction,
      reviewStatus: "PENDING",
      signals,
      assessedAt: record.assessedAt.toISOString(),
    };
  }

  /**
   * Retrieves pending or filtered risk assessments for Admin Fraud Review Dashboard
   */
  public async getRiskAssessments(options: {
    riskLevel?: RiskLevel;
    reviewStatus?: RiskReviewStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ records: FraudReviewRecord[]; totalCount: number }> {
    const limit = options.limit || 25;
    const offset = options.offset || 0;

    const where: any = {};
    if (options.riskLevel) where.riskLevel = options.riskLevel;
    if (options.reviewStatus) where.reviewStatus = options.reviewStatus;

    const [items, totalCount] = await Promise.all([
      (prisma as any).orderRiskAssessment.findMany({
        where,
        orderBy: { assessedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  name: true,
                  phone: true,
                  isPhoneVerified: true,
                  codRefusalCount: true,
                  rtoCount: true,
                },
              },
              _count: {
                select: {
                  orders: true,
                },
              },
            },
          },
        },
      }),
      (prisma as any).orderRiskAssessment.count({ where }),
    ]);

    const records: FraudReviewRecord[] = items.map((item: any) => {
      let triggeredReasons: string[] = [];
      try {
        triggeredReasons = JSON.parse(item.triggeredReasonsJson || "[]");
      } catch {
        triggeredReasons = [];
      }

      let signals: FraudSignalBreakdown = {
        phoneVerified: false,
        duplicateOrderDetected: false,
        priorFailedOrdersCount: 0,
        priorCodRefusalCount: 0,
        priorRtoCount: 0,
        addressCompletenessScore: 100,
        isHighValueOrder: false,
        orderFrequencyLast24Hours: 0,
        unusualSessionPatternDetected: false,
        repeatedPaymentFailuresCount: 0,
      };
      try {
        signals = JSON.parse(item.signalsJson || "{}");
      } catch {
        // default
      }

      return {
        id: item.id,
        orderId: item.orderId,
        customerId: item.customerId,
        customerEmail: item.customer?.email || "Unknown",
        customerName: item.customer?.profile?.name || "Customer",
        isPhoneVerified: Boolean(item.customer?.profile?.isPhoneVerified),
        phone: item.customer?.profile?.phone,
        riskScore: item.riskScore,
        riskLevel: item.riskLevel,
        triggeredReasons,
        recommendedAction: item.recommendedAction,
        reviewStatus: item.reviewStatus,
        reviewedByAdminId: item.reviewedByAdminId,
        overrideReason: item.overrideReason,
        isFalsePositive: item.isFalsePositive,
        signals,
        orderHistory: {
          totalOrders: item.customer?._count?.orders || 0,
          deliveredCount: 0,
          cancelledCount: signals.priorFailedOrdersCount || 0,
          rtoCount: item.customer?.profile?.rtoCount || 0,
          codRefusalCount: item.customer?.profile?.codRefusalCount || 0,
        },
        assessedAt: item.assessedAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    return { records, totalCount };
  }

  /**
   * Administrative decision / manual override with mandatory reason
   */
  public async reviewRiskAssessment(
    assessmentId: string,
    params: {
      adminId: string;
      decision: RiskReviewStatus;
      overrideReason: string;
      isFalsePositive?: boolean;
    }
  ): Promise<FraudReviewRecord> {
    if (!params.overrideReason || params.overrideReason.trim().length < 5) {
      throw new Error("A mandatory explanatory reason of at least 5 characters is required for fraud decisions.");
    }

    const updated = await (prisma as any).orderRiskAssessment.update({
      where: { id: assessmentId },
      data: {
        reviewStatus: params.decision,
        reviewedByAdminId: params.adminId,
        overrideReason: params.overrideReason.trim(),
        isFalsePositive: Boolean(params.isFalsePositive),
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        entityType: "OrderRiskAssessment",
        entityId: assessmentId,
        action: `FRAUD_ASSESSMENT_${params.decision}`,
        performedBy: params.adminId,
        note: JSON.stringify({
          decision: params.decision,
          overrideReason: params.overrideReason,
          isFalsePositive: params.isFalsePositive,
          riskScore: updated.riskScore,
        }),
      },
    });

    // If marked as false positive, reduce customer refusal/RTO penalties if applicable
    if (params.isFalsePositive && updated.customer?.profile) {
      await prisma.customerProfile.update({
        where: { userId: updated.customerId },
        data: {
          codRefusalCount: Math.max(0, (updated.customer.profile.codRefusalCount || 0) - 1),
        },
      });
    }

    let triggeredReasons: string[] = [];
    try {
      triggeredReasons = JSON.parse(updated.triggeredReasonsJson || "[]");
    } catch {
      triggeredReasons = [];
    }

    let signals: any = {};
    try {
      signals = JSON.parse(updated.signalsJson || "{}");
    } catch {
      //
    }

    return {
      id: updated.id,
      orderId: updated.orderId,
      customerId: updated.customerId,
      customerEmail: updated.customer?.email || "",
      customerName: updated.customer?.profile?.name || "",
      isPhoneVerified: Boolean(updated.customer?.profile?.isPhoneVerified),
      phone: updated.customer?.profile?.phone,
      riskScore: updated.riskScore,
      riskLevel: updated.riskLevel,
      triggeredReasons,
      recommendedAction: updated.recommendedAction,
      reviewStatus: updated.reviewStatus,
      reviewedByAdminId: updated.reviewedByAdminId,
      overrideReason: updated.overrideReason,
      isFalsePositive: updated.isFalsePositive,
      signals,
      assessedAt: updated.assessedAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Updates phone verification status for customer
   */
  public async updateCustomerVerification(
    customerId: string,
    isPhoneVerified: boolean,
    phone?: string
  ): Promise<void> {
    const data: any = {
      isPhoneVerified,
      phoneVerifiedAt: isPhoneVerified ? new Date() : null,
    };
    if (phone) data.phone = phone;

    await prisma.customerProfile.upsert({
      where: { userId: customerId },
      update: data,
      create: {
        userId: customerId,
        name: "Patron",
        phone: phone || null,
        isPhoneVerified,
        phoneVerifiedAt: isPhoneVerified ? new Date() : null,
      },
    });
  }

  /**
   * Records a COD refusal or RTO incident
   */
  public async recordCodRefusalOrRto(
    customerId: string,
    type: "COD_REFUSAL" | "RTO"
  ): Promise<void> {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: customerId },
    });

    if (profile) {
      await prisma.customerProfile.update({
        where: { userId: customerId },
        data: {
          codRefusalCount:
            type === "COD_REFUSAL" ? profile.codRefusalCount + 1 : profile.codRefusalCount,
          rtoCount: type === "RTO" ? profile.rtoCount + 1 : profile.rtoCount,
        },
      });
    }
  }
}

export const fraudDetectionService = new FraudDetectionService();

/**
 * NEXU ATELIER — Payment, Fraud Detection & Cash on Delivery Type Definitions
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type RiskAction =
  | "ALLOW"
  | "REQUIRE_OTP"
  | "REQUIRE_ADDITIONAL_CONFIRMATION"
  | "RESTRICT_COD"
  | "MANUAL_REVIEW"
  | "BLOCK";

export type RiskReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "OVERRIDDEN";

export type CodCollectionStatus =
  | "PENDING"
  | "COLLECTED"
  | "REMITTED"
  | "FAILED"
  | "RTO";

export type PaymentMethodType =
  | "UPI"
  | "CARD"
  | "NET_BANKING"
  | "WALLET"
  | "COD";

export interface FraudEvaluationInput {
  customerId: string;
  email: string;
  phone?: string | null;
  isPhoneVerified?: boolean;
  shippingAddress: {
    fullName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone?: string;
  };
  items: Array<{
    productId?: string;
    selectedSku?: string;
    unitPricePaise: number;
    quantity: number;
    vendorId?: string;
    categoryId?: string;
  }>;
  totalPaise: number;
  paymentMethod?: PaymentMethodType;
  ipAddress?: string;
  userAgent?: string;
}

export interface FraudSignalBreakdown {
  phoneVerified: boolean;
  duplicateOrderDetected: boolean;
  priorFailedOrdersCount: number;
  priorCodRefusalCount: number;
  priorRtoCount: number;
  addressCompletenessScore: number; // 0 - 100
  isHighValueOrder: boolean;
  orderFrequencyLast24Hours: number;
  unusualSessionPatternDetected: boolean;
  repeatedPaymentFailuresCount: number;
}

export interface FraudRiskResult {
  assessmentId?: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  triggeredReasons: string[];
  recommendedAction: RiskAction;
  reviewStatus: RiskReviewStatus;
  signals: FraudSignalBreakdown;
  assessedAt: string;
}

export interface FraudReviewRecord {
  id: string;
  orderId?: string | null;
  customerId: string;
  customerEmail: string;
  customerName: string;
  isPhoneVerified: boolean;
  phone?: string | null;
  riskScore: number;
  riskLevel: RiskLevel;
  triggeredReasons: string[];
  recommendedAction: RiskAction;
  reviewStatus: RiskReviewStatus;
  reviewedByAdminId?: string | null;
  overrideReason?: string | null;
  isFalsePositive: boolean;
  signals: FraudSignalBreakdown;
  orderHistory?: {
    totalOrders: number;
    deliveredCount: number;
    cancelledCount: number;
    rtoCount: number;
    codRefusalCount: number;
  };
  assessedAt: string;
  updatedAt: string;
}

export interface CodShipmentEligibility {
  vendorId: string;
  vendorName: string;
  itemCount: number;
  shipmentSubtotalPaise: number;
  isEligible: boolean;
  reason?: string;
}

export interface CodEligibilityResult {
  isEligible: boolean;
  ineligibilityReasons: string[];
  codFeePaise: number;
  minOrderValuePaise: number;
  maxOrderValuePaise: number;
  requiresOtp: boolean;
  isPhoneVerified: boolean;
  serviceablePincode: boolean;
  shipmentBreakdown: CodShipmentEligibility[];
}

export interface PaymentMethodOption {
  id: PaymentMethodType;
  name: string;
  tagline: string;
  iconName: string;
  isAvailable: boolean;
  badgeText?: string;
  restrictionReason?: string;
}

export interface PaymentSelectionState {
  method: PaymentMethodType;
  upiId?: string;
  selectedUpiApp?: "gpay" | "phonepe" | "paytm" | "bhim" | "custom";
  cardMaskedPreview?: string;
  cardBrand?: "visa" | "mastercard" | "rupay" | "amex";
  selectedBankCode?: string;
  selectedWalletId?: string;
  codConfirmed: boolean;
  codOtpVerified: boolean;
  codOtpCode?: string;
}

export interface CodOrderSummary {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  totalPaise: number;
  codFeePaise: number;
  collectionStatus: CodCollectionStatus;
  courierName?: string;
  trackingNumber?: string;
  collectedAt?: string | null;
  remittedAt?: string | null;
  courierRemittanceRef?: string | null;
  createdAt: string;
}

export interface PaymentReportSummary {
  periodMonth: string;
  totalTransactionsCount: number;
  totalVolumePaise: number;
  capturedPaise: number;
  refundedPaise: number;
  byMethod: {
    upiPaise: number;
    upiCount: number;
    cardPaise: number;
    cardCount: number;
    netBankingPaise: number;
    netBankingCount: number;
    codPaise: number;
    codCount: number;
  };
  codCollection: {
    orderedPaise: number;
    collectedPaise: number;
    remittedPaise: number;
    pendingRemittancePaise: number;
    rtoCount: number;
    rtoPaise: number;
  };
  failedTransactionsCount: number;
}

export type PaymentProviderType = "RAZORPAY" | "SANDBOX" | "ESCROW_INTERNAL";

export interface CreatePaymentOrderParams {
  orderId: string;
  amountPaise: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  success: boolean;
  provider: PaymentProviderType;
  providerOrderId: string;
  amountPaise: number;
  currency: string;
  keyId?: string;
  error?: string;
}

export interface VerifySignatureParams {
  orderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface PaymentDetails {
  providerPaymentId: string;
  providerOrderId: string;
  amountPaise: number;
  currency: string;
  status: "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED";
  method?: string;
  capturedAt?: Date;
  rawResponse?: string;
}

export interface RefundParams {
  orderId: string;
  providerPaymentId?: string;
  amountPaise: number;
  reason: string;
  idempotencyKey: string;
}

export interface RefundResult {
  success: boolean;
  providerRefundId?: string;
  amountPaise: number;
  status: "SUCCEEDED" | "PENDING" | "FAILED" | "MANUAL_REVIEW_REQUIRED";
  error?: string;
  rawResponse?: string;
}

export interface IPaymentAdapter {
  readonly provider: PaymentProviderType;
  createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPaymentSignature(params: VerifySignatureParams): Promise<boolean>;
  fetchPaymentStatus(providerPaymentId: string): Promise<PaymentDetails | null>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

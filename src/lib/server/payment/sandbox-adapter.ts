import crypto from "crypto";
import {
  IPaymentAdapter,
  PaymentProviderType,
  CreatePaymentOrderParams,
  PaymentOrderResult,
  VerifySignatureParams,
  PaymentDetails,
  RefundParams,
  RefundResult,
} from "./types";

export class SandboxPaymentAdapter implements IPaymentAdapter {
  public readonly provider: PaymentProviderType = "SANDBOX";
  private readonly testSecret = process.env.SANDBOX_PAYMENT_SECRET || "sandbox_test_secret_key_2026";
  private readonly testKeyId = "rzp_test_sandbox_key";

  public async createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    if (params.amountPaise <= 0) {
      return {
        success: false,
        provider: this.provider,
        providerOrderId: "",
        amountPaise: 0,
        currency: params.currency || "INR",
        error: "Payment order amount must be greater than zero.",
      };
    }

    const providerOrderId = `order_sbx_${params.orderId.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now().toString().slice(-6)}`;

    return {
      success: true,
      provider: this.provider,
      providerOrderId,
      amountPaise: params.amountPaise,
      currency: params.currency || "INR",
      keyId: this.testKeyId,
    };
  }

  public async verifyPaymentSignature(params: VerifySignatureParams): Promise<boolean> {
    if (!params.providerOrderId || !params.providerPaymentId || !params.signature) {
      return false;
    }

    // Expected signature: HMAC SHA256 of "order_id|payment_id" with test secret
    const expected = crypto
      .createHmac("sha256", this.testSecret)
      .update(`${params.providerOrderId}|${params.providerPaymentId}`)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature));
  }

  public generateTestSignature(providerOrderId: string, providerPaymentId: string): string {
    return crypto
      .createHmac("sha256", this.testSecret)
      .update(`${providerOrderId}|${providerPaymentId}`)
      .digest("hex");
  }

  public async fetchPaymentStatus(providerPaymentId: string): Promise<PaymentDetails | null> {
    return {
      providerPaymentId,
      providerOrderId: `order_sbx_mock`,
      amountPaise: 100000,
      currency: "INR",
      status: "CAPTURED",
      method: "sandbox_upi",
      capturedAt: new Date(),
      rawResponse: JSON.stringify({ mode: "sandbox_verified", providerPaymentId }),
    };
  }

  public async refundPayment(params: RefundParams): Promise<RefundResult> {
    if (params.amountPaise <= 0) {
      return {
        success: false,
        amountPaise: 0,
        status: "FAILED",
        error: "Refund amount must be positive.",
      };
    }

    const providerRefundId = `rfnd_sbx_${Date.now().toString().slice(-8)}`;

    return {
      success: true,
      providerRefundId,
      amountPaise: params.amountPaise,
      status: "SUCCEEDED",
      rawResponse: JSON.stringify({
        mode: "sandbox_refund",
        providerRefundId,
        idempotencyKey: params.idempotencyKey,
      }),
    };
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!rawBody || !signature) return false;
    try {
      const expected = crypto
        .createHmac("sha256", this.testSecret)
        .update(rawBody)
        .digest("hex");
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  public generateWebhookSignature(rawBody: string): string {
    return crypto
      .createHmac("sha256", this.testSecret)
      .update(rawBody)
      .digest("hex");
  }
}

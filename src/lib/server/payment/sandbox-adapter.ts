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

export interface DemoPaymentSimulationOptions {
  forceFail?: boolean;
  failureReason?: string;
  forceCancel?: boolean;
}

export class SandboxPaymentAdapter implements IPaymentAdapter {
  public readonly provider: PaymentProviderType = "SANDBOX";
  private readonly testSecret = process.env.SANDBOX_PAYMENT_SECRET || "sandbox_test_secret_key_2026";
  private readonly testKeyId = "rzp_test_sandbox_key";

  public async createPaymentOrder(
    params: CreatePaymentOrderParams,
    options?: DemoPaymentSimulationOptions
  ): Promise<PaymentOrderResult> {
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

    if (options?.forceFail) {
      return {
        success: false,
        provider: this.provider,
        providerOrderId: "",
        amountPaise: params.amountPaise,
        currency: params.currency || "INR",
        error: options.failureReason || "Simulated Payment Authorization Failure (Insufficient Funds / Card Declined)",
      };
    }

    if (options?.forceCancel) {
      return {
        success: false,
        provider: this.provider,
        providerOrderId: "",
        amountPaise: params.amountPaise,
        currency: params.currency || "INR",
        error: "Payment cancelled by user in checkout simulation.",
      };
    }

    const sanitizedId = params.orderId.replace(/[^a-zA-Z0-9]/g, "");
    const providerOrderId = `order_sbx_${sanitizedId}_${Date.now().toString(36)}`;

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

    const expected = crypto
      .createHmac("sha256", this.testSecret)
      .update(`${params.providerOrderId}|${params.providerPaymentId}`)
      .digest("hex");

    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(params.signature);

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  }

  public generateTestSignature(providerOrderId: string, providerPaymentId: string): string {
    return crypto
      .createHmac("sha256", this.testSecret)
      .update(`${providerOrderId}|${providerPaymentId}`)
      .digest("hex");
  }

  public generateDemoPaymentId(prefix: string = "pay_demo"): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public generateDemoRefundId(): string {
    return `rfnd_demo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public async fetchPaymentStatus(providerPaymentId: string): Promise<PaymentDetails | null> {
    return {
      providerPaymentId,
      providerOrderId: `order_demo_mock`,
      amountPaise: 100000,
      currency: "INR",
      status: "CAPTURED",
      method: "demo_upi_sandbox",
      capturedAt: new Date(),
      rawResponse: JSON.stringify({
        mode: "demo_sandbox_verified",
        providerPaymentId,
        isDemo: true,
        simulationDisclaimer: "DEMO MODE: Simulated Payment — Zero Real Money Transacted",
      }),
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

    const providerRefundId = this.generateDemoRefundId();

    return {
      success: true,
      providerRefundId,
      amountPaise: params.amountPaise,
      status: "SUCCEEDED",
      rawResponse: JSON.stringify({
        mode: "demo_refund_simulated",
        providerRefundId,
        isDemo: true,
        amountPaise: params.amountPaise,
        reason: params.reason || "Simulated customer satisfaction refund",
        idempotencyKey: params.idempotencyKey,
        timestamp: new Date().toISOString(),
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

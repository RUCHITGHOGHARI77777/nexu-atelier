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
import { isDemoMode, assertNoLivePaymentInDemo } from "../demo-mode";

export class RazorpayPaymentAdapter implements IPaymentAdapter {
  public readonly provider: PaymentProviderType = "RAZORPAY";
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly baseUrl = "https://api.razorpay.com/v1";

  constructor(keyId?: string, keySecret?: string, webhookSecret?: string) {
    this.keyId = keyId ?? (process.env.RAZORPAY_KEY_ID || "");
    this.keySecret = keySecret ?? (process.env.RAZORPAY_KEY_SECRET || "");
    this.webhookSecret = webhookSecret ?? (process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "");
  }

  public isConfigured(): boolean {
    if (isDemoMode() && this.keyId.startsWith("rzp_live_")) {
      return false;
    }

    return Boolean(
      this.keyId &&
      this.keySecret &&
      this.keyId !== "rzp_test_placeholder" &&
      this.keySecret !== "placeholder"
    );
  }

  public isTestMode(): boolean {
    return this.keyId.startsWith("rzp_test_");
  }

  public async createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    assertNoLivePaymentInDemo(this.keyId);

    if (!this.isConfigured()) {
      return {
        success: false,
        provider: this.provider,
        providerOrderId: "",
        amountPaise: params.amountPaise,
        currency: params.currency || "INR",
        error: "Razorpay credentials are not configured in environment.",
      };
    }

    try {
      const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const res = await fetch(`${this.baseUrl}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: params.amountPaise, // in paise
          currency: params.currency || "INR",
          receipt: params.orderId,
          notes: {
            customerName: params.customerName,
            customerEmail: params.customerEmail,
            environment: isDemoMode() ? "DEMO_TEST" : "PRODUCTION",
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          provider: this.provider,
          providerOrderId: "",
          amountPaise: params.amountPaise,
          currency: params.currency || "INR",
          error: errorData.error?.description || `Razorpay order creation failed with status ${res.status}.`,
        };
      }

      const data = await res.json();
      return {
        success: true,
        provider: this.provider,
        providerOrderId: data.id,
        amountPaise: data.amount,
        currency: data.currency,
        keyId: this.keyId,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.provider,
        providerOrderId: "",
        amountPaise: params.amountPaise,
        currency: params.currency || "INR",
        error: err.message || "Failed to communicate with Razorpay API.",
      };
    }
  }

  public async verifyPaymentSignature(params: VerifySignatureParams): Promise<boolean> {
    if (!params.providerOrderId || !params.providerPaymentId || !params.signature) {
      return false;
    }

    const payload = `${params.providerOrderId}|${params.providerPaymentId}`;
    const expected = crypto
      .createHmac("sha256", this.keySecret)
      .update(payload)
      .digest("hex");

    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(params.signature);

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  }

  public async fetchPaymentStatus(providerPaymentId: string): Promise<PaymentDetails | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const res = await fetch(`${this.baseUrl}/payments/${providerPaymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      let status: "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" = "FAILED";
      if (data.status === "captured") status = "CAPTURED";
      else if (data.status === "authorized") status = "AUTHORIZED";
      else if (data.status === "refunded") status = "REFUNDED";

      return {
        providerPaymentId: data.id,
        providerOrderId: data.order_id,
        amountPaise: data.amount,
        currency: data.currency,
        status,
        method: data.method,
        capturedAt: data.captured_at ? new Date(data.captured_at * 1000) : undefined,
        rawResponse: JSON.stringify(data),
      };
    } catch {
      return null;
    }
  }

  public async refundPayment(params: RefundParams): Promise<RefundResult> {
    assertNoLivePaymentInDemo(this.keyId);

    if (params.providerPaymentId?.startsWith("pay_sbx_") || params.providerPaymentId?.startsWith("pay_demo_")) {
      return {
        success: false,
        amountPaise: 0,
        status: "FAILED",
        error: "Cannot execute live Razorpay refund on a simulated sandbox payment ID.",
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        amountPaise: 0,
        status: "FAILED",
        error: "Razorpay credentials are not configured.",
      };
    }

    try {
      const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const res = await fetch(`${this.baseUrl}/payments/${params.providerPaymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: params.amountPaise,
          notes: {
            reason: params.reason || "Customer refund",
            idempotencyKey: params.idempotencyKey,
            environment: isDemoMode() ? "DEMO_TEST" : "PRODUCTION",
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          amountPaise: 0,
          status: "FAILED",
          error: errorData.error?.description || `Razorpay refund failed with status ${res.status}.`,
        };
      }

      const data = await res.json();
      return {
        success: true,
        providerRefundId: data.id,
        amountPaise: data.amount,
        status: "SUCCEEDED",
        rawResponse: JSON.stringify(data),
      };
    } catch (err: any) {
      return {
        success: false,
        amountPaise: 0,
        status: "FAILED",
        error: err.message || "Failed to process refund with Razorpay API.",
      };
    }
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!rawBody || !signature || !this.webhookSecret) return false;
    try {
      const expected = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}

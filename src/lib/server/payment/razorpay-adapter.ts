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

export class RazorpayPaymentAdapter implements IPaymentAdapter {
  public readonly provider: PaymentProviderType = "RAZORPAY";
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly baseUrl = "https://api.razorpay.com/v1";

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
  }

  public isConfigured(): boolean {
    return Boolean(
      this.keyId &&
      this.keySecret &&
      this.keyId !== "rzp_test_placeholder" &&
      this.keySecret !== "placeholder"
    );
  }

  public async createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
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
            ...params.notes,
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
          error: errorData.error?.description || `Razorpay order creation failed (status ${res.status}).`,
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
        error: err.message || "Failed to reach Razorpay API.",
      };
    }
  }

  public async verifyPaymentSignature(params: VerifySignatureParams): Promise<boolean> {
    if (!this.keySecret) return false;
    if (!params.providerOrderId || !params.providerPaymentId || !params.signature) {
      return false;
    }

    try {
      const generatedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(`${params.providerOrderId}|${params.providerPaymentId}`)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(params.signature)
      );
    } catch {
      return false;
    }
  }

  public async fetchPaymentStatus(providerPaymentId: string): Promise<PaymentDetails | null> {
    if (!this.isConfigured()) return null;

    try {
      const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const res = await fetch(`${this.baseUrl}/payments/${providerPaymentId}`, {
        headers: { Authorization: `Basic ${authHeader}` },
      });

      if (!res.ok) return null;
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
        capturedAt: data.created_at ? new Date(data.created_at * 1000) : undefined,
        rawResponse: JSON.stringify(data),
      };
    } catch {
      return null;
    }
  }

  public async refundPayment(params: RefundParams): Promise<RefundResult> {
    if (!this.isConfigured() || !params.providerPaymentId) {
      return {
        success: false,
        amountPaise: params.amountPaise,
        status: "FAILED",
        error: "Razorpay provider is not configured or missing payment ID.",
      };
    }

    try {
      const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const res = await fetch(`${this.baseUrl}/payments/${params.providerPaymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
          "X-Razorpay-Account": "",
        },
        body: JSON.stringify({
          amount: params.amountPaise,
          notes: {
            orderId: params.orderId,
            reason: params.reason,
            idempotencyKey: params.idempotencyKey,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          amountPaise: params.amountPaise,
          status: "FAILED",
          error: errorData.error?.description || `Razorpay refund failed (status ${res.status}).`,
        };
      }

      const data = await res.json();
      return {
        success: true,
        providerRefundId: data.id,
        amountPaise: data.amount,
        status: data.status === "processed" ? "SUCCEEDED" : "PENDING",
        rawResponse: JSON.stringify(data),
      };
    } catch (err: any) {
      return {
        success: false,
        amountPaise: params.amountPaise,
        status: "FAILED",
        error: err.message || "Failed to execute refund via Razorpay API.",
      };
    }
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret || !rawBody || !signature) return false;
    try {
      const expected = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  }
}

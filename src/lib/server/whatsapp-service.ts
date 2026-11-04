/**
 * NEXU ATELIER — Meta WhatsApp Business Cloud API Service
 * Official integration for WhatsApp OTP delivery, order alerts, and customer notifications.
 *
 * Implements Meta Graph API v20.0 specification for authentication templates.
 * In development or unconfigured staging environments, runs in safe simulator mode.
 */

export interface WhatsAppSendOtpOptions {
  recipientPhone: string;
  otpCode: string;
  purpose?: "LOGIN" | "REGISTRATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "COD_CONFIRMATION";
  expiryMinutes?: number;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export interface IWhatsAppClient {
  sendMessage(payload: Record<string, any>): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class MetaCloudApiClient implements IWhatsAppClient {
  private apiToken: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor(apiToken: string, phoneNumberId: string, apiVersion = "v20.0") {
    this.apiToken = apiToken;
    this.phoneNumberId = phoneNumberId;
    this.apiVersion = apiVersion;
  }

  public async sendMessage(payload: Record<string, any>): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `WhatsApp API error (HTTP ${response.status})`;
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id || "wamid_ok";
      return { success: true, messageId };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to reach WhatsApp Cloud API." };
    }
  }
}

export class WhatsAppService {
  private client: IWhatsAppClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.reloadConfig();
  }

  public reloadConfig(): void {
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v20.0";

    if (apiToken && phoneNumberId && !apiToken.includes("placeholder") && !phoneNumberId.includes("placeholder")) {
      this.client = new MetaCloudApiClient(apiToken, phoneNumberId, apiVersion);
      this.isConfigured = true;
    } else {
      this.client = null;
      this.isConfigured = false;
    }
  }

  public setClientForTesting(mockClient: IWhatsAppClient | null) {
    this.client = mockClient;
    this.isConfigured = mockClient !== null;
  }

  /**
   * Normalizes raw phone input to E.164 without leading plus for Meta Cloud API.
   * e.g., "9876543210" -> "919876543210", "+91 98765-43210" -> "919876543210"
   */
  public normalizePhone(rawPhone: string): string {
    const digits = rawPhone.replace(/\D/g, "");
    if (digits.length === 10) {
      // Default to India (+91)
      return `91${digits}`;
    }
    if (digits.length === 12 && digits.startsWith("91")) {
      return digits;
    }
    return digits;
  }

  public maskPhone(phone: string): string {
    const normalized = this.normalizePhone(phone);
    if (normalized.length <= 4) return "****";
    return `+${normalized.slice(0, 2)} ${normalized.slice(2, 5)}*****${normalized.slice(-2)}`;
  }

  /**
   * Dispatches a 6-digit OTP code to the recipient via WhatsApp Business Cloud API.
   */
  public async sendOtp(options: WhatsAppSendOtpOptions): Promise<WhatsAppSendResult> {
    const normalizedTo = this.normalizePhone(options.recipientPhone);

    if (normalizedTo.length < 10 || normalizedTo.length > 15) {
      return {
        success: false,
        error: "Invalid international phone number format. Must be 10 to 15 digits.",
      };
    }

    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || "nexu_auth_code";
    const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG || "en_US";

    // Standard Meta WhatsApp Cloud API authentication template payload
    const templatePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: options.otpCode,
              },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: options.otpCode,
              },
            ],
          },
        ],
      },
    };

    // If client is configured with live Meta credentials, make actual API call
    if (this.isConfigured && this.client) {
      const res = await this.client.sendMessage(templatePayload);
      if (res.success) {
        return {
          success: true,
          messageId: res.messageId,
          simulated: false,
        };
      }
      return {
        success: false,
        error: res.error,
        simulated: false,
      };
    }

    // Safe Development / Staging Simulator Sink:
    // Never logs the full credentials; records masked log for debugging
    const masked = this.maskPhone(options.recipientPhone);
    console.log(
      `[WhatsApp Cloud API Simulator] Template: ${templateName} (${templateLang}) -> To: ${masked} | Purpose: ${options.purpose || "VERIFICATION"}`
    );

    return {
      success: true,
      messageId: `sim_wamid_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      simulated: true,
    };
  }

  /**
   * Health and capability check for WhatsApp Cloud API integration.
   */
  public getStatus() {
    return {
      provider: "Meta WhatsApp Business Cloud API",
      isConfigured: this.isConfigured,
      phoneNumberIdConfigured: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      apiTokenConfigured: Boolean(process.env.WHATSAPP_API_TOKEN),
      templateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME || "nexu_auth_code",
      version: process.env.WHATSAPP_API_VERSION || "v20.0",
    };
  }
}

export const whatsappService = new WhatsAppService();

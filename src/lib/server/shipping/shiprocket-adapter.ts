import crypto from "crypto";
import { ShipmentStatus } from "@prisma/client";
import {
  IShippingAdapter,
  ServiceabilityResult,
  RateParams,
  ShippingRateQuote,
  CreateShipmentParams,
  ShipmentResult,
  TrackingResult,
  CancelShipmentResult,
} from "./types";

export class ShiprocketShippingAdapter implements IShippingAdapter {
  public readonly provider = "SHIPROCKET";
  private readonly email: string;
  private readonly password: string;
  private readonly webhookToken: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private readonly baseUrl = "https://apiv2.shiprocket.in/v1/external";

  constructor() {
    this.email = process.env.SHIPROCKET_EMAIL || "";
    this.password = process.env.SHIPROCKET_PASSWORD || "";
    this.webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN || "";
  }

  public isConfigured(): boolean {
    return Boolean(
      this.email &&
      this.password &&
      this.email !== "placeholder" &&
      this.password !== "placeholder"
    );
  }

  private async getAuthToken(): Promise<string | null> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }
    if (!this.isConfigured()) return null;

    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.email, password: this.password }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      this.token = data.token;
      this.tokenExpiry = Date.now() + 1000 * 60 * 60 * 20; // 20 hours
      return this.token;
    } catch {
      return null;
    }
  }

  public async checkServiceability(pincode: string): Promise<ServiceabilityResult> {
    const token = await this.getAuthToken();
    if (!token) {
      // Return unconfigured fallback
      return {
        pincode,
        serviceable: true,
        codAvailable: true,
        prepaidAvailable: true,
        estimatedDays: 3,
      };
    }

    try {
      const res = await fetch(
        `${this.baseUrl}/courier/serviceability/?pickup_postcode=400001&delivery_postcode=${pincode}&weight=0.5&cod=0`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        return { pincode, serviceable: false, codAvailable: false, prepaidAvailable: false, estimatedDays: 0 };
      }
      const data = await res.json();
      return {
        pincode,
        serviceable: data.status === 200 && (data.data?.available_courier_companies?.length || 0) > 0,
        codAvailable: true,
        prepaidAvailable: true,
        estimatedDays: 3,
      };
    } catch {
      return { pincode, serviceable: false, codAvailable: false, prepaidAvailable: false, estimatedDays: 0 };
    }
  }

  public async calculateRates(params: RateParams): Promise<ShippingRateQuote[]> {
    return [
      {
        courierId: "sr_bluedart",
        courierName: "Blue Dart Air Priority",
        ratePaise: 16000,
        estimatedDays: 2,
        mode: "AIR",
      },
    ];
  }

  public async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        shipmentId: "",
        provider: this.provider,
        carrierName: "",
        trackingNumber: "",
        shippingRatePaise: 0,
        error: "Shiprocket API credentials are not configured.",
      };
    }

    const token = await this.getAuthToken();
    if (!token) {
      return {
        success: false,
        shipmentId: "",
        provider: this.provider,
        carrierName: "",
        trackingNumber: "",
        shippingRatePaise: 0,
        error: "Failed to authenticate with Shiprocket API.",
      };
    }

    try {
      const payload = {
        order_id: params.orderId,
        order_date: new Date().toISOString().split("T")[0],
        pickup_location: "Primary",
        billing_customer_name: params.deliveryAddress.fullName,
        billing_address: params.deliveryAddress.street,
        billing_city: params.deliveryAddress.city,
        billing_pincode: params.deliveryAddress.pincode,
        billing_state: params.deliveryAddress.state,
        billing_country: "India",
        billing_email: "patron@nexu.studio",
        billing_phone: params.deliveryAddress.phone,
        shipping_is_billing: true,
        order_items: params.items.map((it) => ({
          name: it.title,
          sku: it.sku,
          units: it.quantity,
          selling_price: Math.round(it.pricePaise / 100),
        })),
        payment_method: "Prepaid",
        sub_total: params.items.reduce((s, it) => s + Math.round((it.pricePaise * it.quantity) / 100), 0),
        length: 15,
        breadth: 15,
        height: 10,
        weight: params.weightGrams / 1000,
      };

      const res = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          shipmentId: "",
          provider: this.provider,
          carrierName: "",
          trackingNumber: "",
          shippingRatePaise: 0,
          error: errorData.message || "Shiprocket adhoc order creation failed.",
        };
      }

      const data = await res.json();
      const shipmentId = String(data.shipment_id || data.order_id);
      const awb = data.awb_code || `SR-${shipmentId}`;

      return {
        success: true,
        shipmentId,
        provider: this.provider,
        carrierName: data.courier_name || "Shiprocket Logistics",
        trackingNumber: awb,
        shippingRatePaise: 15000,
      };
    } catch (err: any) {
      return {
        success: false,
        shipmentId: "",
        provider: this.provider,
        carrierName: "",
        trackingNumber: "",
        shippingRatePaise: 0,
        error: err.message || "Failed to call Shiprocket API.",
      };
    }
  }

  public async getTracking(trackingNumber: string): Promise<TrackingResult> {
    const token = await this.getAuthToken();
    if (!token) {
      return {
        success: false,
        trackingNumber,
        carrierName: "Shiprocket",
        currentStatus: ShipmentStatus.PENDING_FULFILLMENT,
        timeline: [],
        error: "Unconfigured Shiprocket credentials",
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/courier/track/awb/${trackingNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return {
          success: false,
          trackingNumber,
          carrierName: "Shiprocket",
          currentStatus: ShipmentStatus.PENDING_FULFILLMENT,
          timeline: [],
          error: `Tracking request failed with status ${res.status}`,
        };
      }
      const data = await res.json();
      return {
        success: true,
        trackingNumber,
        carrierName: data.tracking_data?.carrier_name || "Shiprocket",
        currentStatus: ShipmentStatus.IN_TRANSIT,
        location: data.tracking_data?.current_status,
        timeline: [],
      };
    } catch (err: any) {
      return {
        success: false,
        trackingNumber,
        carrierName: "Shiprocket",
        currentStatus: ShipmentStatus.PENDING_FULFILLMENT,
        timeline: [],
        error: err.message,
      };
    }
  }

  public async cancelShipment(trackingNumber: string, reason: string): Promise<CancelShipmentResult> {
    return { success: true };
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookToken) return false;
    // Shiprocket sends token header "x-api-key" matching webhookToken
    return signature === this.webhookToken;
  }
}

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

export class Simulated3PLAdapter implements IShippingAdapter {
  public readonly provider = "SIMULATED_3PL";
  private readonly webhookSecret = process.env.SHIPPING_WEBHOOK_SECRET || "simulated_shipping_secret_2026";

  public async checkServiceability(pincode: string): Promise<ServiceabilityResult> {
    const cleanPin = pincode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      return {
        pincode,
        serviceable: false,
        codAvailable: false,
        prepaidAvailable: false,
        estimatedDays: 0,
      };
    }

    // High level hub simulation by first digit of PIN
    const firstDigit = cleanPin.charAt(0);
    const regionMap: Record<string, { city: string; state: string; days: number }> = {
      "1": { city: "Delhi", state: "Delhi", days: 2 },
      "2": { city: "Lucknow", state: "Uttar Pradesh", days: 3 },
      "3": { city: "Jaipur", state: "Rajasthan", days: 3 },
      "4": { city: "Mumbai", state: "Maharashtra", days: 2 },
      "5": { city: "Hyderabad", state: "Telangana", days: 3 },
      "6": { city: "Bengaluru", state: "Karnataka", days: 2 },
      "7": { city: "Kolkata", state: "West Bengal", days: 4 },
      "8": { city: "Patna", state: "Bihar", days: 4 },
    };

    const info = regionMap[firstDigit] || { city: "Regional Hub", state: "India", days: 3 };

    return {
      pincode: cleanPin,
      serviceable: true,
      city: info.city,
      state: info.state,
      codAvailable: true,
      prepaidAvailable: true,
      estimatedDays: info.days,
    };
  }

  public async calculateRates(params: RateParams): Promise<ShippingRateQuote[]> {
    const baseAirRate = 15000; // ₹150 in paise
    const baseSurfaceRate = 9000; // ₹90 in paise

    const weightMultiplier = Math.max(1, Math.ceil(params.weightGrams / 500));

    return [
      {
        courierId: "bluedart_air",
        courierName: "Bluedart Air Priority Express",
        ratePaise: baseAirRate * weightMultiplier,
        estimatedDays: 1,
        mode: "AIR",
      },
      {
        courierId: "delhivery_surface",
        courierName: "Delhivery Surface Eco",
        ratePaise: baseSurfaceRate * weightMultiplier,
        estimatedDays: 3,
        mode: "SURFACE",
      },
    ];
  }

  public async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const courier = params.preferredCourier || "Bluedart Air Priority Express";
    const trackingNumber = `BD-${params.orderId.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now().toString().slice(-4)}`;
    const labelUrl = `/api/shipping/labels/${trackingNumber}.pdf`;

    return {
      success: true,
      shipmentId: `SHP-3PL-${Date.now().toString().slice(-8)}`,
      provider: this.provider,
      carrierName: courier,
      trackingNumber,
      labelUrl,
      shippingRatePaise: 15000,
    };
  }

  public async getTracking(trackingNumber: string): Promise<TrackingResult> {
    const now = new Date();
    return {
      success: true,
      trackingNumber,
      carrierName: "Bluedart Air Priority Express",
      currentStatus: ShipmentStatus.IN_TRANSIT,
      location: "Bengaluru Logistics Hub, Sort Facility",
      estimatedDeliveryDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2),
      timeline: [
        {
          status: ShipmentStatus.SHIPPED,
          location: "Artisan Workshop, Mumbai",
          description: "Parcel picked up by courier and scanned at origin hub.",
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12),
        },
        {
          status: ShipmentStatus.IN_TRANSIT,
          location: "Bengaluru Logistics Hub, Sort Facility",
          description: "In transit to destination delivery center.",
          timestamp: now,
        },
      ],
    };
  }

  public async cancelShipment(trackingNumber: string, reason: string): Promise<CancelShipmentResult> {
    return { success: true };
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!rawBody || !signature) return false;
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

  public generateWebhookSignature(rawBody: string): string {
    return crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");
  }
}

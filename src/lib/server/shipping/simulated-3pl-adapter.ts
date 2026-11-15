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

export interface DemoShipmentOptions {
  customStatus?: ShipmentStatus;
  customCarrier?: string;
}

export class Simulated3PLAdapter implements IShippingAdapter {
  public readonly provider = "SHIPROCKET_SIMULATED";
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
        courierId: "sr_bluedart_air",
        courierName: "Shiprocket / Bluedart Air Express",
        ratePaise: baseAirRate * weightMultiplier,
        estimatedDays: 1,
        mode: "AIR",
      },
      {
        courierId: "sr_delhivery_surface",
        courierName: "Shiprocket / Delhivery Surface Eco",
        ratePaise: baseSurfaceRate * weightMultiplier,
        estimatedDays: 3,
        mode: "SURFACE",
      },
    ];
  }

  /**
   * Generates a unique demo AWB number with clear Shiprocket simulation prefix.
   */
  public generateUniqueDemoAwb(): string {
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timePart = Date.now().toString().slice(-5);
    return `DEMO-SR-${randomPart}-${timePart}`;
  }

  public async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const courier = params.preferredCourier || "Shiprocket / Bluedart Air Priority";
    const trackingNumber = this.generateUniqueDemoAwb();
    const labelUrl = `/api/shipping/labels/${trackingNumber}.pdf`;

    return {
      success: true,
      shipmentId: `SHP-DEMO-${Date.now().toString().slice(-8)}`,
      provider: this.provider,
      carrierName: courier,
      trackingNumber,
      labelUrl,
      shippingRatePaise: 15000,
    };
  }

  /**
   * Returns realistic timestamped tracking timeline across all required lifecycle states:
   * CONFIRMED -> DISPATCHED (SHIPPED) -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED (or RTO_INITIATED)
   */
  public async getTracking(trackingNumber: string, currentStatus?: ShipmentStatus): Promise<TrackingResult> {
    const status = currentStatus || ShipmentStatus.IN_TRANSIT;
    const now = new Date();

    const timeline = this.buildSimulatedTimeline(status, now);

    let location = "Bengaluru Logistics Hub, Sort Facility";
    if (status === ShipmentStatus.PENDING_FULFILLMENT) location = "Artisan Studio, Mumbai";
    else if (status === ShipmentStatus.SHIPPED) location = "Bhiwandi Central Logistics Gateway";
    else if (status === ShipmentStatus.OUT_FOR_DELIVERY) location = "Destination City Local Delivery Center";
    else if (status === ShipmentStatus.DELIVERED) location = "Customer Delivery Address";
    else if (status === ShipmentStatus.RTO_INITIATED) location = "Return Processing Center, Mumbai";

    return {
      success: true,
      trackingNumber,
      carrierName: "Shiprocket / Bluedart Air Priority",
      currentStatus: status,
      location,
      estimatedDeliveryDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2),
      timeline,
    };
  }

  public buildSimulatedTimeline(
    targetStatus: ShipmentStatus,
    referenceTime: Date = new Date()
  ): Array<{ status: ShipmentStatus; location: string; description: string; timestamp: Date }> {
    const events: Array<{ status: ShipmentStatus; location: string; description: string; timestamp: Date }> = [];
    const t = referenceTime.getTime();

    events.push({
      status: ShipmentStatus.PENDING_FULFILLMENT,
      location: "Shiprocket Central API Gateway",
      description: "Electronic shipping manifest received. Unique AWB assigned by courier network.",
      timestamp: new Date(t - 1000 * 60 * 60 * 36),
    });

    if (
      targetStatus === ShipmentStatus.SHIPPED ||
      targetStatus === ShipmentStatus.IN_TRANSIT ||
      targetStatus === ShipmentStatus.OUT_FOR_DELIVERY ||
      targetStatus === ShipmentStatus.DELIVERED ||
      targetStatus === ShipmentStatus.RTO_INITIATED
    ) {
      events.push({
        status: ShipmentStatus.SHIPPED,
        location: "Artisan Workshop, Mumbai (Hub MH-01)",
        description: "Package collected from maker studio and scanned into Shiprocket transit network.",
        timestamp: new Date(t - 1000 * 60 * 60 * 24),
      });
    }

    if (
      targetStatus === ShipmentStatus.IN_TRANSIT ||
      targetStatus === ShipmentStatus.OUT_FOR_DELIVERY ||
      targetStatus === ShipmentStatus.DELIVERED ||
      targetStatus === ShipmentStatus.RTO_INITIATED
    ) {
      events.push({
        status: ShipmentStatus.IN_TRANSIT,
        location: "Bhiwandi Line-Haul Air Sorting Center",
        description: "Package in transit across regional hub via express line-haul flight.",
        timestamp: new Date(t - 1000 * 60 * 60 * 12),
      });
    }

    if (
      targetStatus === ShipmentStatus.OUT_FOR_DELIVERY ||
      targetStatus === ShipmentStatus.DELIVERED ||
      targetStatus === ShipmentStatus.RTO_INITIATED
    ) {
      events.push({
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        location: "Destination City Delivery Hub",
        description: "Out for delivery with executive. OTP delivery protocol active.",
        timestamp: new Date(t - 1000 * 60 * 60 * 3),
      });
    }

    if (targetStatus === ShipmentStatus.DELIVERED) {
      events.push({
        status: ShipmentStatus.DELIVERED,
        location: "Customer Residence",
        description: "Package safely delivered to recipient. Consignee signature confirmed.",
        timestamp: referenceTime,
      });
    }

    if (targetStatus === ShipmentStatus.RTO_INITIATED) {
      events.push({
        status: ShipmentStatus.RTO_INITIATED,
        location: "Destination City Sorting Center",
        description: "Customer unavailable after 3 attempts. Package marked Return to Origin (RTO).",
        timestamp: referenceTime,
      });
    }

    return events;
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

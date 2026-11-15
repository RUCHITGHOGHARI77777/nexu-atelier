import { ShipmentStatus } from "@prisma/client";

export interface ServiceabilityResult {
  pincode: string;
  serviceable: boolean;
  city?: string;
  state?: string;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimatedDays: number;
}

export interface RateParams {
  pickupPincode: string;
  deliveryPincode: string;
  weightGrams: number;
  cod: boolean;
  declaredValuePaise: number;
}

export interface ShippingRateQuote {
  courierId: string;
  courierName: string;
  ratePaise: number;
  estimatedDays: number;
  mode: "SURFACE" | "AIR";
}

export interface CreateShipmentParams {
  orderId: string;
  sellerId: string;
  pickupAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  deliveryAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: {
    title: string;
    sku: string;
    quantity: number;
    pricePaise: number;
  }[];
  weightGrams: number;
  preferredCourier?: string;
}

export interface ShipmentResult {
  success: boolean;
  shipmentId: string;
  provider: string;
  carrierName: string;
  trackingNumber: string;
  labelUrl?: string;
  shippingRatePaise: number;
  error?: string;
}

export interface TrackingTimelineEvent {
  status: ShipmentStatus;
  location?: string;
  description: string;
  timestamp: Date;
}

export interface TrackingResult {
  success: boolean;
  trackingNumber: string;
  carrierName: string;
  currentStatus: ShipmentStatus;
  location?: string;
  estimatedDeliveryDate?: Date;
  timeline: TrackingTimelineEvent[];
  error?: string;
}

export interface CancelShipmentResult {
  success: boolean;
  error?: string;
}

export interface IShippingAdapter {
  readonly provider: string;
  checkServiceability(pincode: string): Promise<ServiceabilityResult>;
  calculateRates(params: RateParams): Promise<ShippingRateQuote[]>;
  createShipment(params: CreateShipmentParams): Promise<ShipmentResult>;
  getTracking(trackingNumber: string): Promise<TrackingResult>;
  cancelShipment(trackingNumber: string, reason: string): Promise<CancelShipmentResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

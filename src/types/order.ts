import { Address } from "./customer";
import { ColorVariant } from "./marketplace";

export type OrderStatus =
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface DeliveryMethod {
  id: "standard" | "express";
  name: string;
  description: string;
  estimatedDays: number;
  baseFee: number;
}

export interface OrderItem {
  id?: string;
  productId: string;
  slug: string;
  title: string;
  vendorId: string;
  vendorName: string;
  selectedColor?: ColorVariant;
  selectedSize?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface OrderTotals {
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  estimatedTax: number;
  discount?: number;
  couponCode?: string;
  total: number;
}

export interface OrderShipmentInfo {
  id: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  trackingEvents: Array<{
    status: string;
    location?: string | null;
    timestamp: string;
    note?: string | null;
  }>;
}

export interface Order {
  id: string; // e.g. ORD-2026-98124
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: Address;
  deliveryMethod: DeliveryMethod;
  totals: OrderTotals;
  status: OrderStatus;
  discount?: number;
  couponCode?: string;
  refundedAmount?: number;
  createdAt: string;
  estimatedDeliveryDate: string;
  timeline: OrderTimelineEvent[];
  shipments?: OrderShipmentInfo[];
  idempotencyKey?: string;
  notes?: string;
}

export interface CheckoutRequestPayload {
  items: {
    productId: string;
    selectedSku?: string;
    selectedColorName?: string;
    selectedSize?: string;
    quantity: number;
  }[];
  shippingAddressId?: string;
  newAddress?: Partial<Omit<Address, "id" | "customerId" | "createdAt" | "isDefault">> &
    Pick<Address, "fullName" | "phone" | "street" | "city" | "state" | "pincode">;
  deliveryMethodId: "standard" | "express";
  idempotencyKey?: string;
  couponCode?: string;
}

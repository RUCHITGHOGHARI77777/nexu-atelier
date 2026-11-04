"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { useCurrency } from "@/context/CurrencyContext";

interface TrackedOrderItem {
  id: string;
  title: string;
  slug: string;
  quantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  vendorName: string;
  image?: string | null;
  fulfillmentStatus?: string;
}

interface TrackedShipmentEvent {
  id: string;
  status: string;
  location?: string | null;
  description: string;
  timestamp: string;
}

interface TrackedShipment {
  id: string;
  carrierName: string;
  trackingNumber: string;
  status: string;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  events: TrackedShipmentEvent[];
}

interface TrackedOrder {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  isCod: boolean;
  deliveryMethodName: string;
  estimatedDeliveryDate: string;
  totalPaise: number;
  recipient: {
    name: string;
    destination: string;
  };
  items: TrackedOrderItem[];
  shipments: TrackedShipment[];
}

export default function TrackOrderPage() {
  const { formatPrice } = useCurrency();
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<TrackedOrder | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !contact.trim()) {
      setError("Please enter both Order ID and Phone / Email.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderNumber.trim(),
          contact: contact.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to find order. Please verify your order number and contact details.");
        setOrderData(null);
      } else {
        setOrderData(data.order);
      }
    } catch {
      setError("Network error while retrieving tracking details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return 1;
      case "CONFIRMED":
      case "PROCESSING":
        return 2;
      case "SHIPPED":
      case "IN_TRANSIT":
        return 3;
      case "OUT_FOR_DELIVERY":
        return 4;
      case "DELIVERED":
        return 5;
      case "CANCELLED":
        return -1;
      default:
        return 2;
    }
  };

  const currentStep = orderData ? getStatusStep(orderData.status) : 0;

  return (
    <div className="min-h-screen bg-zinc-50/50 py-10 sm:py-16 text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Editorial Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-mono text-zinc-700 shadow-xs">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span>DIRECT ATELIER DISPATCH TRACKING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
            Track Your Consignment
          </h1>
          <p className="text-sm text-zinc-600 max-w-lg mx-auto">
            Monitor real-time courier movement, dispatch milestones, and doorstep delivery for your curated pieces.
          </p>
        </div>

        {/* Tracking Input Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <form onSubmit={handleTrackSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 uppercase tracking-wider mb-1.5">
                  Order Number / ID
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. ORD-2026-51277"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 pl-10 text-xs sm:text-sm font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 uppercase tracking-wider mb-1.5">
                  Order Email or Phone
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="patron@domain.com or phone"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Retrieving Dispatch Records...</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Locate Shipment</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Hint */}
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Sample verification lookup:</span>
            <button
              type="button"
              onClick={() => {
                setOrderNumber("ORD-2026-10008");
                setContact("priya@nexu.studio");
              }}
              className="text-amber-700 hover:underline font-mono cursor-pointer"
            >
              ORD-2026-10008 (priya@nexu.studio)
            </button>
          </div>
        </div>

        {/* Tracking Details View */}
        {orderData && (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8 animate-fadeIn">
            {/* Top Order Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-zinc-950">
                    {orderData.id}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      orderData.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : orderData.status === "CANCELLED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {orderData.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Placed on {new Date(orderData.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })} • Recipient: {orderData.recipient.name} ({orderData.recipient.destination})
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-[11px] text-zinc-500 block">Total Consignment Value</span>
                <span className="font-mono text-base font-bold text-zinc-950">
                  {formatPrice(orderData.totalPaise / 100)}
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            {currentStep > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                  Fulfillment Progress
                </h3>
                <div className="grid grid-cols-4 gap-2 relative">
                  {[
                    { step: 1, label: "Order Received", sub: "Payment Escrow" },
                    { step: 2, label: "Atelier Packing", sub: "Quality Inspection" },
                    { step: 3, label: "In Transit", sub: "Air/Surface Courier" },
                    { step: 4, label: "Delivered", sub: "Doorstep Handover" },
                  ].map((stage, idx) => {
                    const isDone = currentStep >= stage.step;
                    const isCurrent = currentStep === stage.step;
                    return (
                      <div key={idx} className="flex flex-col items-center text-center space-y-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? "bg-white text-[#171717] border-2 border-[#171717] shadow-xs"
                              : "bg-[#FAFAF8] text-[#767676] border border-[#E8E8E4]"
                          } ${isCurrent ? "ring-2 ring-[#B78B45] ring-offset-2" : ""}`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : stage.step}
                        </div>
                        <span className="text-xs font-semibold text-zinc-900 block">
                          {stage.label}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono hidden sm:block">
                          {stage.sub}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-zinc-500 shrink-0" />
                <div>
                  <div className="font-bold text-zinc-950">
                    Order Status: {orderData.status}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    This order was cancelled or refunded. Payment status: {orderData.paymentStatus}. For further assistance, contact concierge.
                  </p>
                </div>
              </div>
            )}

            {/* Carrier Shipment Info if available */}
            {orderData.shipments && orderData.shipments.length > 0 && (
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-zinc-700" />
                    <span className="text-xs font-bold text-zinc-950">
                      Dispatched via {orderData.shipments[0].carrierName}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-600">
                    AWB: {orderData.shipments[0].trackingNumber}
                  </span>
                </div>
              </div>
            )}

            {/* Parcel Items Showcase */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                Parcel Contents ({orderData.items.length})
              </h3>
              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                {orderData.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between gap-4 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <div className="w-12 h-14 relative rounded-lg bg-zinc-100 overflow-hidden border border-zinc-200 shrink-0">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/product/${item.slug}`}
                          className="text-xs sm:text-sm font-semibold text-zinc-950 hover:text-amber-700 transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span>Maker: {item.vendorName}</span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                          {item.selectedSize && <span>• Size: {item.selectedSize}</span>}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/product/${item.slug}`}
                      className="text-xs text-zinc-600 hover:text-zinc-950 font-medium flex items-center gap-1 shrink-0"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Help / Concierge Notice */}
            <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by Nexu Atelier Escrow & Quality Assurance</span>
              </div>
              <Link
                href="/contact"
                className="text-zinc-800 hover:text-zinc-950 font-semibold underline"
              >
                Need assistance with this parcel?
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

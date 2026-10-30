"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Star,
  ShoppingBag,
  Printer,
  FileText,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { SEED_PRODUCTS } from "@/data/seedCatalog";
import { Product } from "@/types/marketplace";
import { Order, OrderStatus, OrderItem } from "@/types/order";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  params: {
    id: string;
  };
}

export default function OrderDetailPage({ params }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { addToCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);

  // Cancellation State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Return / Replacement State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrderItemId, setReturnOrderItemId] = useState("");
  const [returnType, setReturnType] = useState<"RETURN" | "REPLACEMENT">("RETURN");
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState("Damaged in transit");
  const [returnExplanation, setReturnExplanation] = useState("");
  const [returnEvidence, setReturnEvidence] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [returnSuccess, setReturnSuccess] = useState("");

  // Tax Invoice State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const getItemProduct = (item: OrderItem): Product => {
    const matched = SEED_PRODUCTS.find((p) => p.id === item.productId || p.slug === item.slug);
    if (matched) return matched;

    return {
      id: item.productId,
      slug: item.slug,
      title: item.title,
      subtitle: "Bespoke commission",
      description: "Artisan verified production piece.",
      category: "Objects & Living",
      vendor: {
        id: item.vendorId || "vnd_studio",
        name: item.vendorName,
        slug: "artisan-studio",
        location: "Artisan Hub",
        tagline: "Master Craftsman Collective",
        story: "Dedicated to heritage craft preservation and contemporary precision.",
        rating: 5.0,
        totalSales: 120,
        verifiedSince: "2024",
        dispatchTime: "2-4 days",
        avatarUrl: item.image,
      },
      basePrice: item.unitPrice,
      currency: "INR",
      stock: 10,
      rating: 5.0,
      reviewCount: 1,
      images: [item.image],
      tags: ["craft", "atelier"],
      specifications: [],
      highlights: [],
      materials: "Artisan Grade Materials",
      estimatedDeliveryDays: 3,
    };
  };

  const handleBuyAgain = (item: OrderItem) => {
    const product = getItemProduct(item);
    addToCart(product, {
      color: item.selectedColor,
      size: item.selectedSize,
      quantity: 1,
    });
    router.push("/cart");
  };

  const handleReorderAll = () => {
    if (!order) return;
    setReordering(true);
    for (const item of order.items) {
      const product = getItemProduct(item);
      addToCart(product, {
        color: item.selectedColor,
        size: item.selectedSize,
        quantity: item.quantity,
      });
    }
    setReordering(false);
    router.push("/cart");
  };

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch(`/api/orders/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Order reference not found in your patron portfolio.");
        } else if (res.status === 401) {
          router.push(`/login?redirect=/account/orders/${params.id}`);
        } else {
          setError("Unable to load order details at this moment.");
        }
        return;
      }
      const data = await res.json();
      setOrder(data.order);
    } catch {
      setError("Network error communicating with order ledger.");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login?redirect=/account/orders/${params.id}`);
    } else if (isAuthenticated) {
      fetchOrder();
    }
  }, [isAuthLoading, isAuthenticated, params.id, router, fetchOrder]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    setCancelError("");

    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || "Failed to cancel order.");
        setIsCancelling(false);
        return;
      }

      setOrder(data.order);
      setCancelModalOpen(false);
      setIsCancelling(false);
    } catch {
      setCancelError("Network error while submitting cancellation request.");
      setIsCancelling(false);
    }
  };

  const handleRequestReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSubmittingReturn(true);
    setReturnError("");
    setReturnSuccess("");

    const targetItemId = returnOrderItemId || (order.items[0]?.id || order.items[0]?.productId || "");

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderItemId: targetItemId,
          type: returnType,
          quantity: returnQuantity,
          reason: returnReason,
          explanation: returnExplanation,
          photos: returnEvidence.trim() ? [returnEvidence.trim()] : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReturnError(data.error || "Failed to submit return request.");
        setIsSubmittingReturn(false);
        return;
      }

      setReturnSuccess(data.returnRequest?.id || "LOGGED");
      setIsSubmittingReturn(false);
      setTimeout(() => {
        setReturnModalOpen(false);
        setReturnSuccess("");
        router.push("/account/returns");
      }, 1500);
    } catch {
      setReturnError("Network error logging return request.");
      setIsSubmittingReturn(false);
    }
  };

  const formatStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "in_production":
        return "In Production";
      case "shipped":
        return "Dispatched";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "success";
      case "shipped":
      case "in_production":
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "warning";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-zinc-200 rounded" />
        <div className="h-12 w-64 bg-zinc-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-zinc-200 rounded-xl" />
          <div className="h-48 bg-zinc-200 rounded-xl" />
          <div className="h-48 bg-zinc-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
          <XCircle className="w-6 h-6 stroke-1.5" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-950">Order Retrieval Error</h2>
          <p className="text-xs text-zinc-600">{error || "Unable to display this order."}</p>
        </div>
        <Button variant="outline" size="sm" href="/account/orders">
          ← Return to Orders Ledger
        </Button>
      </div>
    );
  }

  const isCancellable =
    order.status === "confirmed" ||
    order.status === "in_production";

  const isReturnEligible = order.status === "delivered";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>

        <span className="font-mono text-[11px] text-zinc-500">
          Escrow ID: {order.idempotencyKey || "N/A"}
        </span>
      </div>

      {/* Main Order Header Banner */}
      <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 font-mono">
                {order.id}
              </h1>
              <Badge variant={getStatusVariant(order.status) as any}>
                {formatStatusLabel(order.status)}
              </Badge>
            </div>
            <p className="text-xs text-zinc-600 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInvoiceModalOpen(true)}
              className="border-zinc-300 text-zinc-800 hover:bg-zinc-100"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-zinc-600" />
              <span>Tax Invoice</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReorderAll}
              disabled={reordering}
              className="border-zinc-300 text-zinc-800 hover:bg-zinc-100"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              <span>{reordering ? "Adding to Bag..." : "Re-Order Manifest"}</span>
            </Button>

            {isCancellable && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
              >
                Cancel Order
              </Button>
            )}

            {isReturnEligible && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnModalOpen(true)}
                className="border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                <span>Request Return / Dispute</span>
              </Button>
            )}

            {!isCancellable && order.status !== "cancelled" && !isReturnEligible && (
              <span className="text-xs text-zinc-500 font-mono">
                Dispatch locked • Cancellation unavailable
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Line Items, Timeline & Genuine Tracking */}
        <div className="lg:col-span-8 space-y-8">
          {/* Tracking Stages Timeline */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span>Studio Dispatch Lifecycle</span>
            </h3>

            <div className="space-y-4 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
              {order.timeline.map((event, idx) => (
                <div key={idx} className="relative space-y-0.5">
                  <span
                    className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                      event.status === "cancelled"
                        ? "border-rose-500 bg-rose-500"
                        : "border-zinc-300 bg-zinc-100"
                    }`}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white capitalize">
                      {formatStatusLabel(event.status)}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(event.timestamp).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{event.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Genuine 3PL Courier Logistics & AWB Tracking */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-zinc-500" />
              <span>3PL Courier Logistics & AWB Tracking</span>
            </h3>

            {order.shipments && order.shipments.length > 0 ? (
              <div className="space-y-4">
                {order.shipments.map((shipment) => (
                  <div key={shipment.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200">
                      <div>
                        <span className="text-xs font-bold text-zinc-950 block">
                          {shipment.carrier}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-600">
                          AWB: <span className="text-zinc-950 font-bold">{shipment.trackingNumber}</span>
                        </span>
                      </div>
                      <Badge variant="outline" className="self-start sm:self-auto font-mono text-[10px]">
                        {shipment.status.replace("_", " ")}
                      </Badge>
                    </div>

                    {shipment.trackingEvents && shipment.trackingEvents.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-semibold">
                          Carrier Checkpoints
                        </span>
                        <div className="space-y-2">
                          {shipment.trackingEvents.map((evt, idx) => (
                            <div key={idx} className="flex items-start justify-between text-xs">
                              <div>
                                <span className="font-semibold text-zinc-900 block">
                                  {evt.status.replace("_", " ")}
                                </span>
                                {evt.location && (
                                  <span className="text-[11px] text-zinc-600">
                                    {evt.location}
                                  </span>
                                )}
                                {evt.note && (
                                  <p className="text-[10px] text-zinc-500">{evt.note}</p>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                                {new Date(evt.timestamp).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-600">
                        Shipment registered. Real-time courier transit checkpoints are updating.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
                <span className="font-semibold text-zinc-900 block">
                  {order.status === "cancelled"
                    ? "Tracking Unavailable"
                    : order.status === "delivered"
                    ? "Delivery Completed"
                    : "AWB Dispatch Pending"}
                </span>
                <p className="text-[11px] text-zinc-500">
                  {order.status === "cancelled"
                    ? "Order was cancelled prior to carrier dispatch. No shipment was generated."
                    : order.status === "delivered"
                    ? "Parcel was successfully delivered to destination address."
                    : "An official 3PL Air Waybill (AWB) number and live tracking checkpoints will be assigned once the studio hands over the parcel to our logistics partner."}
                </p>
              </div>
            )}
          </div>

          {/* Line Items List */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Commissioned Pieces ({order.items.length})
            </h3>

            <div className="divide-y divide-zinc-100">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-zinc-950">
                        <Link
                          href={`/product/${item.slug}`}
                          className="hover:text-amber-700 transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span>{item.vendorName}</span>
                        {item.selectedColor && (
                          <>
                            <span>•</span>
                            <span>{item.selectedColor.name}</span>
                          </>
                        )}
                        {item.selectedSize && (
                          <>
                            <span>•</span>
                            <span>Size: {item.selectedSize}</span>
                          </>
                        )}
                      </div>
                      <p className="font-mono text-xs text-zinc-700">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                      <div className="flex items-center gap-3 pt-1.5 flex-wrap">
                        <button
                          onClick={() => handleBuyAgain(item)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-800 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-2.5 py-1 rounded transition-colors font-medium"
                        >
                          <ShoppingBag className="w-3 h-3 text-amber-600" />
                          <span>Buy Again</span>
                        </button>
                        {order.status === "delivered" && (
                          <Link
                            href={`/product/${item.slug}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800"
                          >
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Review this piece</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-xs sm:text-sm font-bold text-zinc-950">
                    {formatCurrency(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Address, Courier & Financials */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shipping Details */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>Destination & Contact</span>
            </h3>

            <div className="space-y-1 text-zinc-700 leading-relaxed">
              <p className="font-bold text-zinc-950">{order.shippingAddress.fullName}</p>
              <p>
                {order.shippingAddress.street}
                {order.shippingAddress.apartment
                  ? `, ${order.shippingAddress.apartment}`
                  : ""}
              </p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} —{" "}
                <span className="font-mono">{order.shippingAddress.pincode}</span>
              </p>
              <p className="text-zinc-500 font-mono pt-1">
                Phone: {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          {/* Delivery Method Speed */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Truck className="w-3.5 h-3.5 text-zinc-500" />
              <span>Courier Protocol</span>
            </h3>

            <div className="space-y-1 text-zinc-700">
              <p className="font-semibold text-zinc-950">{order.deliveryMethod.name}</p>
              <p className="text-[11px] text-zinc-600">
                {order.deliveryMethod.description}
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-[11px] text-zinc-600">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  Est. Delivery:{" "}
                  {new Date(order.estimatedDeliveryDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-zinc-950 uppercase tracking-wider text-[11px]">
              Payment & Settlement
            </h3>

            <div className="space-y-2 text-zinc-600 divide-y divide-zinc-100">
              <div className="flex items-center justify-between pt-2">
                <span>Items Subtotal:</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {formatCurrency(order.totals.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span>Courier Dispatch:</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {order.totals.shippingFee === 0
                    ? "Complimentary"
                    : formatCurrency(order.totals.shippingFee)}
                </span>
              </div>

              {order.discount !== undefined && order.discount > 0 && (
                <div className="flex items-center justify-between pt-2 text-emerald-700">
                  <span>
                    Voucher Discount{" "}
                    {order.couponCode ? `(${order.couponCode})` : ""}:
                  </span>
                  <span className="font-mono font-bold">
                    -{formatCurrency(order.discount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span>GST Tax (Included):</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {formatCurrency(order.totals.estimatedTax)}
                </span>
              </div>

              {order.refundedAmount !== undefined && order.refundedAmount > 0 && (
                <div className="flex items-center justify-between pt-2 text-rose-600">
                  <span>Refunded to Source:</span>
                  <span className="font-mono font-bold">
                    -{formatCurrency(order.refundedAmount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 font-bold text-sm text-zinc-950">
                <span>Total Paid:</span>
                <span className="font-mono text-base font-black text-zinc-950">
                  {formatCurrency(order.totals.total)}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-zinc-500 font-mono">
              Direct Escrow Hold • Verified against studio HSN standards
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl space-y-4 text-zinc-900">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancel Order {order.id}?</span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Are you sure you want to cancel this order? Since this order has not yet been dispatched, your studio reservation will be released immediately.
            </p>

            {cancelError && (
              <Alert variant="error" title="Cancellation Error">
                {cancelError}
              </Alert>
            )}

            <div>
              <label className="text-[11px] font-medium text-zinc-700 block mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed sizing preference or delivery timeline..."
                className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-zinc-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
              >
                Keep Order
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelOrder}
                isLoading={isCancelling}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return / Replacement Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl space-y-4 text-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
              <RotateCcw className="w-5 h-5" />
              <span>Initiate Return or Replacement</span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Covered under our 14-day patron protection guarantee. Pieces must remain unworn with original archival packaging and provenance seals.
            </p>

            {returnSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                Return Request #{returnSuccess.slice(0, 8)} registered successfully. Redirecting to your returns portal...
              </div>
            )}

            {returnError && (
              <Alert variant="error" title="Return Request Error">
                {returnError}
              </Alert>
            )}

            <form onSubmit={handleRequestReturn} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Select Item to Return *
                </label>
                <select
                  value={returnOrderItemId || (order.items[0]?.id || order.items[0]?.productId || "")}
                  onChange={(e) => setReturnOrderItemId(e.target.value)}
                  className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600"
                >
                  {order.items.map((it) => {
                    const itemId = it.id || it.productId;
                    return (
                      <option key={itemId} value={itemId}>
                        {it.title} (Qty: {it.quantity}) — Studio: {it.vendorName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Request Type *
                  </label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value as any)}
                    className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600"
                  >
                    <option value="RETURN">Return for Refund</option>
                    <option value="REPLACEMENT">Atelier Replacement</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={
                      order.items.find(
                        (i) => (i.id || i.productId) === (returnOrderItemId || order.items[0]?.id || order.items[0]?.productId)
                      )?.quantity || 1
                    }
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Reason for Return *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600"
                >
                  <option value="Damaged in transit">Damaged in transit</option>
                  <option value="Defective or craft flaw">Defective or craft flaw</option>
                  <option value="Incorrect size or fit">Incorrect size or fit</option>
                  <option value="Item not as described">Item not as described</option>
                  <option value="Missing parts or accessories">Missing parts or accessories</option>
                  <option value="Patron change of mind">Patron change of mind</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Additional Details / Explanation
                </label>
                <textarea
                  rows={3}
                  value={returnExplanation}
                  onChange={(e) => setReturnExplanation(e.target.value)}
                  placeholder="Describe the issue with the material, packaging, or fit..."
                  className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                  Evidence Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={returnEvidence}
                  onChange={(e) => setReturnEvidence(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-50 text-xs text-zinc-900 p-2 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReturnModalOpen(false)}
                  disabled={isSubmittingReturn}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingReturn}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {isSubmittingReturn ? "Submitting..." : "Submit Return Claim"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Tax Invoice Modal */}
      {invoiceModalOpen && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-white text-zinc-950 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-zinc-700" />
                <span className="font-bold text-sm text-zinc-900 uppercase tracking-wider">
                  Official Commercial Tax Invoice
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  aria-label="Close invoice"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="space-y-6 text-xs text-zinc-700">
              {/* Invoice Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-zinc-950 text-white font-bold flex items-center justify-center text-xs">
                      NX
                    </div>
                    <span className="font-extrabold text-base tracking-tight text-zinc-950">
                      NEXU ATELIER
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    GSTIN: 27AAACN1234F1Z5 • Pan-India Master Collective
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Bandra-Kurla Complex, Mumbai, Maharashtra 400051
                  </p>
                </div>

                <div className="sm:text-right font-mono space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded bg-zinc-100 font-bold text-zinc-900 uppercase text-[10px]">
                    Tax Invoice
                  </span>
                  <p className="font-bold text-zinc-950 text-sm">
                    INV-{order.id.replace("ORD-", "")}
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    Order: <strong className="text-zinc-800">{order.id}</strong>
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    Date: {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Billed To & Shipped To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                    Billed & Shipped To (Patron)
                  </span>
                  <p className="font-bold text-zinc-900 text-sm">
                    {order.shippingAddress.fullName}
                  </p>
                  <p className="text-zinc-600">{order.shippingAddress.street}</p>
                  <p className="text-zinc-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                  </p>
                  <p className="text-zinc-500 font-mono mt-1">Phone: {order.shippingAddress.phone}</p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                    Logistics & Settlement
                  </span>
                  <p className="font-medium text-zinc-900">
                    Delivery: {order.deliveryMethod.name}
                  </p>
                  <p className="text-zinc-600">
                    Escrow Protocol: Verified Razorpay Capture
                  </p>
                  {order.shipments && order.shipments.length > 0 && (
                    <p className="text-zinc-600 font-mono text-[11px] mt-1">
                      AWB: {order.shipments[0].trackingNumber} ({order.shipments[0].carrier})
                    </p>
                  )}
                  <p className="text-emerald-700 font-semibold font-mono text-[11px] mt-1">
                    Status: PAID & CONSIGNED
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-900 text-[10px] font-mono uppercase text-zinc-500">
                      <th className="py-2">Item Description & Studio</th>
                      <th className="py-2 text-center">HSN</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Taxable</th>
                      <th className="py-2 text-right">Total (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {order.items.map((item, idx) => {
                      const itemTotal = item.unitPrice * item.quantity;
                      const taxable = Math.round(itemTotal / 1.18);
                      return (
                        <tr key={idx} className="py-2">
                          <td className="py-2.5">
                            <span className="font-bold text-zinc-900 block">{item.title}</span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              Studio: {item.vendorName}
                              {item.selectedSize ? ` • Size: ${item.selectedSize}` : ""}
                              {item.selectedColor ? ` • Color: ${item.selectedColor.name}` : ""}
                            </span>
                          </td>
                          <td className="py-2.5 text-center font-mono text-zinc-600">5007 / 8518</td>
                          <td className="py-2.5 text-center font-mono font-medium">{item.quantity}</td>
                          <td className="py-2.5 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2.5 text-right font-mono text-zinc-600">{formatCurrency(taxable)}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-zinc-900">{formatCurrency(itemTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals */}
              <div className="border-t border-zinc-200 pt-4 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-zinc-600">
                    <span>Items Subtotal:</span>
                    <span>{formatCurrency(order.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Shipping Fee:</span>
                    <span>{order.totals.shippingFee === 0 ? "FREE" : formatCurrency(order.totals.shippingFee)}</span>
                  </div>
                  {order.discount !== undefined && order.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Voucher Discount:</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-600">
                    <span>GST (Included @ 18%):</span>
                    <span>{formatCurrency(order.totals.estimatedTax)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-950 font-bold text-sm pt-2 border-t border-zinc-900">
                    <span>Net Total Paid:</span>
                    <span>{formatCurrency(order.totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Legal Declaration */}
              <div className="border-t border-zinc-200 pt-4 text-[10px] text-zinc-500 leading-relaxed space-y-1">
                <p>
                  <strong>Declaration:</strong> This is a digitally signed computer-generated tax invoice issued by Nexu Atelier on behalf of the registered craft studio.
                </p>
                <p>
                  All craft pieces are authentic originals with direct artisan escrow protection. For return queries, refer to your patron account portal within 14 days of delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

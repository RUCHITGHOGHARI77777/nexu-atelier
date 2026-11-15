"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Calendar,
  Send,
  X,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { SellerOrderLine, FulfillmentStatus } from "@/types/seller";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export default function SellerOrdersPage() {
  const [orderLines, setOrderLines] = useState<SellerOrderLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [shippingLine, setShippingLine] = useState<SellerOrderLine | null>(null);
  const [courierName, setCourierName] = useState("Blue Dart Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSubmittingShip, setIsSubmittingShip] = useState(false);

  const [cancellingLine, setCancellingLine] = useState<SellerOrderLine | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/seller/orders?limit=100");
      if (res.ok) {
        const data = await res.json();
        setOrderLines(data.orderLines || []);
      } else {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setActionError("Authentication required: You must be signed in as an approved studio partner.");
        } else {
          setActionError(err.error || "Failed to load seller orders.");
        }
      }
    } catch {
      setActionError("Network error while loading seller order lines.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (
    lineId: string,
    newStatus: FulfillmentStatus,
    extra?: { courierName?: string; trackingNumber?: string; cancellationReason?: string }
  ) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/seller/orders/${lineId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentStatus: newStatus,
          ...extra,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Order line updated to status: ${newStatus}`);
        fetchOrders();
      } else {
        setActionError(data.error || "Failed to advance fulfillment status.");
      }
    } catch {
      setActionError("Network error while updating fulfillment status.");
    }
  };

  const handleConfirmShip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingLine) return;
    if (!trackingNumber.trim()) {
      setActionError("A valid tracking number or Airway Bill is required.");
      return;
    }

    setIsSubmittingShip(true);
    try {
      await handleUpdateStatus(shippingLine.id, "SHIPPED", {
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim(),
      });
      setShippingLine(null);
      setTrackingNumber("");
    } finally {
      setIsSubmittingShip(false);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingLine) return;
    if (!cancellationReason.trim()) {
      setActionError("A reason is required to cancel an order item.");
      return;
    }

    setIsSubmittingCancel(true);
    try {
      await handleUpdateStatus(cancellingLine.id, "CANCELLED", {
        cancellationReason: cancellationReason.trim(),
      });
      setCancellingLine(null);
      setCancellationReason("");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const getStatusBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case "NEW":
        return <Badge variant="neutral">New Unfulfilled</Badge>;
      case "PROCESSING":
        return <Badge variant="warning">In Production</Badge>;
      case "PACKED":
        return <Badge variant="warning">Packed in Studio</Badge>;
      case "SHIPPED":
        return <Badge variant="success">Dispatched / En Route</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Delivered to Patron</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50">Cancelled</Badge>;
    }
  };

  const filteredOrders = orderLines.filter((line) => {
    const matchesStatus =
      selectedStatus === "ALL" || line.fulfillmentStatus === selectedStatus;
    const matchesSearch =
      searchQuery === "" ||
      line.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      line.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      line.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (line.sku && line.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans text-slate-900 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Order Lifecycle
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Direct Logistics Handoff
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-950 mt-1">
            Fulfillment Workspace
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Track commissioned items, advance production states, assign carrier tracking, and print branded packaging slips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Artisan Fulfillment Responsibilities:</span>
          <p className="text-emerald-800 leading-relaxed text-[11px]">
            As a studio partner, you are responsible for packing pieces securely and entering valid courier tracking details. Delivery confirmations and the 14-day escrow protection period are automated by the platform ledger to ensure timely payments.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <div className="flex items-center gap-2">
            {actionError.toLowerCase().includes("auth") && (
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const res = await fetch("/api/auth/demo-login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role: "seller" }),
                    });
                    if (res.ok) {
                      setActionError(null);
                      fetchOrders();
                    } else {
                      window.location.href = "/login";
                    }
                  } catch {
                    window.location.href = "/login";
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
              >
                Sign In as Demo Studio (Solstice)
              </button>
            )}
            <button
              onClick={() => setActionError(null)}
              className="text-slate-500 hover:text-slate-900 ml-2 font-mono text-[10px]"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-slate-500 hover:text-slate-900 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, piece name, customer, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "All Items" },
              { id: "NEW", label: "New" },
              { id: "PROCESSING", label: "In Production" },
              { id: "PACKED", label: "Packed" },
              { id: "SHIPPED", label: "Shipped" },
              { id: "DELIVERED", label: "Delivered" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedStatus === tab.id
                    ? "bg-slate-950 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-xs text-slate-600">Loading fulfillment orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">No matching orders found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedStatus !== "ALL"
                ? "No fulfillment orders match your current filters."
                : "You do not have any pending customer commissions at this time."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((line) => (
            <div
              key={line.id}
              className="p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-900 font-bold">
                    Order #{line.orderId.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(line.orderedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(line.fulfillmentStatus)}
                  <span className="text-sm font-bold text-slate-950 font-mono">
                    {formatCurrency(line.lineTotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-14 h-16 bg-slate-100 rounded-lg overflow-hidden relative shrink-0 border border-slate-200">
                    <ImageWithFallback
                      src={line.imageSnapshot}
                      alt={line.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <Link
                      href={`/product/${line.productSlug}`}
                      target="_blank"
                      className="font-semibold text-slate-900 hover:text-amber-800 text-sm inline-flex items-center gap-1"
                    >
                      {line.title}
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      {line.sku && <span className="font-mono text-slate-500">SKU: {line.sku}</span>}
                      {line.selectedColorName && (
                        <span>Color: {line.selectedColorName}</span>
                      )}
                      {line.selectedSize && <span>Size: {line.selectedSize}</span>}
                      <span className="font-mono font-semibold text-slate-900">
                        Qty: {line.quantity} × {formatCurrency(line.unitPrice)}
                      </span>
                    </div>

                    {line.cancellationReason && (
                      <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                        <strong>Cancellation Note:</strong> {line.cancellationReason}
                      </div>
                    )}

                    {line.trackingNumber && (
                      <div className="mt-2 text-xs text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center gap-2 font-mono">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {line.courierName} — Track:{" "}
                          <strong className="text-slate-950 font-semibold">{line.trackingNumber}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Ship Destination
                  </span>
                  <p className="font-semibold text-slate-900">{line.customerName}</p>
                  <p className="text-slate-600">
                    {line.shippingAddress.street}, {line.shippingAddress.city},{" "}
                    {line.shippingAddress.state} - {line.shippingAddress.pincode}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono pt-1">
                    Via: {line.deliveryMethodName}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 font-mono">
                  Line Item Ref: {line.id.slice(-8)}
                </div>

                <div className="flex items-center gap-2">
                  {["NEW", "PROCESSING", "PACKED"].includes(line.fulfillmentStatus) && (
                    <button
                      onClick={() => setCancellingLine(line)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel Item
                    </button>
                  )}

                  {line.fulfillmentStatus === "NEW" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(line.id, "PROCESSING")}
                      className="bg-slate-950 hover:bg-slate-800 text-white text-xs cursor-pointer"
                    >
                      Start Production
                    </Button>
                  )}

                  {line.fulfillmentStatus === "PROCESSING" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(line.id, "PACKED")}
                      className="bg-slate-950 hover:bg-slate-800 text-white text-xs cursor-pointer"
                    >
                      Mark as Packed
                    </Button>
                  )}

                  {line.fulfillmentStatus === "PACKED" && (
                    <Button
                      size="sm"
                      onClick={() => setShippingLine(line)}
                      className="bg-slate-950 hover:bg-slate-800 text-white text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Dispatch Shipment
                    </Button>
                  )}

                  {line.fulfillmentStatus === "SHIPPED" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(line.id, "DELIVERED")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Delivery
                    </Button>
                  )}

                  {line.fulfillmentStatus === "DELIVERED" && (
                    <span className="text-xs text-emerald-700 font-mono font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {shippingLine && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmShip}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-slate-800" />
                <h3 className="text-sm font-bold font-serif text-slate-950">
                  Dispatch Shipment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShippingLine(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide logistics courier details to notify the patron and unlock escrow settlement.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-700 font-semibold mb-1">
                  Courier / Logistics Partner
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Blue Dart, Delhivery, DHL Express"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 font-semibold mb-1">
                  Tracking Number / Airway Bill (AWB)
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. BLUEDART-9842104"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShippingLine(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingShip}
                className="bg-slate-950 hover:bg-slate-800 text-white flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmittingShip ? "Dispatching..." : "Confirm & Ship"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {cancellingLine && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmCancel}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold font-serif text-rose-900">
                  Cancel Order Commission
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancellingLine(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Cancelling will atomically restock {cancellingLine.quantity} units to your atelier inventory and log an audit reason for the patron.
            </p>

            <div>
              <label className="block text-xs font-mono text-slate-700 font-semibold mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Material quality check failure, bespoke weave delay, or patron requested cancellation."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCancellingLine(null)}
              >
                Keep Order
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingCancel}
                className="bg-rose-700 text-white hover:bg-rose-800 cursor-pointer"
              >
                {isSubmittingCancel ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

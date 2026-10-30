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

  // Dispatch / Ship Modal State
  const [shippingLine, setShippingLine] = useState<SellerOrderLine | null>(null);
  const [courierName, setCourierName] = useState("Blue Dart Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSubmittingShip, setIsSubmittingShip] = useState(false);

  // Cancel Modal State
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
        const err = await res.json();
        setActionError(err.error || "Failed to load seller orders.");
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
    if (!courierName.trim() || !trackingNumber.trim()) {
      setActionError("Courier name and tracking number are mandatory for dispatch.");
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
        return <Badge variant="outline" className="border-rose-500/40 text-rose-400">Cancelled</Badge>;
    }
  };

  // Filter orders
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
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Order Lifecycle
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Fulfillment Workspace
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track commissioned items, advance production states, assign logistics tracking, and manage patron dispatches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Status Filters & Search Bar */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by Order ID, piece name, customer, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
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
                className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                  selectedStatus === tab.id
                    ? "bg-zinc-200 text-zinc-950 font-medium"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order Lines List */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading fulfillment orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-800/50 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">No matching orders found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
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
              className="p-5 bg-zinc-950/60 border border-zinc-800 rounded hover:border-zinc-700/70 transition-all space-y-4"
            >
              {/* Line Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-300 font-medium">
                    Order #{line.orderId.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(line.orderedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(line.fulfillmentStatus)}
                  <span className="text-sm font-semibold text-zinc-100 font-mono">
                    {formatCurrency(line.lineTotal)}
                  </span>
                </div>
              </div>

              {/* Line Body: Item details & Shipping details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Product Detail */}
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-14 h-16 bg-zinc-900 rounded overflow-hidden relative shrink-0 border border-zinc-800">
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
                      className="font-medium text-zinc-200 hover:text-white text-sm inline-flex items-center gap-1"
                    >
                      {line.title}
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      {line.sku && <span className="font-mono text-zinc-500">SKU: {line.sku}</span>}
                      {line.selectedColorName && (
                        <span>Color: {line.selectedColorName}</span>
                      )}
                      {line.selectedSize && <span>Size: {line.selectedSize}</span>}
                      <span className="font-mono">
                        Qty: {line.quantity} × {formatCurrency(line.unitPrice)}
                      </span>
                    </div>

                    {line.cancellationReason && (
                      <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded">
                        <strong>Cancellation Note:</strong> {line.cancellationReason}
                      </div>
                    )}

                    {line.trackingNumber && (
                      <div className="mt-2 text-xs text-zinc-300 bg-zinc-900 p-2 rounded border border-zinc-800 flex items-center gap-2 font-mono">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {line.courierName} — Track:{" "}
                          <strong className="text-zinc-100">{line.trackingNumber}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patron Shipping Destination */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded text-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Ship Destination
                  </span>
                  <p className="font-medium text-zinc-200">{line.customerName}</p>
                  <p className="text-zinc-400">
                    {line.shippingAddress.street}, {line.shippingAddress.city},{" "}
                    {line.shippingAddress.state} - {line.shippingAddress.pincode}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono pt-1">
                    Via: {line.deliveryMethodName}
                  </p>
                </div>
              </div>

              {/* Line Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
                <div className="text-[11px] text-zinc-500 font-mono">
                  Line Item Ref: {line.id.slice(-8)}
                </div>

                <div className="flex items-center gap-2">
                  {/* Cancel Button */}
                  {["NEW", "PROCESSING", "PACKED"].includes(line.fulfillmentStatus) && (
                    <button
                      onClick={() => setCancellingLine(line)}
                      className="px-2.5 py-1 text-xs text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                    >
                      Cancel Item
                    </button>
                  )}

                  {/* Forward State Transitions */}
                  {line.fulfillmentStatus === "NEW" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(line.id, "PROCESSING")}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs"
                    >
                      Start Production
                    </Button>
                  )}

                  {line.fulfillmentStatus === "PROCESSING" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(line.id, "PACKED")}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs"
                    >
                      Mark as Packed
                    </Button>
                  )}

                  {line.fulfillmentStatus === "PACKED" && (
                    <Button
                      size="sm"
                      onClick={() => setShippingLine(line)}
                      className="bg-zinc-100 hover:bg-white text-zinc-900 text-xs flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Dispatch Shipment
                    </Button>
                  )}

                  {line.fulfillmentStatus === "SHIPPED" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(line.id, "DELIVERED")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Delivery
                    </Button>
                  )}

                  {line.fulfillmentStatus === "DELIVERED" && (
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch / Shipping Modal */}
      {shippingLine && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmShip}
            className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Dispatch Shipment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShippingLine(null)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Provide mandatory logistics courier details to notify the patron and unlock escrow settlement.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Courier / Logistics Partner
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Blue Dart, Delhivery, DHL Express"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Tracking Number / Airway Bill (AWB)
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. BLUEDART-9842104"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
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
                className="bg-zinc-100 text-zinc-900 hover:bg-white flex items-center gap-1.5"
              >
                {isSubmittingShip ? "Dispatching..." : "Confirm & Ship"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingLine && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmCancel}
            className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-semibold text-rose-200">
                  Cancel Order Commission
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancellingLine(null)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Cancelling will atomically restock {cancellingLine.quantity} units to your atelier inventory and log an audit reason for the patron.
            </p>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Material quality check failure, bespoke weave delay, or patron requested cancellation."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
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
                className="bg-rose-600 text-white hover:bg-rose-500"
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

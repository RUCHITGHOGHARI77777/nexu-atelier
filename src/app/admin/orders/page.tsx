"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  X,
  ShieldAlert,
} from "lucide-react";
import { AdminOrderView, OrderStatus } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellingOrder, setCancellingOrder] = useState<AdminOrderView | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/orders?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load platform orders.");
      }
    } catch {
      setActionError("Network error while connecting to order service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    if (!cancelReason || cancelReason.trim().length < 5) {
      setActionError("A formal cancellation reason (minimum 5 characters) is required.");
      return;
    }

    setIsSubmittingCancel(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/orders/${cancellingOrder.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Order #${cancellingOrder.id.slice(-8).toUpperCase()} cancelled administratively.`);
        setCancellingOrder(null);
        setCancelReason("");
        fetchOrders();
      } else {
        setActionError(data.error || "Failed to cancel order.");
      }
    } catch {
      setActionError("Network error while cancelling order.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="neutral">Confirmed</Badge>;
      case "IN_PRODUCTION":
        return <Badge variant="warning">In Production</Badge>;
      case "SHIPPED":
        return <Badge variant="success">Shipped</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="border-rose-500/40 text-rose-400">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Order Fulfillment & Auditing
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Platform Order Operations
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Global search across patron commissions, multi-vendor parcel timelines, courier assignments, and lifecycle management.
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by Order ID, patron name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "All Orders" },
              { id: "CONFIRMED", label: "Confirmed" },
              { id: "IN_PRODUCTION", label: "In Production" },
              { id: "SHIPPED", label: "Shipped" },
              { id: "DELIVERED", label: "Delivered" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-zinc-200 text-zinc-950 font-medium"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading platform orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center text-xs text-zinc-500">
          No orders match the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const isExpanded = expandedOrderId === ord.id;

            return (
              <div
                key={ord.id}
                className="bg-zinc-950/60 border border-zinc-800 rounded overflow-hidden hover:border-zinc-700/70 transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-zinc-200">
                      #{ord.id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(ord.createdAt)}
                    </span>
                    {getOrderStatusBadge(ord.status)}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-zinc-100 font-mono block">
                        {formatCurrency(ord.total)}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {ord.items.length} line item{ord.items.length > 1 ? "s" : ""} • {ord.customerName}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/20 space-y-5">
                    {/* Customer & Address Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded space-y-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-500">Patron Information</span>
                        <p className="font-medium text-zinc-200">{ord.customerName}</p>
                        <p className="text-zinc-400 font-mono text-[11px]">{ord.customerEmail}</p>
                      </div>

                      <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded space-y-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Destination Address
                        </span>
                        <p className="text-zinc-300">
                          {ord.shippingAddressSnapshot.street}, {ord.shippingAddressSnapshot.city},{" "}
                          {ord.shippingAddressSnapshot.state} - {ord.shippingAddressSnapshot.pincode}
                        </p>
                      </div>

                      <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded space-y-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-500">Financial Breakdown</span>
                        <div className="flex justify-between text-zinc-400 font-mono text-[11px]">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(ord.subtotal)}</span>
                        </div>
                        {ord.discount > 0 && (
                          <div className="flex justify-between text-emerald-400 font-mono text-[11px]">
                            <span>Coupon Discount ({ord.couponCode || "PROMO"}):</span>
                            <span>-{formatCurrency(ord.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-zinc-400 font-mono text-[11px]">
                          <span>Shipping Fee:</span>
                          <span>{ord.shippingFee === 0 ? "FREE" : formatCurrency(ord.shippingFee)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-200 font-mono font-semibold pt-1 border-t border-zinc-800">
                          <span>Total Paid:</span>
                          <span>{formatCurrency(ord.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">Multi-Vendor Fulfillment Lines</span>
                      <div className="border border-zinc-800 rounded overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
                            <tr>
                              <th className="py-2.5 px-3">Item</th>
                              <th className="py-2.5 px-3">Artisan Studio</th>
                              <th className="py-2.5 px-3">SKU</th>
                              <th className="py-2.5 px-3">Quantity & Price</th>
                              <th className="py-2.5 px-3">Line Total</th>
                              <th className="py-2.5 px-3">Fulfillment Status</th>
                              <th className="py-2.5 px-3">Courier Tracking</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                            {ord.items.map((it) => (
                              <tr key={it.id}>
                                <td className="py-2.5 px-3 font-medium text-zinc-200">
                                  {it.productTitle}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-400">
                                  {it.vendorName}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-zinc-500 text-[11px]">
                                  {it.sku || "Master SKU"}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-zinc-300">
                                  {it.quantity} × {formatCurrency(it.unitPrice)}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-medium text-zinc-200">
                                  {formatCurrency(it.lineTotal)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <Badge variant="neutral" className="text-[9px]">
                                    {it.fulfillmentStatus}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">
                                  {it.trackingNumber ? (
                                    <span className="flex items-center gap-1 text-emerald-400">
                                      <Truck className="w-3 h-3" />
                                      {it.courierName}: {it.trackingNumber}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-600 italic">Not Dispatched</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Admin Actions Strip */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <div className="text-[11px] font-mono text-zinc-500">
                        Payment Reference: {ord.paymentStatus}
                      </div>

                      {ord.status !== "CANCELLED" && ord.status !== "DELIVERED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancellingOrder(ord)}
                          className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs"
                        >
                          Administrative Cancellation
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmCancel}
            className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-semibold text-rose-200">
                  Cancel Order #{cancellingOrder.id.slice(-8).toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Administrative cancellation will atomically restock all inventory lines across artisan studios and log an official audit entry.
            </p>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Mandatory Operational Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Courier logistics breach, customer safety request, or fraudulent transaction detected."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCancellingOrder(null)}
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

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Package,
  Boxes,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Download,
  ExternalLink,
  Eye,
  Printer,
  ShieldCheck,
  BarChart3,
  Layers,
  Plus,
  Search,
  FileText,
  Calendar,
  ArrowUpRight,
  Filter,
  DollarSign,
  Lock,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { SellerMetrics, SellerOrderLine, SellerProduct, SellerPayoutRecord, SellerProfile, FulfillmentStatus } from "@/types/seller";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BrandedPackagingSlipModal } from "@/components/supplier/BrandedPackagingSlipModal";
import { DispatchOrderModal } from "@/components/supplier/DispatchOrderModal";

interface SellerDashboardMasterProps {
  initialProfile?: SellerProfile | null;
}

export function SellerDashboardMaster({ initialProfile }: SellerDashboardMasterProps) {
  const [profile, setProfile] = useState<SellerProfile | null>(initialProfile || null);
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [orders, setOrders] = useState<SellerOrderLine[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [payouts, setPayouts] = useState<SellerPayoutRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "analytics" | "inventory" | "payouts">("overview");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [packagingSlipOrder, setPackagingSlipOrder] = useState<any | null>(null);
  const [dispatchOrderLine, setDispatchOrderLine] = useState<SellerOrderLine | null>(null);

  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    setActionError(null);
    try {
      const [resMetrics, resOrders, resProducts, resPayouts, resProfile] = await Promise.all([
        fetch("/api/seller/metrics"),
        fetch("/api/seller/orders?limit=100"),
        fetch("/api/seller/products?limit=100"),
        fetch("/api/seller/payouts"),
        fetch("/api/seller/profile"),
      ]);

      if (resMetrics.ok) {
        const data = await resMetrics.json();
        setMetrics(data.metrics || null);
      }
      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data.orderLines || []);
      }
      if (resProducts.ok) {
        const data = await resProducts.json();
        setProducts(data.products || []);
      }
      if (resPayouts.ok) {
        const data = await resPayouts.json();
        setPayouts(data.payouts || []);
      }
      if (resProfile.ok) {
        const data = await resProfile.json();
        setProfile(data.seller || null);
      }

      setLastSynced(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      setActionError("Network error while synchronizing seller database records.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleUpdateOrderStatus = async (
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
        await loadDashboardData();
      } else {
        setActionError(data.error || `Failed to update status to ${newStatus}.`);
      }
    } catch {
      setActionError("Network error updating fulfillment state.");
    }
  };

  const handleConfirmDispatch = async (tracking: { courierName: string; trackingNumber: string }) => {
    if (!dispatchOrderLine) return;
    await handleUpdateOrderStatus(dispatchOrderLine.id, "SHIPPED", tracking);
    setDispatchOrderLine(null);
  };

  const filteredOrderLines = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = orderStatusFilter === "ALL" || o.fulfillmentStatus === orderStatusFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.sku && o.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesDate = true;
      if (dateFilter !== "ALL") {
        const orderDate = new Date(o.orderedAt).getTime();
        const now = Date.now();
        if (dateFilter === "TODAY") {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          matchesDate = orderDate >= startOfToday;
        } else if (dateFilter === "7DAYS") {
          matchesDate = orderDate >= now - 7 * 24 * 60 * 60 * 1000;
        } else if (dateFilter === "30DAYS") {
          matchesDate = orderDate >= now - 30 * 24 * 60 * 60 * 1000;
        }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [orders, orderStatusFilter, searchQuery, dateFilter]);

  const handleExportCSV = () => {
    if (filteredOrderLines.length === 0) {
      setActionError("No order records match the selected filter to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Ordered At",
      "Item Description",
      "SKU",
      "Quantity",
      "Unit Price (INR)",
      "Line Total (INR)",
      "Commission 10% (INR)",
      "Net Payout (INR)",
      "Fulfillment Status",
      "Courier Name",
      "Tracking Number",
      "Customer Name",
      "Destination City",
      "Destination Pincode",
    ];

    const rows = filteredOrderLines.map((o) => {
      const commission = Math.round(o.lineTotal * 0.1);
      const net = o.lineTotal - commission;
      return [
        `"${o.orderId}"`,
        `"${new Date(o.orderedAt).toLocaleString("en-IN")}"`,
        `"${o.title.replace(/"/g, '""')}"`,
        `"${o.sku || "N/A"}"`,
        o.quantity,
        o.unitPrice,
        o.lineTotal,
        commission,
        net,
        `"${o.fulfillmentStatus}"`,
        `"${o.courierName || "N/A"}"`,
        `"${o.trackingNumber || "N/A"}"`,
        `"${o.customerName}"`,
        `"${o.shippingAddress?.city || "India"}"`,
        `"${o.shippingAddress?.pincode || "400001"}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NEXU_Seller_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFulfillmentBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case "NEW":
        return <Badge variant="neutral">New Unfulfilled</Badge>;
      case "PROCESSING":
        return <Badge variant="warning">In Production</Badge>;
      case "PACKED":
        return <Badge variant="warning">Packed in Studio</Badge>;
      case "SHIPPED":
        return <Badge variant="success">Dispatched / In Transit</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Delivered to Patron</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="border-rose-500/40 text-rose-400">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
          <span>Synchronizing studio ledger with PostgreSQL 17...</span>
        </div>
      </div>
    );
  }

  const studioName = profile?.name || "Solstice Handloom Textiles";
  const studioSlug = profile?.slug || "solstice-loom-studio";
  const commissionRate = profile?.commissionRatePercent ?? 10;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
              Artisan Studio Hub
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Partner • {commissionRate}% Platform Fee</span>
            </span>
            {lastSynced && (
              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                Synced: {lastSynced}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            {studioName}
          </h1>

          <p className="text-xs text-slate-500 font-mono">
            Origin Hub: <strong className="text-slate-800">{profile?.originHub || "Surat & Ahmedabad, India"}</strong> • Bank Settlement:{" "}
            <strong className="text-emerald-700">14-Day Escrow Payout Cycle</strong> • GSTIN:{" "}
            <strong className="text-slate-800">{profile?.taxIdentifier || "24AAECN1234F1Z8"}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-slate-900" : ""}`} />
            <span>Sync Ledger</span>
          </Button>

          <Link
            href={`/store/${studioSlug}`}
            target="_blank"
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>View Public Store</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <Link
            href="/seller/products/new"
            className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Add Artisan Piece</span>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700 text-xs font-mono">
            DISMISS
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-mono">
            DISMISS
          </button>
        </div>
      )}

      <div className="space-y-4 font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Financial & Sales Overview
            </h2>
            <p className="text-xs text-slate-500">
              Live verified revenue, fulfillment states, and escrow settlement status
            </p>
          </div>
          <span className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full">
            Real-Time Records
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Total Gross Sales</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {formatCurrency(metrics?.grossSales || 0)}
            </p>
            <span className="text-xs text-slate-500 block">Lifetime orders total</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Today&apos;s Sales</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {formatCurrency(metrics?.todaySales || 0)}
            </p>
            <span className="text-xs text-emerald-600 block">From 12:00 AM IST</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Weekly Sales (7D)</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {formatCurrency(metrics?.weeklySales || 0)}
            </p>
            <span className="text-xs text-slate-500 block">Last 7 calendar days</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Monthly Sales (30D)</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {formatCurrency(metrics?.monthlySales || 0)}
            </p>
            <span className="text-xs text-slate-500 block">Last 30 calendar days</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">Total Net Take-Home</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
              {formatCurrency(metrics?.totalEarnings || metrics?.netProceeds || 0)}
            </p>
            <span className="text-xs text-emerald-700 block font-medium">After {commissionRate}% platform fee</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center space-y-1 shadow-2xs">
            <span className="text-xs font-medium text-slate-600 block">Total Orders</span>
            <span className="text-xl font-bold text-slate-950">{metrics?.totalOrders || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-center space-y-1 shadow-2xs">
            <span className="text-xs font-semibold text-blue-800 block">New Unfulfilled</span>
            <span className="text-xl font-bold text-blue-950">{metrics?.newOrders || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-1 shadow-2xs">
            <span className="text-xs font-semibold text-amber-800 block">In Production</span>
            <span className="text-xl font-bold text-amber-950">{metrics?.processingOrders || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-1 shadow-2xs">
            <span className="text-xs font-semibold text-amber-800 block">Packed in Studio</span>
            <span className="text-xl font-bold text-amber-950">{metrics?.packedOrders || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-center space-y-1 shadow-2xs">
            <span className="text-xs font-semibold text-indigo-800 block">Dispatched (AWB)</span>
            <span className="text-xl font-bold text-indigo-950">{metrics?.shippedOrders || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1 shadow-2xs">
            <span className="text-xs font-semibold text-emerald-800 block">Delivered</span>
            <span className="text-xl font-bold text-emerald-950">{metrics?.deliveredOrders || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-center space-y-1 shadow-2xs">
            <span className="text-xs font-semibold text-rose-800 block">Cancelled</span>
            <span className="text-xl font-bold text-rose-950">{metrics?.cancelledOrders || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1 shadow-2xs">
            <span className="text-xs font-medium text-slate-600 block">Returns/Refunds</span>
            <span className="text-xl font-bold text-slate-900">
              {(metrics?.returnedOrders || 0) + (metrics?.refundedOrders || 0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Catalog & Stock Status</span>
              <Boxes className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-950">
              {metrics?.activeProducts || 0} Live <span className="text-xs text-slate-500 font-normal">/ {metrics?.totalProducts || 0} Total</span>
            </p>
            <p className="text-xs text-slate-500">
              {metrics?.lowStockCount || 0} Low Stock • {metrics?.outOfStockCount || 0} Out of Stock
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Platform Commission ({commissionRate}%)</span>
              <IndianRupee className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-950">
              {formatCurrency(metrics?.commissionDeducted || 0)}
            </p>
            <p className="text-xs text-slate-500">
              Transparent statutory deduction
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs text-amber-900 font-medium">
              <span>14-Day Escrow Hold</span>
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-bold text-amber-950">
              {formatCurrency(metrics?.pendingEarnings || 0)}
            </p>
            <p className="text-xs text-amber-700">
              Held during delivery & return SLA
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs text-emerald-900 font-medium">
              <span>Eligible Payouts</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-950">
              {formatCurrency(metrics?.eligiblePayout || 0)}
            </p>
            <p className="text-xs text-emerald-700">
              Ready for bank settlement ({formatCurrency(metrics?.settledPayouts || 0)} Settled)
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          {[
            { id: "overview", label: "Dashboard Overview & Recent Orders", icon: BarChart3 },
            { id: "orders", label: `Order Fulfillment (${orders.length})`, icon: Package },
            { id: "analytics", label: "Sales Reports & Analytics", icon: TrendingUp },
            { id: "inventory", label: `Stock Inventory (${products.length})`, icon: Boxes },
            { id: "payouts", label: `Settlements & Payouts (${payouts.length})`, icon: IndianRupee },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-slate-900 text-slate-950 font-bold bg-slate-50/80 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 text-xs text-slate-700 mb-2 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CA Report (.CSV)</span>
        </Button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Recent Studio Commission Orders</h2>
              <p className="text-xs text-slate-500">Live order item allocations routed to {studioName}</p>
            </div>
            <Link
              href="/seller/orders"
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1"
            >
              <span>View All Fulfillment Lines ({orders.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">Order / Allocation</th>
                    <th className="py-3 px-4">Piece Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                    <th className="py-3 px-4 text-right">Net Payout</th>
                    <th className="py-3 px-4 text-center">Fulfillment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {orders.slice(0, 8).map((line) => {
                    const commission = Math.round(line.lineTotal * (commissionRate / 100));
                    const netPayout = line.lineTotal - commission;
                    return (
                      <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-950 block">{line.orderId}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(line.orderedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="font-semibold text-slate-900 line-clamp-1 block">{line.title}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {line.sku ? `SKU: ${line.sku}` : "Standard Variant"}
                            {line.selectedColorName ? ` • ${line.selectedColorName}` : ""}
                            {line.selectedSize ? ` • ${line.selectedSize}` : ""}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium">{line.quantity}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-950">
                          {formatCurrency(line.lineTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatCurrency(netPayout)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getFulfillmentBadge(line.fulfillmentStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {line.fulfillmentStatus === "NEW" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(line.id, "PROCESSING")}
                                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors"
                              >
                                Accept Order
                              </button>
                            )}
                            {line.fulfillmentStatus === "PROCESSING" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(line.id, "PACKED")}
                                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold transition-colors"
                              >
                                Mark Packed
                              </button>
                            )}
                            {line.fulfillmentStatus === "PACKED" && (
                              <button
                                type="button"
                                onClick={() => setDispatchOrderLine(line)}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors"
                              >
                                Dispatch Order
                              </button>
                            )}
                            {line.fulfillmentStatus === "SHIPPED" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(line.id, "DELIVERED")}
                                className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-colors"
                              >
                                Confirm Delivery
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPackagingSlipOrder(line)}
                              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title="Print Branded Packaging Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500 font-mono">
                        No orders have been routed to this studio yet. Place a test order from the storefront to see it update live.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Link
              href="/seller/products"
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-1 group transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                  Manage Product Catalog →
                </span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">
                Update prices, descriptions, images, and publish new collections.
              </p>
            </Link>

            <Link
              href="/seller/inventory"
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-1 group transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                  Real-Time Stock Ledger →
                </span>
                <Boxes className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">
                Adjust warehouse stock levels, low-stock alerts, and batch save.
              </p>
            </Link>

            <Link
              href="/seller/payouts"
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-1 group transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                  GST & Payout Ledger →
                </span>
                <IndianRupee className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">
                Track bank settlements, 14-day escrow cooling, and tax deductions.
              </p>
            </Link>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Studio Order Fulfillment Workspace</h2>
              <p className="text-xs text-slate-500">
                Advance orders through verified production milestones: Accept → Pack → Dispatch (with AWB) → Delivered
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Order ID, piece, or patron..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-900 w-56 font-sans"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                {["ALL", "NEW", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                      orderStatusFilter === status
                        ? "bg-slate-900 text-white font-semibold"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Patron & Destination</th>
                    <th className="py-3 px-4">Item & Variant</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                    <th className="py-3 px-4 text-right">Net Payout</th>
                    <th className="py-3 px-4 text-center">Fulfillment Status</th>
                    <th className="py-3 px-4">Logistics Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredOrderLines.map((line) => {
                    const commission = Math.round(line.lineTotal * (commissionRate / 100));
                    const netPayout = line.lineTotal - commission;
                    return (
                      <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-950 block">{line.orderId}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(line.orderedAt).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block">{line.customerName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {line.shippingAddress?.city || "Mumbai"}, {line.shippingAddress?.pincode || "400001"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="font-semibold text-slate-900 line-clamp-1 block">{line.title}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {line.sku ? `SKU: ${line.sku}` : "Standard Piece"}
                            {line.selectedColorName ? ` • Color: ${line.selectedColorName}` : ""}
                            {line.selectedSize ? ` • Size: ${line.selectedSize}` : ""}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium">{line.quantity}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-950">
                          {formatCurrency(line.lineTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatCurrency(netPayout)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getFulfillmentBadge(line.fulfillmentStatus)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {line.trackingNumber ? (
                            <div>
                              <span className="font-semibold text-slate-900 block">{line.courierName || "Courier"}</span>
                              <span className="text-slate-500">{line.trackingNumber}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Pending Dispatch</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {line.fulfillmentStatus === "NEW" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(line.id, "PROCESSING")}
                                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors"
                              >
                                Accept Order
                              </button>
                            )}
                            {line.fulfillmentStatus === "PROCESSING" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(line.id, "PACKED")}
                                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold transition-colors"
                              >
                                Mark Packed
                              </button>
                            )}
                            {line.fulfillmentStatus === "PACKED" && (
                              <button
                                type="button"
                                onClick={() => setDispatchOrderLine(line)}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors"
                              >
                                Dispatch Order
                              </button>
                            )}
                            {line.fulfillmentStatus === "SHIPPED" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(line.id, "DELIVERED")}
                                className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-colors"
                              >
                                Confirm Delivery
                              </button>
                            )}
                            {(line.fulfillmentStatus === "NEW" || line.fulfillmentStatus === "PROCESSING") && (
                              <button
                                type="button"
                                onClick={() => {
                                  const reason = "Merchant cancellation due to craft defect or stock issue";
                                  handleUpdateOrderStatus(line.id, "CANCELLED", { cancellationReason: reason });
                                }}
                                className="px-2 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 text-[10px] font-mono transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPackagingSlipOrder(line)}
                              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title="Print Branded Packaging Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrderLines.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-slate-500 font-mono">
                        No orders match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Statutory Sales Reports & Performance Analytics</h2>
              <p className="text-xs text-slate-500">
                Verified figures calculated from authentic PostgreSQL ledger records with 10% statutory platform commission
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: "ALL", label: "All Time" },
                { id: "TODAY", label: "Today" },
                { id: "7DAYS", label: "Last 7 Days" },
                { id: "30DAYS", label: "Last 30 Days" },
              ].map((df) => (
                <button
                  key={df.id}
                  type="button"
                  onClick={() => setDateFilter(df.id as any)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    dateFilter === df.id
                      ? "bg-slate-900 text-white font-semibold"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {df.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Daily Sales Volume (Last 7 Days)
            </h3>
            <div className="grid grid-cols-7 gap-3 pt-2">
              {(metrics?.recentDaysSales || []).map((day) => (
                <div key={day.date} className="text-center space-y-2">
                  <div className="h-28 bg-slate-50 rounded-lg flex flex-col justify-end p-1.5 relative border border-slate-100">
                    <div
                      className="w-full bg-emerald-600 rounded-sm transition-all"
                      style={{
                        height: `${Math.min(100, Math.max(10, (day.sales / Math.max(1, metrics?.grossSales || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block truncate">
                    {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-900 block">
                    {formatCurrency(day.sales)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">{day.orders} ord</span>
                </div>
              ))}
              {(!metrics?.recentDaysSales || metrics.recentDaysSales.length === 0) && (
                <div className="col-span-7 py-6 text-center text-xs text-slate-400 font-mono">
                  No sales recorded in the last 7 days.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/75">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Product-Wise Sales & Revenue Performance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/40 text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-2.5 px-4">Artisan Piece</th>
                    <th className="py-2.5 px-4 text-center">Units Sold</th>
                    <th className="py-2.5 px-4 text-right">Gross Sales (INR)</th>
                    <th className="py-2.5 px-4 text-right">Platform Commission (10%)</th>
                    <th className="py-2.5 px-4 text-right">Net Studio Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(metrics?.topProducts || []).map((tp) => {
                    const comm = Math.round(tp.revenue * 0.1);
                    const net = tp.revenue - comm;
                    return (
                      <tr key={tp.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{tp.title}</td>
                        <td className="py-3 px-4 text-center font-mono">{tp.unitsSold}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-950">
                          {formatCurrency(tp.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {formatCurrency(comm)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatCurrency(net)}
                        </td>
                      </tr>
                    );
                  })}
                  {(!metrics?.topProducts || metrics.topProducts.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-400 font-mono">
                        No product sales recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Studio Warehouse & Stock Management</h2>
              <p className="text-xs text-slate-500">
                Real-time stock counts reflecting customer purchases and inventory adjustments
              </p>
            </div>
            <Link
              href="/seller/products/new"
              className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add New Piece</span>
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">Piece Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-center">Available Stock</th>
                    <th className="py-3 px-4 text-center">Approval Status</th>
                    <th className="py-3 px-4 text-center">Public Storefront</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{p.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-950">
                        {formatCurrency(p.basePrice)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            p.stock <= 0
                              ? "bg-rose-100 text-rose-800"
                              : p.stock <= (p.lowStockThreshold || 5)
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            p.approvalStatus === "APPROVED"
                              ? "success"
                              : p.approvalStatus === "PENDING_REVIEW"
                              ? "warning"
                              : "neutral"
                          }
                          className="text-[10px] font-mono"
                        >
                          {p.approvalStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={p.isPublished ? "success" : "neutral"} className="text-[10px] font-mono">
                          {p.isPublished ? "Live" : "Unpublished"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/seller/products/${p.id}`}
                          className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          Edit Piece
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-slate-400 font-mono">
                        No products in studio catalog yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payouts" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Statutory GST & Bank Settlement Ledger</h2>
              <p className="text-xs text-slate-500">
                14-Day Escrow Cooling Schedule: Funds advance from Held → Eligible upon delivery confirmation
              </p>
            </div>
            <Link
              href="/seller/payouts"
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1"
            >
              <span>View Full Financial Ledger ({payouts.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">Line Item / Piece</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Gross Amount</th>
                    <th className="py-3 px-4 text-right">Commission (10%)</th>
                    <th className="py-3 px-4 text-right">Net Payout</th>
                    <th className="py-3 px-4 text-center">Settlement Status</th>
                    <th className="py-3 px-4">UTR Bank Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{p.productTitle}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Ref: {p.id.slice(-8)}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-950">
                        {formatCurrency(p.grossAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(p.commission)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(p.netPayout)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === "SETTLED"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "ELIGIBLE_FOR_PAYOUT"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.status === "SETTLED"
                            ? "SETTLED TO BANK"
                            : p.status === "ELIGIBLE_FOR_PAYOUT"
                            ? "ELIGIBLE FOR PAYOUT"
                            : "14-DAY ESCROW HOLD"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.transactionRef || (p.status === "SETTLED" ? "NEFT/2026/894210" : "Pending Release")}
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-slate-400 font-mono">
                        No payout records in ledger yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {dispatchOrderLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Dispatch Order Item</h3>
                <p className="text-xs text-slate-500 font-mono">Order: {dispatchOrderLine.orderId}</p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchOrderLine(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const courierName = form.courier.value;
                const trackingNumber = form.tracking.value;
                if (!trackingNumber.trim()) {
                  setActionError("Tracking number / AWB is required.");
                  return;
                }
                handleConfirmDispatch({ courierName, trackingNumber });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Logistics Courier Partner
                </label>
                <select
                  name="courier"
                  defaultValue="Blue Dart Express"
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Blue Dart Express">Blue Dart Express (Standard Surface)</option>
                  <option value="Delhivery Surface">Delhivery Surface</option>
                  <option value="DTDC Express">DTDC Express Premium</option>
                  <option value="Shiprocket Direct">Shiprocket Direct Air</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Air Waybill (AWB) / Tracking Number
                </label>
                <input
                  name="tracking"
                  type="text"
                  placeholder="e.g. BD-892140510IN"
                  defaultValue={`BD-${Math.floor(10000000 + Math.random() * 90000000)}IN`}
                  required
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setDispatchOrderLine(null)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
                  Confirm Dispatch & Generate AWB
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {packagingSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-sm text-slate-900">Official Merchant Tax Invoice & Packaging Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setPackagingSlipOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 space-y-4 font-sans text-xs" id="printable-slip">
              <div className="flex justify-between border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-extrabold text-base text-slate-950">{studioName}</h4>
                  <p className="text-slate-500 font-mono text-[11px]">{profile?.originHub || "India"}</p>
                  <p className="text-slate-500 font-mono text-[10px]">GSTIN: {profile?.taxIdentifier || "24AAECN1234F1Z8"}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">INV-{packagingSlipOrder.orderId}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Date: {new Date(packagingSlipOrder.orderedAt).toLocaleDateString("en-IN")}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold inline-block mt-1">
                    PAID VIA ESCROW
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Ship To Patron:</span>
                  <p className="font-semibold text-slate-900">{packagingSlipOrder.customerName}</p>
                  <p className="text-slate-600">
                    {packagingSlipOrder.shippingAddress?.street || "Studio Address"}
                  </p>
                  <p className="text-slate-600">
                    {packagingSlipOrder.shippingAddress?.city}, {packagingSlipOrder.shippingAddress?.state} - {packagingSlipOrder.shippingAddress?.pincode}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Logistics Partner:</span>
                  <p className="font-semibold text-slate-900">{packagingSlipOrder.courierName || "Blue Dart Express"}</p>
                  <p className="font-mono text-slate-600">AWB: {packagingSlipOrder.trackingNumber || "BD-892140510IN"}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-400">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">HSN</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 font-medium text-slate-900">
                      {packagingSlipOrder.title}
                      {packagingSlipOrder.sku && (
                        <span className="text-[10px] font-mono text-slate-400 block">SKU: {packagingSlipOrder.sku}</span>
                      )}
                    </td>
                    <td className="py-2 text-center font-mono text-slate-500">6203 / 8518</td>
                    <td className="py-2 text-center font-mono">{packagingSlipOrder.quantity}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(packagingSlipOrder.unitPrice)}</td>
                    <td className="py-2 text-right font-mono font-bold">{formatCurrency(packagingSlipOrder.lineTotal)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs">
                <span className="text-slate-400 text-[10px] font-mono">
                  This is a computer-generated tax invoice settled via NEXU ATELIER Escrow.
                </span>
                <span className="font-bold font-mono text-sm text-slate-950">
                  Total: {formatCurrency(packagingSlipOrder.lineTotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setPackagingSlipOrder(null)}>
                Close
              </Button>
              <Button
                size="sm"
                className="bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => {
                  window.print();
                }}
              >
                Print Slip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

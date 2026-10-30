"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  Store,
  Sparkles,
  Scale,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  CreditCard,
  Banknote,
  Search,
  Filter,
} from "lucide-react";
import { AdminMetrics, AdminOrderView } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrderView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (selectedPeriod = period) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const periodParam = selectedPeriod !== "all" ? `?period=${selectedPeriod}` : "";
      const [metricsRes, ordersRes] = await Promise.all([
        fetch(`/api/admin/metrics${periodParam}`),
        fetch("/api/admin/orders?limit=10"),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
      } else {
        setErrorMessage("Failed to load platform metrics.");
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setRecentOrders(data.orders || []);
      }
    } catch {
      setErrorMessage("Network error while loading admin console.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const getOrderStatusBadge = (status: string) => {
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

  const filteredOrders = recentOrders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Marketplace Command
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Central Admin Operations Control
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time multi-vendor metrics derived strictly from persistent PostgreSQL database ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-1 text-xs">
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  period === p.id
                    ? "bg-zinc-100 text-zinc-950 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(period)}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Financial Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Gross Sales (GMV)</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 mt-2 font-mono">
            {metrics ? formatCurrency(metrics.grossMerchandiseValue) : "—"}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Excludes cancelled orders</p>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Net Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-emerald-400 mt-2 font-mono">
            {metrics ? formatCurrency(metrics.netPlatformRevenue) : "—"}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Commission less processed refunds</p>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 mt-2 font-mono">
            {metrics ? metrics.totalOrders : "—"}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            {metrics ? `${metrics.deliveredOrders} delivered • ${metrics.pendingOrders} pending` : "—"}
          </p>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Processed Refunds</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-semibold text-amber-400 mt-2 font-mono">
            {metrics ? formatCurrency(metrics.totalRefunded) : "—"}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Arbitrated customer returns</p>
        </div>
      </div>

      {/* Secondary Operational Stats Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Pending Orders</span>
          <span className="text-lg font-mono font-medium text-amber-400 mt-1 block">
            {metrics?.pendingOrders ?? "—"}
          </span>
          <span className="text-[9px] text-zinc-600">Awaiting processing</span>
        </div>

        <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Delivered Orders</span>
          <span className="text-lg font-mono font-medium text-emerald-400 mt-1 block">
            {metrics?.deliveredOrders ?? "—"}
          </span>
          <span className="text-[9px] text-zinc-600">Successfully received</span>
        </div>

        <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Cancelled Orders</span>
          <span className="text-lg font-mono font-medium text-rose-400 mt-1 block">
            {metrics?.cancelledOrders ?? "—"}
          </span>
          <span className="text-[9px] text-zinc-600">Voided orders</span>
        </div>

        <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Pending Payments</span>
          <span className="text-lg font-mono font-medium text-blue-400 mt-1 block">
            {metrics?.pendingPayments ?? "—"}
          </span>
          <span className="text-[9px] text-zinc-600">Escrow or pending</span>
        </div>

        <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Low-Stock Pieces</span>
          <span className="text-lg font-mono font-medium text-amber-300 mt-1 block">
            {metrics?.lowStockProducts ?? "—"}
          </span>
          <span className="text-[9px] text-zinc-600">Stock ≤ 5 units</span>
        </div>

        <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Pending Payouts</span>
          <span className="text-lg font-mono font-medium text-purple-400 mt-1 block">
            {metrics?.pendingPayouts ?? "—"}
          </span>
          <span className="text-[9px] text-zinc-600">Eligible settlements</span>
        </div>
      </div>

      {/* Action Queues Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Sellers */}
        <Link
          href="/admin/sellers"
          className="p-4 bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-800 rounded transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-200 block">Supplier Applications</span>
              <span className="text-[11px] text-amber-400 font-mono">
                {metrics?.pendingSellers || 0} Pending Verification
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Product Moderation */}
        <Link
          href="/admin/products"
          className="p-4 bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-800 rounded transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-200 block">Catalog Moderation</span>
              <span className="text-[11px] text-blue-400 font-mono">
                {metrics?.pendingProducts || 0} Awaiting Review
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Open Disputes */}
        <Link
          href="/admin/disputes"
          className="p-4 bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-800 rounded transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-200 block">Open Return Disputes</span>
              <span className="text-[11px] text-rose-400 font-mono">
                {metrics?.openDisputes || 0} Requiring Arbitration
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Directory Counts Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-zinc-950/60 border border-zinc-800 rounded">
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-500">Active Studios</span>
          <p className="text-lg font-medium text-zinc-200 mt-0.5 font-mono">
            {metrics?.activeSellers || 0}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-500">Live Pieces in Storefront</span>
          <p className="text-lg font-medium text-emerald-400 mt-0.5 font-mono">
            {metrics?.activeProducts || 0}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-500">Registered Patrons</span>
          <p className="text-lg font-medium text-zinc-200 mt-0.5 font-mono">
            {metrics?.totalCustomers || 0}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-500">Suspended Studios</span>
          <p className="text-lg font-medium text-rose-400 mt-0.5 font-mono">
            {metrics?.suspendedSellers || 0}
          </p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="p-6 bg-zinc-950/60 border border-zinc-800 rounded space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100 font-mono uppercase">
              Recent Marketplace Orders
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Authoritative transaction audit records from across the multi-vendor network.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search recent orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono shrink-0"
            >
              Full Order Control <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="border border-zinc-800 rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Patron</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No recent orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-zinc-200">
                      #{ord.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-zinc-200 block">{ord.customerName}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{ord.customerEmail}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">
                      {ord.items.length} item{ord.items.length > 1 ? "s" : ""}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-zinc-100">
                      {formatCurrency(ord.total)}
                    </td>
                    <td className="py-2.5 px-3">
                      {getOrderStatusBadge(ord.status)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-zinc-500">
                      {formatDateTime(ord.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/admin/orders?search=${ord.id}`}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-mono"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

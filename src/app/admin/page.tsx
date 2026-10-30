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

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [metricsRes, ordersRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/admin/orders?limit=5"),
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
    fetchData();
  }, []);

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

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Marketplace Command
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Platform Operations & Governance
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Authoritative multi-vendor operational metrics derived strictly from persistent database ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
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
            <span className="text-[10px] font-mono uppercase tracking-wider">Gross Merchandise (GMV)</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 mt-2 font-mono">
            {metrics ? formatCurrency(metrics.grossMerchandiseValue) : "—"}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Excludes cancelled orders</p>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Platform Commission</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-emerald-400 mt-2 font-mono">
            {metrics ? formatCurrency(metrics.totalCommission) : "—"}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Standard 10.0% marketplace cut</p>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Platform Orders</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 mt-2 font-mono">
            {metrics ? metrics.totalOrders : "—"}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            {metrics ? `${metrics.completedOrders} completed • ${metrics.inTransitOrders} active` : "—"}
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
              <span className="text-xs font-medium text-zinc-200 block">Seller Applications</span>
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

      {/* Secondary Operational Stats Strip */}
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
          <span className="text-[10px] font-mono uppercase text-zinc-500">Cancelled Orders</span>
          <p className="text-lg font-medium text-rose-400 mt-0.5 font-mono">
            {metrics?.cancelledOrders || 0}
          </p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Recent Platform Transactions
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Latest patron purchases and multi-vendor fulfillment states across all studios.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-zinc-400 hover:text-zinc-200 font-mono flex items-center gap-1"
          >
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 border border-zinc-800 rounded bg-zinc-950/40 text-center text-xs text-zinc-500">
            No order records found in the database.
          </div>
        ) : (
          <div className="border border-zinc-800 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Placed Date</th>
                    <th className="py-3 px-4">Patron Details</th>
                    <th className="py-3 px-4">Items / Vendors</th>
                    <th className="py-3 px-4">Order Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-zinc-300">
                        {ord.id.slice(-8).toUpperCase()}
                      </td>

                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                        {formatDateTime(ord.createdAt)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-zinc-200 block">{ord.customerName}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{ord.customerEmail}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-zinc-300">
                          {ord.items.length} line item{ord.items.length > 1 ? "s" : ""}
                        </span>
                        <span className="text-[10px] text-zinc-500 block truncate max-w-xs">
                          {ord.items.map((i) => i.vendorName).filter((v, idx, a) => a.indexOf(v) === idx).join(", ")}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-100 font-medium">
                        {formatCurrency(ord.total)}
                      </td>

                      <td className="py-3 px-4">
                        {getOrderStatusBadge(ord.status)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/admin/orders"
                          className="text-xs text-zinc-400 hover:text-zinc-200 font-mono underline"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

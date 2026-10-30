"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Package,
  Boxes,
  Truck,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { SellerMetrics, SellerOrderLine } from "@/types/seller";
import { Product } from "@/types/marketplace";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function SellerDashboardPage() {
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<SellerOrderLine[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, ordersRes, productsRes] = await Promise.all([
        fetch("/api/seller/metrics"),
        fetch("/api/seller/orders?limit=5"),
        fetch("/api/seller/products?limit=20"),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setRecentOrders(data.orderLines || []);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        const low = (data.products || []).filter(
          (p: Product) => p.stock <= 5
        );
        setLowStockProducts(low);
      }
    } catch {
      // Graceful error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFulfillmentVariant = (status: string): "neutral" | "warning" | "success" | "outline" => {
    switch (status) {
      case "NEW":
        return "neutral";
      case "PROCESSING":
      case "PACKED":
        return "warning";
      case "SHIPPED":
      case "DELIVERED":
        return "success";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Operational Overview
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Studio Performance
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="flex items-center gap-1.5"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button href="/seller/products/new" size="sm" className="flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Piece</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 border border-zinc-800 bg-[#09090b] rounded">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono tracking-wider uppercase text-[10px]">
              Gross Studio Sales
            </span>
            <IndianRupee className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 font-mono">
            {metrics ? formatCurrency(metrics.grossSales) : "₹0"}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Authoritative sales before commission
          </div>
        </div>

        <div className="p-5 border border-zinc-800 bg-[#09090b] rounded">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono tracking-wider uppercase text-[10px]">
              Est. Net Proceeds
            </span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-emerald-400 font-mono">
            {metrics ? formatCurrency(metrics.netProceeds) : "₹0"}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Net of 10% platform commission
          </div>
        </div>

        <div className="p-5 border border-zinc-800 bg-[#09090b] rounded">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono tracking-wider uppercase text-[10px]">
              Orders Received
            </span>
            <Truck className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 font-mono">
            {metrics?.totalOrders || 0}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Distinct multi-vendor orders
          </div>
        </div>

        <div className="p-5 border border-zinc-800 bg-[#09090b] rounded">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono tracking-wider uppercase text-[10px]">
              Low Stock Alert
            </span>
            <AlertTriangle className={`w-4 h-4 ${metrics?.lowStockCount ? "text-amber-400" : "text-zinc-600"}`} />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 font-mono flex items-center gap-2">
            <span>{metrics?.lowStockCount || 0}</span>
            {Boolean(metrics?.lowStockCount) && (
              <span className="text-xs font-sans text-amber-400 font-normal">
                items critical
              </span>
            )}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            <Link href="/seller/inventory" className="underline hover:text-zinc-300">
              Review inventory thresholds →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Split: Recent Orders and Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider text-[11px] font-mono">
              Recent Order Items
            </h2>
            <Link
              href="/seller/orders"
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <span>View all orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="border border-zinc-800 bg-[#09090b] rounded overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No orders received yet. New patron orders will appear here for fulfillment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 font-mono text-[10px] tracking-wider uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Order ID</th>
                      <th className="py-2.5 px-4">Piece Title</th>
                      <th className="py-2.5 px-4">Patron</th>
                      <th className="py-2.5 px-4">Total</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                          {ord.orderId}
                        </td>
                        <td className="py-3 px-4 text-zinc-200 font-medium">
                          {ord.title}
                          {ord.selectedSize && (
                            <span className="text-[10px] text-zinc-500 block">
                              Size: {ord.selectedSize}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {ord.customerName}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-200">
                          {formatCurrency(ord.lineTotal)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getFulfillmentVariant(ord.fulfillmentStatus)}>
                            {ord.fulfillmentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Low Stock Warnings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider text-[11px] font-mono">
              Stock Warnings
            </h2>
            <Link
              href="/seller/inventory"
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <span>Manage stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="border border-zinc-800 bg-[#09090b] rounded p-4 space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                All catalog pieces have healthy stock reserves.
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 border border-zinc-800/80 rounded bg-zinc-950/50"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-medium text-zinc-200 truncate">
                      {p.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Price: {formatCurrency(p.basePrice)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-amber-400 block">
                      {p.stock} left
                    </span>
                    <Link
                      href="/seller/inventory"
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 underline mt-0.5 block"
                    >
                      Restock
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

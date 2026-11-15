"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderStatus } from "@/types/order";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency } from "@/lib/formatters";
import { getStatusBadgeVariant, formatStatusLabel } from "@/lib/order-helpers";

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated) {
      fetchOrders();
    }
  }, [isLoading, isAuthenticated, router, fetchOrders]);

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-xs text-zinc-500 font-mono">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-1 pb-6 border-b border-zinc-200">
        <Link
          href="/account"
          className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 mb-2 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Account Overview</span>
        </Link>
        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block font-medium">
          DISPATCH ARCHIVE
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
          My Studio Orders
        </h1>
        <p className="text-xs text-zinc-600">
          Track production progress, view verified maker provenance, and review dispatch stages.
        </p>
      </div>

      {isFetching ? (
        <div className="py-16 text-center text-xs text-zinc-500 font-mono">
          Loading order history...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center space-y-4 rounded-2xl border border-zinc-200 bg-white shadow-xs p-6">
          <div className="w-14 h-14 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mx-auto">
            <Package className="w-6 h-6 stroke-1" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-950">
              No orders placed yet
            </h3>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              Explore the studio catalog to discover artisan handloomed pieces and precision acoustics.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            href="/catalog"
            className="flex items-center gap-1.5"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="p-4 sm:p-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                      Order Identifier
                    </span>
                    <span className="font-mono font-bold text-zinc-950 text-sm">
                      {order.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                      Placed On
                    </span>
                    <span className="text-zinc-700 font-mono">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                      Total Amount
                    </span>
                    <span className="font-mono font-bold text-zinc-950 text-sm">
                      {formatCurrency(order.totals.total)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={getStatusBadgeVariant(order.status)} size="md">
                    {formatStatusLabel(order.status)}
                  </Badge>

                  <Link
                    href={`/account/orders/${order.id}`}
                    className="py-1.5 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 font-semibold text-xs transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200"
                    >
                      <div className="relative w-14 h-16 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="60px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-zinc-950 truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          {item.vendorName}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-zinc-600">
                          <span>Qty: {item.quantity}</span>
                          <span className="text-zinc-950 font-bold">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-zinc-400" />
                    <span>
                      Shipping to: <strong>{order.shippingAddress.city}</strong> (
                      {order.shippingAddress.pincode})
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">
                    Est. Delivery:{" "}
                    {new Date(order.estimatedDeliveryDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

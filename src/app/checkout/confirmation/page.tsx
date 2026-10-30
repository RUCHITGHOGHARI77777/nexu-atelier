"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  ShieldCheck,
  Truck,
  Building2,
} from "lucide-react";
import { Order } from "@/types/order";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/formatters";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) setOrder(data.order);
      })
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      {/* Confirmation Banner */}
      <div className="p-8 sm:p-12 rounded-3xl border border-zinc-800 bg-zinc-950 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">
            TRANSMISSION VERIFIED • ESCROW ALLOCATED
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Order Successfully Placed
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Your studio commission has been placed into our verified artisan escrow system. We have transmitted the order details directly to the creating maker workshops.
          </p>
        </div>

        {order ? (
          <div className="max-w-md mx-auto p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-left space-y-2 font-mono">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Order Number:</span>
              <span className="font-bold text-white">{order.id}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Customer:</span>
              <span className="text-zinc-200">{order.customerName}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Destination:</span>
              <span className="text-zinc-200">
                {order.shippingAddress.city}, {order.shippingAddress.pincode}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Courier Speed:</span>
              <span className="text-zinc-200">{order.deliveryMethod.name}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 pt-2 border-t border-zinc-800 font-bold text-sm">
              <span>Total Paid:</span>
              <span className="text-white">
                {formatCurrency(order.totals.total)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 font-mono">
            Order Reference: {orderId || "Generated"}
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {order && (
            <Button variant="primary" size="md">
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center gap-2"
              >
                <span>Track Order Timeline</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}

          <Button variant="outline" size="md">
            <Link href="/catalog">Continue Browsing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-xs text-zinc-500 font-mono">
          Loading order status...
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}

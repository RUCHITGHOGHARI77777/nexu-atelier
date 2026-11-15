"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatters";

interface ReturnItem {
  id: string;
  orderId: string;
  type: "RETURN" | "REPLACEMENT";
  status: string;
  quantity: number;
  reason: string;
  explanation?: string;
  photos: string[];
  rejectionReason?: string;
  adminNotes?: string;
  trackingNumber?: string;
  courierName?: string;
  refundAmountPaise?: number;
  createdAt: string;
  order: {
    id: string;
    status: string;
    createdAt: string;
  };
  orderItem: {
    id: string;
    title: string;
    productSlug: string;
    imageSnapshot: string;
    unitPricePaise: number;
    selectedSize?: string;
    selectedColorName?: string;
    vendorName: string;
  };
}

export default function ReturnsHubPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?redirect=/account/returns");
      return;
    }

    if (isAuthenticated) {
      fetch("/api/returns")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.returns)) {
            setReturns(data.returns);
          }
        })
        .catch((err) => console.error("Failed to load returns:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const filteredReturns = returns.filter((r) => {
    if (filter === "ACTIVE") {
      return !["CLOSED", "REFUNDED", "REJECTED"].includes(r.status);
    }
    if (filter === "COMPLETED") {
      return ["CLOSED", "REFUNDED", "REJECTED"].includes(r.status);
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
      case "UNDER_REVIEW":
        return <Badge variant="warning">Under Review</Badge>;
      case "APPROVED":
      case "PICKUP_PENDING":
        return <Badge variant="accent">Pickup Pending</Badge>;
      case "PICKED_UP":
      case "RECEIVED":
        return <Badge variant="accent">Item In Transit / Received</Badge>;
      case "REFUND_PENDING":
        return <Badge variant="warning">Refund Processing</Badge>;
      case "REFUNDED":
        return <Badge variant="success">Refunded</Badge>;
      case "REPLACEMENT_DISPATCHED":
        return <Badge variant="success">Replacement Shipped</Badge>;
      case "REJECTED":
        return <Badge variant="outline">Request Rejected</Badge>;
      case "CLOSED":
      default:
        return <Badge variant="neutral">Closed</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="space-y-1">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Patron Account</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-amber-600" />
            <span>Returns & Replacements</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Track return pickups, quality reviews, refunds, and artisan replacements.
          </p>
        </div>

        <Link href="/account/orders">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            <span>Manage Orders</span>
          </Button>
        </Link>
      </div>

      <div className="flex border-b border-zinc-200 gap-6 text-xs font-medium">
        {(["ALL", "ACTIVE", "COMPLETED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              filter === tab
                ? "border-zinc-950 text-zinc-950 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tab === "ALL" ? `All Requests (${returns.length})` : tab === "ACTIVE" ? "Active" : "Completed"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white border border-zinc-200 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">No return requests found</h3>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">
            Items eligible for return or replacement within 14 days can be initiated from your order details page.
          </p>
          <Link href="/account/orders">
            <Button variant="primary" size="sm">
              View Order History
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-zinc-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-900">
                    ID: {req.id.slice(0, 10).toUpperCase()}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs text-zinc-500 font-mono">
                    Order #{req.orderId}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                    {req.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(req.status)}
                  <Link href={`/account/returns/${req.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-zinc-700 hover:text-zinc-950">
                      <span>Details</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden relative shrink-0">
                  <img
                    src={req.orderItem.imageSnapshot}
                    alt={req.orderItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-sm font-bold text-zinc-950 truncate">
                    {req.orderItem.title}
                  </h4>
                  <p className="text-xs text-zinc-500 font-mono">
                    Studio: {req.orderItem.vendorName} • Qty: {req.quantity}
                    {req.orderItem.selectedSize ? ` • Size: ${req.orderItem.selectedSize}` : ""}
                  </p>
                  <p className="text-xs text-zinc-700">
                    <strong className="font-medium text-zinc-900">Reason:</strong> {req.reason}
                  </p>
                  {req.rejectionReason && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg mt-2">
                      <strong>Rejection reason:</strong> {req.rejectionReason}
                    </p>
                  )}
                  {req.refundAmountPaise && (
                    <p className="text-xs text-emerald-700 font-mono font-bold mt-1">
                      Refund Amount: {formatCurrency(req.refundAmountPaise / 100)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 font-mono">
                <span>Requested on: {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                {req.trackingNumber && (
                  <span className="text-amber-800">
                    Pickup Courier: {req.courierName || "Courier"} (AWB: {req.trackingNumber})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

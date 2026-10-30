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
  ShieldCheck,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  params: {
    id: string;
  };
}

export default function ReturnDetailPage({ params }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [returnReq, setReturnReq] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login?redirect=/account/returns/${params.id}`);
      return;
    }

    if (isAuthenticated) {
      fetch(`/api/returns/${params.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Return request not found or access denied");
          return res.json();
        })
        .then((data) => setReturnReq(data.returnRequest))
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [params.id, isAuthenticated, isAuthLoading, router]);

  const handleCancelReturn = async () => {
    if (!confirm("Are you sure you want to cancel this return request?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/returns/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel return");
      setReturnReq((prev: any) => ({ ...prev, status: "CLOSED", adminNotes: "Cancelled by customer" }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const STAGES = [
    { key: "REQUESTED", label: "Requested" },
    { key: "UNDER_REVIEW", label: "Under Review" },
    { key: "APPROVED", label: "Approved" },
    { key: "PICKUP_PENDING", label: "Pickup Scheduled" },
    { key: "PICKED_UP", label: "Picked Up" },
    { key: "RECEIVED", label: "Received at Studio" },
    { key: "REFUND_PENDING", label: "Processing Settlement" },
    { key: "REFUNDED", label: "Completed" },
  ];

  const getStageIndex = (status: string) => {
    if (status === "REPLACEMENT_DISPATCHED") return 7;
    const idx = STAGES.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-4">
        <div className="h-8 bg-zinc-200 rounded w-48 animate-pulse" />
        <div className="h-64 bg-zinc-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !returnReq) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Alert variant="error" title="Access Error">
          {error || "Could not retrieve return details."}
        </Alert>
        <Link href="/account/returns">
          <Button variant="outline" size="sm">
            Back to Returns Hub
          </Button>
        </Link>
      </div>
    );
  }

  const currentIdx = getStageIndex(returnReq.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="space-y-1">
          <Link
            href="/account/returns"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Return Requests</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
              Return Request #{returnReq.id.slice(0, 8).toUpperCase()}
            </h1>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 font-bold uppercase">
              {returnReq.type}
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Linked to Order #{returnReq.orderId} • Submitted on{" "}
            {new Date(returnReq.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {returnReq.status === "REQUESTED" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelReturn}
            disabled={cancelling}
            className="text-rose-600 border-zinc-200 hover:bg-rose-50"
          >
            {cancelling ? "Cancelling..." : "Cancel Return Request"}
          </Button>
        )}
      </div>

      {/* Lifecycle Progress Bar */}
      {returnReq.status !== "REJECTED" && returnReq.status !== "CLOSED" && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">
            Settlement Lifecycle Progress
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {STAGES.map((st, i) => {
              const isPast = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={st.key} className="flex flex-col items-center text-center space-y-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-amber-600 text-white ring-4 ring-amber-100"
                        : isPast
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {isPast && !isCurrent ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-[10px] leading-tight ${
                      isCurrent ? "font-bold text-zinc-950" : isPast ? "text-zinc-700" : "text-zinc-400"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Item & Return Details */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-zinc-950 pb-3 border-b border-zinc-100">
          Item Information
        </h3>
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
            <img
              src={returnReq.orderItem.imageSnapshot}
              alt={returnReq.orderItem.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-base font-bold text-zinc-950">
              {returnReq.orderItem.title}
            </h4>
            <p className="text-xs text-zinc-500 font-mono">
              Craft Studio: {returnReq.orderItem.vendorName}
              {returnReq.orderItem.selectedSize ? ` • Size: ${returnReq.orderItem.selectedSize}` : ""}
              {returnReq.orderItem.selectedColorName ? ` • Color: ${returnReq.orderItem.selectedColorName}` : ""}
            </p>
            <p className="text-xs font-mono font-bold text-zinc-900 mt-1">
              Unit Price: {formatCurrency(returnReq.orderItem.unitPricePaise / 100)} × {returnReq.quantity} unit(s)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 text-xs">
          <div>
            <span className="text-zinc-400 uppercase font-mono text-[10px] block mb-1">
              Return Reason
            </span>
            <p className="text-zinc-900 font-medium">{returnReq.reason}</p>
          </div>
          {returnReq.explanation && (
            <div>
              <span className="text-zinc-400 uppercase font-mono text-[10px] block mb-1">
                Customer Explanation
              </span>
              <p className="text-zinc-700">{returnReq.explanation}</p>
            </div>
          )}
        </div>

        {/* Courier / Refund Info */}
        {(returnReq.trackingNumber || returnReq.refundAmountPaise) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs">
            {returnReq.trackingNumber && (
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">
                  Pickup Reverse Logistics
                </span>
                <p className="font-mono font-bold text-zinc-900">
                  AWB: {returnReq.trackingNumber} ({returnReq.courierName || "Express Courier"})
                </p>
              </div>
            )}
            {returnReq.refundAmountPaise && (
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">
                  Settlement Refund
                </span>
                <p className="font-mono font-bold text-emerald-700 text-sm">
                  {formatCurrency(returnReq.refundAmountPaise / 100)} credited to source payment
                </p>
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {returnReq.photos && returnReq.photos.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block font-bold">
              Uploaded Evidence
            </span>
            <div className="flex flex-wrap gap-3">
              {returnReq.photos.map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-16 h-16 rounded-lg border border-zinc-200 overflow-hidden relative block hover:opacity-85 transition-opacity"
                >
                  <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

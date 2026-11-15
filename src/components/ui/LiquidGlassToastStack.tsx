"use client";

import React from "react";
import {
  ShoppingBag,
  Heart,
  Smartphone,
  CheckCircle2,
  Package,
  AlertTriangle,
  Info,
  Sparkles,
  X,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useStore, ToastItem } from "@/context/StoreContext";

export function LiquidGlassToastStack() {
  const { toasts, dismissToast } = useStore();

  if (!toasts || toasts.length === 0) return null;

  const getToastIcon = (message: string, type: ToastItem["type"]) => {
    const lower = message.toLowerCase();
    if (message.includes("🛍️") || lower.includes("cart") || lower.includes("bag")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
          <ShoppingBag className="w-4 h-4" />
        </div>
      );
    }
    if (message.includes("❤️") || message.includes("💔") || lower.includes("wishlist")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
          <Heart className="w-4 h-4 fill-rose-500" />
        </div>
      );
    }
    if (message.includes("📱") || lower.includes("upi") || lower.includes("mobile")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Smartphone className="w-4 h-4" />
        </div>
      );
    }
    if (message.includes("✅") || lower.includes("invoice") || lower.includes("utr") || lower.includes("approved")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    }
    if (message.includes("📦") || lower.includes("dispatched") || lower.includes("supplier") || lower.includes("fulfillment")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Package className="w-4 h-4" />
        </div>
      );
    }
    if (lower.includes("manifest") || lower.includes("air cargo")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Truck className="w-4 h-4" />
        </div>
      );
    }
    if (type === "warning" || lower.includes("hold")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    if (message.includes("✨") || lower.includes("product") || lower.includes("live")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200/80 text-violet-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
        <Info className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className="pointer-events-auto group relative rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/95 ring-1 ring-slate-900/10 shadow-[0_15px_40px_rgba(15,23,42,0.08)] p-3.5 sm:p-4 flex items-center justify-between gap-3 text-slate-900 transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in"
        >
          <div className="flex items-center gap-3 min-w-0">
            {getToastIcon(item.message, item.type)}
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-semibold tracking-tight block truncate text-slate-900">
                {item.message}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Just now • System Confirmed
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dismissToast(item.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors shrink-0 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 animate-[shrink_4s_linear_forwards]" />
          </div>
        </div>
      ))}
    </div>
  );
}


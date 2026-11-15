"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

export const ToastNotification: React.FC = () => {
  const { toasts, dismissToast } = useCart();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
        let borderColor = "border-emerald-500/30";

        if (toast.type === "warning") {
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
          borderColor = "border-amber-500/30";
        } else if (toast.type === "info") {
          icon = <Info className="w-4 h-4 text-zinc-400 shrink-0" />;
          borderColor = "border-zinc-700";
        }

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto p-3.5 rounded-xl border ${borderColor} bg-zinc-950/95 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs text-zinc-100 transition-all`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-zinc-500 hover:text-white p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

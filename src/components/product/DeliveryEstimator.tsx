"use client";

import React, { useState } from "react";
import { Truck, MapPin, CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { ServiceabilityResult } from "@/lib/server/shipping/types";

interface Props {
  className?: string;
}

export function DeliveryEstimator({ className = "" }: Props) {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ServiceabilityResult | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setError("Please enter a valid 6-digit postal PIN code.");
      setResult(null);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/shipping/serviceability?pincode=${cleanPin}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Serviceability check failed.");
      }

      setResult(data.serviceability);
    } catch (err: any) {
      setError(err.message || "Failed to check PIN code delivery.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-zinc-600" />
          <span>Delivery & Dispatch Estimation</span>
        </span>
        <span className="text-[10px] font-mono text-zinc-500">Pan-India Courier</span>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit PIN (e.g. 400018)"
            className="w-full bg-white border border-zinc-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading || pincode.length !== 6}
          className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          {loading ? "Checking..." : "Verify"}
        </button>
      </form>

      {error && (
        <p className="text-[11px] text-rose-600 flex items-center gap-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {result && (
        <div className="pt-2 border-t border-zinc-200 space-y-2 text-xs">
          {result.serviceable ? (
            <>
              <div className="flex items-center justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Serviceable: {result.city || "Domestic Hub"}, {result.state || "India"}</span>
                </span>
                <span className="font-mono text-[11px] text-zinc-500">PIN: {result.pincode}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-zinc-200 space-y-1 text-[11px] text-zinc-700">
                <p className="flex items-center gap-1.5 font-semibold text-zinc-900">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Estimated Delivery in {result.estimatedDays} business days</span>
                </p>
                <p className="text-zinc-400 text-[10px]">
                  Dispatched via 3PL Air Express (Bluedart / Delhivery). Complimentary shipping applied on orders exceeding ₹2,500.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono text-zinc-400">
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  {result.codAvailable ? "✓ Cash on Delivery" : "✗ Prepaid Only"}
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  ✓ Provenance Seal Inspection
                </span>
              </div>
            </>
          ) : (
            <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/50 space-y-1 text-[11px] text-rose-300">
              <p className="font-semibold">Standard Courier Coverage Unavailable</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                PIN code {result.pincode} is outside standard express routing. Please reach out to our Concierge Desk via the Contact form to schedule specialized freight delivery.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

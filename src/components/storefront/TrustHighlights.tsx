"use client";

import React from "react";
import { ShieldCheck, Truck, RefreshCw, Scale } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export const TrustHighlights: React.FC = () => {
  const { formatPrice, activeRegion } = useStore();

  const HIGHLIGHTS = [
    {
      icon: ShieldCheck,
      title: "Direct Guild Provenance",
      description: "Sourced directly from verified maker workshops without third-party aggregator markups or predatory commissions.",
    },
    {
      icon: Scale,
      title: "Escrow Payment Model",
      description: "Patron funds are held in secure escrow and disbursed to studios only upon verified doorstep delivery.",
    },
    {
      icon: Truck,
      title: "Complimentary Delivery",
      description: `Zero courier charges on all studio consignments exceeding ${formatPrice(activeRegion.shippingThresholdINR)}.`,
    },
    {
      icon: RefreshCw,
      title: "7-Day Studio Exchange",
      description: "Hassle-free size and tone replacement directly coordinated with the creating artisan or studio.",
    },
  ];

  return (
    <section aria-label="Customer Guarantees and Trust Pillars" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {HIGHLIGHTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl border border-zinc-200/90 ring-1 ring-zinc-950/5 bg-white/95 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                <Icon className="w-5 h-5 text-zinc-900" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-zinc-950 tracking-tight font-sans">
                  {item.title}
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

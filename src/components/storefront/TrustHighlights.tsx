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
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {HIGHLIGHTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/80 backdrop-blur-2xl shadow-[0_8px_30px_rgb(15,23,42,0.04)] hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-slate-900">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-950 tracking-wide uppercase font-mono">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
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

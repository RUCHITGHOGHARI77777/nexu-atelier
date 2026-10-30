import React from "react";
import { ShieldCheck, Truck, RefreshCw, Scale } from "lucide-react";

export const TrustHighlights: React.FC = () => {
  const HIGHLIGHTS = [
    {
      icon: ShieldCheck,
      title: "Direct Guild Provenance",
      description: "Sourced directly from verified maker workshops without third-party aggregator markups.",
    },
    {
      icon: Scale,
      title: "Escrow Payment Model",
      description: "Patron funds are held in secure escrow and disbursed to studios only upon verified doorstep delivery.",
    },
    {
      icon: Truck,
      title: "Complimentary Delivery",
      description: "Zero courier charges across India on all studio orders exceeding ₹2,500.",
    },
    {
      icon: RefreshCw,
      title: "7-Day Studio Exchange",
      description: "Hassle-free size and tone replacement directly coordinated with the creating artisan.",
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {HIGHLIGHTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 shadow-xs hover:shadow-sm transition-all space-y-3"
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-950 tracking-wide">
                  {item.title}
                </h4>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
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

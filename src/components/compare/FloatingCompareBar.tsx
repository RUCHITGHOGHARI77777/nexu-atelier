"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X, Scale, Trash2 } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency } from "@/lib/formatters";

export function FloatingCompareBar() {
  const pathname = usePathname();
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();

  if (pathname === "/compare" || compareProducts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-40 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 shadow-2xl space-y-3">
      <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Product Comparison ({compareProducts.length}/4)</span>
        </span>
        <button
          onClick={clearCompare}
          className="text-[11px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear all</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {compareProducts.map((p) => (
            <div
              key={p.id}
              className="relative group w-12 h-14 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0"
            >
              <ImageWithFallback
                src={p.images[0]}
                alt={p.title}
                fill
                sizes="50px"
                className="object-cover"
              />
              <button
                onClick={() => removeFromCompare(p.id)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] transition-colors"
                title="Remove"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {Array.from({ length: 4 - compareProducts.length }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-14 rounded-lg border border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 text-[10px] shrink-0 font-mono"
            >
              +
            </div>
          ))}
        </div>

        <Link
          href="/compare"
          className="px-4 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span>Compare Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

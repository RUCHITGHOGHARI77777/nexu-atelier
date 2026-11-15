"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Trash2, ArrowRight } from "lucide-react";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";

interface RecentlyViewedProps {
  currentProductId?: string;
  limit?: number;
}

export function RecentlyViewed({ currentProductId, limit = 4 }: RecentlyViewedProps) {
  const { recentlyViewed, clearHistory } = useRecentlyViewed();

  const items = recentlyViewed
    .filter((item) => !currentProductId || item.id !== currentProductId)
    .slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section className="pt-14 pb-4 border-t border-zinc-200" aria-label="Recently Viewed Products">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-mono tracking-widest uppercase text-zinc-950 font-semibold">
            Recently Viewed Atelier Pieces
          </h3>
        </div>
        <button
          onClick={clearHistory}
          className="text-[11px] font-mono text-zinc-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          title="Clear browsing trail"
        >
          <Trash2 className="w-3 h-3" /> Clear History
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((prod) => (
          <Link
            key={prod.id}
            href={`/product/${prod.slug}`}
            className="group block rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-xs hover:shadow-md p-3 transition-all"
          >
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-100 mb-3 border border-zinc-100">
              <Image
                src={prod.image}
                alt={prod.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono tracking-wider uppercase text-amber-700 font-medium truncate">
                {prod.category}
              </p>
              <h4 className="text-xs sm:text-sm font-semibold text-zinc-950 group-hover:text-amber-700 transition-colors line-clamp-1">
                {prod.title}
              </h4>
              <p className="text-xs font-mono text-zinc-900 font-bold">
                ₹{(prod.pricePaise / 100).toLocaleString("en-IN")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

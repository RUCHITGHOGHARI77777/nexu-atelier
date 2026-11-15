"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SearchX, RotateCcw, ArrowRight, ChevronDown } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCardSaaS } from "./ProductCardSaaS";

interface ProductGridSaaSProps {
  initialLimit?: number;
}

export function ProductGridSaaS({ initialLimit = 8 }: ProductGridSaaSProps) {
  const { filteredProducts, setSearchQuery, setSelectedCategory, setPriceRange, setMinRating } = useStore();
  const [visibleCount, setVisibleCount] = useState(initialLimit);

  useEffect(() => {
    setVisibleCount(initialLimit);
  }, [filteredProducts.length, initialLimit]);

  if (filteredProducts.length === 0) {
    return (
      <div className="py-20 px-4 text-center rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <SearchX className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-950">No Matching Pieces Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Try adjusting your search keywords, raising your price ceiling, or resetting category filters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setSelectedCategory("All");
            setPriceRange([1000, 150000]);
            setMinRating(0);
          }}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      </div>
    );
  }

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const remainingCount = filteredProducts.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 8, filteredProducts.length));
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedProducts.map((product) => (
          <ProductCardSaaS key={product.id} product={product} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-200">
        <p className="text-xs font-mono text-zinc-500">
          Showing <strong className="text-zinc-900">{displayedProducts.length}</strong> of{" "}
          <strong className="text-zinc-900">{filteredProducts.length}</strong> curated studio pieces
        </p>

        <div className="flex items-center gap-3">
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 text-xs font-semibold inline-flex items-center gap-2 shadow-2xs transition-all active:scale-98 cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              <span>Load More Pieces (+{Math.min(8, remainingCount)})</span>
            </button>
          )}

          <Link
            href="/catalog"
            className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-all active:scale-98"
          >
            <span>Explore Complete Catalog ({filteredProducts.length})</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}

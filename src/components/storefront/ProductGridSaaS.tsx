"use client";

import React from "react";
import { SearchX, RotateCcw } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCardSaaS } from "./ProductCardSaaS";

export function ProductGridSaaS() {
  const { filteredProducts, setSearchQuery, setSelectedCategory, setPriceRange, setMinRating } = useStore();

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProducts.map((product) => (
        <ProductCardSaaS key={product.id} product={product} />
      ))}
    </div>
  );
}


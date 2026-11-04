"use client";

import React, { useState } from "react";
import {
  Filter,
  SlidersHorizontal,
  Star,
  ArrowUpDown,
  RotateCcw,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";

export function StorefrontFilterBar() {
  const {
    products,
    filteredProducts,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    minRating,
    setMinRating,
    searchQuery,
    setSearchQuery,
    formatPrice,
    activeRegion,
  } = useStore();

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const categories = [
    { name: "All", label: "All Pieces" },
    { name: "Electronics", label: "Electronics" },
    { name: "Fashion & Apparel", label: "Fashion & Apparel" },
    { name: "Home & Kitchen", label: "Home & Kitchen" },
    { name: "B2B Wholesale Packs", label: "B2B Wholesale" },
  ];

  // Calculate count per category
  const getCategoryCount = (catName: string) => {
    if (catName === "All") return products.length;
    return products.filter((p) => p.category === catName).length;
  };

  const hasActiveFilters =
    selectedCategory !== "All" ||
    searchQuery.trim() !== "" ||
    priceRange[0] > 1000 ||
    priceRange[1] < 150000 ||
    minRating > 0;

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    setPriceRange([1000, 150000]);
    setMinRating(0);
    setSortBy("featured");
  };

  return (
    <div className="space-y-4">
      {/* Category Pills Strip */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2">
          {categories.map((cat) => {
            const count = getCategoryCount(cat.name);
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-white text-[#171717] border-2 border-[#171717] shadow-xs font-bold"
                    : "bg-white hover:bg-[#FAFAF8] text-[#626262] hover:text-[#171717] border border-[#E8E8E4] shadow-2xs"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? "bg-[#F8F2E6] text-[#B78B45] font-bold" : "bg-[#FAFAF8] text-[#767676]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Toggle Button for Advanced Controls */}
        <button
          type="button"
          onClick={() => setIsFilterPanelOpen((prev) => !prev)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-2 border transition-all cursor-pointer ${
            isFilterPanelOpen || hasActiveFilters
              ? "bg-white text-[#171717] border-2 border-[#171717] shadow-xs font-bold"
              : "bg-white hover:bg-[#FAFAF8] text-[#626262] border border-[#E8E8E4] shadow-2xs"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters & Range</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* Expandable Advanced Filter Drawer/Bar */}
      {isFilterPanelOpen && (
        <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Refine Product Catalogue</span>
            </h4>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Price Range Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Price Ceiling:</span>
                <span className="font-mono font-bold text-slate-950">
                  Up to {formatPrice(priceRange[1])}
                </span>
              </div>
              <input
                type="range"
                min={2000}
                max={150000}
                step={2000}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
                className="w-full accent-slate-950 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{formatPrice(1000)}</span>
                <span>{formatPrice(50000)}</span>
                <span>{formatPrice(150000)}</span>
              </div>
            </div>

            {/* 2. Rating Threshold */}
            <div className="space-y-2">
              <span className="font-semibold text-xs text-slate-700 block">Customer Rating:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMinRating(0)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    minRating === 0
                      ? "bg-[#FAFAF8] text-[#171717] font-bold border border-[#E8E8E4] shadow-xs"
                      : "bg-white text-[#626262] border border-[#E8E8E4] hover:bg-[#FAFAF8]"
                  }`}
                >
                  All Ratings
                </button>
                <button
                  type="button"
                  onClick={() => setMinRating(4.8)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    minRating >= 4.8
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>4.8★ & Above</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMinRating(4.9)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    minRating >= 4.9
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>4.9★ Top Rated</span>
                </button>
              </div>
            </div>

            {/* 3. Sort Order */}
            <div className="space-y-2">
              <span className="font-semibold text-xs text-slate-700 block">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="featured">Featured First (Editorial Pick)</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Customer Rating</option>
                <option value="discount">Biggest Savings Percentage</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Header Strip */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-950 font-mono">{filteredProducts.length}</strong> of{" "}
            <span className="font-mono">{products.length}</span> verified pieces
          </span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]">
              Query: &quot;{searchQuery}&quot;
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden sm:inline">Sort:</span>
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] font-mono">
            {sortBy.replace("-", " ")}
          </span>
        </div>
      </div>
    </div>
  );
}


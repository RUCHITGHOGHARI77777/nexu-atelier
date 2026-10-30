"use client";

import React from "react";
import { Filter, ArrowUpDown } from "lucide-react";
import { SortOption } from "@/types/marketplace";

export interface CatalogSortBarProps {
  totalCount: number;
  filteredCount: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenMobileFilters: () => void;
}

export const CatalogSortBar: React.FC<CatalogSortBarProps> = ({
  totalCount,
  filteredCount,
  sortBy,
  onSortChange,
  onOpenMobileFilters,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-4 py-3 border-b border-zinc-200 text-xs">
      {/* Result count */}
      <div className="text-zinc-600 font-mono">
        Showing <strong className="text-zinc-950">{filteredCount}</strong> of{" "}
        {totalCount} pieces
      </div>

      <div className="flex items-center gap-3">
        {/* Mobile filter button */}
        <button
          onClick={onOpenMobileFilters}
          className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 hover:bg-zinc-200 transition-colors cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>

        {/* Sort select */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-white text-zinc-900 text-xs px-3 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900 shadow-xs font-medium cursor-pointer"
            aria-label="Sort products"
          >
            <option value="featured">Featured & Curated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Patron Rating (4.8+ ★)</option>
            <option value="newest">Newest Studio Releases</option>
          </select>
        </div>
      </div>
    </div>
  );
};

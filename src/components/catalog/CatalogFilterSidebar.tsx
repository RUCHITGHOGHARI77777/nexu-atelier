"use client";

import React from "react";
import { FilterState, ProductCategory } from "@/types/marketplace";
import { SEED_PRODUCTS, SEED_VENDORS } from "@/data/seedCatalog";
import { X, RotateCcw } from "lucide-react";

export interface CatalogFilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  isMobileModal?: boolean;
  onCloseMobile?: () => void;
}

const CATEGORIES: (ProductCategory | "All")[] = [
  "All",
  "Apparel",
  "Audio & Tech",
  "Footwear",
  "Objects & Living",
  "Accessories",
];

export const CatalogFilterSidebar: React.FC<CatalogFilterSidebarProps> = ({
  filters,
  onFilterChange,
  onReset,
  isMobileModal = false,
  onCloseMobile,
}) => {
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    if (cat === "All") {
      acc[cat] = SEED_PRODUCTS.length;
    } else {
      acc[cat] = SEED_PRODUCTS.filter((p) => p.category === cat).length;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 text-xs text-zinc-700">
      {/* Header if mobile */}
      {isMobileModal && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <span className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
            Filter Catalog
          </span>
          <button
            onClick={onCloseMobile}
            className="p-1 text-zinc-500 hover:text-zinc-950 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Categories Filter */}
      <div className="space-y-2.5">
        <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
          Collections
        </h4>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat;
            return (
              <button
                key={cat}
                onClick={() => onFilterChange({ category: cat })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 text-white font-semibold shadow-xs"
                    : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100"
                }`}
              >
                <span>{cat}</span>
                <span className={`font-mono text-[10px] ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-2.5 pt-4 border-t border-zinc-200">
        <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
          Price Range (INR)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Min (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice !== undefined ? filters.minPrice : ""}
              onChange={(e) =>
                onFilterChange({
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full bg-zinc-50 text-zinc-900 px-2.5 py-1.5 rounded-md border border-zinc-300 text-xs font-mono focus:bg-white focus:outline-none focus:border-zinc-900"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Max (₹)</label>
            <input
              type="number"
              placeholder="10000"
              value={filters.maxPrice !== undefined ? filters.maxPrice : ""}
              onChange={(e) =>
                onFilterChange({
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full bg-zinc-50 text-zinc-900 px-2.5 py-1.5 rounded-md border border-zinc-300 text-xs font-mono focus:bg-white focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>
      </div>

      {/* Availability Filter */}
      <div className="space-y-2.5 pt-4 border-t border-zinc-200">
        <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
          Stock Status
        </h4>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300 bg-white text-zinc-900 focus:ring-0 cursor-pointer"
          />
          <span className="text-zinc-800 font-medium">Ready to Ship (In Stock Only)</span>
        </label>
      </div>

      {/* Maker Studio Filter */}
      <div className="space-y-2.5 pt-4 border-t border-zinc-200">
        <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
          Independent Studio
        </h4>
        <select
          value={filters.vendorId || ""}
          onChange={(e) =>
            onFilterChange({ vendorId: e.target.value || undefined })
          }
          className="w-full bg-zinc-50 text-zinc-900 px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:bg-white focus:outline-none focus:border-zinc-900 cursor-pointer font-medium"
        >
          <option value="">All Verified Studios</option>
          {Object.values(SEED_VENDORS).map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.location.split("&")[0].trim()})
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Action */}
      <div className="pt-4 border-t border-zinc-200">
        <button
          onClick={() => {
            onReset();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      </div>
    </div>
  );
};

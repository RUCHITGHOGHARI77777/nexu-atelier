"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types/marketplace";
import { ProductCard } from "@/components/storefront/ProductCard";
import { PackageSearch, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CatalogGridProps {
  products: Product[];
  onResetFilters: () => void;
  itemsPerPage?: number;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({
  products,
  onResetFilters,
  itemsPerPage = 12,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="w-full py-24 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center justify-center text-center p-6 space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500">
          <PackageSearch className="w-6 h-6 stroke-1" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-zinc-950">
            No matching pieces found
          </h3>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
            No pieces in our curated catalog match your current filter parameters. Try broadening your price range or clearing category filters.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="flex items-center gap-1.5 border-zinc-300 text-zinc-800 hover:bg-zinc-100 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </Button>
      </div>
    );
  }

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-200 text-xs">
          <div className="text-zinc-600 font-mono">
            Showing <span className="text-zinc-950 font-bold">{startIndex + 1}</span>–
            <span className="text-zinc-950 font-bold">{Math.min(startIndex + itemsPerPage, products.length)}</span> of{" "}
            <span className="text-zinc-950 font-bold">{products.length}</span> pieces
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer font-medium"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNumber = idx + 1;
                const isCurrent = pageNumber === currentPage;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`w-8 h-8 rounded-lg font-mono text-xs transition-colors flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? "bg-zinc-900 text-white font-bold shadow-sm"
                        : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 font-medium"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer font-medium"
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

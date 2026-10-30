"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FilterState, ProductCategory, SortOption, Product } from "@/types/marketplace";
import { filterCatalog } from "@/lib/catalog-filters";
import { CatalogFilterSidebar } from "@/components/catalog/CatalogFilterSidebar";
import { CatalogSortBar } from "@/components/catalog/CatalogSortBar";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { Skeleton } from "@/components/ui/Skeleton";

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize filters from URL query parameters
  const initialCategory = (searchParams.get("category") as ProductCategory) || "All";
  const initialQuery = searchParams.get("q") || "";
  const initialSort = (searchParams.get("sort") as SortOption) || "featured";

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: initialQuery,
    category: initialCategory,
    inStockOnly: false,
    sortBy: initialSort,
    minPrice: undefined,
    maxPrice: undefined,
    vendorId: undefined,
  });

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Live Database Products State
  const [dbProducts, setDbProducts] = useState<Product[] | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Sync state if query params change externally
  useEffect(() => {
    const cat = (searchParams.get("category") as ProductCategory) || "All";
    const q = searchParams.get("q") || "";
    const s = (searchParams.get("sort") as SortOption) || "featured";
    setFilters((prev) => ({
      ...prev,
      category: cat,
      searchQuery: q,
      sortBy: s,
    }));
  }, [searchParams]);

  // Fetch real approved products from PostgreSQL
  useEffect(() => {
    let active = true;
    async function fetchCatalog() {
      setIsFetching(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.category && filters.category !== "All") {
          queryParams.set("category", filters.category);
        }
        if (filters.searchQuery && filters.searchQuery.trim()) {
          queryParams.set("q", filters.searchQuery.trim());
        }
        if (filters.inStockOnly) {
          queryParams.set("inStock", "true");
        }
        if (filters.minPrice !== undefined) {
          queryParams.set("minPrice", filters.minPrice.toString());
        }
        if (filters.maxPrice !== undefined) {
          queryParams.set("maxPrice", filters.maxPrice.toString());
        }
        if (filters.vendorId) {
          queryParams.set("vendor", filters.vendorId);
        }
        if (filters.sortBy) {
          queryParams.set("sort", filters.sortBy);
        }
        queryParams.set("limit", "100");

        const endpoint = filters.searchQuery ? "/api/search" : "/api/products";
        const res = await fetch(`${endpoint}?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.products)) {
            setDbProducts(data.products);
          }
        }
      } catch (err) {
        console.error("Failed to query live catalog:", err);
      } finally {
        if (active) setIsFetching(false);
      }
    }

    fetchCatalog();
    return () => {
      active = false;
    };
  }, [filters]);

  // Live database products strictly loaded from PostgreSQL API
  const filteredProducts = useMemo(() => {
    return dbProducts || [];
  }, [dbProducts]);

  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...partial };
      // Sync category to URL if changed
      if (partial.category !== undefined) {
        if (partial.category === "All") {
          router.replace("/catalog");
        } else {
          router.replace(`/catalog?category=${encodeURIComponent(partial.category)}`);
        }
      }
      return updated;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      category: "All",
      inStockOnly: false,
      sortBy: "featured",
      minPrice: undefined,
      maxPrice: undefined,
      vendorId: undefined,
    });
    router.replace("/catalog");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2 pb-6 border-b border-zinc-200">
        <span className="text-[11px] font-mono text-amber-700 uppercase tracking-widest block font-semibold">
          CURATED CATALOG
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
          {filters.category === "All"
            ? "Complete Studio Archive"
            : `${filters.category} Collection`}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 max-w-xl">
          Discover verified multi-vendor craft pieces across independent Indian studios and industrial design workshops.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 p-6 rounded-2xl border border-zinc-200 bg-white sticky top-24 shadow-sm">
          <CatalogFilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Main Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          <CatalogSortBar
            totalCount={filteredProducts.length}
            filteredCount={filteredProducts.length}
            sortBy={filters.sortBy}
            onSortChange={(sort) => handleFilterChange({ sortBy: sort })}
            onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
          />

          <CatalogGrid
            products={filteredProducts}
            onResetFilters={handleResetFilters}
          />
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setIsMobileFiltersOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute top-0 bottom-0 right-0 w-4/5 max-w-sm bg-white border-l border-zinc-200 p-6 overflow-y-auto shadow-2xl">
            <CatalogFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              isMobileModal={true}
              onCloseMobile={() => setIsMobileFiltersOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Skeleton className="h-96 rounded-xl hidden lg:block" />
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogContent />
    </Suspense>
  );
}

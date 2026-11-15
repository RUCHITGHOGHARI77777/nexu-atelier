"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FilterState, ProductCategory, SortOption, Product } from "@/types/marketplace";
import { CatalogFilterSidebar, CategoryOption } from "@/components/catalog/CatalogFilterSidebar";
import { CatalogSortBar } from "@/components/catalog/CatalogSortBar";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

const catalogProductsCache = new Map<string, Product[]>();
let catalogCategoriesCache: CategoryOption[] | null = null;

function buildQueryCacheKey(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "All") params.set("category", filters.category);
  if (filters.searchQuery?.trim()) params.set("q", filters.searchQuery.trim());
  if (filters.inStockOnly) params.set("inStock", "true");
  if (filters.minPrice !== undefined) params.set("minPrice", filters.minPrice.toString());
  if (filters.maxPrice !== undefined) params.set("maxPrice", filters.maxPrice.toString());
  if (filters.vendorId) params.set("vendor", filters.vendorId);
  if (filters.sortBy) params.set("sort", filters.sortBy);
  return params.toString();
}

export function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialCategory = (searchParams.get("category") as ProductCategory) || "All";
  const initialQuery = searchParams.get("q") || searchParams.get("search") || "";
  const initialSort = (searchParams.get("sort") as SortOption) || "featured";
  const initialInStock = searchParams.get("inStock") === "true";
  const initialMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const initialMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const initialVendor = searchParams.get("vendor") || undefined;

  const [filters, setFilters] = useState<FilterState>(() => ({
    searchQuery: initialQuery,
    category: initialCategory,
    inStockOnly: initialInStock,
    sortBy: initialSort,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    vendorId: initialVendor,
  }));

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState<CategoryOption[]>(
    () => catalogCategoriesCache || []
  );

  const initialCacheKey = useMemo(() => buildQueryCacheKey(filters), []);
  const [dbProducts, setDbProducts] = useState<Product[] | null>(() => {
    return catalogProductsCache.get(initialCacheKey) || null;
  });
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const cat = (searchParams.get("category") as ProductCategory) || "All";
    const q = searchParams.get("q") || searchParams.get("search") || "";
    const s = (searchParams.get("sort") as SortOption) || "featured";
    const inStock = searchParams.get("inStock") === "true";
    const minP = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxP = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const vId = searchParams.get("vendor") || undefined;

    setFilters({
      searchQuery: q,
      category: cat,
      inStockOnly: inStock,
      sortBy: s,
      minPrice: minP,
      maxPrice: maxP,
      vendorId: vId,
    });
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      if (catalogCategoriesCache && catalogCategoriesCache.length > 0) {
        setCategoriesList(catalogCategoriesCache);
        return;
      }
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.categories)) {
            const mapped: CategoryOption[] = data.categories.map((c: any) => ({
              name: c.name,
              slug: c.slug,
              count: c._count?.products ?? undefined,
            }));
            catalogCategoriesCache = mapped;
            setCategoriesList(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const cacheKey = buildQueryCacheKey(filters);

    if (catalogProductsCache.has(cacheKey)) {
      setDbProducts(catalogProductsCache.get(cacheKey)!);
    }

    const abortController = new AbortController();

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
        queryParams.set("limit", "48");

        const endpoint = filters.searchQuery ? "/api/search" : "/api/products";
        const res = await fetch(`${endpoint}?${queryParams.toString()}`, {
          signal: abortController.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.products)) {
            catalogProductsCache.set(cacheKey, data.products);
            setDbProducts(data.products);
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Failed to query live catalog:", err);
        }
      } finally {
        if (active) setIsFetching(false);
      }
    }

    fetchCatalog();
    return () => {
      active = false;
      abortController.abort();
    };
  }, [filters]);

  const filteredProducts = useMemo(() => {
    return dbProducts || [];
  }, [dbProducts]);

  const handleFilterChange = (partial: Partial<FilterState>) => {
    const updated = { ...filters, ...partial };
    setFilters(updated);

    const params = new URLSearchParams();
    if (updated.category && updated.category !== "All") {
      params.set("category", updated.category);
    }
    if (updated.searchQuery && updated.searchQuery.trim()) {
      params.set("q", updated.searchQuery.trim());
    }
    if (updated.sortBy && updated.sortBy !== "featured") {
      params.set("sort", updated.sortBy);
    }
    if (updated.inStockOnly) {
      params.set("inStock", "true");
    }
    if (updated.minPrice !== undefined) {
      params.set("minPrice", updated.minPrice.toString());
    }
    if (updated.maxPrice !== undefined) {
      params.set("maxPrice", updated.maxPrice.toString());
    }
    if (updated.vendorId) {
      params.set("vendor", updated.vendorId);
    }

    const targetBase = pathname.startsWith("/catalog") ? "/catalog" : "/shop";
    const queryString = params.toString();
    const targetUrl = queryString ? `${targetBase}?${queryString}` : targetBase;

    router.replace(targetUrl, { scroll: false });
  };

  const handleResetFilters = () => {
    const resetState: FilterState = {
      searchQuery: "",
      category: "All",
      inStockOnly: false,
      sortBy: "featured",
      minPrice: undefined,
      maxPrice: undefined,
      vendorId: undefined,
    };
    setFilters(resetState);
    const targetBase = pathname.startsWith("/catalog") ? "/catalog" : "/shop";
    router.replace(targetBase, { scroll: false });
  };

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
    { label: "Catalog", href: "/shop" },
  ];
  if (filters.category && filters.category !== "All") {
    breadcrumbItems.push({ label: filters.category });
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Breadcrumbs customItems={breadcrumbItems} />

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
          Discover verified multi-vendor craft pieces across independent Indian studios, premium consumer electronics, and industrial design workshops.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="hidden lg:block lg:col-span-1 p-6 rounded-2xl border border-zinc-200 bg-white sticky top-24 shadow-sm">
          <CatalogFilterSidebar
            filters={filters}
            categories={categoriesList}
            totalProductCount={filteredProducts.length}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </aside>

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

      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setIsMobileFiltersOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute top-0 bottom-0 right-0 w-4/5 max-w-sm bg-white border-l border-zinc-200 p-6 overflow-y-auto shadow-2xl">
            <CatalogFilterSidebar
              filters={filters}
              categories={categoriesList}
              totalProductCount={filteredProducts.length}
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

export function CatalogFallback() {
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

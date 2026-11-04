"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Filter, RefreshCw, X, ArrowUpDown, Sparkles, AlertCircle } from "lucide-react";
import { Product } from "@/types/marketplace";
import { ProductCard } from "@/components/storefront/ProductCard";

interface SearchFacet {
  categoryCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  priceRanges: {
    under2500: number;
    under5000: number;
    under10000: number;
    above10000: number;
  };
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSort = searchParams.get("sort") || "relevance";

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSort, setActiveSort] = useState(initialSort);
  const [products, setProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<SearchFacet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Sync state if URL query params change
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchTerm(q);
    setActiveCategory(searchParams.get("category") || "");
    setActiveSort(searchParams.get("sort") || "relevance");
  }, [searchParams]);

  // Execute search query
  useEffect(() => {
    async function runSearch() {
      const q = searchTerm.trim();
      setIsLoading(true);
      setHasSearched(true);

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (activeCategory) params.set("category", activeCategory);
      if (activeSort) params.set("sort", activeSort);
      params.set("limit", "24");

      try {
        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products)) {
            setProducts(data.products);
          } else {
            setProducts([]);
          }
          if (data.facets) {
            setFacets(data.facets);
          }
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    runSearch();
  }, [searchTerm, activeCategory, activeSort]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    const url = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
    router.push(url);
  };

  const handleCategoryFilter = (cat: string) => {
    const next = activeCategory === cat ? "" : cat;
    setActiveCategory(next);
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (next) params.set("category", next);
    if (activeSort && activeSort !== "relevance") params.set("sort", activeSort);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 py-8 sm:py-12 text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search Header Form */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <span className="text-[11px] font-mono text-amber-700 uppercase tracking-widest font-semibold block">
              SEARCH & PRODUCT DISCOVERY
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              Discover Verified Atelier Creations
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600">
              Query through master weaver silks, acoustic laboratory pieces, brass castings, and leather carry goods.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by piece title, artisan guild, material (e.g. silk, brass, acoustic)..."
              className="w-full bg-zinc-50 hover:bg-white focus:bg-white text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 rounded-2xl border border-zinc-200 hover:border-zinc-300 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 pl-11 pr-28 py-3.5 transition-all shadow-xs"
            />
            <button
              type="submit"
              className="absolute right-2 px-5 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Suggested quick keywords */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
            <span className="text-[11px] font-mono">Popular:</span>
            {["Silk Saree", "Acoustic", "Brass", "Leather Derby", "Hoodie", "Kolhapuri"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSearchTerm(term);
                  router.push(`/search?q=${encodeURIComponent(term)}`);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 transition-colors cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-900">
              {isLoading ? (
                <span className="flex items-center gap-2 text-zinc-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Searching atelier archives...
                </span>
              ) : (
                <>
                  <span>{products.length} {products.length === 1 ? "piece" : "pieces"} found</span>
                  {searchTerm.trim() && (
                    <span className="text-zinc-500">
                      for &ldquo;<strong className="text-zinc-950 font-bold">{searchTerm.trim()}</strong>&rdquo;
                    </span>
                  )}
                  {activeCategory && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Category: {activeCategory}
                      <button
                        onClick={() => handleCategoryFilter(activeCategory)}
                        className="cursor-pointer ml-1 hover:text-amber-950"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </>
              )}
            </span>
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="font-mono text-[11px] text-zinc-600 font-medium">Sort by:</span>
            <select
              value={activeSort}
              onChange={(e) => {
                setActiveSort(e.target.value);
                const params = new URLSearchParams(searchParams.toString());
                params.set("sort", e.target.value);
                router.push(`/search?${params.toString()}`);
              }}
              className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Additions</option>
            </select>
          </div>
        </div>

        {/* Facet Chips (Categories) */}
        {facets?.categoryCounts && Object.keys(facets.categoryCounts).length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-[11px] font-mono text-zinc-600 font-semibold uppercase tracking-wider shrink-0">
              Disciplines:
            </span>
            {Object.entries(facets.categoryCounts).map(([catName, count]) => {
              const isSelected = activeCategory.toLowerCase() === catName.toLowerCase();
              return (
                <button
                  key={catName}
                  onClick={() => handleCategoryFilter(catName)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-white text-[#171717] border-2 border-[#171717] shadow-xs font-bold"
                      : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {catName} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Product Cards Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : !isLoading && hasSearched ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-500">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-950">
              No matching atelier pieces located
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              We couldn&apos;t find any pieces matching &ldquo;{searchTerm}&rdquo;. Try browsing our discipline collections or clearing active filters.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/catalog"
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-semibold transition-colors shadow-xs"
              >
                Browse All Pieces
              </Link>
              <Link
                href="/categories"
                className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition-colors"
              >
                Explore Disciplines
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

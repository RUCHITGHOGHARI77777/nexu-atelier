"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Archive,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Boxes,
} from "lucide-react";
import { Product } from "@/types/marketplace";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isArchivingId, setIsArchivingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/seller/products?limit=100");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load studio catalog.");
      }
    } catch {
      setActionError("Network error while connecting to atelier catalog.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleArchive = async (productId: string, title: string) => {
    if (!confirm(`Are you sure you wish to archive "${title}"? Archived pieces will no longer appear on the customer storefront.`)) {
      return;
    }

    setIsArchivingId(productId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setActionSuccess(`"${title}" has been archived successfully.`);
        fetchProducts();
      } else {
        const err = await res.json();
        setActionError(err.error || "Unable to archive product.");
      }
    } catch {
      setActionError("Failed to archive product due to connection error.");
    } finally {
      setIsArchivingId(null);
    }
  };

  // Derive categories from products
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();

    let matchesStock = true;
    if (stockFilter === "IN_STOCK") matchesStock = p.stock > 5;
    if (stockFilter === "LOW_STOCK") matchesStock = p.stock > 0 && p.stock <= 5;
    if (stockFilter === "OUT_OF_STOCK") matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const activeCount = products.filter((p) => p.stock > 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Artisan Catalog Management
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Studio Pieces & Collections
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage product listings, SKU variants, pricing, and storefront publication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/seller/products/new">
            <Button size="sm" className="flex items-center gap-1.5 bg-zinc-100 text-zinc-900 hover:bg-white">
              <Plus className="w-4 h-4" />
              New Piece
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Total Creations</span>
          <p className="text-xl font-medium text-zinc-100 mt-1">{products.length}</p>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">In Stock</span>
          <p className="text-xl font-medium text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Low Stock Alert</span>
          <p className="text-xl font-medium text-amber-400 mt-1">{lowStockCount}</p>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Depleted / Out</span>
          <p className="text-xl font-medium text-rose-400 mt-1">{outOfStockCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search pieces by title or collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Status:
            </span>
            <button
              onClick={() => setStockFilter("ALL")}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                stockFilter === "ALL"
                  ? "bg-zinc-200 text-zinc-950 font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter("IN_STOCK")}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                stockFilter === "IN_STOCK"
                  ? "bg-zinc-200 text-zinc-950 font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStockFilter("LOW_STOCK")}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                stockFilter === "LOW_STOCK"
                  ? "bg-amber-400 text-zinc-950 font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              Low Stock (≤5)
            </button>
            <button
              onClick={() => setStockFilter("OUT_OF_STOCK")}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                stockFilter === "OUT_OF_STOCK"
                  ? "bg-rose-400 text-zinc-950 font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Categories Strip */}
        {categories.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-zinc-800/60">
            <span className="text-[10px] font-mono uppercase text-zinc-500 shrink-0">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-0.5 text-[11px] rounded-full transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-zinc-100 text-zinc-900 font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product List Table / Empty State */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading atelier creations...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-800/50 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">No pieces found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "All" || stockFilter !== "ALL"
                ? "No products matched your search or filters. Try adjusting your query."
                : "You haven't listed any creations in your atelier yet. Start by crafting your first catalog entry."}
            </p>
          </div>
          <Link href="/seller/products/new">
            <Button size="sm" className="mt-2 bg-zinc-100 text-zinc-900 hover:bg-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Craft New Piece
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">Creation</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Pricing</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Variants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {filteredProducts.map((p) => {
                  const hasColors = p.availableColors && p.availableColors.length > 0;
                  const hasSizes = p.availableSizes && p.availableSizes.length > 0;
                  const totalVariants = (p.availableColors?.length || 0) + (p.availableSizes?.length || 0);

                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 bg-zinc-900 rounded overflow-hidden relative shrink-0 border border-zinc-800">
                            <ImageWithFallback
                              src={p.images?.[0] || ""}
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-medium text-zinc-200 block text-sm">
                              {p.title}
                            </span>
                            <span className="text-[11px] text-zinc-500 line-clamp-1">
                              {p.subtitle}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-zinc-400 font-mono text-[11px] bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-zinc-200 font-medium">
                          {formatCurrency(p.basePrice)}
                        </div>
                        {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                          <div className="text-[10px] text-zinc-500 line-through">
                            {formatCurrency(p.compareAtPrice)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {p.stock === 0 ? (
                          <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[10px]">
                            Out of Stock (0)
                          </Badge>
                        ) : p.stock <= 5 ? (
                          <Badge variant="warning" className="text-[10px]">
                            Low: {p.stock} left
                          </Badge>
                        ) : (
                          <span className="text-zinc-300 text-xs">
                            {p.stock} in stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {totalVariants > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="neutral" className="text-[10px] font-mono">
                              {totalVariants} variant{totalVariants > 1 ? "s" : ""}
                            </Badge>
                            {hasColors && p.availableColors && (
                              <div className="flex -space-x-1">
                                {p.availableColors.slice(0, 3).map((c) => (
                                  <span
                                    key={c.name}
                                    title={c.name}
                                    className="w-3.5 h-3.5 rounded-full border border-zinc-900 shrink-0 inline-block"
                                    style={{ backgroundColor: c.hex }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px] font-mono">Standard SKU</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            title="Preview on Storefront"
                            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleArchive(p.id, p.title)}
                            disabled={isArchivingId === p.id}
                            title="Archive piece"
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors disabled:opacity-50"
                          >
                            <Archive className={`w-3.5 h-3.5 ${isArchivingId === p.id ? "animate-pulse" : ""}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Edit3,
  AlertTriangle,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { formatCurrency, calculateDiscountPercentage, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

interface SellerProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  categoryId?: string;
  basePrice: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
  approvalStatus: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  isPublished: boolean;
  moderationNotes?: string | null;
  createdAt?: string;
  availableColors?: { name: string; hex: string; image?: string }[];
  availableSizes?: string[];
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED">("ALL");
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

  // Derive categories from loaded products
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  // Counts for top status tabs & metrics
  const totalCount = products.length;
  const draftCount = products.filter((p) => p.approvalStatus === "DRAFT").length;
  const pendingCount = products.filter((p) => p.approvalStatus === "PENDING_REVIEW").length;
  const approvedCount = products.filter((p) => p.approvalStatus === "APPROVED").length;
  const liveCount = products.filter((p) => p.approvalStatus === "APPROVED" && p.isPublished).length;
  const rejectedCount = products.filter((p) => p.approvalStatus === "REJECTED").length;

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();

    let matchesStatus = true;
    if (statusFilter !== "ALL") {
      matchesStatus = p.approvalStatus === statusFilter;
    }

    let matchesStock = true;
    if (stockFilter === "IN_STOCK") matchesStock = p.stock > 5;
    if (stockFilter === "LOW_STOCK") matchesStock = p.stock > 0 && p.stock <= 5;
    if (stockFilter === "OUT_OF_STOCK") matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const renderStatusBadge = (p: SellerProduct) => {
    const isChangesRequested =
      p.approvalStatus === "REJECTED" &&
      p.moderationNotes &&
      (p.moderationNotes.toLowerCase().includes("change") ||
        p.moderationNotes.toLowerCase().includes("edit") ||
        p.moderationNotes.toLowerCase().includes("update") ||
        p.moderationNotes.toLowerCase().includes("please"));

    if (p.approvalStatus === "DRAFT") {
      return (
        <Badge variant="outline" className="border-zinc-700 text-zinc-400 gap-1 text-[10px] font-mono">
          <Clock className="w-3 h-3 text-zinc-500" />
          Draft
        </Badge>
      );
    }

    if (p.approvalStatus === "PENDING_REVIEW") {
      return (
        <Badge variant="warning" className="gap-1 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
          Pending Review
        </Badge>
      );
    }

    if (p.approvalStatus === "APPROVED") {
      if (p.isPublished) {
        return (
          <Badge variant="success" className="gap-1 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Approved &amp; Live
          </Badge>
        );
      }
      return (
        <Badge variant="neutral" className="gap-1 text-[10px] font-mono bg-zinc-800 text-zinc-300">
          Approved (Unpublished)
        </Badge>
      );
    }

    if (isChangesRequested) {
      return (
        <Badge variant="warning" className="gap-1 text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/40">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          Changes Requested
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1 text-[10px] font-mono bg-rose-500/10 text-rose-400 border-rose-500/30">
        <Ban className="w-3 h-3 text-rose-400" />
        Rejected
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Artisan Catalog Management
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Studio Pieces &amp; Collections
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your creations, draft revisions, view moderation feedback, and track customer storefront publication.
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

          <Button href="/seller/products/new" size="sm" className="flex items-center gap-1.5 bg-zinc-100 text-zinc-900 hover:bg-white">
            <Plus className="w-4 h-4" />
            New Piece
          </Button>
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Total Pieces</span>
          <p className="text-xl font-medium text-zinc-100 mt-1">{totalCount}</p>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Drafts</span>
          <p className="text-xl font-medium text-zinc-300 mt-1">{draftCount}</p>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500">In Review</span>
          <p className="text-xl font-medium text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500">Live Storefront</span>
          <p className="text-xl font-medium text-emerald-400 mt-1">{liveCount}</p>
        </div>
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400">Action Needed</span>
          <p className="text-xl font-medium text-rose-400 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Workflow Status Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === "ALL"
              ? "bg-zinc-800 text-zinc-100 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setStatusFilter("DRAFT")}
          className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === "DRAFT"
              ? "bg-zinc-800 text-zinc-100 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          Drafts ({draftCount})
        </button>
        <button
          onClick={() => setStatusFilter("PENDING_REVIEW")}
          className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === "PENDING_REVIEW"
              ? "bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Clock className="w-3 h-3 text-amber-400" />
          Pending Review ({pendingCount})
        </button>
        <button
          onClick={() => setStatusFilter("APPROVED")}
          className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === "APPROVED"
              ? "bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Approved &amp; Live ({approvedCount})
        </button>
        <button
          onClick={() => setStatusFilter("REJECTED")}
          className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === "REJECTED"
              ? "bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Ban className="w-3 h-3 text-rose-400" />
          Action Needed ({rejectedCount})
        </button>
      </div>

      {/* Search & Stock Filter Bar */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search pieces by title, collection, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Stock:
            </span>
            <button
              onClick={() => setStockFilter("ALL")}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                stockFilter === "ALL"
                  ? "bg-zinc-200 text-zinc-950 font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter("IN_STOCK")}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                stockFilter === "IN_STOCK"
                  ? "bg-zinc-200 text-zinc-950 font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              In Stock (&gt;5)
            </button>
            <button
              onClick={() => setStockFilter("LOW_STOCK")}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                stockFilter === "LOW_STOCK"
                  ? "bg-amber-400 text-zinc-950 font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              Low Stock (&le;5)
            </button>
            <button
              onClick={() => setStockFilter("OUT_OF_STOCK")}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                stockFilter === "OUT_OF_STOCK"
                  ? "bg-rose-400 text-zinc-950 font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              Depleted (0)
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
              {searchQuery || selectedCategory !== "All" || statusFilter !== "ALL" || stockFilter !== "ALL"
                ? "No products matched your search or filters. Try adjusting your query."
                : "You haven't listed any creations in your atelier yet. Start by crafting your first catalog entry."}
            </p>
          </div>
          <Button href="/seller/products/new" size="sm" className="mt-2 bg-zinc-100 text-zinc-900 hover:bg-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Craft New Piece
          </Button>
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
                  <th className="py-3 px-4">Inventory</th>
                  <th className="py-3 px-4">Status &amp; Workflow</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {filteredProducts.map((p) => {
                  const discountPercent = calculateDiscountPercentage(p.basePrice, p.compareAtPrice || undefined);
                  const imageCount = p.images?.length || 0;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                      {/* Creation thumbnail & title */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-16 bg-zinc-900 rounded overflow-hidden relative shrink-0 border border-zinc-800">
                            <ImageWithFallback
                              src={p.images?.[0] || ""}
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                            {imageCount > 1 && (
                              <span className="absolute bottom-1 right-1 bg-black/75 px-1 py-0.2 rounded text-[9px] font-mono text-zinc-300">
                                {imageCount}📷
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Link
                              href={`/seller/products/${p.id}`}
                              className="font-medium text-zinc-200 block text-sm hover:text-white transition-colors"
                            >
                              {p.title}
                            </Link>
                            {p.subtitle && (
                              <p className="text-[11px] text-zinc-500 line-clamp-1">
                                {p.subtitle}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
                              <span>Added {formatDate(p.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Feedback Box if rejection / changes requested */}
                        {p.moderationNotes && (p.approvalStatus === "REJECTED" || p.approvalStatus === "DRAFT") && (
                          <div className="mt-2.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-300 flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-amber-200">Admin Feedback: </span>
                              <span>{p.moderationNotes}</span>
                              <div className="mt-1">
                                <Link
                                  href={`/seller/products/${p.id}`}
                                  className="underline text-amber-300 hover:text-amber-100 font-medium inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit and resubmit piece
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-zinc-400 font-mono text-[11px] bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                          {p.category}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4 font-mono">
                        <div className="text-zinc-200 font-medium">
                          {formatCurrency(p.basePrice)}
                        </div>
                        {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-zinc-500 line-through">
                              {formatCurrency(p.compareAtPrice)}
                            </span>
                            {discountPercent > 0 && (
                              <span className="text-[10px] text-emerald-400 font-sans font-medium">
                                {discountPercent}% off
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Inventory & stock */}
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
                            {p.stock} units
                          </span>
                        )}
                      </td>

                      {/* Status & Workflow Badge */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(p)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Action Button */}
                          <Link
                            href={`/seller/products/${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-medium transition-colors border border-zinc-700/60"
                            title="Edit this piece"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </Link>

                          {/* Preview / Storefront Link */}
                          {p.isPublished ? (
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              title="View on Customer Storefront"
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              title="Storefront Preview"
                              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {/* Archive Action */}
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

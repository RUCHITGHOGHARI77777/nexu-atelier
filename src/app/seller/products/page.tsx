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
  ShieldCheck,
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
  approvalStatus: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
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
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED">("ALL");
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
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setActionError("Authentication required: You must be signed in as an approved studio partner.");
        } else {
          setActionError(err.error || "Failed to load studio catalog.");
        }
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
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to archive product.");
      }
    } catch {
      setActionError("Network error while archiving creation.");
    } finally {
      setIsArchivingId(null);
    }
  };

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const totalCount = products.length;
  const draftCount = products.filter((p) => p.approvalStatus === "DRAFT").length;
  const pendingCount = products.filter((p) => p.approvalStatus === "PENDING_REVIEW").length;
  const approvedCount = products.filter((p) => p.approvalStatus === "APPROVED").length;
  const liveCount = products.filter((p) => p.approvalStatus === "APPROVED" && p.isPublished).length;
  const changesCount = products.filter((p) => p.approvalStatus === "CHANGES_REQUESTED").length;
  const rejectedCount = products.filter((p) => p.approvalStatus === "REJECTED").length;

  const filteredProducts = products.filter((p) => {
    let matchesCategory = selectedCategory === "All" || p.category === selectedCategory;

    let matchesStatus = true;
    if (statusFilter !== "ALL") {
      matchesStatus = p.approvalStatus === statusFilter;
    }

    let matchesStock = true;
    if (stockFilter === "IN_STOCK") {
      matchesStock = p.stock > 5;
    } else if (stockFilter === "LOW_STOCK") {
      matchesStock = p.stock > 0 && p.stock <= 5;
    } else if (stockFilter === "OUT_OF_STOCK") {
      matchesStock = p.stock === 0;
    }

    const isChangesRequested =
      p.approvalStatus === "REJECTED" &&
      p.moderationNotes &&
      p.moderationNotes.toLowerCase().includes("please update");

    let matchesSearch = true;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      matchesSearch =
        p.title.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q);
    }

    return matchesCategory && matchesStatus && matchesStock && matchesSearch;
  });

  const renderStatusBadge = (p: SellerProduct) => {
    if (p.approvalStatus === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Studio Draft
        </span>
      );
    }

    if (p.approvalStatus === "PENDING_REVIEW") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-2.5 h-2.5 text-amber-600" />
          Awaiting Curation Review
        </span>
      );
    }

    if (p.approvalStatus === "APPROVED") {
      if (p.isPublished) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Live on Storefront
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Approved (Unpublished)
        </span>
      );
    }

    const isChangesRequested =
      p.approvalStatus === "REJECTED" &&
      p.moderationNotes &&
      p.moderationNotes.toLowerCase().includes("please update");

    if (p.approvalStatus === "CHANGES_REQUESTED" || isChangesRequested) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <AlertTriangle className="w-2.5 h-2.5 text-blue-600" />
          Revisions Requested
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
        <Ban className="w-2.5 h-2.5 text-rose-600" />
        Listing Rejected
      </span>
    );
  };

  return (
    <div className="space-y-8 font-sans text-slate-900 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Studio Workshop
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Curated Listing Verification
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-950 mt-1">
            Studio Pieces &amp; Collections
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Manage your creations, draft revisions, view curation review feedback, and track active storefront publications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button href="/seller/products/new" size="sm" className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs">
            <Plus className="w-4 h-4" />
            New Piece
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Editorial Curation Policy:</span>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            To ensure genuine craftsmanship and premium presentation, new pieces cannot be published directly to the customer storefront. When you submit a piece, it undergoes evaluation by NEXU Platform Curators before becoming active.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <div className="flex items-center gap-2">
            {actionError.toLowerCase().includes("auth") && (
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const res = await fetch("/api/auth/demo-login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role: "seller" }),
                    });
                    if (res.ok) {
                      setActionError(null);
                      fetchProducts();
                    } else {
                      window.location.href = "/login";
                    }
                  } catch {
                    window.location.href = "/login";
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
              >
                Sign In as Demo Studio (Solstice)
              </button>
            )}
            <button
              onClick={() => setActionError(null)}
              className="text-slate-500 hover:text-slate-900 ml-2 font-mono text-[10px]"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-slate-500 hover:text-slate-900 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Total Pieces</span>
          <p className="text-xl font-bold font-mono text-slate-950 mt-1">{totalCount}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Drafts</span>
          <p className="text-xl font-bold font-mono text-slate-700 mt-1">{draftCount}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-semibold">In Review</span>
          <p className="text-xl font-bold font-mono text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">Live Storefront</span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">{liveCount}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-700 font-semibold">Action Needed</span>
          <p className="text-xl font-bold font-mono text-rose-700 mt-1">{rejectedCount}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-slate-950 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setStatusFilter("DRAFT")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            statusFilter === "DRAFT"
              ? "bg-slate-950 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Drafts ({draftCount})
        </button>
        <button
          onClick={() => setStatusFilter("PENDING_REVIEW")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            statusFilter === "PENDING_REVIEW"
              ? "bg-amber-100 text-amber-900 font-semibold border border-amber-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-3 h-3 text-amber-600" />
          Pending Review ({pendingCount})
        </button>
        <button
          onClick={() => setStatusFilter("APPROVED")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            statusFilter === "APPROVED"
              ? "bg-emerald-100 text-emerald-900 font-semibold border border-emerald-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Approved &amp; Live ({approvedCount})
        </button>
        <button
          onClick={() => setStatusFilter("CHANGES_REQUESTED")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            statusFilter === "CHANGES_REQUESTED"
              ? "bg-blue-100 text-blue-900 font-semibold border border-blue-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-blue-600" />
          Changes Requested ({changesCount})
        </button>
        <button
          onClick={() => setStatusFilter("REJECTED")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            statusFilter === "REJECTED"
              ? "bg-rose-100 text-rose-900 font-semibold border border-rose-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Ban className="w-3 h-3 text-rose-600" />
          Rejected ({rejectedCount})
        </button>
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search pieces by title, collection, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white font-sans"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Stock:
            </span>
            <button
              onClick={() => setStockFilter("ALL")}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                stockFilter === "ALL"
                  ? "bg-slate-950 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter("IN_STOCK")}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                stockFilter === "IN_STOCK"
                  ? "bg-slate-950 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              In Stock (&gt;5)
            </button>
            <button
              onClick={() => setStockFilter("LOW_STOCK")}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                stockFilter === "LOW_STOCK"
                  ? "bg-amber-100 text-amber-900 font-semibold"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              Low Stock (&le;5)
            </button>
            <button
              onClick={() => setStockFilter("OUT_OF_STOCK")}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                stockFilter === "OUT_OF_STOCK"
                  ? "bg-rose-100 text-rose-900 font-semibold"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              Depleted (0)
            </button>
          </div>
        </div>

        {categories.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold shrink-0">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-0.5 text-xs rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-950 text-white font-medium shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-xs text-slate-600">Loading atelier creations...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">No pieces found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "All" || statusFilter !== "ALL" || stockFilter !== "ALL"
                ? "No products matched your search or filters. Try adjusting your query."
                : "You haven't listed any creations in your atelier yet. Start by crafting your first catalog entry."}
            </p>
          </div>
          <Button href="/seller/products/new" size="sm" className="mt-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            Craft New Piece
          </Button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Creation</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Pricing</th>
                  <th className="py-3 px-4 font-semibold">Inventory</th>
                  <th className="py-3 px-4 font-semibold">Status &amp; Workflow</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const discountPercent = calculateDiscountPercentage(p.basePrice, p.compareAtPrice || undefined);
                  const imageCount = p.images?.length || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-16 bg-slate-100 rounded-lg overflow-hidden relative shrink-0 border border-slate-200">
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
                              className="font-semibold text-slate-900 block text-sm hover:text-amber-800 transition-colors"
                            >
                              {p.title}
                            </Link>
                            {p.subtitle && (
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {p.subtitle}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span>Added {formatDate(p.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {p.moderationNotes && (p.approvalStatus === "REJECTED" || p.approvalStatus === "CHANGES_REQUESTED" || p.approvalStatus === "DRAFT") && (
                          <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-amber-950">Curator Feedback: </span>
                              <span>{p.moderationNotes}</span>
                              <div className="mt-1">
                                <Link
                                  href={`/seller/products/${p.id}`}
                                  className="underline text-amber-800 hover:text-amber-950 font-semibold inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit and resubmit piece
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-900 font-semibold">
                          {formatCurrency(p.basePrice)}
                        </div>
                        {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatCurrency(p.compareAtPrice)}
                            </span>
                            {discountPercent > 0 && (
                              <span className="text-[10px] text-emerald-700 font-sans font-semibold">
                                {discountPercent}% off
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {p.stock === 0 ? (
                          <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 text-[10px]">
                            Out of Stock (0)
                          </Badge>
                        ) : p.stock <= 5 ? (
                          <Badge variant="warning" className="text-[10px]">
                            Low: {p.stock} left
                          </Badge>
                        ) : (
                          <span className="text-slate-700 text-xs font-semibold">
                            {p.stock} units
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {renderStatusBadge(p)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/seller/products/${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors border border-slate-200"
                            title="Edit this piece"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </Link>

                          {p.isPublished ? (
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              title="View on Customer Storefront"
                              className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              title="Storefront Preview"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          <button
                            onClick={() => handleArchive(p.id, p.title)}
                            disabled={isArchivingId === p.id}
                            title="Archive piece"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
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

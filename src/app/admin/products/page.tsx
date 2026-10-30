"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Package,
  Layers,
  X,
} from "lucide-react";
import { AdminProductView, ProductApprovalStatus } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<AdminProductView | null>(null);

  // Moderation state
  const [moderationAction, setModerationAction] = useState<"APPROVED" | "REJECTED" | "ARCHIVED" | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/products?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load moderation products.");
      }
    } catch {
      setActionError("Network error while loading moderation products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleExecuteModeration = async () => {
    if (!selectedProduct || !moderationAction) return;

    if (moderationAction === "REJECTED" && (!moderationNotes || moderationNotes.trim().length < 5)) {
      setActionError("A formal explanation (minimum 5 characters) is required when rejecting a creation.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: moderationAction,
          notes: moderationNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Piece "${selectedProduct.title}" marked as ${moderationAction}.`);
        setSelectedProduct(null);
        setModerationAction(null);
        setModerationNotes("");
        fetchProducts();
      } else {
        setActionError(data.error || "Failed to moderate piece.");
      }
    } catch {
      setActionError("Network error while submitting moderation verdict.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getApprovalBadge = (status: ProductApprovalStatus, isPublished: boolean) => {
    switch (status) {
      case "APPROVED":
        return isPublished ? (
          <Badge variant="success">Published & Live</Badge>
        ) : (
          <Badge variant="neutral">Approved (Unpublished)</Badge>
        );
      case "PENDING_REVIEW":
        return <Badge variant="warning">In Review</Badge>;
      case "DRAFT":
        return <Badge variant="neutral">Draft</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="border-rose-500/40 text-rose-400">Rejected</Badge>;
      case "ARCHIVED":
        return <Badge variant="outline" className="border-zinc-700 text-zinc-400">Archived</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Curatorial Oversight
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Catalog Moderation Queue
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review submitted artisan creations, verify provenance standards, and control public storefront publication.
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by piece title, subtitle, or studio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "All Pieces" },
              { id: "PENDING_REVIEW", label: "Awaiting Review" },
              { id: "APPROVED", label: "Approved" },
              { id: "REJECTED", label: "Rejected" },
              { id: "ARCHIVED", label: "Archived" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-zinc-200 text-zinc-950 font-medium"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading catalog items...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center text-xs text-zinc-500">
          No creations match the selected filter.
        </div>
      ) : (
        <div className="border border-zinc-800 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">Creation</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Artisan Studio</th>
                  <th className="py-3 px-4">Valuation</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-zinc-900 rounded overflow-hidden relative shrink-0 border border-zinc-800">
                          <ImageWithFallback
                            src={p.images?.[0] || ""}
                            alt={p.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-medium text-zinc-200 block">{p.title}</span>
                          <span className="text-[11px] text-zinc-500 line-clamp-1">{p.subtitle}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                      {p.category}
                    </td>

                    <td className="py-3 px-4 text-zinc-300">
                      {p.vendorName}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-200 font-medium">
                      {formatCurrency(p.basePrice)}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {p.stock} units
                    </td>

                    <td className="py-3 px-4">
                      {getApprovalBadge(p.approvalStatus, p.isPublished)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          title="Preview Storefront"
                          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProduct(p)}
                          className="text-xs"
                        >
                          Moderate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moderation Verdict Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Moderate: {selectedProduct.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setModerationAction(null);
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-4">
              <div className="w-20 h-24 bg-zinc-900 rounded overflow-hidden relative shrink-0 border border-zinc-800">
                <ImageWithFallback
                  src={selectedProduct.images?.[0] || ""}
                  alt={selectedProduct.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-semibold text-zinc-200">{selectedProduct.title}</h4>
                <p className="text-zinc-400 font-mono">By {selectedProduct.vendorName} • {selectedProduct.category}</p>
                <p className="text-zinc-300 font-mono font-medium">Valuation: {formatCurrency(selectedProduct.basePrice)} ({selectedProduct.stock} ready units)</p>
                <p className="text-[11px] text-zinc-500">Current Standing: {selectedProduct.approvalStatus}</p>
              </div>
            </div>

            {selectedProduct.moderationNotes && (
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded text-xs text-zinc-300 space-y-1">
                <span className="font-mono text-[10px] uppercase text-zinc-500 block">Existing Moderation Notes:</span>
                <p>{selectedProduct.moderationNotes}</p>
              </div>
            )}

            {moderationAction ? (
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-3">
                <h4 className="text-xs font-semibold text-zinc-200 uppercase font-mono">
                  Confirm {moderationAction} Decision
                </h4>

                {moderationAction === "REJECTED" && (
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Editorial Rejection Feedback <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      placeholder="e.g. Imagery does not meet resolution standards or craft technique requires verification."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                      required
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModerationAction(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleExecuteModeration}
                    className={
                      moderationAction === "APPROVED"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-rose-600 hover:bg-rose-500 text-white"
                    }
                  >
                    {isSubmitting ? "Applying..." : `Confirm ${moderationAction}`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 font-mono">
                  Select Action:
                </div>

                <div className="flex items-center gap-2">
                  {selectedProduct.approvalStatus !== "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => setModerationAction("APPROVED")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve & Publish
                    </Button>
                  )}

                  {selectedProduct.approvalStatus !== "REJECTED" && (
                    <Button
                      size="sm"
                      onClick={() => setModerationAction("REJECTED")}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject Piece
                    </Button>
                  )}

                  {selectedProduct.approvalStatus !== "ARCHIVED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModerationAction("ARCHIVED")}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5 text-zinc-400" />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

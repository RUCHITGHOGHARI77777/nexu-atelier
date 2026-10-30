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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);

  // Moderation state
  const [moderationAction, setModerationAction] = useState<"APPROVED" | "REJECTED" | "ARCHIVED" | "CHANGES_REQUESTED" | null>(null);
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

  const handleToggleFeatured = async () => {
    if (!selectedProduct) return;
    const newFeatured = !selectedProduct.isFeatured;
    setIsTogglingFeatured(true);
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: newFeatured }),
      });
      if (res.ok) {
        setSelectedProduct({ ...selectedProduct, isFeatured: newFeatured });
        setProducts((prev) =>
          prev.map((p) => (p.id === selectedProduct.id ? { ...p, isFeatured: newFeatured } : p))
        );
        setActionSuccess(`Homepage featured showcase ${newFeatured ? "Enabled" : "Disabled"}.`);
      }
    } finally {
      setIsTogglingFeatured(false);
    }
  };

  const handleExecuteModeration = async () => {
    if (!selectedProduct || !moderationAction) return;

    if (
      (moderationAction === "REJECTED" || moderationAction === "CHANGES_REQUESTED") &&
      (!moderationNotes || moderationNotes.trim().length < 5)
    ) {
      setActionError("A formal explanation (minimum 5 characters) is required when rejecting or requesting changes.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const targetStatus = moderationAction === "CHANGES_REQUESTED" ? "DRAFT" : moderationAction;
      const formattedNotes =
        moderationAction === "CHANGES_REQUESTED"
          ? `[CHANGES_REQUESTED]: ${moderationNotes.trim()}`
          : moderationNotes.trim() || undefined;

      const res = await fetch(`/api/admin/products/${selectedProduct.id}/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          notes: formattedNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Piece "${selectedProduct.title}" verdict recorded (${moderationAction}).`);
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
                          onClick={() => {
                            setSelectedProduct(p);
                            setActiveImageIndex(0);
                          }}
                          className="text-xs"
                        >
                          Moderate / Inspect
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

      {/* Moderation In-Depth Preview & Verdict Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                    <span>{selectedProduct.title}</span>
                    {getApprovalBadge(selectedProduct.approvalStatus, selectedProduct.isPublished)}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    By {selectedProduct.vendorName} • Department: {selectedProduct.category} • Slug: /{selectedProduct.slug}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setModerationAction(null);
                }}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Two-Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Visual Showcase & Gallery */}
              <div className="md:col-span-5 space-y-4">
                <div className="relative aspect-[4/5] w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                  <ImageWithFallback
                    src={selectedProduct.images?.[activeImageIndex] || selectedProduct.images?.[0] || ""}
                    alt={selectedProduct.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                  {selectedProduct.isFeatured && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-zinc-950 font-bold text-[10px] uppercase font-mono px-2 py-0.5 rounded shadow">
                      Homepage Featured
                    </div>
                  )}
                </div>

                {/* Thumbnails Strip */}
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                          activeImageIndex === idx
                            ? "border-amber-500 ring-2 ring-amber-500/20"
                            : "border-zinc-800 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <ImageWithFallback
                          src={img}
                          alt=""
                          fill
                          sizes="60px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Homepage Featured Switcher */}
                <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-zinc-200 block">
                      Homepage Spotlight
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Promote to storefront curated showcase
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedProduct.isFeatured ? "primary" : "outline"}
                    disabled={isTogglingFeatured}
                    onClick={handleToggleFeatured}
                    className="text-xs"
                  >
                    {selectedProduct.isFeatured ? "Featured Active" : "Set Featured"}
                  </Button>
                </div>
              </div>

              {/* Right Column: In-Depth Specifications & Variants */}
              <div className="md:col-span-7 space-y-4">
                {/* Pricing & Stock Card */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Selling Price</span>
                    <span className="text-base font-bold font-mono text-zinc-100">
                      {formatCurrency(selectedProduct.basePrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">MRP / Compare</span>
                    <span className="text-base font-mono text-zinc-400 line-through">
                      {selectedProduct.compareAtPrice ? formatCurrency(selectedProduct.compareAtPrice) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Stock Available</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {selectedProduct.stock} units
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">
                    Editorial Description
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed max-h-28 overflow-y-auto pr-1">
                    {selectedProduct.description || selectedProduct.subtitle || "No full description provided."}
                  </p>
                </div>

                {/* Craft Specifications */}
                {(selectedProduct.material || selectedProduct.dimensions || selectedProduct.weight) && (
                  <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl space-y-1 text-xs">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">
                      Architectural & Material Specifications
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                      {selectedProduct.material && (
                        <div><strong className="text-zinc-500">Material:</strong> {selectedProduct.material}</div>
                      )}
                      {selectedProduct.dimensions && (
                        <div><strong className="text-zinc-500">Dimensions:</strong> {selectedProduct.dimensions}</div>
                      )}
                      {selectedProduct.weight && (
                        <div><strong className="text-zinc-500">Weight:</strong> {selectedProduct.weight}</div>
                      )}
                      {selectedProduct.careInstructions && (
                        <div><strong className="text-zinc-500">Care:</strong> {selectedProduct.careInstructions}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Variants Matrix */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">
                      Configured Product Variants ({selectedProduct.variants.length})
                    </span>
                    <div className="max-h-32 overflow-y-auto border border-zinc-800 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-500 sticky top-0">
                          <tr>
                            <th className="py-2 px-3">SKU</th>
                            <th className="py-2 px-3">Size</th>
                            <th className="py-2 px-3">Color</th>
                            <th className="py-2 px-3">Price</th>
                            <th className="py-2 px-3">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {selectedProduct.variants.map((v) => (
                            <tr key={v.id}>
                              <td className="py-2 px-3 font-mono text-[11px] text-zinc-400">{v.sku}</td>
                              <td className="py-2 px-3">{v.size || "—"}</td>
                              <td className="py-2 px-3">
                                {v.colorName ? (
                                  <span className="flex items-center gap-1.5">
                                    {v.colorHex && (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-zinc-700"
                                        style={{ backgroundColor: v.colorHex }}
                                      />
                                    )}
                                    {v.colorName}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono">{formatCurrency(v.price)}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-emerald-400">{v.stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Existing Notes */}
                {selectedProduct.moderationNotes && (
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-300 space-y-1">
                    <span className="font-mono text-[10px] uppercase text-zinc-500 block">Existing Moderation Notes:</span>
                    <p>{selectedProduct.moderationNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action / Verdict Controls */}
            {moderationAction ? (
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold text-zinc-200 uppercase font-mono">
                  Confirm {moderationAction.replace("_", " ")} Decision
                </h4>

                {(moderationAction === "REJECTED" || moderationAction === "CHANGES_REQUESTED") && (
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Feedback for Maker / Workshop <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      placeholder={
                        moderationAction === "CHANGES_REQUESTED"
                          ? "Specify required modifications (e.g. please upload higher resolution imagery or update dimensions)."
                          : "Specify reasons for listing rejection."
                      }
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
                        : moderationAction === "CHANGES_REQUESTED"
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "bg-rose-600 hover:bg-rose-500 text-white"
                    }
                  >
                    {isSubmitting ? "Applying..." : `Confirm ${moderationAction.replace("_", " ")}`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    href={`/product/${selectedProduct.slug}`}
                    target="_blank"
                    className="text-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Storefront Page
                  </Button>
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

                  <Button
                    size="sm"
                    onClick={() => setModerationAction("CHANGES_REQUESTED")}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs flex items-center gap-1.5"
                  >
                    Request Changes
                  </Button>

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

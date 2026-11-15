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
  Clock,
  ShieldCheck,
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

  const [moderationAction, setModerationAction] = useState<"APPROVED" | "REJECTED" | "ARCHIVED" | "CHANGES_REQUESTED" | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [selectedRejectedFields, setSelectedRejectedFields] = useState<string[]>([]);
  const [suggestedCorrections, setSuggestedCorrections] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanningSla, setIsScanningSla] = useState(false);
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
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          setActionError("Admin privileges required: Sign in as Platform Super Admin to moderate catalog pieces.");
        } else {
          setActionError(err.error || "Failed to load moderation products.");
        }
      }
    } catch {
      setActionError("Network error while loading catalog moderation queue.");
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

  const handleTriggerSlaScan = async () => {
    setIsScanningSla(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/admin/products/scan-sla", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`SLA sweep completed. ${data.overdueCount || 0} overdue items flagged.`);
        fetchProducts();
      } else {
        setActionError(data.error || "Failed to execute review SLA sweep.");
      }
    } catch {
      setActionError("Network error during SLA scan.");
    } finally {
      setIsScanningSla(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (!selectedProduct) return;
    setIsTogglingFeatured(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !selectedProduct.isFeatured }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedProduct({
          ...selectedProduct,
          isFeatured: !selectedProduct.isFeatured,
        });
        fetchProducts();
      } else {
        setActionError(data.error || "Failed to toggle featured status.");
      }
    } catch {
      setActionError("Network error while updating featured status.");
    } finally {
      setIsTogglingFeatured(false);
    }
  };

  const handleExecuteModeration = async () => {
    if (!selectedProduct || !moderationAction) return;

    if (
      (moderationAction === "REJECTED" || moderationAction === "CHANGES_REQUESTED") &&
      !moderationNotes.trim()
    ) {
      alert("A curator feedback note is required to explain requested modifications or rejection.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: moderationAction,
          moderationNotes: moderationNotes.trim() || undefined,
          rejectedFields: selectedRejectedFields.length > 0 ? selectedRejectedFields : undefined,
          suggestedCorrections: suggestedCorrections.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(
          `Piece "${selectedProduct.title}" verdict recorded: ${moderationAction.replace("_", " ")}.`
        );
        setSelectedProduct(null);
        setModerationAction(null);
        setModerationNotes("");
        setSelectedRejectedFields([]);
        setSuggestedCorrections("");
        fetchProducts();
      } else {
        setActionError(data.error || "Failed to record curation verdict.");
      }
    } catch {
      setActionError("Network error while submitting curation verdict.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getApprovalBadge = (status: ProductApprovalStatus, isPublished: boolean) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved {isPublished ? "(Live)" : "(Hidden)"}
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Under Curation Review
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Changes Requested
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Archived
          </span>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-900 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Platform Governance
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Admin-Enforced Curation Gate
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-950 mt-1">
            Artisan Catalog Moderation
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Curatorial review queue for newly created artisan pieces. Verify luxury craft standards, photography authenticity, and material specifications before public storefront display.
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
            Refresh Queue
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Artisan Quality Assurance Protocol:</span>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            Sellers cannot unilaterally publish products to the live patron storefront. All additions and modifications enter the curation pipeline as <strong>Pending Review</strong> until authenticated by platform management.
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
            {(actionError.toLowerCase().includes("admin") || actionError.toLowerCase().includes("privilege")) && (
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const res = await fetch("/api/auth/demo-login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role: "admin" }),
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
                Sign In as Platform Super Admin
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

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by piece title, subtitle, or studio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "All Pieces" },
              { id: "PENDING_REVIEW", label: "Awaiting Review" },
              { id: "OVERDUE", label: "SLA Overdue" },
              { id: "APPROVED", label: "Approved" },
              { id: "CHANGES_REQUESTED", label: "Changes Requested" },
              { id: "REJECTED", label: "Rejected" },
              { id: "DRAFT", label: "Drafts" },
              { id: "ARCHIVED", label: "Archived" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-slate-950 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              disabled={isScanningSla}
              onClick={handleTriggerSlaScan}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono transition-colors shrink-0 cursor-pointer"
              title="Scan pending creations against review SLA timers"
            >
              <Clock className={`w-3.5 h-3.5 text-amber-600 ${isScanningSla ? "animate-spin" : ""}`} />
              <span>{isScanningSla ? "Scanning..." : "Scan SLAs"}</span>
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-xs text-slate-600">Loading catalog items...</p>
        </div>
      ) : products.filter((p) => statusFilter !== "OVERDUE" || (p.approvalStatus === "PENDING_REVIEW" && p.isReviewOverdue)).length === 0 ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center text-xs text-slate-500 shadow-xs">
          No creations match the selected filter.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Creation</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Artisan Studio</th>
                  <th className="py-3 px-4 font-semibold">Valuation</th>
                  <th className="py-3 px-4 font-semibold">Stock</th>
                  <th className="py-3 px-4 font-semibold">Review Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products
                  .filter((p) => statusFilter !== "OVERDUE" || (p.approvalStatus === "PENDING_REVIEW" && p.isReviewOverdue))
                  .map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-slate-100 rounded-lg overflow-hidden relative shrink-0 border border-slate-200">
                          <ImageWithFallback
                            src={p.images?.[0] || ""}
                            alt={p.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{p.title}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{p.subtitle}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {p.category}
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {p.vendorName}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-900 font-semibold">
                      {formatCurrency(p.basePrice)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.stock} units
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {getApprovalBadge(p.approvalStatus, p.isPublished)}
                        {p.approvalStatus === "PENDING_REVIEW" && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                              p.isReviewOverdue
                                ? "bg-rose-100 text-rose-800 border border-rose-300 font-bold"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}>
                              <Clock className="w-2.5 h-2.5" />
                              <span>{p.isReviewOverdue ? "SLA BREACHED" : "SLA 60m"}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          title="Preview Storefront"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
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
                          className="text-xs border-slate-200 hover:bg-slate-50 text-slate-800"
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

      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-950 flex items-center gap-2">
                    <span>{selectedProduct.title}</span>
                    {getApprovalBadge(selectedProduct.approvalStatus, selectedProduct.isPublished)}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    By {selectedProduct.vendorName} • Department: {selectedProduct.category} • Slug: /{selectedProduct.slug}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setModerationAction(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-4">
                <div className="relative aspect-[4/5] w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                  <ImageWithFallback
                    src={selectedProduct.images?.[activeImageIndex] || selectedProduct.images?.[0] || ""}
                    alt={selectedProduct.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                  {selectedProduct.isFeatured && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-zinc-950 font-bold text-[10px] uppercase font-mono px-2 py-0.5 rounded shadow-xs">
                      Homepage Featured
                    </div>
                  )}
                </div>

                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                          activeImageIndex === idx
                            ? "border-amber-600 ring-2 ring-amber-500/20"
                            : "border-slate-200 opacity-60 hover:opacity-100"
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

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-900 block">
                      Homepage Spotlight
                    </span>
                    <p className="text-[11px] text-slate-500">
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

              <div className="md:col-span-7 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Selling Price</span>
                    <span className="text-base font-bold font-mono text-slate-950">
                      {formatCurrency(selectedProduct.basePrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">MRP / Compare</span>
                    <span className="text-base font-mono text-slate-400 line-through">
                      {selectedProduct.compareAtPrice ? formatCurrency(selectedProduct.compareAtPrice) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Stock Available</span>
                    <span className="text-base font-bold font-mono text-emerald-700">
                      {selectedProduct.stock} units
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-600 block font-semibold">
                    Editorial Description
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed max-h-28 overflow-y-auto pr-1">
                    {selectedProduct.description || selectedProduct.subtitle || "No full description provided."}
                  </p>
                </div>

                {(selectedProduct.material || selectedProduct.dimensions || selectedProduct.weight) && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-600 block font-semibold">
                      Architectural &amp; Material Specifications
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                      {selectedProduct.material && (
                        <div><strong className="text-slate-500">Material:</strong> {selectedProduct.material}</div>
                      )}
                      {selectedProduct.dimensions && (
                        <div><strong className="text-slate-500">Dimensions:</strong> {selectedProduct.dimensions}</div>
                      )}
                      {selectedProduct.weight && (
                        <div><strong className="text-slate-500">Weight:</strong> {selectedProduct.weight}</div>
                      )}
                      {selectedProduct.careInstructions && (
                        <div><strong className="text-slate-500">Care:</strong> {selectedProduct.careInstructions}</div>
                      )}
                    </div>
                  </div>
                )}

                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-600 block font-semibold">
                      Configured Product Variants ({selectedProduct.variants.length})
                    </span>
                    <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-600 sticky top-0">
                          <tr>
                            <th className="py-2 px-3 font-semibold">SKU</th>
                            <th className="py-2 px-3 font-semibold">Size</th>
                            <th className="py-2 px-3 font-semibold">Color</th>
                            <th className="py-2 px-3 font-semibold">Price</th>
                            <th className="py-2 px-3 font-semibold">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {selectedProduct.variants.map((v) => (
                            <tr key={v.id}>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{v.sku}</td>
                              <td className="py-2 px-3">{v.size || "—"}</td>
                              <td className="py-2 px-3">
                                {v.colorName ? (
                                  <span className="flex items-center gap-1.5">
                                    {v.colorHex && (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-slate-300"
                                        style={{ backgroundColor: v.colorHex }}
                                      />
                                    )}
                                    {v.colorName}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono font-medium">{formatCurrency(v.price)}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-emerald-700">{v.stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedProduct.moderationNotes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <span className="font-mono text-[10px] uppercase text-amber-700 block font-semibold">Existing Moderation Notes:</span>
                    <p>{selectedProduct.moderationNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {moderationAction ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 uppercase font-mono">
                  Confirm {moderationAction.replace("_", " ")} Decision
                </h4>

                {(moderationAction === "REJECTED" || moderationAction === "CHANGES_REQUESTED") && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-700 mb-1">
                        Curator Feedback for Maker / Workshop <span className="text-rose-500">*</span>
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                        required
                      />
                    </div>

                    {moderationAction === "CHANGES_REQUESTED" && (
                      <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl">
                        <label className="block text-[11px] font-mono text-slate-600 font-semibold">
                          Flag Specific Fields for Maker Correction:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {[
                            { key: "title", label: "Title" },
                            { key: "description", label: "Description" },
                            { key: "images", label: "Photographs" },
                            { key: "basePrice", label: "Pricing / MRP" },
                            { key: "attributes", label: "Specifications" },
                            { key: "variants", label: "Variant SKUs" },
                            { key: "weight", label: "Weight" },
                            { key: "dispatchEstimate", label: "Dispatch Estimate" },
                          ].map((f) => {
                            const checked = selectedRejectedFields.includes(f.key);
                            return (
                              <label key={f.key} className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-[11px]">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRejectedFields([...selectedRejectedFields, f.key]);
                                    } else {
                                      setSelectedRejectedFields(selectedRejectedFields.filter((x) => x !== f.key));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-amber-600"
                                />
                                <span>{f.label}</span>
                              </label>
                            );
                          })}
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
                            Curator Suggested Correction (Optional Guidance):
                          </label>
                          <input
                            type="text"
                            value={suggestedCorrections}
                            onChange={(e) => setSuggestedCorrections(e.target.value)}
                            placeholder="e.g. Please clarify fabric purity (e.g. 100% Khadi Silk) and upload 1 texture close-up."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white"
                          />
                        </div>
                      </div>
                    )}
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
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                        : moderationAction === "CHANGES_REQUESTED"
                        ? "bg-amber-700 hover:bg-amber-800 text-white cursor-pointer"
                        : "bg-rose-700 hover:bg-rose-800 text-white cursor-pointer"
                    }
                  >
                    {isSubmitting ? "Applying..." : `Confirm ${moderationAction.replace("_", " ")}`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    href={`/product/${selectedProduct.slug}`}
                    target="_blank"
                    className="text-xs flex items-center gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-800"
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
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve &amp; Publish
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => setModerationAction("CHANGES_REQUESTED")}
                    className="bg-amber-700 hover:bg-amber-800 text-white text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    Request Changes
                  </Button>

                  {selectedProduct.approvalStatus !== "REJECTED" && (
                    <Button
                      size="sm"
                      onClick={() => setModerationAction("REJECTED")}
                      className="bg-rose-700 hover:bg-rose-800 text-white text-xs flex items-center gap-1.5 cursor-pointer"
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
                      className="text-xs flex items-center gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-500" />
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

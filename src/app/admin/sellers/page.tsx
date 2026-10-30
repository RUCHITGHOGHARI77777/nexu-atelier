"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  FileText,
  X,
  CreditCard,
  Package,
  Truck,
  Landmark,
} from "lucide-react";
import { AdminSellerView, SellerStatus } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<AdminSellerView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<AdminSellerView | null>(null);

  // Deep-dive detail state
  const [sellerDetail, setSellerDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Action Modals State
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "SUSPEND" | "REACTIVATE" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSellers = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/sellers?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers || []);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load seller directory.");
      }
    } catch {
      setActionError("Network error while connecting to seller service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [statusFilter]);

  const openSellerDossier = async (s: AdminSellerView) => {
    setSelectedSeller(s);
    setLoadingDetail(true);
    setSellerDetail(null);
    try {
      const res = await fetch(`/api/admin/sellers/${s.id}`);
      if (res.ok) {
        const data = await res.json();
        setSellerDetail(data.seller);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSellers();
  };

  const handleExecuteStatusUpdate = async () => {
    if (!selectedSeller || !actionType) return;

    let targetStatus: SellerStatus = SellerStatus.APPROVED;
    if (actionType === "REJECT") targetStatus = SellerStatus.REJECTED;
    if (actionType === "SUSPEND") targetStatus = SellerStatus.SUSPENDED;
    if (actionType === "REACTIVATE") targetStatus = SellerStatus.APPROVED;

    if ((actionType === "REJECT" || actionType === "SUSPEND") && (!actionReason || actionReason.trim().length < 5)) {
      setActionError("A formal explanation (minimum 5 characters) is required.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/sellers/${selectedSeller.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          reason: actionReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Seller studio status updated to ${targetStatus}.`);
        setActionType(null);
        setSelectedSeller(null);
        fetchSellers();
      } else {
        setActionError(data.error || "Failed to update studio status.");
      }
    } catch {
      setActionError("Network error while executing moderation action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSellerStatusBadge = (status: SellerStatus) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">Verified Active</Badge>;
      case "PENDING":
        return <Badge variant="warning">Awaiting Verification</Badge>;
      case "SUSPENDED":
        return <Badge variant="outline" className="border-rose-500/40 text-rose-400">Suspended</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="border-zinc-700 text-zinc-500">Rejected</Badge>;
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
            Artisan Network Governance
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Supplier & Artisan Studios
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Verify onboarding applications, monitor studio fulfillment rates, enforce commission thresholds, and arbitrate suspensions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSellers}
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
              placeholder="Search studios by workshop name, business email, or origin hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "All Studios" },
              { id: "PENDING", label: "Pending Verification" },
              { id: "APPROVED", label: "Active & Verified" },
              { id: "SUSPENDED", label: "Suspended" },
              { id: "REJECTED", label: "Rejected" },
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

      {/* Sellers Table */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading artisan studios...</p>
        </div>
      ) : sellers.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center text-xs text-zinc-500">
          No studios match the specified criteria.
        </div>
      ) : (
        <div className="border border-zinc-800 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">Artisan Studio</th>
                  <th className="py-3 px-4">Craft Hub</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pieces</th>
                  <th className="py-3 px-4">Gross Sales</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-zinc-200 block text-sm">{s.name}</span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {s.businessEmail || "No email listed"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                      {s.originHub}
                    </td>

                    <td className="py-3 px-4">
                      {getSellerStatusBadge(s.status)}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {s.productCount} creations
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-200 font-medium">
                      {formatCurrency(s.grossSales)}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                      {formatDateTime(s.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSellerDossier(s)}
                        className="text-xs"
                      >
                        Inspect Dossier 360°
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seller Inspection / Review Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-4xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-zinc-300" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    {selectedSeller.name} — Studio Dossier 360°
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    ID: {selectedSeller.id} • Slug: {selectedSeller.slug}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSeller(null);
                  setActionType(null);
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center text-zinc-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
                <p className="text-xs">Loading studio KYC, banking, and inventory records...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded space-y-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">Contact Details</span>
                    <p className="text-zinc-200 flex items-center gap-1.5 pt-1">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      {selectedSeller.businessEmail || "N/A"}
                    </p>
                    <p className="text-zinc-400 flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      {selectedSeller.businessPhone || "N/A"}
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded space-y-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">Legal Compliance</span>
                    <p className="text-zinc-200 font-mono pt-1">
                      GSTIN/PAN: {selectedSeller.taxIdentifier || "Not Provided"}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Commission: {selectedSeller.commissionRatePercent}%
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded space-y-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">Settlement Account</span>
                    <p className="text-zinc-200 font-mono pt-1">
                      {selectedSeller.bankAccountName || "Pending Setup"}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      A/C: {selectedSeller.bankAccountNumber || "—"} | IFSC: {selectedSeller.bankIfsc || "—"}
                    </p>
                  </div>
                </div>

                {/* Craft Story */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Craft Story & Origin Hub</span>
                  <p className="text-zinc-300 italic pt-1">&ldquo;{selectedSeller.story}&rdquo;</p>
                  <p className="text-[11px] text-zinc-500 font-mono pt-1">Hub: {selectedSeller.originHub}</p>
                </div>

                {/* Products & Inventory Section */}
                {sellerDetail?.products && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-zinc-500" /> Studio Creations & Live Inventory ({sellerDetail.products.length})
                      </span>
                    </div>
                    {sellerDetail.products.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic">No products listed by this studio.</p>
                    ) : (
                      <div className="border border-zinc-800 rounded overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
                            <tr>
                              <th className="py-2 px-3">Title</th>
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3">Price</th>
                              <th className="py-2 px-3">Stock</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                            {sellerDetail.products.map((p: any) => (
                              <tr key={p.id}>
                                <td className="py-2 px-3 font-medium text-zinc-200">{p.title}</td>
                                <td className="py-2 px-3 text-zinc-400">{p.category}</td>
                                <td className="py-2 px-3 font-mono text-zinc-200">{formatCurrency(p.basePrice)}</td>
                                <td className={`py-2 px-3 font-mono ${p.stock <= 5 ? "text-amber-400" : "text-zinc-300"}`}>
                                  {p.stock} units
                                </td>
                                <td className="py-2 px-3">
                                  <Badge variant={p.approvalStatus === "APPROVED" ? "success" : "warning"} className="text-[9px]">
                                    {p.approvalStatus}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Dispatches Section */}
                {sellerDetail?.orderLines && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-zinc-500" /> Discrete Order Fulfillment Performance ({sellerDetail.orderLines.length})
                    </span>
                    {sellerDetail.orderLines.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic">No order lines assigned yet.</p>
                    ) : (
                      <div className="border border-zinc-800 rounded overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
                            <tr>
                              <th className="py-2 px-3">Item</th>
                              <th className="py-2 px-3">Patron</th>
                              <th className="py-2 px-3">Amount</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Courier Tracking</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                            {sellerDetail.orderLines.map((ol: any) => (
                              <tr key={ol.id}>
                                <td className="py-2 px-3 font-medium text-zinc-200">{ol.productTitle}</td>
                                <td className="py-2 px-3 text-zinc-400">{ol.customerName}</td>
                                <td className="py-2 px-3 font-mono text-zinc-200">{formatCurrency(ol.lineTotal)}</td>
                                <td className="py-2 px-3">
                                  <Badge variant="neutral" className="text-[9px]">{ol.fulfillmentStatus}</Badge>
                                </td>
                                <td className="py-2 px-3 font-mono text-[11px] text-zinc-400">
                                  {ol.trackingNumber ? `${ol.courierName || "Courier"}: ${ol.trackingNumber}` : "Not Dispatched"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Note if any */}
                {selectedSeller.rejectionReason && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-300 space-y-1">
                    <span className="font-semibold text-rose-400 font-mono text-[10px] uppercase">Recorded Reason</span>
                    <p>{selectedSeller.rejectionReason}</p>
                  </div>
                )}

                {/* Decision Action Sub-form */}
                {actionType ? (
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-200 uppercase font-mono">
                      Confirm {actionType} Action
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {actionType === "APPROVE" && "Approving will authorize this studio to publish pieces and fulfill patron orders."}
                      {actionType === "REJECT" && "Rejecting will notify the applicant and block catalog publication. Please provide a clear reason."}
                      {actionType === "SUSPEND" && "Suspending will immediately unpublish all catalog pieces from the live storefront."}
                      {actionType === "REACTIVATE" && "Reactivating will restore the studio to approved standing."}
                    </p>

                    {(actionType === "REJECT" || actionType === "SUSPEND") && (
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Reason / Feedback <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          placeholder="e.g. Incomplete tax compliance documentation or workshop audit pending."
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
                        onClick={() => setActionType(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={isSubmitting}
                        onClick={handleExecuteStatusUpdate}
                        className={
                          actionType === "APPROVE" || actionType === "REACTIVATE"
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-rose-600 hover:bg-rose-500 text-white"
                        }
                      >
                        {isSubmitting ? "Applying..." : `Confirm ${actionType}`}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                    <div className="text-xs text-zinc-500 font-mono">
                      Current Standing: <strong className="text-zinc-300">{selectedSeller.status}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedSeller.status !== "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() => setActionType("APPROVE")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Studio
                        </Button>
                      )}

                      {selectedSeller.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => setActionType("REJECT")}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-xs flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Application
                        </Button>
                      )}

                      {selectedSeller.status === "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() => setActionType("SUSPEND")}
                          className="bg-amber-600 hover:bg-amber-500 text-white text-xs flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Suspend Studio
                        </Button>
                      )}

                      {selectedSeller.status === "SUSPENDED" && (
                        <Button
                          size="sm"
                          onClick={() => setActionType("REACTIVATE")}
                          className="bg-zinc-100 hover:bg-white text-zinc-900 text-xs"
                        >
                          Reactivate Studio
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

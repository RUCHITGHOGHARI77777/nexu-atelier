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

  const [sellerDetail, setSellerDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "SUSPEND" | "REACTIVATE" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSellers = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/sellers?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers || []);
      } else {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          setActionError("Admin privileges required: Sign in as Platform Super Admin to inspect and govern artisan studios.");
        } else {
          setActionError(err.error || "Failed to load seller studios.");
        }
      }
    } catch {
      setActionError("Network error while connecting to seller governance service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSellers();
  };

  const openSellerDossier = async (seller: AdminSellerView) => {
    setSelectedSeller(seller);
    setActionType(null);
    setActionReason("");
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/sellers/${seller.id}`);
      if (res.ok) {
        const data = await res.json();
        setSellerDetail(data.seller || null);
      } else {
        setSellerDetail(null);
      }
    } catch {
      setSellerDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExecuteStatusUpdate = async () => {
    if (!selectedSeller || !actionType) return;

    if ((actionType === "REJECT" || actionType === "SUSPEND") && !actionReason.trim()) {
      alert("A valid administrative justification is required to reject or suspend an artisan studio.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    const targetStatus =
      actionType === "APPROVE" || actionType === "REACTIVATE"
        ? "APPROVED"
        : actionType === "REJECT"
        ? "REJECTED"
        : "SUSPENDED";

    try {
      const res = await fetch(`/api/admin/sellers/${selectedSeller.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          rejectionReason: actionReason.trim() || undefined,
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
        return <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50">Suspended</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="border-slate-300 text-slate-600 bg-slate-50">Rejected</Badge>;
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
              Admin-Enforced KYC Verification
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-950 mt-1">
            Artisan Studio Network &amp; KYC
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Super Admin command center for evaluating merchant applications, verifying statutory GSTIN / bank credentials, monitoring studio fulfillment, and approving store activation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSellers}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Separation of Authority Rule:</span>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            Sellers and suppliers cannot self-approve their studio accounts or bypass statutory KYC. Only designated platform administrators can verify banking details, authorize storefront activation, and arbitrate merchant suspensions.
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
                      fetchSellers();
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
              placeholder="Search studios by workshop name, business email, or origin hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
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
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-slate-950 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-xs text-slate-600">Loading artisan studios...</p>
        </div>
      ) : sellers.length === 0 ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center text-xs text-slate-500 shadow-xs">
          No studios match the specified criteria.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Artisan Studio</th>
                  <th className="py-3 px-4 font-semibold">Craft Hub</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Pieces</th>
                  <th className="py-3 px-4 font-semibold">Gross Sales</th>
                  <th className="py-3 px-4 font-semibold">Registered Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-950 block text-sm">{s.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {s.businessEmail || "No email listed"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                      {s.originHub}
                    </td>

                    <td className="py-3 px-4">
                      {getSellerStatusBadge(s.status)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      {s.productCount} creations
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-900 font-semibold">
                      {formatCurrency(s.grossSales)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {formatDateTime(s.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSellerDossier(s)}
                        className="text-xs border-slate-200 hover:bg-slate-50 text-slate-800"
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

      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 border border-slate-200">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-950">
                    {selectedSeller.name} — Studio Dossier 360°
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedSeller.id} • Slug: {selectedSeller.slug}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSeller(null);
                  setActionType(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                <p className="text-xs">Loading studio KYC, banking, and inventory records...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Contact Details</span>
                    <p className="text-slate-900 flex items-center gap-1.5 pt-1 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {selectedSeller.businessEmail || "N/A"}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedSeller.businessPhone || "N/A"}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Legal Compliance</span>
                    <p className="text-slate-900 font-mono pt-1 font-semibold">
                      GSTIN/PAN: {selectedSeller.taxIdentifier || "Not Provided"}
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      Platform Fee: {selectedSeller.commissionRatePercent}% standard
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Settlement Account</span>
                    <p className="text-slate-900 font-mono pt-1 font-semibold">
                      {selectedSeller.bankAccountName || "Pending Setup"}
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      A/C: {selectedSeller.bankAccountNumber || "—"} | IFSC: {selectedSeller.bankIfsc || "—"}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Craft Story &amp; Origin Hub</span>
                  <p className="text-slate-800 italic pt-1">&ldquo;{selectedSeller.story}&rdquo;</p>
                  <p className="text-[11px] text-slate-500 font-mono pt-1">Hub: {selectedSeller.originHub}</p>
                </div>

                {sellerDetail?.products && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase text-slate-700 font-semibold flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-500" /> Studio Creations &amp; Live Inventory ({sellerDetail.products.length})
                      </span>
                    </div>
                    {sellerDetail.products.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No products listed by this studio.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-600">
                            <tr>
                              <th className="py-2 px-3 font-semibold">Title</th>
                              <th className="py-2 px-3 font-semibold">Category</th>
                              <th className="py-2 px-3 font-semibold">Price</th>
                              <th className="py-2 px-3 font-semibold">Stock</th>
                              <th className="py-2 px-3 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sellerDetail.products.map((p: any) => (
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-semibold text-slate-900">{p.title}</td>
                                <td className="py-2 px-3 text-slate-600">{p.category}</td>
                                <td className="py-2 px-3 font-mono text-slate-900 font-semibold">{formatCurrency(p.basePrice)}</td>
                                <td className={`py-2 px-3 font-mono ${p.stock <= 5 ? "text-amber-700 font-bold" : "text-slate-700"}`}>
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

                {sellerDetail?.orderLines && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase text-slate-700 font-semibold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-500" /> Discrete Order Fulfillment Performance ({sellerDetail.orderLines.length})
                    </span>
                    {sellerDetail.orderLines.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No order lines assigned yet.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-600">
                            <tr>
                              <th className="py-2 px-3 font-semibold">Item</th>
                              <th className="py-2 px-3 font-semibold">Patron</th>
                              <th className="py-2 px-3 font-semibold">Amount</th>
                              <th className="py-2 px-3 font-semibold">Status</th>
                              <th className="py-2 px-3 font-semibold">Courier Tracking</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sellerDetail.orderLines.map((ol: any) => (
                              <tr key={ol.id} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-semibold text-slate-900">{ol.productTitle}</td>
                                <td className="py-2 px-3 text-slate-600">{ol.customerName}</td>
                                <td className="py-2 px-3 font-mono text-slate-900 font-semibold">{formatCurrency(ol.lineTotal)}</td>
                                <td className="py-2 px-3">
                                  <Badge variant="neutral" className="text-[9px]">{ol.fulfillmentStatus}</Badge>
                                </td>
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
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

                {selectedSeller.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                    <span className="font-semibold text-rose-700 font-mono text-[10px] uppercase">Recorded Reason</span>
                    <p>{selectedSeller.rejectionReason}</p>
                  </div>
                )}

                {actionType ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-semibold text-slate-900 uppercase font-mono">
                      Confirm {actionType} Action
                    </h4>
                    <p className="text-xs text-slate-600">
                      {actionType === "APPROVE" && "Approving will authorize this studio to publish pieces and fulfill patron orders."}
                      {actionType === "REJECT" && "Rejecting will notify the applicant and block catalog publication. Please provide a clear reason."}
                      {actionType === "SUSPEND" && "Suspending will immediately unpublish all catalog pieces from the live storefront."}
                      {actionType === "REACTIVATE" && "Reactivating will restore the studio to approved standing."}
                    </p>

                    {(actionType === "REJECT" || actionType === "SUSPEND") && (
                      <div>
                        <label className="block text-[11px] font-mono text-slate-700 mb-1">
                          Reason / Feedback <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          placeholder="e.g. Incomplete tax compliance documentation or workshop audit pending."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400"
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
                            ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                            : "bg-rose-700 hover:bg-rose-800 text-white"
                        }
                      >
                        {isSubmitting ? "Applying..." : `Confirm ${actionType}`}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-600 font-mono">
                      Current Standing: <strong className="text-slate-950 font-bold">{selectedSeller.status}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedSeller.status !== "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() => setActionType("APPROVE")}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Studio
                        </Button>
                      )}

                      {selectedSeller.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => setActionType("REJECT")}
                          className="bg-rose-700 hover:bg-rose-800 text-white text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Application
                        </Button>
                      )}

                      {selectedSeller.status === "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() => setActionType("SUSPEND")}
                          className="bg-amber-700 hover:bg-amber-800 text-white text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Suspend Studio
                        </Button>
                      )}

                      {selectedSeller.status === "SUSPENDED" && (
                        <Button
                          size="sm"
                          onClick={() => setActionType("REACTIVATE")}
                          className="bg-slate-950 hover:bg-slate-800 text-white text-xs cursor-pointer"
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

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  X,
  FileText,
  IndianRupee,
} from "lucide-react";
import { DisputeCaseView, DisputeStatus } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeCaseView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<DisputeCaseView | null>(null);

  const [resolutionType, setResolutionType] = useState<"RESOLVED_REFUNDED" | "RESOLVED_REJECTED" | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/disputes");
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load dispute cases.");
      }
    } catch {
      setActionError("Network error while loading dispute cases.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleOpenArbitration = (c: DisputeCaseView, type: "RESOLVED_REFUNDED" | "RESOLVED_REJECTED") => {
    setSelectedCase(c);
    setResolutionType(type);
    setRefundAmount(c.refundAmount || 0);
    setResolutionNotes("");
    setActionError(null);
  };

  const handleExecuteResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !resolutionType) return;

    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      setActionError("Formal arbitration notes (minimum 5 characters) are required.");
      return;
    }

    if (resolutionType === "RESOLVED_REFUNDED" && refundAmount <= 0) {
      setActionError("A positive refund amount is required for refund authorization.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/disputes/${selectedCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: resolutionType,
          notes: resolutionNotes.trim(),
          refundAmount: resolutionType === "RESOLVED_REFUNDED" ? Number(refundAmount) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Dispute case ${selectedCase.id} successfully arbitrated as ${resolutionType}.`);
        setSelectedCase(null);
        setResolutionType(null);
        fetchDisputes();
      } else {
        setActionError(data.error || "Failed to resolve dispute.");
      }
    } catch {
      setActionError("Network error while submitting dispute arbitration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisputeBadge = (status: DisputeStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="warning">Open Case</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="warning">Under Investigation</Badge>;
      case "RESOLVED_REFUNDED":
        return <Badge variant="success">Refund Authorized</Badge>;
      case "RESOLVED_REJECTED":
        return <Badge variant="outline" className="border-rose-500/40 text-rose-400">Claim Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="border-zinc-700 text-zinc-500">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Patron Protection & Claims
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Disputes, Returns & Refund Arbitration
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Arbitrate customer return requests, review transit damage evidence, and authorize escrow refunds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDisputes}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

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

      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading dispute claims...</p>
        </div>
      ) : disputes.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800/50 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-zinc-200">No active dispute cases</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            All customer orders are currently in good standing with zero open complaints.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((c) => {
            const isTerminal = c.status === "RESOLVED_REFUNDED" || c.status === "RESOLVED_REJECTED";

            return (
              <div
                key={c.id}
                className="p-5 bg-zinc-950/60 border border-zinc-800 rounded hover:border-zinc-700/70 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-zinc-200">
                      Case #{c.id}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Order Ref: #{c.orderId.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(c.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getDisputeBadge(c.status)}
                    {c.refundAmount && (
                      <span className="font-mono text-xs text-emerald-400 font-medium">
                        Refund: {formatCurrency(c.refundAmount)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-500">Patron Complaint</span>
                      <p className="text-zinc-200 mt-0.5 leading-relaxed">{c.reason}</p>
                    </div>

                    {c.evidence && (
                      <div className="pt-1">
                        <a
                          href={c.evidence}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Photographic Evidence
                        </a>
                      </div>
                    )}

                    {c.internalNotes && (
                      <div className="p-3 bg-zinc-900/50 border border-zinc-800/60 rounded text-xs text-zinc-400 space-y-0.5">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block">Arbitration History:</span>
                        <p>{c.internalNotes}</p>
                        {c.resolvedAt && (
                          <span className="text-[10px] text-zinc-500 font-mono block pt-1">
                            Resolved on {formatDateTime(c.resolvedAt)} by {c.resolvedBy || "admin"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-zinc-900/30 border border-zinc-800/60 rounded space-y-2 text-xs h-fit">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-500">Patron</span>
                      <p className="text-zinc-200 font-medium">{c.customerName}</p>
                      <p className="text-zinc-500 font-mono text-[11px]">{c.customerEmail}</p>
                    </div>

                    {c.sellerName && (
                      <div>
                        <span className="text-[10px] font-mono uppercase text-zinc-500">Target Studio</span>
                        <p className="text-zinc-300">{c.sellerName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {!isTerminal && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/60">
                    <Button
                      size="sm"
                      onClick={() => handleOpenArbitration(c, "RESOLVED_REFUNDED")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Authorize Refund
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenArbitration(c, "RESOLVED_REJECTED")}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject Claim
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedCase && resolutionType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteResolution}
            className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  {resolutionType === "RESOLVED_REFUNDED" ? "Authorize Patron Refund" : "Reject Dispute Claim"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCase(null);
                  setResolutionType(null);
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Case #{selectedCase.id} • Patron: {selectedCase.customerName}
            </p>

            {resolutionType === "RESOLVED_REFUNDED" && (
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Refund Amount (INR) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
                    required
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Adjustment will be deducted from escrow ledger and logged to order audit trail.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Arbitration Rationale / Customer Note <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Courier transit scratch verified via high-res photograph. Full compensation authorized."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCase(null);
                  setResolutionType(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className={
                  resolutionType === "RESOLVED_REFUNDED"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-rose-600 hover:bg-rose-500 text-white"
                }
              >
                {isSubmitting ? "Processing..." : "Confirm Arbitration"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

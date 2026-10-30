"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Phone,
  Mail,
  User,
  X,
  Smartphone,
  Truck,
  RotateCcw,
} from "lucide-react";
import { FraudReviewRecord, RiskLevel, RiskReviewStatus } from "@/types/payment-fraud";
import { formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminFraudReviewPage() {
  const [records, setRecords] = useState<FraudReviewRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state
  const [activeReviewRecord, setActiveReviewRecord] = useState<FraudReviewRecord | null>(null);
  const [decision, setDecision] = useState<RiskReviewStatus>("APPROVED");
  const [overrideReason, setOverrideReason] = useState("");
  const [isFalsePositive, setIsFalsePositive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (levelFilter !== "ALL") params.set("riskLevel", levelFilter);
      if (statusFilter !== "ALL") params.set("reviewStatus", statusFilter);

      const res = await fetch(`/api/admin/fraud/assessments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  }, [levelFilter, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenReview = (record: FraudReviewRecord) => {
    setActiveReviewRecord(record);
    setDecision("APPROVED");
    setOverrideReason("");
    setIsFalsePositive(false);
    setReviewError("");
  };

  const handleCloseReview = () => {
    setActiveReviewRecord(null);
    setReviewError("");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewRecord) return;
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      setReviewError("A mandatory explanatory reason (at least 5 characters) is required.");
      return;
    }

    setIsSubmitting(true);
    setReviewError("");

    try {
      const res = await fetch(`/api/admin/fraud/assessments/${activeReviewRecord.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          overrideReason: overrideReason.trim(),
          isFalsePositive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to update review status.");
      } else {
        handleCloseReview();
        fetchRecords();
      }
    } catch {
      setReviewError("Network error saving fraud decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.customerEmail.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  // Calculate metrics
  const highRiskCount = records.filter((r) => r.riskLevel === "HIGH").length;
  const mediumRiskCount = records.filter((r) => r.riskLevel === "MEDIUM").length;
  const pendingCount = records.filter((r) => r.reviewStatus === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-zinc-900" />
            <span>Fraud Prevention & Order Risk Control</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Operational risk evaluation, multi-signal verification, and administrative manual override
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRecords} isLoading={isLoading}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Link href="/admin/cod">
            <Button variant="primary" size="sm">
              <Truck className="w-3.5 h-3.5" />
              <span>COD Remittance</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Assessed
          </span>
          <p className="text-2xl font-black text-zinc-950 font-mono">{totalCount}</p>
          <span className="text-[10px] text-zinc-400">Recorded sessions</span>
        </div>

        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            High Risk Alerts
          </span>
          <p className="text-2xl font-black text-rose-700 font-mono">{highRiskCount}</p>
          <span className="text-[10px] text-rose-600">Requires heightened review</span>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Medium Risk
          </span>
          <p className="text-2xl font-black text-amber-700 font-mono">{mediumRiskCount}</p>
          <span className="text-[10px] text-amber-600">OTP / verification triggered</span>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Pending Action
          </span>
          <p className="text-2xl font-black text-zinc-950 font-mono">{pendingCount}</p>
          <span className="text-[10px] text-zinc-400">Awaiting operator review</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                levelFilter === level
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {level === "ALL" ? "All Levels" : `${level} Risk`}
            </button>
          ))}
          <div className="h-4 w-px bg-zinc-200 mx-1 hidden sm:block" />
          {["ALL", "PENDING", "APPROVED", "OVERRIDDEN"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === st
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search email, name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/75 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer & Verification</th>
                <th className="py-3 px-4">Risk Level & Score</th>
                <th className="py-3 px-4">Triggered Signals</th>
                <th className="py-3 px-4">Order History & RTO</th>
                <th className="py-3 px-4">Status & Decision</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <ShieldCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-800">No risk assessments found</p>
                    <p className="text-[11px] text-zinc-400">All customer checkout activity currently passes standard safety checks.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-950">{r.customerName}</div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-zinc-400" />
                        <span>{r.customerEmail}</span>
                      </div>
                      <div className="text-[10px] mt-1 flex items-center gap-1.5">
                        {r.isPhoneVerified ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Mobile Verified
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium inline-flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Unverified Mobile
                          </span>
                        )}
                        {r.phone && <span className="text-zinc-400 font-mono">{r.phone}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-black font-mono ${
                          r.riskScore >= 70 ? "text-rose-600" : r.riskScore >= 35 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {r.riskScore}/100
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          r.riskLevel === "HIGH"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : r.riskLevel === "MEDIUM"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}>
                          {r.riskLevel}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        Action: <span className="font-semibold text-zinc-700">{r.recommendedAction}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {r.triggeredReasons.length === 0 ? (
                        <span className="text-[11px] text-zinc-400 italic">No flags triggered</span>
                      ) : (
                        <div className="space-y-1">
                          {r.triggeredReasons.slice(0, 2).map((reason, idx) => (
                            <div key={idx} className="text-[11px] text-zinc-700 flex items-start gap-1 leading-tight">
                              <span className="text-rose-500 font-bold shrink-0">•</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                          {r.triggeredReasons.length > 2 && (
                            <span className="text-[10px] font-semibold text-zinc-400 block">
                              +{r.triggeredReasons.length - 2} more reasons
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-zinc-600">
                          Total Orders: <span className="font-mono font-semibold text-zinc-900">{r.orderHistory?.totalOrders || 0}</span>
                        </div>
                        <div className="text-zinc-600">
                          Prior RTOs: <span className={`font-mono font-semibold ${r.signals?.priorRtoCount > 0 ? "text-rose-600" : "text-zinc-700"}`}>{r.signals?.priorRtoCount || 0}</span>
                        </div>
                        <div className="text-zinc-600">
                          COD Refusals: <span className={`font-mono font-semibold ${r.signals?.priorCodRefusalCount > 0 ? "text-rose-600" : "text-zinc-700"}`}>{r.signals?.priorCodRefusalCount || 0}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        r.reviewStatus === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.reviewStatus === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : r.reviewStatus === "OVERRIDDEN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-zinc-100 text-zinc-700"
                      }`}>
                        {r.reviewStatus}
                      </span>
                      {r.isFalsePositive && (
                        <span className="text-[9px] font-bold text-emerald-700 block mt-1">
                          ✓ False Positive Corrected
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 block mt-0.5 font-mono">
                        {formatDateTime(r.assessedAt)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(r)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Manual Override Modal */}
      {activeReviewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-zinc-950" />
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                  Administrative Risk Review
                </h3>
              </div>
              <button onClick={handleCloseReview} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-semibold text-zinc-950">{activeReviewRecord.customerName} ({activeReviewRecord.customerEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Evaluated Score:</span>
                <span className="font-mono font-bold text-zinc-950">{activeReviewRecord.riskScore}/100 ({activeReviewRecord.riskLevel} Risk)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Current Action:</span>
                <span className="font-semibold text-zinc-950">{activeReviewRecord.recommendedAction}</span>
              </div>
            </div>

            {/* Triggered Reasons */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-700 block">Triggered Signals:</span>
              <ul className="list-disc list-inside space-y-1 text-xs text-rose-700 bg-rose-50/50 p-3 rounded-xl border border-rose-200">
                {activeReviewRecord.triggeredReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Administrative Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "APPROVED", label: "Allow / Clear" },
                    { id: "OVERRIDDEN", label: "Manual Override" },
                    { id: "REJECTED", label: "Enforce Block" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDecision(d.id as RiskReviewStatus)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        decision === d.id
                          ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mandatory Explanatory Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the audit justification for this override (e.g. Verified customer over phone call, authorized bypass for repeat patron)..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700">
                <input
                  type="checkbox"
                  checked={isFalsePositive}
                  onChange={(e) => setIsFalsePositive(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-900"
                />
                <span>Mark as False Positive (mitigate future risk scoring penalties for this patron)</span>
              </label>

              {reviewError && (
                <p className="text-xs text-rose-600 font-semibold">{reviewError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button variant="outline" size="sm" type="button" onClick={handleCloseReview}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                  Save Decision & Audit Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

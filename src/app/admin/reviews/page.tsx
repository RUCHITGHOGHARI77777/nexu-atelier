"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flag,
  User,
  Package,
  Clock,
  ShieldCheck,
  X,
  Info,
} from "lucide-react";
import { AdminModerationReviewDTO } from "@/types/review";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AdminReviewsModerationPage() {
  const [queue, setQueue] = useState<AdminModerationReviewDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Moderation Action Modal
  const [activeReview, setActiveReview] = useState<AdminModerationReviewDTO | null>(null);
  const [actionType, setActionType] = useState<"APPROVED" | "REMOVED">("APPROVED");
  const [reasonCode, setReasonCode] = useState<string>("POLICY_COMPLIANT");
  const [actionNote, setActionNote] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/reviews");
      if (!res.ok) {
        throw new Error("Failed to load moderation queue.");
      }
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (err: any) {
      setError(err.message || "Failed to load moderation queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/admin/reviews/${activeReview.id}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          reasonCode: actionType === "REMOVED" ? reasonCode : "APPROVED_POLICY_COMPLIANT",
          note: actionNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute moderation action.");
      }

      setActiveReview(null);
      setActionNote("");
      loadQueue();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to execute moderation action.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold">
              Trust & Safety Engine
            </span>
            <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">
              Community Moderation
            </Badge>
          </div>
          <h1 className="text-3xl font-serif text-white tracking-tight">
            Review Moderation Queue
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Audit flagged and reported patron reviews. Enforce community guidelines against hate speech, spam, and PII leaks while protecting honest critical feedback.
          </p>
        </div>

        <Button
          onClick={loadQueue}
          variant="outline"
          className="text-xs border-zinc-700 hover:bg-zinc-800 self-start md:self-auto"
        >
          Refresh Queue
        </Button>
      </div>

      {/* Policy Protection Banner */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-5 flex items-start gap-4">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 leading-relaxed">
          <strong className="text-amber-300 font-semibold block mb-0.5">
            Marketplace Policy Rule: Critical Reviews are Strictly Protected
          </strong>
          Patrons have the fundamental right to express authentic disappointment with sizing, materials, or shipping delays. Reviews must NEVER be removed for expressing low ratings or negative opinions. Removals are exclusively permitted for verified spam, personal identifiable information (PII), profanity/hate speech, or illegal solicitation.
        </div>
      </div>

      {/* Moderation Queue */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-red-400 text-center">
          {error}
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-medium text-white">Moderation Queue Clear</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            All customer reviews are in good standing. No pending or reported reviews require manual moderation intervention at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            {queue.length} Review{queue.length > 1 ? "s" : ""} Requiring Adjudication
          </div>

          {queue.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 lg:p-8 space-y-6 transition-all hover:border-zinc-700"
            >
              {/* Review Card Top Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {item.customerName}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        ({item.customerEmail})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <Package className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-amber-400 font-medium">{item.productTitle}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.isVerifiedPurchase && (
                    <Badge variant="success" className="text-[10px] py-1">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verified Purchase
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= item.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <Badge variant="warning" className="text-[10px] py-1 flex items-center gap-1">
                    <Flag className="w-3 h-3 text-rose-400" />
                    {item.reportCount} Report{item.reportCount > 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-2">
                {item.title && (
                  <h4 className="text-base font-semibold text-white tracking-tight">
                    {item.title}
                  </h4>
                )}
                <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                  {item.comment || <span className="italic text-zinc-500">No written text provided (Star-only rating).</span>}
                </p>
              </div>

              {/* Attached Abuse Reports */}
              {item.reports.length > 0 && (
                <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Evidence & Reporter Allegations
                  </div>
                  <div className="space-y-2 divide-y divide-rose-950/60">
                    {item.reports.map((rep, idx) => (
                      <div key={idx} className="pt-2 text-xs text-zinc-300 flex items-start justify-between gap-4">
                        <div>
                          <Badge variant="outline" className="text-[10px] text-rose-300 border-rose-800 mr-2">
                            {rep.reasonCode}
                          </Badge>
                          <span>{rep.explanation || "No additional explanation provided."}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                          {rep.reporterEmail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  onClick={() => {
                    setActiveReview(item);
                    setActionType("APPROVED");
                    setActionNote("");
                  }}
                  variant="outline"
                  className="text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Dismiss Reports & Keep Published
                </Button>

                <Button
                  onClick={() => {
                    setActiveReview(item);
                    setActionType("REMOVED");
                    setReasonCode("INAPPROPRIATE_LANGUAGE");
                    setActionNote("");
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Remove Violating Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moderation Confirmation Modal */}
      {activeReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveReview(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif text-white mb-1">
              {actionType === "APPROVED" ? "Dismiss Reports & Reinstate Review" : "Remove Policy-Violating Review"}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              {actionType === "APPROVED"
                ? "This will dismiss all reports, keep the review published, and log an approval event in the audit trail."
                : "This will remove the review from public display, exclude its score from product aggregates, and record the action in the audit log."}
            </p>

            {submitError && (
              <div className="p-3 mb-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleExecuteAction} className="space-y-4">
              {actionType === "REMOVED" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Specific Policy Violation Code *
                  </label>
                  <select
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="SPAM">Commercial spam or automated bot submission</option>
                    <option value="INAPPROPRIATE_LANGUAGE">Profanity, abusive speech, or hate content</option>
                    <option value="PII">Personal Identifiable Information (phone, address, credentials)</option>
                    <option value="HARASSMENT">Targeted harassment of vendor or staff</option>
                    <option value="ADVERTISING">External competitor link or promotion</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Administrative Note (Logged for Audit & Transparency)
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Provide objective audit justification..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveReview(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`text-xs font-semibold px-5 ${
                    actionType === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-red-600 hover:bg-red-500 text-white"
                  }`}
                >
                  {submitting ? "Processing..." : actionType === "APPROVED" ? "Confirm Approval" : "Confirm Removal"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

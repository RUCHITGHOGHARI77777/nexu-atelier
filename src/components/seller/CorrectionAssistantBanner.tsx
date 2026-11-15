"use client";

import React, { useState } from "react";
import { AlertCircle, History, Sparkles, ChevronRight, X } from "lucide-react";
import { ProductRevisionRecord } from "@/types/listing-engine";

interface CorrectionAssistantBannerProps {
  moderationNotes?: string | null;
  rejectedFields?: string[];
  suggestedCorrections?: string | null;
  productId: string;
  onNavigateToField?: (fieldKey: string) => void;
}

export function CorrectionAssistantBanner({
  moderationNotes,
  rejectedFields = [],
  suggestedCorrections,
  productId,
  onNavigateToField,
}: CorrectionAssistantBannerProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [revisions, setRevisions] = useState<ProductRevisionRecord[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const fetchRevisions = async () => {
    setShowHistoryModal(true);
    setLoadingRevisions(true);
    try {
      const res = await fetch(`/api/products/${productId}/revisions`);
      if (res.ok) {
        const body = await res.json();
        setRevisions(body.revisions || []);
      }
    } catch {
    } finally {
      setLoadingRevisions(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">
                  Curator Editorial Feedback — Action Required
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-200 text-amber-900 uppercase">
                  Changes Requested
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                {moderationNotes || "The curation team has reviewed your submission and requested adjustments before publication."}
              </p>

              {rejectedFields.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-amber-900 mr-1">
                    Specific fields requiring revision:
                  </span>
                  {rejectedFields.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => onNavigateToField?.(f)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 transition-colors shadow-2xs"
                    >
                      <span>{f}</span>
                      <ChevronRight className="w-3 h-3 text-amber-600" />
                    </button>
                  ))}
                </div>
              )}

              {suggestedCorrections && (
                <div className="mt-3 p-3 rounded-lg bg-white/90 border border-amber-200 text-xs text-zinc-800 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-950">Suggested Curator Adjustment:</strong>
                    <div className="mt-0.5 text-zinc-700">{suggestedCorrections}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={fetchRevisions}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-white px-3 py-1.5 rounded-lg border border-amber-300 hover:bg-amber-100/70 shadow-2xs transition-colors"
          >
            <History className="w-3.5 h-3.5 text-amber-700" />
            <span>Revision History</span>
          </button>
        </div>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-950">Product Revision History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {loadingRevisions ? (
                <div className="py-8 text-center text-zinc-400">Loading revision snapshots...</div>
              ) : revisions.length === 0 ? (
                <div className="py-8 text-center text-zinc-500">No previous revisions recorded.</div>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-zinc-900">
                        Revision #{rev.revisionNumber} — {rev.snapshot?.approvalStatus || "Snapshot"}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {rev.adminFeedback && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 font-medium">
                        Curator feedback: {rev.adminFeedback}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-600">
                      <div>Title: {rev.snapshot?.title}</div>
                      <div>Base Price: ₹{rev.snapshot?.basePricePaise ? (rev.snapshot.basePricePaise / 100).toLocaleString() : "-"}</div>
                      <div>Variants: {rev.snapshot?.variants?.length || 0}</div>
                      <div>Images: {rev.snapshot?.images?.length || 0}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

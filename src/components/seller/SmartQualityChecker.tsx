"use client";

import React, { useState } from "react";
import { SmartListingQualityResult } from "@/types/listing-engine";
import { ShieldCheck, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Lightbulb, ArrowUpRight } from "lucide-react";

interface SmartQualityCheckerProps {
  evaluation: SmartListingQualityResult | null;
  onNavigateToField?: (fieldKey: string) => void;
  isLoading?: boolean;
}

export function SmartQualityChecker({
  evaluation,
  onNavigateToField,
  isLoading = false,
}: SmartQualityCheckerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!evaluation) {
    return (
      <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-500 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
          <span>Smart Quality Checker active</span>
        </span>
        <span className="text-[11px] text-zinc-400">Complete fields to calculate quality score</span>
      </div>
    );
  }

  const { score, canSubmit, errors, warnings, suggestions, breakdown, summary } = evaluation;

  // Determine score color
  let scoreColorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
  let ringColor = "stroke-emerald-600";
  if (score < 50) {
    scoreColorClass = "text-rose-700 bg-rose-50 border-rose-200";
    ringColor = "stroke-rose-600";
  } else if (score < 80) {
    scoreColorClass = "text-amber-700 bg-amber-50 border-amber-200";
    ringColor = "stroke-amber-600";
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
      {/* Top Header Card */}
      <div className="p-4 flex items-center justify-between bg-zinc-50/50 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          {/* Circular Score Gauge */}
          <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
            <svg className="w-11 h-11 transform -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="18"
                strokeWidth="3.5"
                className="stroke-zinc-200"
                fill="none"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                strokeWidth="3.5"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * score) / 100}
                className={`${ringColor} transition-all duration-500`}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-xs font-bold text-zinc-900">{score}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                Smart Listing Quality
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${scoreColorClass}`}>
                {canSubmit ? "Submission Eligible" : `${errors.length} Blocker(s)`}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xl line-clamp-1">{summary}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Category breakdown bars */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-[11px]">
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="text-zinc-500">Core Details</div>
              <div className="font-bold text-zinc-900 mt-0.5">{breakdown.coreDetails} / 25</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="text-zinc-500">Specifications</div>
              <div className="font-bold text-zinc-900 mt-0.5">{breakdown.categoryAttributes} / 25</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="text-zinc-500">Photography</div>
              <div className="font-bold text-zinc-900 mt-0.5">{breakdown.mediaQuality} / 20</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="text-zinc-500">Variants & Stock</div>
              <div className="font-bold text-zinc-900 mt-0.5">{breakdown.variantsAndStock} / 15</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="text-zinc-500">Pricing & Claims</div>
              <div className="font-bold text-zinc-900 mt-0.5">{breakdown.pricingSanity} / 15</div>
            </div>
          </div>

          {/* Hard Blocker Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Hard Blockers ({errors.length}) — Must resolve before submitting</span>
              </div>
              <div className="space-y-1.5">
                {errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/70 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-rose-900">{err.message}</div>
                      {err.tip && <div className="text-[11px] text-rose-700 mt-0.5">Tip: {err.tip}</div>}
                    </div>
                    {onNavigateToField && (
                      <button
                        type="button"
                        onClick={() => onNavigateToField(err.field)}
                        className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-white px-2.5 py-1 rounded-md border border-rose-200 hover:bg-rose-100/60 shadow-2xs"
                      >
                        <span>Fix</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Recommendations */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Quality Recommendations ({warnings.length})</span>
              </div>
              <div className="space-y-1.5">
                {warnings.map((warn, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-amber-200 bg-amber-50/60 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-amber-950 font-medium">{warn.message}</div>
                      {warn.tip && <div className="text-[11px] text-amber-800 mt-0.5">Tip: {warn.tip}</div>}
                    </div>
                    {onNavigateToField && (
                      <button
                        type="button"
                        onClick={() => onNavigateToField(warn.field)}
                        className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100/50"
                      >
                        <span>Review</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs flex items-center gap-2 text-zinc-600"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    <strong>{sug.message}</strong> {sug.tip && `— ${sug.tip}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Standard Disclaimer */}
          <div className="text-[10px] text-zinc-400 italic pt-1 border-t border-zinc-100">
            * Listing completeness score evaluates adherence to NEXU Atelier catalog standards. Marketplace ranking and patron purchase decisions depend on demand, provenance, and artisan reputation.
          </div>
        </div>
      )}
    </div>
  );
}

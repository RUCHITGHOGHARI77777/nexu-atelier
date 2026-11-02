"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  TrendingUp,
  Store,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Filter,
  MessageSquare,
  IndianRupee,
  Share2,
  Heart,
  Truck,
  Box,
} from "lucide-react";
import { useStore, PlatformReview } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";
import { SubmitReviewModal } from "@/components/reviews/SubmitReviewModal";

export default function TrustWallPage() {
  const { reviews, platformOverallScore } = useStore();

  const [filterType, setFilterType] = useState<"ALL" | "SELLER" | "CUSTOMER">("ALL");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const filteredReviews = useMemo(() => {
    if (filterType === "ALL") return reviews;
    return reviews.filter((r) => r.type === filterType);
  }, [reviews, filterType]);

  const sellerReviewsCount = useMemo(() => reviews.filter((r) => r.type === "SELLER").length, [reviews]);
  const customerReviewsCount = useMemo(() => reviews.filter((r) => r.type === "CUSTOMER").length, [reviews]);

  const totalCommissionsSaved = useMemo(() => {
    return reviews.reduce((acc, r) => acc + (r.savedCommissionINR || 0), 0);
  }, [reviews]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-slate-900 animate-in fade-in duration-300">
      {/* Back to Catalog */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace Storefront</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-98 cursor-pointer transition-all"
        >
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>✍️ Submit Live Review (1 to 10 Score)</span>
        </button>
      </div>

      {/* --- HERO TRUST WALL BANNER --- */}
      <div className="relative rounded-3xl border border-white/90 ring-1 ring-slate-900/5 bg-gradient-to-br from-white/95 via-white/80 to-emerald-50/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-6 sm:p-10 space-y-6 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold uppercase tracking-wider">
                🌟 PUBLIC REVIEWS & VERIFIED TRUST WALL
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>100% Authentic Bank & P2P Verified</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              Real Indian Makers. Real Buyers. Zero Marketing Hype.
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Read uncensored stories from verified sellers who escaped Amazon, Flipkart, and Meesho's abusive commission traps, alongside authentic reviews from patrons who received museum-grade handcrafted goods directly at studio pricing.
            </p>
          </div>

          {/* Big Live Overall Score Badge */}
          <div className="p-6 rounded-3xl bg-slate-950 text-white shadow-xl text-center space-y-2 shrink-0 border border-slate-800">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
              OVERALL PLATFORM SCORE
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {platformOverallScore}
              </span>
              <span className="text-sm font-mono text-slate-400 font-bold">/ 10</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Across {reviews.length} Verified Submissions
            </p>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="pt-4 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
              Commission Saved for Sellers
            </span>
            <span className="text-base font-black font-mono text-emerald-700">
              {formatCurrency(totalCommissionsSaved)}+
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
              Seller Empowerment Score
            </span>
            <span className="text-base font-black font-mono text-slate-950">
              10 / 10 Flawless
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
              Payment Dispute Rate
            </span>
            <span className="text-base font-black font-mono text-emerald-700">
              0.0% (Direct UPI P2P)
            </span>
          </div>
        </div>
      </div>

      {/* --- STREAM FILTER CONTROLS --- */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "ALL"
                ? "bg-slate-950 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
            }`}
          >
            All Reviews ({reviews.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("SELLER")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterType === "SELLER"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>🏪 Seller Stories ({sellerReviewsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType("CUSTOMER")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterType === "CUSTOMER"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>🛍️ Customer Reviews ({customerReviewsCount})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* --- REVIEWS STREAM GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReviews.map((rev) => (
          <div
            key={rev.id}
            className={`rounded-3xl border p-6 sm:p-7 space-y-4 backdrop-blur-2xl transition-all duration-300 hover:shadow-lg ${
              rev.type === "SELLER"
                ? "bg-gradient-to-br from-white/95 to-emerald-50/30 border-emerald-200/80 shadow-[0_8px_30px_rgb(5,150,105,0.05)]"
                : "bg-white/95 border-slate-200/80 shadow-[0_8px_30px_rgb(15,23,42,0.04)]"
            }`}
          >
            {/* Header: Score & Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      rev.type === "SELLER"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    }`}
                  >
                    {rev.type === "SELLER" ? "🏪 VERIFIED SELLER STORY" : "🛍️ VERIFIED PATRON"}
                  </span>
                  {rev.previousMarketplace && (
                    <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-bold">
                      Left {rev.previousMarketplace}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-extrabold text-slate-950 leading-snug pt-1">
                  "{rev.headline}"
                </h3>
              </div>

              {/* Score Meter */}
              <div className="px-3 py-1.5 rounded-2xl bg-slate-950 text-white font-mono text-center shrink-0">
                <span className="text-base font-black text-amber-400 block leading-none">
                  {rev.ratingScore}
                </span>
                <span className="text-[9px] text-slate-400 block font-bold">/ 10</span>
              </div>
            </div>

            {/* Quote Body */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {rev.comment}
            </p>

            {/* Specific Seller Savings Callout */}
            {rev.savedCommissionINR && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <span className="text-emerald-900 font-medium">Monthly Commission Saved:</span>
                <span className="font-mono font-black text-emerald-800 text-sm">
                  +{formatCurrency(rev.savedCommissionINR)}/mo Extra Profit
                </span>
              </div>
            )}

            {/* Specific Customer Ratings Bar */}
            {rev.type === "CUSTOMER" && rev.productTitle && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[11px] text-slate-500 font-mono block">
                  Purchased: <strong className="text-slate-800">{rev.productTitle}</strong>
                </span>
                <div className="flex items-center gap-4 text-[11px] text-slate-600">
                  <span>Product Quality: <strong className="text-emerald-700 font-bold">5/5 ★</strong></span>
                  <span>•</span>
                  <span>Delivery Speed: <strong className="text-emerald-700 font-bold">5/5 ★</strong></span>
                </div>
              </div>
            )}

            {/* Author Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                  {rev.authorName.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{rev.authorName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {rev.storeName ? `${rev.storeName} • ` : ""}{rev.authorCity}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-[11px] text-slate-400">
                <span>{rev.date}</span>
                <span className="block text-emerald-700 font-bold">Verified ✓</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- SUBMIT REVIEW MODAL --- */}
      <SubmitReviewModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />
    </div>
  );
}


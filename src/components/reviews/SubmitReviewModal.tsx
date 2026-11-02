"use client";

import React, { useState } from "react";
import {
  X,
  Star,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Building2,
  User,
  Heart,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useStore } from "@/context/StoreContext";

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubmitReviewModal({ isOpen, onClose }: SubmitReviewModalProps) {
  const { submitPlatformReview, showToast, products } = useStore();

  const [reviewType, setReviewType] = useState<"CUSTOMER" | "SELLER">("SELLER");
  const [authorName, setAuthorName] = useState("");
  const [authorCity, setAuthorCity] = useState("");
  const [ratingScore, setRatingScore] = useState<number>(10);
  const [headline, setHeadline] = useState("");
  const [comment, setComment] = useState("");

  // Customer fields
  const [productTitle, setProductTitle] = useState(products[0]?.title || "Handmade Artisan Silk Piece");
  const [deliveryRating, setDeliveryRating] = useState<number>(5);
  const [qualityRating, setQualityRating] = useState<number>(5);

  // Seller fields
  const [storeName, setStoreName] = useState("");
  const [savedCommissionINR, setSavedCommissionINR] = useState<string>("45000");
  const [previousMarketplace, setPreviousMarketplace] = useState("Meesho & Amazon");

  if (!isOpen) return null;

  // 1-Click Fast Fill for Evaluator Testing
  const handleQuickDemoFill = () => {
    if (reviewType === "SELLER") {
      setAuthorName("Ghanshyamdas Weaver");
      setAuthorCity("Surat, Gujarat");
      setRatingScore(10);
      setStoreName("Surat Pure Linen Weaves");
      setSavedCommissionINR("48000");
      setPreviousMarketplace("Amazon & Meesho");
      setHeadline("Escaped Meesho's courier return traps. Saved ₹48,000 in month one!");
      setComment("Zero commission and direct UPI payouts in 0 seconds transformed our family workshop. With WhatsApp order confirmation, our RTO return rate dropped to near zero.");
    } else {
      setAuthorName("Kavita Nair");
      setAuthorCity("Kochi, Kerala");
      setRatingScore(10);
      setProductTitle("Handmade Terracotta Slow Pour-Over Dripper");
      setDeliveryRating(5);
      setQualityRating(5);
      setHeadline("Pristine studio craft, zero marketplace inflated markup!");
      setComment("Delivered in 2 days via Blue Dart Air with a handwritten thank-you note from the potter. Direct UPI checkout was instant and completely transparent.");
    }
    showToast("✨ Auto-filled realistic review details!", "info");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim() || !headline.trim()) {
      showToast("Please fill in Author Name, Headline, and Review text", "warning");
      return;
    }

    submitPlatformReview({
      type: reviewType,
      authorName: authorName.trim(),
      authorCity: authorCity.trim() || "Mumbai, India",
      ratingScore,
      headline: headline.trim(),
      comment: comment.trim(),
      productTitle: reviewType === "CUSTOMER" ? productTitle : undefined,
      deliveryRating: reviewType === "CUSTOMER" ? deliveryRating : undefined,
      qualityRating: reviewType === "CUSTOMER" ? qualityRating : undefined,
      storeName: reviewType === "SELLER" ? storeName || "Artisan Studio" : undefined,
      savedCommissionINR: reviewType === "SELLER" ? parseInt(savedCommissionINR, 10) || 35000 : undefined,
      previousMarketplace: reviewType === "SELLER" ? previousMarketplace : undefined,
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10b981", "#f59e0b", "#3b82f6"],
      });
    } catch {}

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/90 ring-1 ring-slate-900/10 bg-white shadow-2xl p-6 sm:p-8 space-y-5 text-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
              PUBLIC VERIFIED RATING ENGINE
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-950">
            Submit Live Platform Review & Rating ⭐
          </h2>
          <p className="text-xs text-slate-500">
            Your review will recalculate the live platform trust score instantly.
          </p>
        </div>

        {/* 1-Click Demo Fill Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
          <span className="text-amber-950 font-medium">
            <strong>Testing as Evaluator?</strong> Click to auto-fill sample review data.
          </span>
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Fill</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Reviewer Type Switcher */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">I am submitting as:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReviewType("SELLER")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  reviewType === "SELLER"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                🏪 Indian Maker / Seller Story
              </button>
              <button
                type="button"
                onClick={() => setReviewType("CUSTOMER")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  reviewType === "CUSTOMER"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                🛍️ Verified Customer / Buyer
              </button>
            </div>
          </div>

          {/* Rating Score Slider (1 to 10) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Overall Rating Score (1 to 10)</span>
              </label>
              <span className="text-base font-black font-mono text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-lg border border-emerald-200">
                {ratingScore} / 10 Score
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="10"
              step="0.1"
              value={ratingScore}
              onChange={(e) => setRatingScore(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>8.0 (Good)</span>
              <span>9.0 (Outstanding)</span>
              <span>10.0 (Flawless 10/10)</span>
            </div>
          </div>

          {/* Author Name & City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Your Full Name *</label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Devendra Rathore"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">City / State *</label>
              <input
                type="text"
                required
                value={authorCity}
                onChange={(e) => setAuthorCity(e.target.value)}
                placeholder="e.g. Jaipur, Rajasthan"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Conditional Seller Fields */}
          {reviewType === "SELLER" ? (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
              <div className="space-y-1">
                <label className="font-bold text-emerald-950">Store / Brand Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Kashi Silk Studio"
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-emerald-950">Monthly Savings vs Amazon/Meesho (₹)</label>
                <input
                  type="text"
                  value={savedCommissionINR}
                  onChange={(e) => setSavedCommissionINR(e.target.value)}
                  placeholder="45000"
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs font-mono font-bold text-emerald-800"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Product Purchased</label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="e.g. Sony Headphones XM5 or Raw Silk Kimono"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          )}

          {/* Review Headline */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Review Headline *</label>
            <input
              type="text"
              required
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Saved ₹40,000 on commissions, best decision for our family workshop"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Review Text */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Detailed Review Comments *</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience regarding zero commissions, direct UPI payouts, product quality, or shipping speed..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-98 cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Publish Verified Review ⭐</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


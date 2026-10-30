"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  ShieldCheck,
  Truck,
  PackageCheck,
  MessageCircle,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import { SellerReputationScorecard } from "@/types/review";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default function SellerReputationPage() {
  const [scorecard, setScorecard] = useState<SellerReputationScorecard | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Response Modal State
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [replySubmitting, setReplySubmitting] = useState<boolean>(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const loadReputation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/seller/reputation");
      if (!res.ok) {
        throw new Error("Failed to load seller reputation scorecard.");
      }
      const data = await res.json();
      setScorecard(data.scorecard || null);
      setReviews(data.reviews || []);
      setFeedbacks(data.recentFeedbacks || []);
    } catch (err: any) {
      setError(err.message || "Failed to load seller reputation.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReputation();
  }, [loadReputation]);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyReviewId || !replyText.trim()) return;

    setReplySubmitting(true);
    setReplyError(null);

    try {
      const res = await fetch(`/api/seller/reviews/${replyReviewId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseText: replyText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish seller response.");
      }

      setReplyReviewId(null);
      setReplyText("");
      loadReputation();
    } catch (err: any) {
      setReplyError(err.message || "Failed to publish seller response.");
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold mb-1 block">
            Trust, Safety & Customer Sentiment
          </span>
          <h1 className="text-3xl font-serif text-white tracking-tight">
            Reputation & Review Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Monitor client satisfaction, fulfill service tier standards, and maintain official communication with patrons.
          </p>
        </div>

        <Button
          onClick={loadReputation}
          variant="outline"
          className="text-xs self-start md:self-auto border-zinc-700 hover:bg-zinc-800"
        >
          Refresh Metrics
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-red-400 text-center">
          {error}
        </div>
      ) : (
        <>
          {/* Reputation KPI Cards */}
          {scorecard && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Product Rating */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Product Rating</span>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-3xl font-serif font-bold text-white mb-1">
                  {scorecard.averageProductRating.toFixed(1)}{" "}
                  <span className="text-sm font-sans text-zinc-500 font-normal">/ 5.0</span>
                </div>
                <div className="text-xs text-zinc-400">
                  Across {scorecard.totalProductReviews} customer reviews
                </div>
              </div>

              {/* On-Time Dispatch Rate */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">On-Time Dispatch</span>
                  <Truck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-serif font-bold text-emerald-400 mb-1">
                  {scorecard.onTimeDispatchRate}%
                </div>
                <div className="text-xs text-zinc-400">
                  Target: ≥95% (Within 48h SLA)
                </div>
              </div>

              {/* Service Satisfaction */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Packaging Care</span>
                  <PackageCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-serif font-bold text-white mb-1">
                  {scorecard.packagingScore.toFixed(1)}{" "}
                  <span className="text-sm font-sans text-zinc-500 font-normal">/ 5.0</span>
                </div>
                <div className="text-xs text-zinc-400">
                  {scorecard.totalServiceFeedbacks} order service ratings
                </div>
              </div>

              {/* Response Rate */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between text-zinc-400 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Seller Response Rate</span>
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl font-serif font-bold text-white mb-1">
                  {scorecard.responseRate}%
                </div>
                <div className="text-xs text-zinc-400">
                  Patron inquiry response coverage
                </div>
              </div>
            </div>
          )}

          {/* Two Columns: Recent Product Reviews & Order Service Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 cols: Reviews and Official Responses */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif text-white">Piece Reviews & Official Replies</h2>
                <span className="text-xs text-zinc-500">{reviews.length} total reviews</span>
              </div>

              {reviews.length === 0 ? (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm">
                  No product reviews received yet for your catalog items.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                            {r.product.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-white">
                              {r.customer.name || "Customer"}
                            </span>
                            {r.isVerifiedPurchase && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Verified Order
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                          {[1, 2, 3, 4, 5].map((s: number) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= r.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {r.title && (
                        <h4 className="text-sm font-semibold text-zinc-100">{r.title}</h4>
                      )}

                      {r.comment && (
                        <p className="text-xs text-zinc-300 leading-relaxed">{r.comment}</p>
                      )}

                      {/* Official Seller Response */}
                      {r.sellerResponse ? (
                        <div className="bg-zinc-950/90 border-l-2 border-amber-500 rounded-r-xl p-3 mt-3">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-amber-400">
                              Your Official Seller Reply
                            </span>
                            <span className="text-zinc-500">
                              {new Date(r.sellerResponse.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300">{r.sellerResponse.responseText}</p>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <Button
                            onClick={() => {
                              setReplyReviewId(r.id);
                              setReplyText("");
                            }}
                            variant="outline"
                            className="text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          >
                            <Send className="w-3 h-3 mr-1.5" />
                            Post Official Response
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 5 cols: Order Service Feedback & Standards */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif text-white">Order Delivery Feedback</h2>
                <span className="text-xs text-zinc-500">{feedbacks.length} records</span>
              </div>

              {feedbacks.length === 0 ? (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm">
                  No post-delivery service ratings submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((f) => (
                    <div
                      key={f.id}
                      className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
                        <span>Order {f.order.id}</span>
                        <span>{new Date(f.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                          <div className="text-[10px] text-zinc-500 uppercase">Packaging</div>
                          <div className="font-bold text-amber-400 mt-0.5">{f.packagingRating}★</div>
                        </div>
                        <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                          <div className="text-[10px] text-zinc-500 uppercase">Delivery</div>
                          <div className="font-bold text-amber-400 mt-0.5">{f.deliveryRating}★</div>
                        </div>
                        <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                          <div className="text-[10px] text-zinc-500 uppercase">Comm.</div>
                          <div className="font-bold text-amber-400 mt-0.5">{f.communicationRating}★</div>
                        </div>
                      </div>

                      {f.comment && (
                        <p className="text-xs text-zinc-300 italic pt-1">&ldquo;{f.comment}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Official Reply Modal */}
      {replyReviewId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setReplyReviewId(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif text-white mb-1">Author Official Seller Reply</h3>
            <p className="text-xs text-zinc-400 mb-4">
              This response will appear publicly beneath the patron&apos;s review as an authenticated message from your studio.
            </p>

            {replyError && (
              <div className="p-3 mb-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
                {replyError}
              </div>
            )}

            <form onSubmit={handlePostReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Official Response Statement *
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank the patron for their feedback, address any concerns regarding dimensions or materials, and highlight studio care instructions..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
                  required
                  minLength={5}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplyReviewId(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={replySubmitting || replyText.trim().length < 5}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs px-5"
                >
                  {replySubmitting ? "Publishing..." : "Publish Official Reply"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans text-slate-900 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold mb-1 block font-mono">
            Trust, Safety &amp; Customer Sentiment
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950 tracking-tight">
            Reputation &amp; Review Management
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Monitor client satisfaction, fulfill service tier standards, and maintain official communication with patrons.
          </p>
        </div>

        <Button
          onClick={loadReputation}
          variant="outline"
          className="text-xs self-start md:self-auto border-slate-200 hover:bg-slate-50 text-slate-800"
        >
          Refresh Metrics
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-center text-xs">
          {error}
        </div>
      ) : (
        <>
          {scorecard && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Product Rating</span>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <div className="text-3xl font-serif font-bold text-slate-950 mb-1">
                  {scorecard.averageProductRating.toFixed(1)}{" "}
                  <span className="text-sm font-sans text-slate-400 font-normal">/ 5.0</span>
                </div>
                <div className="text-xs text-slate-500">
                  Across {scorecard.totalProductReviews} customer reviews
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">On-Time Dispatch</span>
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-serif font-bold text-emerald-700 mb-1">
                  {scorecard.onTimeDispatchRate}%
                </div>
                <div className="text-xs text-slate-500">
                  Target: ≥95% (Within 48h SLA)
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Packaging Care</span>
                  <PackageCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-3xl font-serif font-bold text-slate-950 mb-1">
                  {scorecard.packagingScore.toFixed(1)}{" "}
                  <span className="text-sm font-sans text-slate-400 font-normal">/ 5.0</span>
                </div>
                <div className="text-xs text-slate-500">
                  {scorecard.totalServiceFeedbacks} order service ratings
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Response Rate</span>
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-serif font-bold text-slate-950 mb-1">
                  {scorecard.responseRate}%
                </div>
                <div className="text-xs text-slate-500">
                  Patron inquiry response coverage
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-bold text-slate-950">Piece Reviews &amp; Official Replies</h2>
                <span className="text-xs text-slate-500 font-mono">{reviews.length} total reviews</span>
              </div>

              {reviews.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs shadow-xs">
                  No product reviews received yet for your catalog items.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider font-mono">
                            {r.product.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-slate-900">
                              {r.customer.name || "Customer"}
                            </span>
                            {r.isVerifiedPurchase && (
                              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Verified Order
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          {[1, 2, 3, 4, 5].map((s: number) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= r.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {r.title && (
                        <h4 className="text-sm font-semibold text-slate-950">{r.title}</h4>
                      )}

                      {r.comment && (
                        <p className="text-xs text-slate-700 leading-relaxed">{r.comment}</p>
                      )}

                      {r.sellerResponse ? (
                        <div className="bg-amber-50/60 border-l-2 border-amber-600 rounded-r-xl p-3 mt-3">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-amber-900">
                              Your Official Seller Reply
                            </span>
                            <span className="text-slate-500 text-[10px] font-mono">
                              {new Date(r.sellerResponse.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800">{r.sellerResponse.responseText}</p>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <Button
                            onClick={() => {
                              setReplyReviewId(r.id);
                              setReplyText("");
                            }}
                            variant="outline"
                            className="text-xs border-amber-300 text-amber-900 bg-amber-50/60 hover:bg-amber-100"
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

            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-bold text-slate-950">Order Delivery Feedback</h2>
                <span className="text-xs text-slate-500 font-mono">{feedbacks.length} records</span>
              </div>

              {feedbacks.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs shadow-xs">
                  No post-delivery service ratings submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2 font-mono">
                        <span>Order {f.order.id.slice(-8)}</span>
                        <span>{new Date(f.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Packaging</div>
                          <div className="font-bold text-amber-700 mt-0.5">{f.packagingRating}★</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Delivery</div>
                          <div className="font-bold text-amber-700 mt-0.5">{f.deliveryRating}★</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Comm.</div>
                          <div className="font-bold text-amber-700 mt-0.5">{f.communicationRating}★</div>
                        </div>
                      </div>

                      {f.comment && (
                        <p className="text-xs text-slate-700 italic pt-1">&ldquo;{f.comment}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {replyReviewId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setReplyReviewId(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif font-bold text-slate-950 mb-1">Author Official Seller Reply</h3>
            <p className="text-xs text-slate-600 mb-4">
              This response will appear publicly beneath the patron&apos;s review as an authenticated message from your studio.
            </p>

            {replyError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                {replyError}
              </div>
            )}

            <form onSubmit={handlePostReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Official Response Statement *
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank the patron for their feedback, address any concerns regarding dimensions or materials, and highlight studio care instructions..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white resize-none"
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
                  className="bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs px-5 cursor-pointer"
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

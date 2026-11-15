"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  Check,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ShieldCheck,
  Image as ImageIcon,
  MessageSquare,
  AlertCircle,
  X,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import { PublicReviewDTO, ReviewStatsDTO } from "@/types/review";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface ProductReviewsProps {
  productId: string;
  productTitle: string;
}

export function ProductReviews({ productId, productTitle }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<PublicReviewDTO[]>([]);
  const [stats, setStats] = useState<ReviewStatsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [hasMediaOnly, setHasMediaOnly] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<"recent" | "helpful" | "rating_high" | "rating_low">("recent");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [showWriteModal, setShowWriteModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [activeReportReviewId, setActiveReportReviewId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [writeRating, setWriteRating] = useState<number>(5);
  const [writeTitle, setWriteTitle] = useState<string>("");
  const [writeComment, setWriteComment] = useState<string>("");
  const [writeMediaUrl, setWriteMediaUrl] = useState<string>("");
  const [writeMediaList, setWriteMediaList] = useState<string[]>([]);
  const [submitSubmitting, setSubmitSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [reportReason, setReportReason] = useState<string>("SPAM_OR_ADVERTISEMENT");
  const [reportExplanation, setReportExplanation] = useState<string>("");
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.set("page", page.toString());
      queryParams.set("limit", "8");
      queryParams.set("sort", sortOption);
      if (selectedStar) queryParams.set("rating", selectedStar.toString());
      if (verifiedOnly) queryParams.set("verifiedOnly", "true");
      if (hasMediaOnly) queryParams.set("hasMediaOnly", "true");

      const res = await fetch(`/api/products/${productId}/reviews?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error("Unable to load reviews.");
      }
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Error fetching reviews.");
    } finally {
      setLoading(false);
    }
  }, [productId, page, sortOption, selectedStar, verifiedOnly, hasMediaOnly]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleReaction = async (reviewId: string, type: "HELPFUL" | "UNHELPFUL") => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: type }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Please sign in to react to reviews.");
        return;
      }

      const updated = await res.json();
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                helpfulVotes: updated.helpfulVotes,
                unhelpfulVotes: updated.unhelpfulVotes,
                userReaction: updated.userReaction,
              }
            : r
        )
      );
    } catch (err) {
      console.error("Failed to react to review:", err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: writeRating,
          title: writeTitle.trim() || undefined,
          comment: writeComment.trim() || undefined,
          mediaUrls: writeMediaList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setSubmitSuccess("Your review has been verified and published to the Nexu community.");
      setTimeout(() => {
        setShowWriteModal(false);
        setSubmitSuccess(null);
        setWriteTitle("");
        setWriteComment("");
        setWriteMediaList([]);
        loadReviews();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit review.");
    } finally {
      setSubmitSubmitting(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportReviewId) return;

    setReportSubmitting(true);
    setReportError(null);

    try {
      const res = await fetch(`/api/reviews/${activeReportReviewId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reasonCode: reportReason,
          explanation: reportExplanation.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setActiveReportReviewId(null);
        setReportExplanation("");
      }, 1500);
    } catch (err: any) {
      setReportError(err.message || "Failed to report review.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const addMediaUrl = () => {
    if (writeMediaUrl.trim() && writeMediaList.length < 4) {
      setWriteMediaList([...writeMediaList, writeMediaUrl.trim()]);
      setWriteMediaUrl("");
    }
  };

  const removeMediaUrl = (index: number) => {
    setWriteMediaList(writeMediaList.filter((_, i) => i !== index));
  };

  return (
    <section className="mt-16 pt-12 border-t border-zinc-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-2 block font-mono">
            Verified Community Feedback
          </span>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Customer Reviews & Authenticity
          </h2>
          <p className="text-sm text-zinc-600 mt-1 max-w-xl">
            Real experiences from verified collectors and patrons. Every review is cryptographically tied to verified orders or flagged for moderation.
          </p>
        </div>
        <Button
          onClick={() => setShowWriteModal(true)}
          className="bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] font-semibold px-6 py-2.5 rounded-lg shadow-xs transition-all self-start md:self-auto"
        >
          Write a Review
        </Button>
      </div>

      {stats && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 lg:p-8 mb-10 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-zinc-200 pb-6 md:pb-0 md:pr-8">
            <div className="text-5xl lg:text-6xl font-extrabold text-zinc-950 tracking-tight">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1.5 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(stats.averageRating)
                      ? "text-amber-500 fill-amber-500"
                      : "text-zinc-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-zinc-600">
              Based on <span className="font-semibold text-zinc-950">{stats.totalCount}</span> verified ratings
            </div>
            {stats.totalCount > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{Math.round((stats.verifiedCount / stats.totalCount) * 100)}% Verified Purchases</span>
              </div>
            )}
          </div>

          <div className="md:col-span-8 flex flex-col gap-2.5">
            {stats.distribution.map((item) => (
              <button
                key={item.star}
                onClick={() => setSelectedStar(selectedStar === item.star ? null : item.star)}
                className={`flex items-center gap-3 w-full group text-left transition-opacity ${
                  selectedStar && selectedStar !== item.star ? "opacity-40" : "opacity-100"
                }`}
              >
                <span className="text-xs font-medium text-zinc-600 w-12 flex items-center gap-1">
                  {item.star} <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
                <div className="flex-1 h-2.5 bg-zinc-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-zinc-600 w-16 text-right">
                  {item.count} ({item.percentage}%)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-5 bg-zinc-50 border border-zinc-200 rounded-xl mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mr-1 font-mono">
            Filter:
          </span>
          <button
            onClick={() => setSelectedStar(null)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              selectedStar === null
                ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStar(selectedStar === s ? null : s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                selectedStar === s
                  ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                  : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {s}★
            </button>
          ))}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              verifiedOnly
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            Verified Only
          </button>
          <button
            onClick={() => setHasMediaOnly(!hasMediaOnly)}
            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              hasMediaOnly
                ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            With Media
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="text-xs bg-white border border-zinc-200 text-zinc-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-600"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500" />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          {error}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-300 rounded-2xl shadow-xs">
          <MessageSquare className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-950 mb-1">No reviews match your filters</h3>
          <p className="text-xs text-zinc-600 mb-4">
            Be the first collector to share your impression of this piece.
          </p>
          <Button
            onClick={() => setShowWriteModal(true)}
            className="bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs px-5 py-2 font-semibold shadow-xs"
          >
            Write a Review
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs transition-all hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
                    {review.reviewerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-950">
                        {review.reviewerName}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                      <span>{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {review.isEdited && <span>• Edited</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-200">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= review.rating ? "text-amber-500 fill-amber-500" : "text-zinc-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {(review.variantName || review.variantSku) && (
                <div className="mb-3">
                  <Badge variant="outline" className="text-[11px] bg-zinc-100 text-zinc-700 border-zinc-200">
                    Edition: {review.variantName || review.variantSku}
                  </Badge>
                </div>
              )}

              {review.title && (
                <h4 className="text-base font-bold text-zinc-950 mb-2 tracking-tight">
                  {review.title}
                </h4>
              )}

              {review.comment && (
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line mb-4">
                  {review.comment}
                </p>
              )}

              {review.media && review.media.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mb-4">
                  {review.media.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedPhoto(m.url)}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 hover:border-amber-600 transition-colors group"
                    >
                      <img
                        src={m.url}
                        alt="Customer upload"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                  ))}
                </div>
              )}

              {review.sellerResponse && (
                <div className="bg-amber-50/40 border-l-2 border-amber-600 border border-amber-100 rounded-r-xl p-4 my-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-amber-900">
                      Official Response from {review.sellerResponse.sellerName}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(review.sellerResponse.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 leading-relaxed">
                    {review.sellerResponse.responseText}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">Was this review helpful?</span>
                  <button
                    onClick={() => handleReaction(review.id, "HELPFUL")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                      review.userReaction === "HELPFUL"
                        ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful ({review.helpfulVotes})</span>
                  </button>
                  <button
                    onClick={() => handleReaction(review.id, "UNHELPFUL")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                      review.userReaction === "UNHELPFUL"
                        ? "bg-rose-50 border-rose-300 text-rose-800 font-semibold"
                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Unhelpful ({review.unhelpfulVotes})</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setActiveReportReviewId(review.id);
                    setShowReportModal(true);
                  }}
                  className="flex items-center gap-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <Flag className="w-3 h-3" />
                  <span>Report</span>
                </button>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs px-4 py-2"
              >
                Previous
              </Button>
              <span className="text-xs text-zinc-600 px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs px-4 py-2"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {showWriteModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E8E4] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative text-[#171717]">
            <button
              onClick={() => setShowWriteModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-950"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-zinc-950 mb-1">Review {productTitle}</h3>
            <p className="text-xs text-zinc-600 mb-6">
              Share your genuine craftsmanship impression. Verified orders will automatically receive the verified collector seal.
            </p>

            {submitSuccess && (
              <div className="p-4 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="p-4 mb-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setWriteRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= writeRating
                            ? "text-amber-500 fill-amber-500"
                            : "text-zinc-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-amber-700 font-medium ml-2">
                    {writeRating === 5 && "Exemplary (5 Stars)"}
                    {writeRating === 4 && "Commendable (4 Stars)"}
                    {writeRating === 3 && "Acceptable (3 Stars)"}
                    {writeRating === 2 && "Below Standard (2 Stars)"}
                    {writeRating === 1 && "Deficient (1 Star)"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Review Headline
                </label>
                <input
                  type="text"
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                  placeholder="e.g. Masterful hand-stitched detailing and bespoke drape"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-amber-600"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Detailed Experience
                </label>
                <textarea
                  rows={4}
                  value={writeComment}
                  onChange={(e) => setWriteComment(e.target.value)}
                  placeholder="Describe material feel, proportion accuracy, unboxing presentation, and long-term durability..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-amber-600 resize-none"
                  maxLength={2000}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Photographic Evidence (Optional, Max 4)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={writeMediaUrl}
                    onChange={(e) => setWriteMediaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-amber-600"
                  />
                  <Button
                    type="button"
                    onClick={addMediaUrl}
                    disabled={!writeMediaUrl.trim() || writeMediaList.length >= 4}
                    variant="outline"
                    className="text-xs px-3"
                  >
                    Add Photo
                  </Button>
                </div>
                {writeMediaList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {writeMediaList.map((url, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200">
                        <img src={url} alt="Attached" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeMediaUrl(idx)}
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWriteModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitSubmitting}
                  className="bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] font-semibold text-xs px-6 shadow-xs"
                >
                  {submitSubmitting ? "Publishing..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E8E4] rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-[#171717]">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-zinc-950 mb-1">Report Policy Violation</h3>
            <p className="text-xs text-zinc-600 mb-4">
              Help our Trust & Safety team safeguard community integrity.
            </p>

            {reportSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 text-sm">
                Thank you. Your report has been flagged for trust and safety review.
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                {reportError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                    {reportError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Reason for Report *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="SPAM_OR_ADVERTISEMENT">Commercial spam or promotional solicitation</option>
                    <option value="HARASSMENT_OR_ABUSE">Harassment, threats, or abusive language</option>
                    <option value="PROFANITY_OR_HATE_SPEECH">Profanity, hate speech, or offensive content</option>
                    <option value="PERSONAL_DATA_LEAK">Personal Identifiable Information (phone, address, PII)</option>
                    <option value="IRRELEVANT_CONTENT">Irrelevant or not related to this item</option>
                    <option value="SUSPECTED_FRAUD_OR_MANIPULATION">Suspected incentivized or fabricated review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Additional Explanation
                  </label>
                  <textarea
                    rows={3}
                    value={reportExplanation}
                    onChange={(e) => setReportExplanation(e.target.value)}
                    placeholder="Provide specific context for our moderation team..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-600 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReportModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={reportSubmitting}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-5"
                  >
                    {reportSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img
              src={selectedPhoto}
              alt="Enlarged patron photo"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-[#E8E8E4] bg-[#FAFAF8]"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 bg-white text-[#171717] hover:text-[#B78B45] p-2 rounded-full border border-[#E8E8E4] shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

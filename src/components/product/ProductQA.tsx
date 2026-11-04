"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  HelpCircle,
  MessageSquare,
  ThumbsUp,
  Search,
  Sparkles,
  ShieldCheck,
  User,
  Plus,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Answer {
  id: string;
  authorName: string;
  authorRole: "STUDIO_ARTISAN" | "VERIFIED_BUYER" | "COMMUNITY" | string;
  answer: string;
  upvotes: number;
  createdAt: string;
}

interface Question {
  id: string;
  authorName: string;
  question: string;
  upvotes: number;
  createdAt: string;
  answers: Answer[];
}

interface ProductQAProps {
  productId: string;
  productSlug: string;
  productTitle: string;
}

export function ProductQA({ productId, productSlug, productTitle }: ProductQAProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Ask Question Modal
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askSuccess, setAskSuccess] = useState(false);

  // Reply inline state
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Upvoted IDs state (client session tracking)
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  const fetchQuestions = useCallback(async (query: string = "") => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/products/${encodeURIComponent(productSlug)}/questions${
        query ? `?q=${encodeURIComponent(query)}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to load craft inquiries.");
      }
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions(searchQuery);
  };

  const handleUpvote = async (questionId: string) => {
    if (upvotedIds.has(questionId)) return;

    try {
      setUpvotedIds((prev) => new Set(prev).add(questionId));
      const res = await fetch(
        `/api/products/${encodeURIComponent(productSlug)}/questions/${questionId}/upvote`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, upvotes: data.upvotes } : q))
        );
      }
    } catch (err) {
      console.error("Failed to upvote question:", err);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      setSubmittingQuestion(true);
      setAskError(null);

      const res = await fetch(`/api/products/${encodeURIComponent(productSlug)}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry.");
      }

      setAskSuccess(true);
      setNewQuestion("");
      setTimeout(() => {
        setAskSuccess(false);
        setShowAskModal(false);
        fetchQuestions();
      }, 1500);
    } catch (err: any) {
      setAskError(err.message || "An error occurred.");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!replyText.trim()) return;

    try {
      setSubmittingReply(true);
      setReplyError(null);

      const res = await fetch(
        `/api/products/${encodeURIComponent(productSlug)}/questions/${questionId}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: replyText }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit response.");
      }

      // Append answer locally
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, answers: [...q.answers, data.answer] } : q
        )
      );

      setReplyText("");
      setActiveReplyId(null);
    } catch (err: any) {
      setReplyError(err.message || "Failed to submit answer.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "STUDIO_ARTISAN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-amber-50 text-amber-800 border border-amber-300 font-semibold">
            <Sparkles className="w-2.5 h-2.5" /> Studio Artisan
          </span>
        );
      case "VERIFIED_BUYER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
            <ShieldCheck className="w-2.5 h-2.5" /> Verified Patron
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
            <User className="w-2.5 h-2.5" /> Community
          </span>
        );
    }
  };

  return (
    <section className="mt-16 pt-12 border-t border-zinc-200" id="craft-inquiries">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-amber-600 mb-1 font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            Direct Atelier Dialogue
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
            Questions & Answers
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            Inquire about materials, bespoke sizing, care regimens, or provenance.
          </p>
        </div>

        <Button
          onClick={() => setShowAskModal(true)}
          className="bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-mono uppercase tracking-wider py-2.5 px-5 rounded-lg transition-all flex items-center gap-2 self-start md:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4 text-[#B78B45]" />
          Ask a Question
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative mb-8 max-w-xl">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Have a question? Search answers or ask patrons..."
          className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-10 pr-24 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-600 transition-colors shadow-xs"
        />
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
        <button
          type="submit"
          className="absolute right-2 top-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-xs font-mono uppercase tracking-wider text-zinc-700 rounded-lg transition-colors font-medium"
        >
          Filter
        </button>
      </form>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-zinc-50 rounded-xl p-6 border border-zinc-200 space-y-3">
              <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
              <div className="h-3 bg-zinc-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-white border border-dashed border-zinc-300 shadow-xs">
          <MessageSquare className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-950 font-bold text-base mb-1">No inquiries yet for this creation</p>
          <p className="text-xs text-zinc-600 max-w-md mx-auto mb-5">
            Be the first to ask the master artisan or collector community about {productTitle}.
          </p>
          <Button
            onClick={() => setShowAskModal(true)}
            className="bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-mono uppercase tracking-wider py-2 px-4 rounded-lg shadow-xs"
          >
            Post the First Question
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => (
            <div
              key={q.id}
              className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-xs hover:shadow-sm transition-all space-y-4"
            >
              {/* Question Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex-shrink-0 mt-0.5">
                    Q
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-950 tracking-tight leading-snug">
                      {q.question}
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-500 mt-1">
                      Asked by <span className="text-zinc-700 font-medium">{q.authorName}</span> on{" "}
                      {new Date(q.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Upvote Question Button */}
                <button
                  onClick={() => handleUpvote(q.id)}
                  disabled={upvotedIds.has(q.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex-shrink-0 ${
                    upvotedIds.has(q.id)
                      ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                      : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-300"
                  }`}
                  title="Mark this inquiry as helpful"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{q.upvotes}</span>
                </button>
              </div>

              {/* Answers */}
              <div className="pl-7 space-y-3 pt-2 border-t border-zinc-100">
                {q.answers.length > 0 ? (
                  q.answers.map((ans) => (
                    <div
                      key={ans.id}
                      className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            A
                          </span>
                          <span className="text-xs font-semibold text-zinc-900">
                            {ans.authorName}
                          </span>
                          {getRoleBadge(ans.authorRole)}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {new Date(ans.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-700 pl-5 leading-relaxed">
                        {ans.answer}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-zinc-500 italic py-1">
                    No answer published yet. Artisans typically reply within 24 hours.
                  </p>
                )}

                {/* Reply Form Trigger */}
                {activeReplyId !== q.id ? (
                  <button
                    onClick={() => {
                      setActiveReplyId(q.id);
                      setReplyError(null);
                    }}
                    className="text-xs font-mono text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 transition-colors mt-2"
                  >
                    <Plus className="w-3 h-3" /> Provide an Answer
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-800 uppercase tracking-wider font-bold">
                        Contribute Atelier Knowledge
                      </span>
                      <button
                        onClick={() => setActiveReplyId(null)}
                        className="text-zinc-500 hover:text-zinc-950"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {replyError && (
                      <p className="text-xs text-rose-600">{replyError}</p>
                    )}
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Share your verified experience or artisan craftsmanship note..."
                      rows={2}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-600"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveReplyId(null)}
                        className="px-3 py-1 text-xs text-zinc-600 hover:text-zinc-950 font-mono"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnswerSubmit(q.id)}
                        disabled={submittingReply || !replyText.trim()}
                        className="px-3 py-1 bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-mono uppercase tracking-wider rounded font-medium flex items-center gap-1 disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        {submittingReply ? "Posting..." : "Post Answer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 max-w-lg w-full shadow-2xl relative text-[#171717]">
            <button
              onClick={() => setShowAskModal(false)}
              className="absolute right-4 top-4 text-[#767676] hover:text-[#171717] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-[#B78B45] uppercase tracking-wider mb-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Atelier Inquiry
            </div>
            <h3 className="text-xl font-bold text-[#171717] mb-2">
              Inquire About {productTitle}
            </h3>
            <p className="text-xs text-[#626262] mb-4">
              Your inquiry will be visible to the master artisan and fellow patrons who own this piece.
            </p>

            {askSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#21866F] mx-auto" />
                <p className="text-[#171717] font-bold text-base">Inquiry Submitted</p>
                <p className="text-xs text-[#626262]">
                  Thank you. Your question has been recorded and posted to the dialogue board.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAskQuestion} className="space-y-4">
                {askError && (
                  <div className="p-3 rounded-lg bg-[#FAF0F0] border border-[#F2D6D6] text-xs text-[#A63232] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {askError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase text-[#626262] mb-1.5 font-medium">
                    Your Question
                  </label>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="e.g. Can this hand-carved teak wood finish be maintained in humid coastal climates? What is the exact internal ring diameter?"
                    rows={4}
                    required
                    maxLength={500}
                    className="w-full bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl p-3 text-sm text-[#171717] placeholder-[#767676] focus:outline-none focus:bg-white focus:border-[#B78B45] transition-colors"
                  />
                  <div className="flex justify-between items-center text-[11px] font-mono text-[#767676] mt-1">
                    <span>Minimum 5 characters</span>
                    <span>{newQuestion.length}/500</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAskModal(false)}
                    className="text-xs font-mono uppercase"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingQuestion || !newQuestion.trim()}
                    className="bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-mono uppercase tracking-wider font-semibold shadow-xs"
                  >
                    {submittingQuestion ? "Transmitting..." : "Submit Inquiry"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

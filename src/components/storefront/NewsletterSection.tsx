"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Subscription request failed. Please try again.");
        return;
      }

      setIsSubmitted(true);
      setEmail("");
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="rounded-3xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50/60 shadow-xs p-8 sm:p-12 lg:p-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-sans font-semibold text-zinc-800">
              <Mail className="w-3.5 h-3.5 text-zinc-700" />
              <span>The Atelier Dispatch</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-zinc-950 tracking-tight leading-tight">
              Curated Releases, Private Drops &amp; Craft Notes
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl font-sans">
              Receive confidential preview access to limited handloom drops, verified brand flagship launches, and technical specifications directly from our registered ateliers.
            </p>

            <div className="flex items-center gap-4 pt-1 text-xs text-zinc-500 font-sans">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero spam guarantee</span>
              </span>
              <span>•</span>
              <span>1-click unsubscribe anytime</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            {isSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start sm:items-center gap-3 font-medium animate-in fade-in duration-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-semibold text-emerald-950">You are subscribed to The Atelier Dispatch.</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">A verification receipt has been queued for your inbox.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      disabled={isLoading}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Enter your email address"
                      className={`w-full h-12 bg-white text-xs sm:text-sm text-zinc-950 placeholder-zinc-400 pl-10 pr-3.5 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                        error
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
                          : "border-zinc-300 hover:border-zinc-400 focus:border-zinc-950 focus:ring-zinc-950/10 shadow-2xs"
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Join Dispatch</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {error ? (
                  <p className="text-[11px] text-red-600 font-medium text-left pl-1">
                    {error}
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-400 text-left pl-1 font-mono">
                    By subscribing, you agree to receive studio bulletins. We protect your privacy.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

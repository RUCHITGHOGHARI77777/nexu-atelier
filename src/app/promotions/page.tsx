"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TicketPercent, Check, Copy, Sparkles, ArrowRight, ShieldCheck, ArrowLeft, Tag, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PromoOffer {
  code: string;
  badge: string;
  title: string;
  discount: string;
  minSpend: string;
  maxSavings: string;
  description: string;
  terms: string[];
}

const OFFERS: PromoOffer[] = [
  {
    code: "NEXUFIRST",
    badge: "Inaugural Patron Offer",
    title: "15% Off Your Inaugural Studio Acquisition",
    discount: "15% OFF",
    minSpend: "₹2,000",
    maxSavings: "₹1,500",
    description: "Welcome to the atelier collective. Experience master craftsmanship with 15% complimentary patronage savings on your first acquisition.",
    terms: [
      "Valid on first order per authenticated customer account",
      "Requires minimum cart subtotal of ₹2,000",
      "Maximum discount capped at ₹1,500",
      "Applies automatically across all independent studios",
    ],
  },
  {
    code: "ATELIER10",
    badge: "Heritage Collector Reward",
    title: "10% Off Fine Textiles & Studio Objects",
    discount: "10% OFF",
    minSpend: "₹1,000",
    maxSavings: "₹1,000",
    description: "Honoring enduring patronage. Enjoy 10% off artisanal mulberry silks, brass vessels, and handcrafted leather accessories.",
    terms: [
      "Eligible up to 2 usages per patron account",
      "Requires minimum cart subtotal of ₹1,000",
      "Maximum discount capped at ₹1,000",
      "Can be combined with complimentary shipping above ₹2,500",
    ],
  },
  {
    code: "FESTIVE500",
    badge: "Seasonal Celebration Voucher",
    title: "Flat ₹500 Off Curated Statements",
    discount: "FLAT ₹500 OFF",
    minSpend: "₹3,000",
    maxSavings: "₹500",
    description: "Direct celebration subsidy on heirloom centerpieces, acoustic monitors, and ceremonial occasion wear.",
    terms: [
      "One redemption per patron account",
      "Requires minimum cart subtotal of ₹3,000",
      "Instant deduction applied to minor-unit invoice calculation",
      "Limited availability allocation funded directly by platform escrow",
    ],
  },
];

export default function PromotionsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] py-12 sm:py-20 text-zinc-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>

        {/* Header */}
        <div className="border-b border-zinc-200 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-mono text-zinc-700 shadow-xs">
            <TicketPercent className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold uppercase tracking-wider">OFFICIAL PROMOTIONS & VOUCHERS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif text-zinc-950 tracking-tight font-bold">
            Curated Atelier Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
            Transparent, server-validated promotional codes. Every coupon is mathematically evaluated against authoritative database totals in minor units (paise).
          </p>
        </div>

        {/* Offers Cards */}
        <div className="space-y-6">
          {OFFERS.map((offer) => {
            const isCopied = copiedCode === offer.code;
            return (
              <div
                key={offer.code}
                className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden space-y-6 hover:shadow-md transition-shadow"
              >
                {/* Accent strip */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pl-2">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                        {offer.badge}
                      </span>
                      <span className="text-xs font-mono text-zinc-300">•</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                        {offer.discount}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-950 tracking-tight">
                      {offer.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {offer.description}
                    </p>

                    <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-zinc-600 font-mono">
                      <div>Min Spend: <span className="text-zinc-950 font-bold">{offer.minSpend}</span></div>
                      <div>Max Savings: <span className="text-zinc-950 font-bold">{offer.maxSavings}</span></div>
                      <div>Status: <span className="text-emerald-700 font-bold">Active in Cart</span></div>
                    </div>
                  </div>

                  {/* Code Voucher Box */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shrink-0 lg:w-64 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-semibold">
                      Voucher Code
                    </span>
                    <div className="font-mono text-lg font-bold text-zinc-950 tracking-widest bg-white px-4 py-2 rounded-xl border border-dashed border-zinc-300 w-full shadow-xs">
                      {offer.code}
                    </div>
                    <button
                      onClick={() => handleCopy(offer.code)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Code Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Copy Voucher</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms & Usage Limits */}
                <div className="pt-4 border-t border-zinc-100 text-[11px] text-zinc-500 pl-2 space-y-1">
                  <span className="font-semibold text-zinc-700 uppercase tracking-wider block font-mono text-[10px]">
                    Eligibility & Usage Terms:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-600">
                    {offer.terms.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct Shopping CTA */}
        <div className="p-8 bg-white border border-zinc-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left shadow-xs">
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-bold text-zinc-950">Ready to acquire your handcrafted piece?</h3>
            <p className="text-xs text-zinc-600">Enter your copied voucher code in the checkout review summary for instant server deduction.</p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] text-xs font-semibold shrink-0 shadow-xs transition-all active:scale-95"
          >
            <span>Explore Curated Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

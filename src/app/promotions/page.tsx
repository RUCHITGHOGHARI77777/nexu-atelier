"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TicketPercent, Check, Copy, Sparkles, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
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
    title: "15% Off Your Inaugural Studio Commission",
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-300">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Atelier
      </Link>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-8 mb-12 text-center sm:text-left">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold block mb-2">
          Curated Vouchers & Studio Subsidies
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
          Current Promotional Offers & Codes
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
          Transparent, server-validated promotional codes. No hidden deductions or inflated original retail prices.
        </p>
      </div>

      {/* Offers Cards */}
      <div className="space-y-6 mb-16">
        {OFFERS.map((offer) => {
          const isCopied = copiedCode === offer.code;
          return (
            <div
              key={offer.code}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden"
            >
              {/* Glowing accent border */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-0.5 rounded-full">
                      {offer.badge}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">•</span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {offer.discount}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight">
                    {offer.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {offer.description}
                  </p>

                  <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-400 font-mono">
                    <div>Min Spend: <span className="text-white font-bold">{offer.minSpend}</span></div>
                    <div>Max Savings: <span className="text-white font-bold">{offer.maxSavings}</span></div>
                    <div>Verification: <span className="text-emerald-400 font-bold">Server Enforced</span></div>
                  </div>
                </div>

                {/* Code Voucher Box */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-3 shrink-0 lg:w-60 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                    Promo Code
                  </span>
                  <div className="font-mono text-lg font-bold text-amber-400 tracking-wider bg-zinc-900 px-4 py-1.5 rounded-lg border border-dashed border-amber-500/40 w-full">
                    {offer.code}
                  </div>
                  <Button
                    onClick={() => handleCopy(offer.code)}
                    variant="outline"
                    className="w-full text-xs border-zinc-700 hover:border-amber-500 text-zinc-200"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Code Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Voucher
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Terms Accordion / Bullet list */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500">
                <span className="font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Conditions & Usage Limits:
                </span>
                <ul className="list-disc list-inside space-y-0.5">
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
      <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <h3 className="text-lg font-serif text-white">Ready to commission your first piece?</h3>
          <p className="text-xs text-zinc-400 mt-1">Apply your copied voucher code in the checkout review drawer.</p>
        </div>
        <Button
          href="/catalog"
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs px-6 py-2.5"
        >
          Browse Curated Catalog <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

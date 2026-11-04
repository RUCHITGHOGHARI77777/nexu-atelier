import React from "react";
import Link from "next/link";
import { Scale, FileText, CheckCircle2, Shield, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Nexu Atelier",
  description: "User agreements, marketplace vendor relations, patron rights, and contractual terms governing Nexu Atelier.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] py-12 sm:py-20 text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>

        {/* Header */}
        <div className="border-b border-zinc-200 pb-8 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-semibold block">
            CONTRACTUAL TRANSPARENCY
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif text-zinc-950 tracking-tight font-bold">
            Terms of Service & Platform Governance
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Effective Date: October 30, 2026 • Governing laws of the Republic of India
          </p>
        </div>

        {/* Body Content */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-zinc-700 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">1. Marketplace Architecture & Artisan Direct Model</h2>
            <p>
              NEXU ATELIER operates an open-source multi-vendor marketplace connecting patrons with verified, independent design studios, handloom cooperatives, and industrial craft workshops. While NEXU ATELIER provides the catalog infrastructure, payment escrow, logistics orchestration, and dispute arbitration, the underlying sales contract for each piece is concluded between the patron and the fulfilling vendor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">2. Pricing Transparency & Minor-Unit Calculations</h2>
            <p>
              All prices listed on NEXU ATELIER are quoted in Indian Rupees (INR) and computed internally in minor units (paise) to guarantee mathematical precision and prevent floating-point rounding errors. Listed prices include applicable Goods and Services Tax (GST) unless explicitly noted otherwise. The final order review summarizes itemized subtotal, shipping fee, and any verified coupon deductions before payment initiation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">3. Order Acceptance & Inventory Reservation</h2>
            <p>
              Submitting an order constitutes an offer to purchase. Order confirmation and binding contract formation occur when payment is verified and captured through our authorized payment adapter, triggering automated inventory decrements and generation of an immutable order snapshot. In the event of unforeseen studio inventory deficits or fabric flaws, the vendor or platform reserves the right to cancel the order line and release an immediate full refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">4. Review Integrity & Anti-Astroturfing Policy</h2>
            <p>
              NEXU ATELIER enforces strict review authenticity:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
              <li>Only patrons with verified, delivered purchases are eligible for the &quot;Verified Purchase&quot; credential.</li>
              <li>Independent sellers are strictly barred from posting reviews on their own pieces.</li>
              <li>Customer reviews expressing honest dissatisfaction or critique are fully protected and will never be removed merely for being negative.</li>
              <li>Astroturfing, incentivized ratings, automated bot reviews, and spam will result in permanent ban and removal.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">5. Intellectual Property & Artisan Provenance</h2>
            <p>
              Design patents, textile weaves, lost-wax bronze molds, and photographic artifacts remain the intellectual property of their respective creators and independent studios. Any unauthorized commercial reproduction or scraping of studio portfolios is strictly prohibited.
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="pt-4 border-t border-zinc-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

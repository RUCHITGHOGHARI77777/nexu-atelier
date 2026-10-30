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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-300">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Atelier
      </Link>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-8 mb-10">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold block mb-2">
          Contractual Transparency
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
          Terms of Service & Platform Governance
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Effective Date: October 30, 2026 • Governing laws of India
        </p>
      </div>

      {/* Body Content */}
      <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">1. Marketplace Architecture & Artisan Direct Model</h2>
          <p>
            Nexu Atelier operates an open-source multi-vendor marketplace connecting patrons with verified, independent design studios, handloom cooperatives, and industrial craft workshops. While Nexu Atelier provides the catalog infrastructure, payment escrow, logistics orchestration, and dispute arbitration, the underlying sales contract for each piece is concluded between the patron and the fulfilling vendor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">2. Pricing Transparency & Minor-Unit Calculations</h2>
          <p>
            All prices listed on Nexu Atelier are quoted in Indian Rupees (INR) and computed internally in minor units (paise) to guarantee mathematical precision and prevent floating-point rounding errors. Listed prices include applicable Goods and Services Tax (GST) unless explicitly noted otherwise. The final order review summarizes itemized subtotal, shipping fee, and any verified coupon deductions before payment initiation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">3. Order Acceptance & Inventory Reservation</h2>
          <p>
            Submitting an order constitutes an offer to purchase. Order confirmation and binding contract formation occur when payment is verified and captured through our authorized payment adapter, triggering automated inventory decrements and generation of an immutable order snapshot. In the event of unforeseen studio inventory deficits or fabric flaws, the vendor or platform reserves the right to cancel the order line and release an immediate full refund.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">4. Review Integrity & Anti-Astroturfing Policy</h2>
          <p>
            Nexu Atelier enforces strict review authenticity:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>Only patrons with verified, delivered purchases are eligible for the &quot;Verified Purchase&quot; credential.</li>
            <li>Independent sellers are strictly barred from posting reviews on their own pieces.</li>
            <li>Customer reviews expressing honest dissatisfaction or critique are fully protected and will never be removed merely for being negative.</li>
            <li>Astroturfing, incentivized ratings, automated bot reviews, and spam will result in permanent ban and removal.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">5. Intellectual Property & Artisan Provenance</h2>
          <p>
            Design patents, textile weaves, lost-wax bronze molds, and photographic artifacts remain the intellectual property of their respective creators and independent studios. Any unauthorized commercial reproduction or scraping of studio portfolios is strictly prohibited.
          </p>
        </section>
      </div>
    </div>
  );
}

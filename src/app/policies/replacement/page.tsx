import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, CheckCircle2, ChevronRight, ShieldCheck, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "7-Day Studio Replacement & Exchange Policy | NEXU ATELIER",
  description:
    "Learn about our 7-day doorstep replacement and sizing exchange process coordinated directly with creating artisans.",
};

export default function ReplacementPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50/50 py-10 sm:py-16 text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <Link href="/" className="hover:text-zinc-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <Link href="/policies" className="hover:text-zinc-950 transition-colors">Policies</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-900 font-bold">Replacement Policy</span>
        </nav>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          <div className="space-y-3 pb-6 border-b border-zinc-200">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700">
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>DIRECT GUILD EXCHANGE GUARANTEE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              7-Day Studio Replacement & Exchange Policy
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Transparent, hassle-free exchanges directly coordinated with the artisan workshop.
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-zinc-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-950">
                1. Eligibility Window
              </h2>
              <p>
                All eligible apparel, footwear, and studio pieces can be exchanged or replaced within <strong>7 calendar days</strong> from verified doorstep delivery. Handcrafted products are unique, and we ensure you receive the exact size, fit, and finish you envisioned.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-zinc-950">
                2. Acceptable Replacement Reasons
              </h2>
              <ul className="space-y-2 list-none pl-0">
                {[
                  "Size or Fit Discrepancy: We will ship the revised size directly from the artisan's stock.",
                  "Transit Damage or Imperfection: Immediate priority courier pickup and pristine replacement dispatch.",
                  "Defective Component: Immediate atelier replacement covered completely under artisan warranty.",
                  "Incorrect Piece Delivered: We arrange priority return courier and expedite the intended creation.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-950">
                3. Zero-Fee Return Logistics
              </h2>
              <p>
                NEXU ATELIER covers reverse logistics courier fees for genuine sizing adjustments and quality replacements. A courier representative will collect the packaged parcel from your doorstep with an automated return manifest.
              </p>
            </section>

            <section className="space-y-3 p-6 rounded-2xl bg-zinc-50 border border-zinc-200">
              <h2 className="text-base font-bold text-zinc-950">
                4. Initiating an Exchange
              </h2>
              <p className="text-xs text-zinc-600">
                To request a replacement, visit your account orders or connect with our concierge with your Order ID:
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/account/orders"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-semibold shadow-xs"
                >
                  Manage in My Orders
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold"
                >
                  Contact Concierge
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

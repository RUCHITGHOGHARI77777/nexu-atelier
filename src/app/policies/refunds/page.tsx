import React from "react";
import Link from "next/link";
import { RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation, Returns & Refunds Policy — Nexu Atelier",
  description: "Transparent 14-day return window, pre-dispatch cancellation rules, transit damage claims, and refund timelines.",
};

export default function RefundPolicyPage() {
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
            PATRON PROTECTION & ESCROW
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif text-zinc-950 tracking-tight font-bold">
            Cancellation, Returns & Refund Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Effective Date: October 30, 2026 • 14-day inspection window for verified delivered consignments
          </p>
        </div>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              14-Day Return Window
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Request returns or open disputes within 14 calendar days of confirmed carrier delivery.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Pre-Dispatch Cancellation
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Instant 1-click cancellation with 100% full refund before parcel courier dispatch.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Zero Over-Refund Guarantee
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Refunds are mathematically reconciled in minor units (paise) back to your original payment mode.
            </p>
          </div>
        </div>

        {/* Policy Details */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-zinc-700 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">1. Pre-Dispatch Order Cancellations</h2>
            <p>
              You may cancel any unfulfilled or processing order directly from your <Link href="/account/orders" className="text-amber-700 font-semibold underline underline-offset-4">Order History</Link> prior to carrier dispatch. Upon cancellation, reserved inventory is automatically restored to the studio catalog, and a 100% refund is initiated immediately to your payment instrument.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">2. 14-Day Post-Delivery Return Eligibility</h2>
            <p>
              Pieces qualify for return if:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
              <li>The piece is in unblemished, unworn, and unwashed condition with all original hand-carved tags intact.</li>
              <li>All studio packaging, archival linen boxes, and certificates of authenticity are included.</li>
              <li>The request is initiated within 14 calendar days from the carrier-stamped delivery date.</li>
            </ul>
            <p className="text-xs text-zinc-500 pt-1">
              <em>Exceptions:</em> Customized bespoke monogrammed items and intimate apparel are non-returnable unless defective on delivery.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">3. How to Open a Return or Dispute Case</h2>
            <p>
              To initiate a return:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-zinc-600">
              <li>Navigate to your <Link href="/account/orders" className="text-amber-700 font-semibold underline underline-offset-4">Orders Page</Link> and select the relevant order.</li>
              <li>Click <strong>&quot;Request Return / Open Dispute&quot;</strong> on any delivered item line.</li>
              <li>Provide a concise explanation (e.g. sizing discrepancy, fabric finish, or transit scratch) and optional photographic evidence.</li>
              <li>Our concierge desk will review the case within 24 hours, generate a reverse pickup AWB, and schedule courier pickup from your doorstep.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">4. Refund Processing & Bank Timelines</h2>
            <p>
              Once the artisan studio receives the returned piece and inspects its condition:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
              <li><strong>UPI & Netbanking:</strong> 2 to 4 business days to credit your bank account.</li>
              <li><strong>Credit & Debit Cards:</strong> 3 to 7 business days depending on issuing bank settlement cycles.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

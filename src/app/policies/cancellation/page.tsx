import React from "react";
import Link from "next/link";
import { XCircle, ArrowLeft, ShieldAlert, Clock, RefreshCw, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Cancellation Policy — Nexu Atelier",
  description: "Comprehensive guidelines for order cancellations, inventory releases, and payment reversals across our artisan marketplace.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] py-12 sm:py-20 text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <Link href="/" className="hover:text-zinc-950 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span>Policies</span>
          <span>/</span>
          <span className="text-zinc-950 font-semibold">Cancellation Policy</span>
        </div>

        {/* Header */}
        <div className="space-y-3 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-[11px] font-mono text-zinc-700 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span className="font-semibold uppercase tracking-wider">MARKETPLACE OPERATIONS STANDARD v2026.1</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif text-zinc-950 font-bold tracking-tight">
            Order Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-2xl">
            NEXU ATELIER protects patrons and artisan studios through transparent, deterministic cancellation rules. Learn how pre-dispatch cancellations, stock restorations, and payment reversals operate.
          </p>
        </div>

        {/* Key Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Pre-Dispatch Window</h2>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Patrons may cancel an order anytime before the artisan marks the parcel as dispatched and generates the 3PL Air Waybill (AWB).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Immediate Stock Release</h2>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Upon cancellation confirmation, reserved units are automatically restored to the studio catalog so fellow patrons may purchase them.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Automated Full Reversal</h2>
            <p className="text-xs text-zinc-600 leading-relaxed">
              100% of the transaction amount (including taxes and courier charges) is automatically refunded to the original payment source.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-zinc-700 leading-relaxed bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          {/* 1. Cancellation Eligibility */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold tracking-tight">
              1. Eligibility & Timeline
            </h2>
            <p>
              An order is eligible for instantaneous cancellation directly from your <Link href="/account/orders" className="text-amber-700 font-semibold underline underline-offset-4">Patron Account</Link> provided it resides in one of the following states:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-600">
              <li><strong className="text-zinc-900">Pending Review:</strong> Order registered in database awaiting initial studio acknowledgment.</li>
              <li><strong className="text-zinc-900">Confirmed:</strong> Payment cryptographically captured, studio scheduled for archival packaging.</li>
              <li><strong className="text-zinc-900">In Production / Packaging:</strong> Artisan handcrafting or boxing piece prior to courier handover.</li>
            </ul>
            <p className="text-xs text-zinc-500 pt-1">
              Once an order transitions to <span className="font-mono text-zinc-900 font-semibold">DISPATCHED</span> and an Air Waybill (AWB) is issued, it can no longer be cancelled in transit. Patrons must await receipt and initiate a return via our <Link href="/policies/refunds" className="text-amber-700 font-semibold underline underline-offset-4">14-Day Return Policy</Link>.
            </p>
          </section>

          {/* 2. Step-by-Step Cancellation Workflow */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold tracking-tight">
              2. How to Cancel an Order
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-zinc-600">
              <li>
                Navigate to <strong className="text-zinc-900">Account → Order History</strong> and locate your order.
              </li>
              <li>
                Click <strong className="text-zinc-900">View Order Details</strong> to inspect the order tracking page.
              </li>
              <li>
                If eligible, click the red <strong className="text-rose-600">Cancel Order</strong> button located on the order summary card.
              </li>
              <li>
                Optionally provide a reason for the studio archive (e.g. sizing adjustment or changed timeline) and confirm.
              </li>
              <li>
                Your order status updates immediately to <span className="font-mono text-rose-700 font-bold">CANCELLED</span>, and an automated audit confirmation receipt is dispatched.
              </li>
            </ol>
          </section>

          {/* 3. Refund Timelines */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold tracking-tight">
              3. Refund Disbursement SLA
            </h2>
            <p>
              When a pre-dispatch cancellation is executed, our payment integration automatically releases all escrow reservations. Settlement to your original payment method adheres to the following timelines:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-zinc-200 rounded-xl overflow-hidden">
                <thead className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Gateway Processing</th>
                    <th className="p-3">Bank Credit SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono text-[11px] text-zinc-600">
                  <tr>
                    <td className="p-3 text-zinc-900 font-sans font-medium">UPI / Instant Pay</td>
                    <td className="p-3 text-emerald-700 font-bold">Immediate</td>
                    <td className="p-3">2–24 Hours</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-zinc-900 font-sans font-medium">Net Banking</td>
                    <td className="p-3">Within 24 Hours</td>
                    <td className="p-3">2–4 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-zinc-900 font-sans font-medium">Debit / Credit Cards</td>
                    <td className="p-3">Within 24 Hours</td>
                    <td className="p-3">3–5 Business Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Non-Cancellable Items */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold tracking-tight">
              4. Bespoke & Personalized Pieces
            </h2>
            <p className="text-zinc-600">
              Certain atelier pieces marked as <span className="text-zinc-900 font-semibold">&ldquo;Custom Bespoke&rdquo;</span> or tailored to individual dimensions enter irreversible material cutting within 12 hours of payment. For such pieces, cancellation is permitted only prior to custom material preparation.
            </p>
          </section>

          {/* 5. Support Concierge */}
          <section className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Need assistance with an urgent cancellation?</span>
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              If your order is pending dispatch and you experience any issues, please submit an immediate inquiry via our{" "}
              <Link href="/contact" className="text-amber-950 font-semibold underline underline-offset-4">
                Concierge Contact Form
              </Link>{" "}
              or email <span className="font-mono font-semibold text-amber-950">concierge@nexu.studio</span> with your Order Reference.
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

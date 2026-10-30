import React from "react";
import Link from "next/link";
import { XCircle, ArrowLeft, ShieldAlert, Clock, RefreshCw, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Cancellation Policy — Nexu Atelier",
  description: "Comprehensive guidelines for order cancellations, inventory releases, and payment reversals across our artisan marketplace.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
        <Link href="/" className="hover:text-zinc-300 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-zinc-400">Policies</span>
        <span>/</span>
        <span className="text-zinc-200">Cancellation Policy</span>
      </div>

      {/* Header */}
      <div className="space-y-3 border-b border-zinc-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Marketplace Operations Standard v2026.1</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Order Cancellation Policy
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
          Nexu Atelier protects patrons and artisan studios through transparent, deterministic cancellation rules. Learn how pre-dispatch cancellations, stock restorations, and payment reversals operate.
        </p>
      </div>

      {/* Key Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-white">Pre-Dispatch Window</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Patrons may cancel an order anytime before the artisan marks the parcel as dispatched and generates the 3PL Air Waybill (AWB).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
            <RefreshCw className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-white">Immediate Stock Release</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Upon cancellation confirmation, reserved units are atomically restored to the studio catalog so fellow patrons may purchase them.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-white">Automated Full Reversal</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            100% of the transaction amount (including taxes and courier charges) is automatically queued for settlement via the original payment source.
          </p>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
        {/* 1. Cancellation Eligibility */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">
            1. Eligibility & Timeline
          </h2>
          <p>
            An order is eligible for instantaneous cancellation directly from your <Link href="/account/orders" className="text-zinc-100 underline underline-offset-4 hover:text-white">Patron Account</Link> provided it resides in one of the following states:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
            <li><strong className="text-zinc-200">Pending Review:</strong> Order registered in database awaiting initial seller acknowledgment.</li>
            <li><strong className="text-zinc-200">Confirmed:</strong> Payment cryptographically captured, studio scheduled for packaging.</li>
            <li><strong className="text-zinc-200">In Production / Packaging:</strong> Artisan handcrafting or boxing piece prior to courier handover.</li>
          </ul>
          <p className="text-xs text-zinc-400">
            Once an order transitions to <span className="font-mono text-zinc-200">DISPATCHED</span> and an Air Waybill (AWB) is issued, it can no longer be cancelled in transit. Patrons must await receipt and initiate a return via our <Link href="/policies/refunds" className="text-zinc-100 underline underline-offset-4 hover:text-white">14-Day Return Policy</Link>.
          </p>
        </section>

        {/* 2. Step-by-Step Cancellation Workflow */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">
            2. How to Cancel an Order
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-zinc-400">
            <li>
              Navigate to <strong className="text-zinc-200">Account → Order History</strong> and locate your order.
            </li>
            <li>
              Click <strong className="text-zinc-200">View Order Details</strong> to inspect the order tracking page.
            </li>
            <li>
              If eligible, click the red <strong className="text-rose-400">Cancel Order</strong> button located at the top right of the order card.
            </li>
            <li>
              Optionally provide a reason for the studio archive (e.g. sizing adjustment or changed timeline) and confirm.
            </li>
            <li>
              Your order status updates immediately to <span className="font-mono text-rose-400">CANCELLED</span>, and an automated audit confirmation email is dispatched.
            </li>
          </ol>
        </section>

        {/* 3. Refund Timelines */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">
            3. Refund Disbursement SLA
          </h2>
          <p>
            When a pre-dispatch cancellation is executed, our payment integration automatically releases all escrow reservations. Settlement to your original payment method adheres to the following timelines:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-zinc-800 rounded-xl overflow-hidden">
              <thead className="bg-zinc-900/80 text-zinc-300 font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Gateway Processing</th>
                  <th className="p-3">Bank Credit SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950 font-mono text-[11px] text-zinc-400">
                <tr>
                  <td className="p-3 text-zinc-200 font-sans">UPI / Instant Pay</td>
                  <td className="p-3 text-emerald-400">Immediate</td>
                  <td className="p-3">2–24 Hours</td>
                </tr>
                <tr>
                  <td className="p-3 text-zinc-200 font-sans">Net Banking</td>
                  <td className="p-3">Within 24 Hours</td>
                  <td className="p-3">2–4 Business Days</td>
                </tr>
                <tr>
                  <td className="p-3 text-zinc-200 font-sans">Debit / Credit Cards</td>
                  <td className="p-3">Within 24 Hours</td>
                  <td className="p-3">3–5 Business Days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Non-Cancellable Items */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">
            4. Bespoke & Personalized Pieces
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Certain atelier pieces marked as <span className="text-zinc-200">&ldquo;Custom Bespoke&rdquo;</span> or made to individual dimensions enter irreversible material cutting within 12 hours of payment. For such pieces, cancellation is permitted only prior to custom material preparation. Any such restrictions are explicitly flagged on the respective Product Display Page prior to checkout.
          </p>
        </section>

        {/* 5. Support Concierge */}
        <section className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2">
          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Need assistance with an urgent cancellation?</span>
          </h3>
          <p className="text-xs text-zinc-400">
            If your order is pending dispatch and you experience any issues, please submit an immediate inquiry via our{" "}
            <Link href="/contact" className="text-zinc-200 underline underline-offset-4 hover:text-white">
              Concierge Contact Form
            </Link>{" "}
            or email <span className="font-mono text-zinc-300">concierge@nexu.studio</span> with your Order Reference.
          </p>
        </section>
      </div>

      {/* Back Link */}
      <div className="pt-6 border-t border-zinc-800">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Storefront</span>
        </Link>
      </div>
    </div>
  );
}

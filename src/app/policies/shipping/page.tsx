import React from "react";
import Link from "next/link";
import { Truck, ShieldCheck, Clock, MapPin, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy — Nexu Atelier",
  description: "Comprehensive shipping guidelines, dispatch timeframes, courier tracking, and domestic serviceability.",
};

export default function ShippingPolicyPage() {
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
          Logistics Transparency
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
          Shipping & Delivery Policy
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Effective Date: October 30, 2026 • Verified carrier integrations via Bluedart & Delhivery
        </p>
      </div>

      {/* Key Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <Truck className="w-5 h-5 text-amber-400 mb-2" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
            Complimentary Shipping
          </h3>
          <p className="text-xs text-zinc-400">
            All orders above ₹2,500 qualify for free white-glove courier shipping across India.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <Clock className="w-5 h-5 text-emerald-400 mb-2" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
            Dispatch SLA
          </h3>
          <p className="text-xs text-zinc-400">
            Artisan studios dispatch finished orders within 48 business hours with live AWB tracking.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <ShieldCheck className="w-5 h-5 text-blue-400 mb-2" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
            Insured Transit
          </h3>
          <p className="text-xs text-zinc-400">
            Every parcel is sealed in tamper-evident archival crates with full damage-in-transit insurance.
          </p>
        </div>
      </div>

      {/* Body Content */}
      <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">1. Domestic Serviceability & PIN Code Verification</h2>
          <p>
            Nexu Atelier fulfills orders across all major postal circles in India covering over 19,000 PIN codes. During checkout, your 6-digit postal PIN code is validated against our active logistics routing table. In the rare event that a remote postal zone is categorized as unserviceable, our concierge will contact you within 24 hours to arrange alternate courier handoff or offer a full refund.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">2. Shipping Tiers & Delivery Timelines</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-zinc-800 rounded-xl">
              <thead className="bg-zinc-900/80 text-zinc-300 uppercase tracking-wider">
                <tr>
                  <th className="p-3 border-b border-zinc-800">Tier / Method</th>
                  <th className="p-3 border-b border-zinc-800">Carrier Partner</th>
                  <th className="p-3 border-b border-zinc-800">Estimated Transit</th>
                  <th className="p-3 border-b border-zinc-800">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-400">
                <tr>
                  <td className="p-3 font-medium text-white">Standard Courier</td>
                  <td className="p-3">Delhivery Surface / Ecom Express</td>
                  <td className="p-3">4 – 6 Business Days</td>
                  <td className="p-3">₹150 (Free over ₹2,500)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-white">Priority Air Express</td>
                  <td className="p-3">Bluedart Air Express</td>
                  <td className="p-3">2 – 3 Business Days</td>
                  <td className="p-3">₹350 flat rate</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-white">Artisan Direct Freight</td>
                  <td className="p-3">Specialized Crated Transit</td>
                  <td className="p-3">5 – 8 Business Days</td>
                  <td className="p-3">Calculated on piece mass</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">3. Multi-Vendor Parcel Partitioning</h2>
          <p>
            Because Nexu Atelier features independent master weavers, ceramicists, and acoustic dynamics laboratories, orders containing pieces from multiple studios may ship in separate discrete parcels. You will receive dedicated Air Waybill (AWB) tracking numbers and dispatch notifications for each studio&apos;s parcel at no additional shipping fee.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">4. Damaged Parcels & Transit Claims</h2>
          <p>
            Please inspect the outer tamper-evident seal before signing delivery handoff. If the parcel exhibits physical damage, crushing, or tampered tape, you may refuse delivery or sign with a notation &quot;Damaged on Arrival&quot;. Notify our concierge at <a href="mailto:concierge@nexu.studio" className="text-amber-400 underline underline-offset-4">concierge@nexu.studio</a> within 48 hours with photographs of the packaging to initiate immediate replacement or escrow refund.
          </p>
        </section>
      </div>
    </div>
  );
}

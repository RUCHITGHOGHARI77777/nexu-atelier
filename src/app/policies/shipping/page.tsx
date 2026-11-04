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
            LOGISTICS TRANSPARENCY
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif text-zinc-950 tracking-tight font-bold">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Effective Date: October 30, 2026 • Verified carrier integrations via Bluedart Air & Delhivery
          </p>
        </div>

        {/* Key Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Complimentary Shipping
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              All orders above ₹2,500 qualify for complimentary white-glove courier delivery across India.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Dispatch SLA
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Artisan studios dispatch finished orders within 48 business hours with live AWB tracking.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Insured Transit
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Every parcel is sealed in tamper-evident archival crates with full damage-in-transit insurance.
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-zinc-700 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">1. Domestic Serviceability & PIN Code Verification</h2>
            <p>
              NEXU ATELIER fulfills orders across all major postal circles in India covering over 19,000 PIN codes. During checkout, your 6-digit postal PIN code is validated against our active logistics routing table. In the rare event that a remote postal zone is categorized as unserviceable, our concierge desk will contact you within 24 hours to arrange alternate courier handoff or offer an immediate full refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">2. Shipping Tiers & Delivery Timelines</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-zinc-200 rounded-xl overflow-hidden">
                <thead className="bg-zinc-50 text-zinc-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3 border-b border-zinc-200">Tier / Method</th>
                    <th className="p-3 border-b border-zinc-200">Carrier Partner</th>
                    <th className="p-3 border-b border-zinc-200">Estimated Transit</th>
                    <th className="p-3 border-b border-zinc-200">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-600">
                  <tr>
                    <td className="p-3 font-medium text-zinc-950">Standard Courier</td>
                    <td className="p-3">Delhivery Surface / Ecom Express</td>
                    <td className="p-3">4 – 6 Business Days</td>
                    <td className="p-3">₹150 (Free over ₹2,500)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-zinc-950">Priority Air Express</td>
                    <td className="p-3">Bluedart Air Express</td>
                    <td className="p-3">2 – 3 Business Days</td>
                    <td className="p-3">₹350 flat rate</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-zinc-950">Artisan Direct Freight</td>
                    <td className="p-3">Specialized Crated Transit</td>
                    <td className="p-3">5 – 8 Business Days</td>
                    <td className="p-3">Calculated on piece mass</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">3. Multi-Vendor Parcel Partitioning</h2>
            <p>
              Because NEXU ATELIER connects you directly with independent master weavers, ceramicists, and acoustic laboratories, orders containing pieces from multiple studios may ship in separate discrete parcels. You will receive dedicated Air Waybill (AWB) tracking numbers and dispatch notifications for each studio&apos;s parcel at no additional shipping charge.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">4. Damaged Parcels & Transit Claims</h2>
            <p>
              Please inspect the outer tamper-evident seal before signing delivery handoff. If the parcel exhibits physical damage, crushing, or tampered tape, you may refuse delivery or sign with a notation &quot;Damaged on Arrival&quot;. Notify our concierge at <a href="mailto:concierge@nexu.studio" className="text-amber-700 font-semibold underline underline-offset-4">concierge@nexu.studio</a> within 48 hours with photographs of the packaging to initiate immediate replacement or escrow refund.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

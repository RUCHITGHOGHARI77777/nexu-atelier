"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, CheckCircle2, ArrowUpRight, Truck, FileText } from "lucide-react";

export function BecomeSupplierSection() {
  const benefits = [
    {
      icon: Building2,
      title: "Direct Studio Identity",
      description: "Establish your dedicated brand boutique with verified studio credentials, atelier photography, and full creative autonomy.",
    },
    {
      icon: FileText,
      title: "Automated GST Compliance",
      description: "Statutory Indian GST calculation engine adhering to Notification 13/2025 with automated HSN invoices.",
    },
    {
      icon: ShieldCheck,
      title: "Direct Settlement Ledger",
      description: "Authoritative bank settlements with transparent minor-unit accounting and complete ledger traceability.",
    },
    {
      icon: Truck,
      title: "Nationwide Logistics",
      description: "Integrated express surface and air shipping with automated AWB generation across 19,000+ PIN codes.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Apply Online",
      detail: "Submit your studio details, craft lineage, and GSTIN identification in 5 minutes.",
    },
    {
      num: "02",
      title: "Studio Verification",
      detail: "Our curation team reviews material integrity, workshop origin, and production standards.",
    },
    {
      num: "03",
      title: "Publish & Fulfill",
      detail: "List your catalog, manage inventory, and fulfill orders with integrated dispatch labels.",
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-14 shadow-xs space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
              <span>Supplier &amp; Guild Partnerships</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 font-serif">
              Partner with NEXU ATELIER to Reach Conscious Patrons
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-sans">
              We connect verified independent studios, master weavers, and precision hardware engineers directly with a nationwide audience of discerning patrons.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/seller/apply"
              className="px-6 py-3 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-xs active:scale-98"
            >
              <span>Apply as a Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/seller"
              className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 text-xs font-semibold transition-all inline-flex items-center gap-1.5 active:scale-98"
            >
              <span>Supplier Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-950 font-serif">
                  {b.title}
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-6 border-t border-zinc-200 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 font-sans">
              • How Atelier Onboarding Works
            </span>
            <span className="text-xs text-zinc-500 font-sans">
              Zero onboarding fees • Direct verification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div
                key={s.num}
                className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-2 hover:border-zinc-400 transition-colors"
              >
                <span className="text-2xl font-serif font-black text-zinc-950 block">
                  {s.num}
                </span>
                <h4 className="text-sm font-bold text-zinc-950 font-serif">
                  {s.title}
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                  {s.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

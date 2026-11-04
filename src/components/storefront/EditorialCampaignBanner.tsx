"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, RefreshCw, Truck, HeartHandshake } from "lucide-react";

export function EditorialCampaignBanner() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl bg-zinc-950 text-white p-8 sm:p-14 relative overflow-hidden shadow-2xl">
        {/* Subtle Luxury Pattern / Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Statement */}
          <div className="lg:col-span-8 space-y-4 max-w-2xl">
            <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold block">
              THE PATRON PROTECTION PROTOCOL
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white font-serif">
              Direct From Master Looms. <br className="hidden sm:inline" />
              <span className="text-zinc-300 font-normal italic">
                Zero Intermediary Exploitation.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
              In traditional luxury retail, over 65% of the patron&apos;s payment is absorbed by distributors, importers, and showrooms. At NEXU ATELIER, 100% of the asking price is transferred directly to verified artisan guilds.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2"
              >
                <span>Read Our Ethics Charter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/shop"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider transition-colors border border-white/20"
              >
                Discover Collections
              </Link>
            </div>
          </div>

          {/* Key Facts Matrix */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">100%</span>
              <p className="text-[11px] text-zinc-400">Direct studio payout upon verified delivery</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">0 ₹</span>
              <p className="text-[11px] text-zinc-400">Zero commission markups on patron orders</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">48 Hr</span>
              <p className="text-[11px] text-zinc-400">Guaranteed packaging & dispatch SLA</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">7-Day</span>
              <p className="text-[11px] text-zinc-400">Artisan exchange and authenticity guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


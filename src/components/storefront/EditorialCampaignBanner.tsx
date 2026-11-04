"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, RefreshCw, Truck, HeartHandshake } from "lucide-react";

export function EditorialCampaignBanner() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] p-8 sm:p-14 relative overflow-hidden shadow-sm">
        {/* Subtle Luxury Pattern / Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Statement */}
          <div className="lg:col-span-8 space-y-4 max-w-2xl">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#B78B45] font-bold block">
              THE PATRON PROTECTION PROTOCOL
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[#171717] font-serif">
              Direct From Master Looms. <br className="hidden sm:inline" />
              <span className="text-[#626262] font-normal italic">
                Zero Intermediary Exploitation.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#626262] leading-relaxed max-w-xl">
              In traditional luxury retail, over 65% of the patron&apos;s payment is absorbed by distributors, importers, and showrooms. At NEXU ATELIER, 90% of order value settles directly to verified artisan guilds via escrow upon delivery, with an honest, transparent 10% platform fee and zero hidden markups.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="px-6 py-3 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Read Our Ethics Charter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/shop"
                className="px-6 py-3 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] font-semibold text-xs uppercase tracking-wider transition-colors border border-[#E8E8E4] shadow-xs cursor-pointer"
              >
                Discover Collections
              </Link>
            </div>
          </div>

          {/* Key Facts Matrix */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E8E8E4] shadow-xs space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#171717] font-mono">90%</span>
              <p className="text-[11px] text-[#767676]">Net studio escrow payout upon verified delivery</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E8E8E4] shadow-xs space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#21866F] font-mono">0 ₹</span>
              <p className="text-[11px] text-[#767676]">Zero hidden markups or showroom fees</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E8E8E4] shadow-xs space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#B78B45] font-mono">48 Hr</span>
              <p className="text-[11px] text-[#767676]">Guaranteed packaging & dispatch SLA</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E8E8E4] shadow-xs space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#171717] font-mono">7-Day</span>
              <p className="text-[11px] text-[#767676]">Artisan exchange and authenticity guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


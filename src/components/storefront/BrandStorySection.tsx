"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Truck, RefreshCw, Sparkles, ArrowRight } from "lucide-react";

export function BrandStorySection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Visual Photography Collage */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="relative aspect-3/4 rounded-3xl overflow-hidden bg-zinc-100 shadow-md">
            <Image
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"
              alt="Loom shuttle craftsmanship"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-4 pt-8">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-100 shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
                alt="Master Artisan"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/90 text-zinc-900 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold block">
                LIVING HERITAGE
              </span>
              <p className="text-xs font-semibold">
                &ldquo;Every thread carries centuries of lineage, knowledge passed from mother to daughter.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Mission Text & Pillars */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-amber-700 uppercase tracking-widest font-semibold block">
              OUR HERITAGE & ETHOS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-serif leading-tight">
              Bridging Ancient Heritage With Discerning Global Patrons
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              NEXU ATELIER was founded on a simple truth: India produces the world&apos;s most sophisticated artisanal textiles, brassware, and acoustics, yet traditional supply chains leave artisans vulnerable and patrons disconnected.
            </p>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              We provide sovereign digital storefronts, verified KYB provenance, automated GST accounting, and direct bank settlement—enabling master craftspeople to thrive on their own terms.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-950">Heirloom Provenance</h4>
                <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                  Verified studio certificates with geographic and maker identification.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-950">Climate-Neutral Air</h4>
                <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                  Priority domestic & international delivery via Blue Dart Express.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-950">7-Day Studio Exchange</h4>
                <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                  Effortless replacements and size adjustments with dedicated concierge.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-950">Direct Studio Settlement</h4>
                <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                  Artisans receive direct payout with verified banking transaction receipts.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/about"
              className="text-xs font-bold text-zinc-950 hover:text-blue-600 inline-flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              <span>Explore The Full Atelier Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


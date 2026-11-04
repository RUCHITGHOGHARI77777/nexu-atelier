"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, MapPin, Award, CheckCircle2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export function EditorialHeroSection() {
  const { formatPrice, activeRegion } = useStore();

  return (
    <section className="relative pt-4 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Asymmetrical Luxury Magazine Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Stage: Hero Editorial Card (8 Columns) */}
          <div className="lg:col-span-8 rounded-3xl bg-zinc-950 text-white relative overflow-hidden min-h-[520px] flex flex-col justify-end p-8 sm:p-12 shadow-xl group">
            {/* Background Editorial Image with subtle zoom on hover */}
            <div className="absolute inset-0 z-0">
              <Image
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85"
                alt="Heirloom Indian Silk Textiles"
                fill
                priority
                className="object-cover object-center opacity-70 group-hover:scale-103 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Editorial Content Overlay */}
            <div className="relative z-10 space-y-5 max-w-2xl">
              {/* Provenance Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/30">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Curated Autumn / Winter 2026</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 backdrop-blur-md">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Direct From Master Looms</span>
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
                  Heirloom Craftsmanship. <br className="hidden sm:inline" />
                  <span className="text-zinc-200 font-normal italic font-serif">
                    Direct From Independent Guilds.
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 max-w-xl leading-relaxed">
                  Discover museum-grade raw mulberry silks, point-to-point acoustic tube amplifiers, and lost-wax cast brassware direct from certified Indian artisan studios.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/shop"
                  className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-xl active:scale-98 flex items-center gap-2"
                >
                  <span>Explore The Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/collections"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider backdrop-blur-md border border-white/25 transition-all duration-200"
                >
                  View Lookbooks
                </Link>
              </div>
            </div>
          </div>

          {/* Right Stage: Dual Curated Feature Cards (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Feature 1: Artisan Studio Spotlight Card */}
            <div className="flex-1 rounded-3xl bg-white border border-zinc-200/90 shadow-sm p-6 sm:p-7 flex flex-col justify-between hover:border-zinc-300 transition-all duration-300 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Artisan Spotlight
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    <span>Surat, India</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 group-hover:text-blue-600 transition-colors">
                    Solstice Loom Studio
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                    A family atelier of second-generation textile engineers preserving slow-cloth traditions using certified organic dyes and 100% natural Mulberry silk.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div className="text-xs font-mono text-zinc-500">
                  <span className="font-bold text-zinc-900">4.9 ★</span> (128 reviews)
                </div>
                <Link
                  href="/store/solstice-loom-studio"
                  className="text-xs font-bold text-zinc-900 group-hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  <span>Visit Atelier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 2: Escrow Protection & Trust Card */}
            <div className="rounded-3xl bg-zinc-900 text-white p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Direct Artisan Escrow
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    100% of patron payments are secured in escrow and only released to the master craftspeople after verified delivery and inspection.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400 relative z-10">
                <span>Zero Middlemen Markup</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% Protected</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

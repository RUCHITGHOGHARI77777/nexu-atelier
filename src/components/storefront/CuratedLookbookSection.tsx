"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export function CuratedLookbookSection() {
  const { formatPrice } = useStore();

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-zinc-200 gap-4">
        <div>
          <span className="text-[11px] font-mono text-amber-700 uppercase tracking-widest block mb-1 font-semibold">
            EDITORIAL LOOKBOOK
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-serif">
            The Royal Benaras & Chanderi Edit
          </h2>
        </div>
        <Link
          href="/collections"
          className="text-xs font-bold text-zinc-900 hover:text-blue-600 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
        >
          <span>View All 6 Lookbooks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Split Magazine Layout: 7 cols Editorial Story, 5 cols 2 Ensemble Pieces */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Full-Bleed Editorial Story Card */}
        <div className="lg:col-span-7 rounded-3xl overflow-hidden bg-zinc-900 text-white relative min-h-[460px] flex flex-col justify-end p-8 sm:p-10 group shadow-lg">
          <Image
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80"
            alt="Royal Benaras Weave"
            fill
            className="object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="relative z-10 space-y-3 max-w-lg">
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300">
              Autumn / Winter 2026 Lookbook
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif leading-tight">
              &ldquo;The 48-Hour Loom: Where Time Becomes Silk&rdquo;
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Every warp and weft is tensioned by hand on wooden pit looms. The Royal Benaras collection revives mughal-era floral jaal motifs using certified chemical-free water baths.
            </p>
            <div className="pt-2">
              <Link
                href="/shop?category=Apparel"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider hover:bg-zinc-100 transition-colors"
              >
                <span>Shop The Edit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: 2 Featured Ensemble Cards */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          {/* Piece 1 */}
          <Link
            href="/product/chanderi-silk-embroidered-anarkali-robe"
            className="flex-1 rounded-3xl bg-white border border-zinc-200/90 hover:border-zinc-300 p-5 flex gap-5 items-center transition-all duration-300 hover:shadow-md group"
          >
            <div className="relative w-32 h-36 rounded-2xl overflow-hidden shrink-0 bg-zinc-100">
              <Image
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"
                alt="Chanderi Silk Anarkali"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                Mulberry Handloom
              </span>
              <h4 className="text-sm font-bold text-zinc-950 group-hover:text-blue-600 transition-colors line-clamp-1">
                Chanderi Silk Embroidered Anarkali Silhouette
              </h4>
              <p className="text-xs text-zinc-500 font-mono">
                Solstice Loom Studio • Surat
              </p>
              <div className="pt-1 flex items-baseline gap-2">
                <span className="font-extrabold text-sm text-zinc-950 font-mono">
                  {formatPrice(3490)}
                </span>
                <span className="text-xs text-zinc-400 line-through font-mono">
                  {formatPrice(5200)}
                </span>
              </div>
            </div>
          </Link>

          {/* Piece 2 */}
          <Link
            href="/product/solstice-handwoven-bandhej-viscose-saree"
            className="flex-1 rounded-3xl bg-white border border-zinc-200/90 hover:border-zinc-300 p-5 flex gap-5 items-center transition-all duration-300 hover:shadow-md group"
          >
            <div className="relative w-32 h-36 rounded-2xl overflow-hidden shrink-0 bg-zinc-100">
              <Image
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80"
                alt="Solstice Bandhej Saree"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                Hand-Tied Bandhej
              </span>
              <h4 className="text-sm font-bold text-zinc-950 group-hover:text-blue-600 transition-colors line-clamp-1">
                Solstice Hand-Tied Bandhej Georgette Saree
              </h4>
              <p className="text-xs text-zinc-500 font-mono">
                Solstice Loom Studio • Surat
              </p>
              <div className="pt-1 flex items-baseline gap-2">
                <span className="font-extrabold text-sm text-zinc-950 font-mono">
                  {formatPrice(2890)}
                </span>
                <span className="text-xs text-zinc-400 line-through font-mono">
                  {formatPrice(4200)}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

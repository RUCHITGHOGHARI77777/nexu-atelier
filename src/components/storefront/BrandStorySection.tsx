"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, ArrowRight, Award, Sparkles } from "lucide-react";

export function BrandStorySection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-xs">
            <Image
              src="/products/sarees/saree_01.jpg"
              alt="Varanasi master handloom silk weaving"
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              className="object-cover hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-white text-[11px] font-medium font-sans">
              Hand-guided Shuttle Loom • Varanasi
            </div>
          </div>
          <div className="space-y-4 pt-6">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-xs">
              <Image
                src="/products/furniture/furniture_03.jpg"
                alt="Moradabad lost-wax brassware foundry"
                fill
                sizes="(max-width: 768px) 50vw, 300px"
                className="object-cover hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 text-white text-[11px] font-medium font-sans">
                Lost-Wax Sand Casting • Moradabad
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-950 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
                <span>Generational Provenance</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Every thread, casting, and carve carries documented lineage straight from India&apos;s master artisan clusters.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
              <span>Platform Ethos &amp; Direct Patronage</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 font-serif leading-tight">
              Direct From Master Looms &amp; Foundries to Conscious Patrons
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              NEXU ATELIER was founded on a simple conviction: India produces the world&apos;s finest handlooms, metalworks, and acoustic objects, yet multi-tier intermediaries extract up to 60% of value while disconnecting makers from patrons.
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              We empower generational guild masters with sovereign digital storefronts, automated GST-compliant billing, and immediate escrow settlement—eliminating predatory commissions and ensuring fair artisan livelihood.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold font-serif text-zinc-950">140+</div>
              <div className="text-xs font-semibold text-zinc-900 mt-0.5">Master Guilds</div>
              <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">Directly verified across 18 craft clusters.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold font-serif text-zinc-950">100%</div>
              <div className="text-xs font-semibold text-zinc-900 mt-0.5">Direct Remittance</div>
              <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">Escrow release upon delivery confirmation.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold font-serif text-zinc-950">0%</div>
              <div className="text-xs font-semibold text-zinc-900 mt-0.5">Middlemen Markup</div>
              <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">Transparent statutory GST &amp; fair pricing.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold font-serif text-zinc-950">GI-Tagged</div>
              <div className="text-xs font-semibold text-zinc-900 mt-0.5">Authentic Provenance</div>
              <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">Geographical Indication certs verified.</p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-all shadow-xs active:scale-98"
            >
              <span>Explore The Atelier Manifesto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

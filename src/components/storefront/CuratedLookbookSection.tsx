"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export function CuratedLookbookSection() {
  const { formatPrice } = useStore();

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-zinc-200 gap-4">
        <div>
          <span className="text-xs font-semibold text-zinc-500 block mb-1 font-sans">
            Editorial Edit
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-serif">
            The Chanderi &amp; Bandhej Collection
          </h2>
        </div>
        <Link
          href="/collections"
          className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
        >
          <span>View All Collections</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 rounded-2xl overflow-hidden bg-zinc-950 text-white relative min-h-[460px] flex flex-col justify-end p-8 sm:p-10 border border-zinc-800">
          <Image
            src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1400&q=80"
            alt="Artisanal Handloom Craft"
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="relative z-10 space-y-4 max-w-lg">
            <span className="text-xs font-sans font-semibold tracking-wider text-zinc-300 uppercase">
              Textile Lineage
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight font-serif">
              Where Heritage Weave Meets Minimalist Form
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              Every warp and weft is tensioned by hand on traditional pit looms. Sourced directly from certified weaving clusters preserving centuries-old slow-cloth traditions.
            </p>
            <div className="pt-2">
              <Link
                href="/shop?category=Apparel"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-zinc-950 font-medium text-xs uppercase tracking-wider hover:bg-zinc-100 transition-colors shadow-sm"
              >
                <span>Shop The Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          <Link
            href="/product/chanderi-silk-embroidered-anarkali-robe"
            className="flex-1 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-950 p-5 flex gap-5 items-center transition-all duration-200 shadow-xs group"
          >
            <div className="relative w-32 h-36 rounded-xl overflow-hidden shrink-0 bg-zinc-50 border border-zinc-200">
              <Image
                src="/products/chanderi-silk-embroidered-anarkali-robe/1.jpg"
                alt="Chanderi Silk Anarkali"
                fill
                sizes="128px"
                className="object-cover group-hover:scale-103 transition-transform duration-300"
              />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-[11px] font-sans font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                Mulberry Silk
              </span>
              <h4 className="text-sm font-semibold text-zinc-950 group-hover:underline line-clamp-1 font-sans">
                Chanderi Silk Embroidered Anarkali Silhouette
              </h4>
              <p className="text-xs text-zinc-500 font-sans">
                Solstice Loom Studio • Surat
              </p>
              <div className="pt-1 flex items-baseline gap-2">
                <span className="font-bold text-sm text-zinc-950 font-mono">
                  {formatPrice(3490)}
                </span>
                <span className="text-xs text-zinc-400 line-through font-mono">
                  {formatPrice(5200)}
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/product/solstice-handwoven-bandhej-viscose-saree"
            className="flex-1 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-950 p-5 flex gap-5 items-center transition-all duration-200 shadow-xs group"
          >
            <div className="relative w-32 h-36 rounded-xl overflow-hidden shrink-0 bg-zinc-50 border border-zinc-200">
              <Image
                src="/products/solstice-handwoven-bandhej-viscose-saree/1.jpg"
                alt="Solstice Bandhej Saree"
                fill
                sizes="128px"
                className="object-cover group-hover:scale-103 transition-transform duration-300"
              />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-[11px] font-sans font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                Hand-Tied Bandhej
              </span>
              <h4 className="text-sm font-semibold text-zinc-950 group-hover:underline line-clamp-1 font-sans">
                Solstice Hand-Tied Bandhej Georgette Saree
              </h4>
              <p className="text-xs text-zinc-500 font-sans">
                Solstice Loom Studio • Surat
              </p>
              <div className="pt-1 flex items-baseline gap-2">
                <span className="font-bold text-sm text-zinc-950 font-mono">
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

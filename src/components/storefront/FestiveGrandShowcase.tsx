"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, ArrowRight, Award, Compass } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export function FestiveGrandShowcase() {
  const { setSelectedCategory, setSearchQuery } = useStore();

  const handlePillClick = (cat: string, search: string) => {
    setSelectedCategory(cat);
    setSearchQuery(search);
    const catalogElem = document.getElementById("marketplace-catalog");
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative rounded-3xl bg-[#FAF8F5] border border-stone-200/90 text-stone-900 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  <span>The Heritage Exhibition • Autumn / Festive 2026</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white text-stone-700 border border-stone-200 shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-stone-500" />
                  <span>Certified Masterpiece Guilds</span>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-bold tracking-tight font-serif text-stone-950 leading-[1.15]">
                  Authentic Master Craftsmen Drops. <br className="hidden sm:inline" />
                  <span className="text-stone-500 font-normal italic">Direct from Looms &amp; Foundries.</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 max-w-xl leading-relaxed font-sans">
                  Direct from the shuttle looms of Varanasi, the pottery wheels of Kutch, and the lost-wax foundries of Moradabad. 
                  Zero middleman markups, statutory GST transparency, and verified artisan bank remittance upon delivery.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/catalog?category=Heirloom+Sarees+%26+Handlooms"
                  className="px-6 py-3 rounded-xl bg-stone-950 hover:bg-stone-850 text-white font-semibold text-xs transition-all shadow-xs active:scale-98 flex items-center gap-2 group font-sans"
                >
                  <span>Explore Exhibition Drops</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/seller/apply"
                  className="px-5 py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 font-semibold text-xs transition-all shadow-2xs active:scale-98 font-sans"
                >
                  <span>Apply as Master Artisan</span>
                </Link>
              </div>

              <div className="pt-2 space-y-2">
                <span className="text-xs font-semibold text-stone-500 block font-sans">
                  Featured Craft Disciplines:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Varanasi Silk Sarees", category: "Heirloom Sarees & Handlooms", query: "silk" },
                    { label: "Studio Acoustics & Terracotta", category: "Furniture & Home Decor", query: "vessel" },
                    { label: "Handloom Wool Throws", category: "Furniture & Home Decor", query: "wool" },
                    { label: "Lost-Wax Cast Brassware", category: "Furniture & Home Decor", query: "brass" },
                    { label: "Bespoke Heritage Footwear", category: "Men's Fashion & Heritage Apparel", query: "leather" },
                  ].map((pill) => (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={() => handlePillClick(pill.category, pill.query)}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-medium transition-all shadow-2xs hover:border-stone-400 cursor-pointer font-sans"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-stone-200/80 text-xs font-sans">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-stone-800" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">100% Genuine Handcraft</p>
                  <p className="text-[11px] text-stone-500">GI-tagged maker provenance</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Truck className="w-4 h-4 text-stone-800" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Free Insured Transit</p>
                  <p className="text-[11px] text-stone-500">End-to-end tracked courier</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <RotateCcw className="w-4 h-4 text-stone-800" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">7-Day Doorstep Returns</p>
                  <p className="text-[11px] text-stone-500">Full inspection guarantee</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-4 h-4 text-stone-800" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Direct Escrow Payout</p>
                  <p className="text-[11px] text-stone-500">Released upon delivery</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-stone-100 border-t lg:border-t-0 lg:border-l border-stone-200/90 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 font-sans">
                <span className="font-semibold text-stone-900">• Exhibition Specimens</span>
                <span>GI Registry 2026</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-2">
                  <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-white border border-stone-200/90 shadow-2xs group">
                    <Image
                      src="/products/sarees/saree_01.jpg"
                      alt="Varanasi Katan Silk Handloom Specimen"
                      fill
                      sizes="(max-width: 1024px) 50vw, 250px"
                      className="object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/95 text-stone-900 border border-stone-200 shadow-2xs">
                      Handloom Silk
                    </div>
                  </div>
                  <div className="text-[11px] font-sans">
                    <p className="font-semibold text-stone-900 line-clamp-1">Kota Doria Silk Zari</p>
                    <p className="text-stone-500">Varanasi Looms • ₹14,800</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-white border border-stone-200/90 shadow-2xs group">
                    <Image
                      src="/products/furniture/furniture_03.jpg"
                      alt="Lost-Wax Cast Brass Urli Specimen"
                      fill
                      sizes="(max-width: 1024px) 50vw, 250px"
                      className="object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/95 text-stone-900 border border-stone-200 shadow-2xs">
                      Lost-Wax Cast
                    </div>
                  </div>
                  <div className="text-[11px] font-sans">
                    <p className="font-semibold text-stone-900 line-clamp-1">Cast Brass Temple Urli</p>
                    <p className="text-stone-500">Moradabad Foundry • ₹4,200</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-200/80 text-[11px] text-stone-500 font-sans flex items-center justify-between">
              <span>All pieces photographed in natural studio light</span>
              <span className="font-medium text-stone-800">100% Face-Free</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

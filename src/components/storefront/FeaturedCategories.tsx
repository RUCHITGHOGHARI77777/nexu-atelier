"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES_METADATA } from "@/data/seedCatalog";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export const FeaturedCategories: React.FC = () => {
  const [categories, setCategories] = useState(CATEGORIES_METADATA);

  useEffect(() => {
    async function loadLiveCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      } catch {
        // Fallback to initial metadata
      }
    }
    loadLiveCategories();
  }, []);

  const [heroCategory, ...gridCategories] = categories;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-[11px] font-mono text-amber-700 uppercase tracking-widest block mb-1 font-semibold">
            STUDIO DISCIPLINES
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            Curated Guild Disciplines
          </h2>
        </div>
        <Link
          href="/catalog"
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1.5 transition-colors"
        >
          <span>Explore All 12 Pieces</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hero Category Tile */}
        {heroCategory && (
          <Link
            href={`/catalog?category=${encodeURIComponent(heroCategory.name)}`}
            className="group relative lg:col-span-5 rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 shadow-sm hover:shadow-lg transition-all flex flex-col justify-end min-h-[380px] lg:min-h-[460px]"
          >
            <div className="absolute inset-0 bg-zinc-100">
              <ImageWithFallback
                src={heroCategory.image}
                alt={heroCategory.name}
                fill
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
            </div>

            <div className="relative z-10 p-6 sm:p-8 space-y-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
                FLAGSHIP DISCIPLINE
              </span>
              <h3 className="text-2xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {heroCategory.name}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-200 max-w-sm leading-relaxed">
                {heroCategory.description}
              </p>
              <div className="pt-2 inline-flex items-center gap-2 text-xs font-semibold text-white">
                <span>View Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        )}

        {/* Right Column: 4 Sub-Categories in 2x2 Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {gridCategories.map((cat) => (
            <Link
              key={cat.name}
              href={`/catalog?category=${encodeURIComponent(cat.name)}`}
              className="group relative rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between min-h-[220px]"
            >
              <div className="relative aspect-[16/9] w-full bg-zinc-100 overflow-hidden">
                <ImageWithFallback
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>

              <div className="p-4 flex items-center justify-between bg-white border-t border-zinc-100">
                <div>
                  <h4 className="text-sm font-bold text-zinc-950 group-hover:text-amber-700 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-all shrink-0">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

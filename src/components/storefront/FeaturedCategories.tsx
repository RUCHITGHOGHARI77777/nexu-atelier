"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

interface LiveCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  _count?: {
    products: number;
  };
}

const DEFAULT_CATEGORIES: LiveCategory[] = [
  {
    id: "cat_apparel",
    slug: "apparel",
    name: "Fine Silks & Handlooms",
    description: "Museum-grade raw mulberry silks, organic khadi robes, and heirloom festive sarees from master weavers.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    _count: { products: 18 },
  },
  {
    id: "cat_audio",
    slug: "audio-electronics",
    name: "Acoustic Engineering",
    description: "Bespoke point-to-point hand-wired vacuum tube amplifiers and acoustic monitors.",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    _count: { products: 12 },
  },
  {
    id: "cat_home",
    slug: "home-objects",
    name: "Foundry & Brassware",
    description: "Heavy lost-wax cast temple urlis, incense vessels, and organic terracotta ceramics.",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    _count: { products: 14 },
  },
  {
    id: "cat_footwear",
    slug: "footwear-leather",
    name: "Leather & Heritage Footwear",
    description: "Goodyear-welted vegetable-tanned leather derbies, boots, and hand-stitched kolhapuri sandals.",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    _count: { products: 8 },
  },
];

export const FeaturedCategories: React.FC = () => {
  const [categories, setCategories] = useState<LiveCategory[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLiveCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            const valid = data.categories.filter(
              (c: any) =>
                !c.name?.toLowerCase().includes("test") &&
                !c.slug?.toLowerCase().includes("cust-cat")
            );
            if (valid.length > 0) {
              setCategories(valid);
            }
          }
        }
      } catch {
        // silence network error
      } finally {
        setIsLoading(false);
      }
    }
    loadLiveCategories();
  }, []);

  const displayList = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const [heroCategory, ...gridCategories] = displayList;

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
          href="/categories"
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1.5 transition-colors"
        >
          <span>Explore All Disciplines</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hero Category Tile */}
        {heroCategory && (
          <Link
            href={`/category/${heroCategory.slug}`}
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
                  FLAGSHIP DISCIPLINE
                </span>
                {heroCategory._count && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                    {heroCategory._count.products} pieces
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {heroCategory.name}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-200 max-w-sm leading-relaxed">
                {heroCategory.description}
              </p>
              <div className="pt-2 inline-flex items-center gap-2 text-xs font-semibold text-white">
                <span>View Discipline Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        )}

        {/* Right Column: Sub-Categories Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {gridCategories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
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
                {cat._count && (
                  <span className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                    {cat._count.products} pieces
                  </span>
                )}
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

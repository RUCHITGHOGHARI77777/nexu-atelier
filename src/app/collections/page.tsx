import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight, Sparkles, Flame, Clock, Tag } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export const metadata: Metadata = {
  title: "Curated Collections | NEXU ATELIER",
  description:
    "Explore specially curated collections from verified Indian master weavers, acoustic laboratories, and industrial sand-casters.",
};

const CURATED_COLLECTIONS = [
  {
    slug: "new-arrivals",
    title: "New Studio Arrivals",
    badge: "FRESH RELEASE",
    description: "The latest seasonal releases freshly completed on heritage handlooms and casting benches.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    href: "/new-arrivals",
    itemCount: "Latest drops",
  },
  {
    slug: "best-sellers",
    title: "Most Patroned Pieces",
    badge: "COLLECTIVE FAVORITES",
    description: "Masterwork creations receiving sustained acclaim and repeat orders from design connoisseurs.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    href: "/best-sellers",
    itemCount: "Top patroned",
  },
  {
    slug: "trending",
    title: "Trending in the Atelier",
    badge: "ACTIVE FOCUS",
    description: "Pieces experiencing peak curiosity and immediate studio dispatch across international markets.",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    href: "/trending",
    itemCount: "High velocity",
  },
  {
    slug: "sale",
    title: "Archive Drops & Special Value",
    badge: "SEASONAL ARCHIVE",
    description: "Exceptional studio pieces offered at special promotional pricing for private collections.",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    href: "/sale",
    itemCount: "Special value",
  },
];

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-zinc-50/50 py-10 sm:py-16 text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-mono text-zinc-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>EDITORIAL CURATION</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950">
            Curated Atelier Collections
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Thematic selections curated around craft heritage, precision acoustic performance, and rare tactile materials.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CURATED_COLLECTIONS.map((col) => (
            <Link
              key={col.slug}
              href={col.href}
              className="group relative rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-end min-h-[340px] sm:min-h-[400px]"
            >
              <div className="absolute inset-0 bg-zinc-100">
                <ImageWithFallback
                  src={col.image}
                  alt={col.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
              </div>

              <div className="relative z-10 p-6 sm:p-8 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                    {col.badge}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                    {col.itemCount}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-amber-200 transition-colors">
                  {col.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-200 max-w-md leading-relaxed">
                  {col.description}
                </p>
                <div className="pt-2 inline-flex items-center gap-2 text-xs font-semibold text-white">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

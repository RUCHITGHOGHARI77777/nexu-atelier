"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, CheckCircle2 } from "lucide-react";

interface Studio {
  slug: string;
  name: string;
  origin: string;
  discipline: string;
  story: string;
  image: string;
}

const FEATURED_STUDIOS: Studio[] = [
  {
    slug: "solstice-loom-studio",
    name: "Solstice Loom Studio",
    origin: "Surat & Ahmedabad, Gujarat",
    discipline: "Fine Mulberry Silks & Handloom",
    story: "Second-generation weavers preserving wooden pit-loom traditions with closed-loop natural dye processes.",
    image: "/products/sarees/saree_01.jpg",
  },
  {
    slug: "monolith-leather-guild",
    name: "Monolith Leather Guild",
    origin: "Agra & Florence",
    discipline: "Vegetable-Tanned Leathercraft",
    story: "Master bench-makers crafting Goodyear-welted footwear and heirloom carry goods with vegetable extracts.",
    image: "/products/fashion/fashion_04.jpg",
  },
  {
    slug: "nordic-form-atelier",
    name: "Nordic Form Atelier",
    origin: "Copenhagen & Moradabad",
    discipline: "Sculptural Brass & Homeware",
    story: "Bridging quiet minimalist design with traditional Moradabad sand-casting and metalwork lineages.",
    image: "/products/furniture/furniture_03.jpg",
  },
];

export function ArtisanStudiosShowcase() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-zinc-200 gap-4">
        <div>
          <span className="text-xs font-semibold text-zinc-500 block mb-1 font-sans">
            • Independent Verified Ateliers
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-serif">
            Featured Artisan Brands
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md">
          Discover verified studios and generational craft collectives across India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURED_STUDIOS.map((studio) => (
          <Link
            key={studio.slug}
            href={`/brand/${studio.slug}`}
            className="group rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 p-6 flex flex-col justify-between transition-all duration-200 shadow-xs"
          >
            <div className="space-y-4">
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
                <Image
                  src={studio.image}
                  alt={studio.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-103 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-sans font-medium bg-white/95 text-zinc-900 border border-zinc-200 flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Atelier</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-zinc-950 font-serif group-hover:underline">
                  {studio.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-zinc-500 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{studio.origin}</span>
                </div>
                <div className="text-xs font-semibold text-zinc-800 pt-0.5 font-sans">
                  {studio.discipline}
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2 pt-1 font-sans">
                  {studio.story}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900 group-hover:text-black">
              <span>View Atelier Profile</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

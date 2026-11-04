"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Star, Users } from "lucide-react";

interface Studio {
  slug: string;
  name: string;
  origin: string;
  discipline: string;
  story: string;
  image: string;
  rating: number;
  reviewsCount: number;
}

const FEATURED_STUDIOS: Studio[] = [
  {
    slug: "solstice-loom-studio",
    name: "Solstice Loom Studio",
    origin: "Surat & Ahmedabad, Gujarat",
    discipline: "Fine Mulberry Silks & Khadi",
    story: "Second-generation weavers preserving wooden pit-loom traditions with closed-loop organic dye baths.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    reviewsCount: 142,
  },
  {
    slug: "jaipur-heritage-looms",
    name: "Jaipur Heritage Looms",
    origin: "Bagru & Sanganer, Rajasthan",
    discipline: "Hand-Block Vegetable Dye Textiles",
    story: "Master carvers and block printers continuing 300-year-old wooden block dabu mud-resist dyeing.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    rating: 4.95,
    reviewsCount: 96,
  },
  {
    slug: "kashmir-pashmina-guild",
    name: "Kashmir Pashmina Guild",
    origin: "Srinagar, Jammu & Kashmir",
    discipline: "Grade-A Certified Cashmere",
    story: "Authentic Changthangi mountain goat fleece hand-spun on traditional charkhas with sozni needlework.",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80",
    rating: 5.0,
    reviewsCount: 64,
  },
];

export function ArtisanStudiosShowcase() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-zinc-200 gap-4">
        <div>
          <span className="text-[11px] font-mono text-amber-700 uppercase tracking-widest block mb-1 font-semibold">
            INDEPENDENT ATELIERS & VENDORS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-serif">
            Verified Master Studios
          </h2>
        </div>
        <p className="text-xs text-zinc-500 max-w-md">
          Every studio undergoes KYB verification, origin provenance checks, and maintains direct escrow-backed accountability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURED_STUDIOS.map((studio) => (
          <Link
            key={studio.slug}
            href={`/store/${studio.slug}`}
            className="group rounded-3xl bg-white border border-zinc-200/90 hover:border-zinc-300 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg"
          >
            <div className="space-y-4">
              {/* Studio Cover & Avatar */}
              <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-zinc-100">
                <Image
                  src={studio.image}
                  alt={studio.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/90 backdrop-blur-md text-zinc-900 border border-zinc-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>VERIFIED ATELIER</span>
                </div>
              </div>

              {/* Title & Origin */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-zinc-950 group-hover:text-blue-600 transition-colors">
                    {studio.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-zinc-900">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{studio.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-500 font-mono mt-0.5">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  <span>{studio.origin}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                {studio.story}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">
              <span className="text-[11px] font-mono text-zinc-400">{studio.discipline}</span>
              <span className="flex items-center gap-1">
                <span>Visit Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { ArrowRight, MapPin, ShieldCheck, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SpotlightSeller {
  id: string;
  slug: string;
  name: string;
  originHub: string;
  story: string;
  heroImage: string;
  verified: boolean;
  rating: number;
  leadTimeDays: number;
  _count?: {
    products: number;
  };
}

export const ArtisanSpotlight: React.FC = () => {
  const [seller, setSeller] = useState<SpotlightSeller | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSpotlight() {
      try {
        const res = await fetch("/api/sellers/spotlight");
        if (res.ok) {
          const data = await res.json();
          if (data.seller) {
            setSeller(data.seller);
          }
        }
      } catch {
        // silence
      } finally {
        setIsLoading(false);
      }
    }
    loadSpotlight();
  }, []);

  if (!seller && !isLoading) {
    return null;
  }

  // Graceful initial display while loading
  const displaySeller = seller || {
    id: "vnd_sol_textiles",
    slug: "solstice-loom-studio",
    name: "Solstice Loom Studio",
    originHub: "Surat & Ahmedabad, India",
    story: "A collective of second-generation textile engineers and loom weavers preserving slow-cloth traditions with sustainable closed-loop natural dyeing.",
    heroImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    verified: true,
    rating: 4.9,
    leadTimeDays: 2,
    _count: { products: 2 },
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs p-8 sm:p-12 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Studio Profile Left */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-mono text-zinc-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>VERIFIED MAKER SPOTLIGHT</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                {displaySeller.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1 text-zinc-800 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  {displaySeller.originHub}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-zinc-600">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {displaySeller.leadTimeDays} days dispatch
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-zinc-900 font-bold">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {displaySeller.rating.toFixed(1)} rating
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed max-w-xl">
              &ldquo;{displaySeller.story}&rdquo;
            </p>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 max-w-xl space-y-1">
              <div className="font-bold text-zinc-950">
                Ethical Direct Guild Model & Provenance Guarantee:
              </div>
              <p className="text-[11px] text-zinc-600 leading-normal">
                Orders for {displaySeller.name} are routed straight to their verified artisan workshops with direct courier dispatch, authentic craft certifications, and audited GST invoices.
              </p>
            </div>

            <div>
              <Link
                href={`/catalog?maker=${encodeURIComponent(displaySeller.name)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] font-semibold text-xs sm:text-sm transition-colors shadow-xs"
              >
                <span>Explore {displaySeller.name} Pieces</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Visual Right */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-100">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85"
                alt={`${displaySeller.name} craft`}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

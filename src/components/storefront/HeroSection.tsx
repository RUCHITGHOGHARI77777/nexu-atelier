"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export const HeroSection: React.FC = () => {
  const [headline, setHeadline] = useState("Architectural craft. Direct from master looms & ateliers.");
  const [subtitle, setSubtitle] = useState(
    "Nexu Atelier unites heritage loom master weavers, acoustic laboratories, and virgin brass sand-casters directly with discerning global patrons. Zero intermediary markups. 100% verified maker provenance."
  );
  const [heroImage, setHeroImage] = useState(
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85"
  );
  const [studioCount, setStudioCount] = useState(5);
  const [piecesCount, setPiecesCount] = useState(12);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.homepage_hero_headline) {
            setHeadline(data.settings.homepage_hero_headline);
          }
          if (data.settings.homepage_hero_subtitle) {
            setSubtitle(data.settings.homepage_hero_subtitle);
          }
          if (data.settings.homepage_hero_image) {
            setHeroImage(data.settings.homepage_hero_image);
          }
        }
      })
      .catch(() => {});

    fetch("/api/products?limit=1")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total === "number" && data.total > 0) {
          setPiecesCount(data.total);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-12 lg:p-16 relative overflow-hidden shadow-sm">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-mono text-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span className="tracking-wide">DIRECT GUILD & STUDIO PROVENANCE</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.08]">
                {headline}
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 max-w-xl leading-relaxed">
                {subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/catalog"
                className="px-6 py-3 rounded-lg bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-xs"
              >
                <span>Explore Curated Pieces</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/catalog?category=Apparel"
                className="px-5 py-3 rounded-lg border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
              >
                <span>Surat Loom Silks</span>
              </Link>
            </div>

            <div className="pt-8 border-t border-zinc-200 grid grid-cols-3 gap-6 text-left">
              <div>
                <span className="font-mono text-xl sm:text-2xl font-bold text-zinc-950 block">
                  {studioCount}
                </span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mt-0.5">
                  Verified Studios
                </span>
              </div>
              <div>
                <span className="font-mono text-xl sm:text-2xl font-bold text-zinc-950 block">
                  {piecesCount}
                </span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mt-0.5">
                  Curated Pieces
                </span>
              </div>
              <div>
                <span className="font-mono text-xl sm:text-2xl font-bold text-amber-600 block">
                  100%
                </span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mt-0.5">
                  Verified Dispatch
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-200 shadow-xl bg-zinc-100 group">
              <ImageWithFallback
                src={heroImage}
                alt="Curated Indian Craft Masterpiece"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-700 uppercase tracking-wider block font-semibold">
                    Featured Master Work
                  </span>
                  <h4 className="text-xs font-semibold text-zinc-950 mt-0.5">
                    Chanderi Silk Anarkali
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Solstice Loom Studio • Surat
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-zinc-950 block">
                    ₹3,490
                  </span>
                  <Link
                    href="/product/chanderi-silk-embroidered-anarkali-robe"
                    className="text-[10px] text-amber-700 hover:text-amber-800 underline font-semibold"
                  >
                    View Piece
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

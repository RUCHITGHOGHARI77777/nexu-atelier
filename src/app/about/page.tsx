import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Heart, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — The Nexu Atelier Philosophy",
  description: "Direct-from-studio multi-vendor patronage bridging centuries of heritage craftsmanship with contemporary architectural design.",
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 text-zinc-300">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold block">
          Patronage & Slow Craftsmanship
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif text-white tracking-tight leading-tight">
          Where Millennia of Heritage Converges with Industrial Modernism
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          Nexu Atelier is an open-source multi-vendor marketplace founded on a radical premise: that the finest textiles, lost-wax bronzes, and precision acoustic instruments should be acquired directly from their creators, with complete transparency in materials and provenance.
        </p>
      </div>

      {/* Philosophy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-serif text-white">Artisan Direct Sovereignty</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Eliminating extractive middlemen. Up to 90% of order value is transferred directly to verified independent studios, master weavers, and design guilds.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-serif text-white">Verifiable Provenance</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every piece carries authenticated workshop origin, material certifications, and signed weaver provenance cards sealed in archival packaging.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-serif text-white">Zero Review Astroturfing</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Only verified delivered purchasers can receive verified ratings. Honest critical reviews are legally protected against vendor suppression.
          </p>
        </div>
      </div>

      {/* Featured Studios Showcase */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 sm:p-12 space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold block mb-2">
            The Maker Collectives
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
            Independent Design Hubs Across the Subcontinent
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
            From the handloom silk pits of Varanasi to the precision audio skunkworks of Bangalore and lost-wax bronze foundries of Moradabad, our studios represent the pinnacle of regional excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono uppercase text-amber-400">Surat, Gujarat</span>
            <h4 className="text-sm font-semibold text-white">Solstice Loom Studio</h4>
            <p className="text-xs text-zinc-400">
              Heritage mulberry silk, raw zari selvedges, and pit-loom artisanal weaves dating back five generations.
            </p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono uppercase text-emerald-400">Bangalore, Karnataka</span>
            <h4 className="text-sm font-semibold text-white">Voxel Acoustic Laboratories</h4>
            <p className="text-xs text-zinc-400">
              Bespoke CNC-machined aluminum monitors, beryllium diaphragms, and studio-grade reference audio gear.
            </p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono uppercase text-blue-400">Moradabad, UP</span>
            <h4 className="text-sm font-semibold text-white">Nordic Form Atelier</h4>
            <p className="text-xs text-zinc-400">
              Lost-wax sand-cast heavy brass vessels, hand-buffed umber patinas, and monolithic living objects.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-start">
          <Link href="/catalog">
            <Button className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs px-6 py-2.5">
              Explore All Curated Pieces <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Heart, Award, ArrowRight, Building2, MapPin, CheckCircle2, Globe, Clock, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Metadata } from "next";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export const metadata: Metadata = {
  title: "About Us — The Nexu Atelier Philosophy",
  description: "Direct-from-studio multi-vendor patronage bridging centuries of heritage craftsmanship with contemporary architectural design.",
};

const ATELIER_PILLARS = [
  {
    icon: Sparkles,
    title: "Artisan Direct Sovereignty",
    description: "Eliminating extractive intermediaries. Over 88% of transaction value flows directly to verified independent master weavers, brass sand-casters, and precision laboratories.",
    badge: "Direct Escrow",
  },
  {
    icon: ShieldCheck,
    title: "Verifiable Loom & Workshop Provenance",
    description: "Every piece carries an authenticated provenance certificate detailing the master artisan, geographical GI tagging, materials assay, and exact finishing date.",
    badge: "GI Authenticated",
  },
  {
    icon: Award,
    title: "Zero Review Astroturfing",
    description: "Only verified patrons with delivered consignments may submit evaluations. Critical feedback is legally protected against vendor suppression.",
    badge: "Verified Patrons",
  },
  {
    icon: Globe,
    title: "Climate-Neutral Express Logistics",
    description: "All deliveries are carbon-offset through verified regional afforestation programs with temperature-controlled archival packaging.",
    badge: "Eco-Conscious",
  },
];

const MASTER_GUILDS = [
  {
    name: "Solstice Loom Studio",
    location: "Surat & Ahmedabad, Gujarat",
    craft: "Mulberry Silk & Ring-Loom Zari Weaving",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    slug: "solstice-loom-studio",
    established: "Est. 1978",
  },
  {
    name: "Voxel Acoustic Dynamics",
    location: "Bangalore & Tokyo",
    craft: "Beryllium Driver Acoustics & Spatial Audio",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    slug: "voxel-acoustic-dynamics",
    established: "Est. 2018",
  },
  {
    name: "Nordic Form Atelier",
    location: "Copenhagen & Moradabad",
    craft: "Sand-Cast Brass & Minimalist Architectural Objects",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    slug: "nordic-form-atelier",
    established: "Est. 2012",
  },
  {
    name: "Monolith Leather Guild",
    location: "Agra & Florence",
    craft: "Goodyear-Welted Vegetable-Tanned Footwear",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    slug: "monolith-leather-guild",
    established: "Est. 1994",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] py-12 sm:py-20 text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-mono text-zinc-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#111111]" />
            <span className="font-semibold tracking-wider uppercase">THE PATRONAGE PROTOCOL</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif text-zinc-950 tracking-tight leading-[1.15]">
            Where Millennia of Heritage Converges with Industrial Modernism
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            NEXU ATELIER was founded on a simple conviction: the finest textiles, lost-wax bronzes, and acoustic instruments should be acquired directly from their creators, with full material transparency and zero intermediary exploitation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#111111] hover:bg-[#222222] text-white text-xs sm:text-sm font-medium transition-colors shadow-xs"
            >
              <span>Explore Curated Archive</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-zinc-800 text-xs sm:text-sm font-medium border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              <span>Speak to Concierge</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-950">88%</span>
            <p className="text-xs font-medium text-zinc-600">Direct-to-Studio Payouts</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[#111111]">100%</span>
            <p className="text-xs font-medium text-zinc-600">Verified Studio Provenance</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-950">14-Day</span>
            <p className="text-xs font-medium text-zinc-600">Complimentary Inspection Window</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-950">28+</span>
            <p className="text-xs font-medium text-zinc-600">Verified Regional Craft Guilds</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-mono text-[#666666] uppercase tracking-widest font-bold">
              OUR OPERATING PRINCIPLES
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-zinc-950 font-bold">
              Engineering Trust Into Every Transaction
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              How our architectural multi-vendor infrastructure protects patrons and makers alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ATELIER_PILLARS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] border border-[#E7E7E7] flex items-center justify-center text-[#111111]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#111111] font-medium bg-[#F7F7F7] border border-[#E7E7E7] px-2 py-0.5 rounded-full inline-block">
                      {p.badge}
                    </span>
                    <h3 className="text-base font-bold text-zinc-950 font-serif">
                      {p.title}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 space-y-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-100 pb-6">
            <div>
              <span className="text-[11px] font-mono text-[#666666] uppercase tracking-widest font-bold block mb-1">
                VERIFIED COLLECTIVES
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950">
                Independent Design Hubs Across India
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-xl">
                Every workshop on NEXU ATELIER has passed stringent physical verification of raw materials, ethical wage standards, and historical craftsmanship lineage.
              </p>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111] hover:underline transition-colors"
            >
              <span>View All Studios</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MASTER_GUILDS.map((guild) => (
              <div
                key={guild.slug}
                className="group rounded-2xl border border-zinc-200 overflow-hidden bg-zinc-50 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-200">
                  <ImageWithFallback
                    src={guild.image}
                    alt={guild.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 300px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                    {guild.established}
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-950 group-hover:text-[#111111] transition-colors">
                      {guild.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      <span>{guild.location}</span>
                    </p>
                    <p className="text-xs text-zinc-600 mt-2 line-clamp-2">
                      {guild.craft}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 mt-3">
                    <Link
                      href={`/store/${guild.slug}`}
                      className="text-xs font-semibold text-zinc-900 group-hover:text-[#111111] flex items-center justify-between"
                    >
                      <span>Explore Boutique</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#F7F7F7] border border-[#E7E7E7] rounded-3xl p-8 sm:p-12">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-mono text-[#666666] uppercase tracking-widest font-bold">
              THE PATRON UNBOXING EXPERIENCE
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif text-zinc-950 font-bold">
              Museum-Grade Care from Workshop to Threshold
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Every garment is folded in pH-neutral acid-free tissue paper, sealed within an archival dust sleeve, and boxed with an embossed wax stamp. Tech instruments and bronze castings arrive in shock-absorbing moulded pulp cradles engineered for zero plastic waste.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Signed Weaver Provenance Card</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Virgin Single-Use Plastics</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bluedart Air Express Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tamper-Proof Hologram Seal</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
              alt="Archival presentation and packaging"
              fill
              sizes="(max-width: 1024px) 100vw, 400px"
              className="object-cover"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

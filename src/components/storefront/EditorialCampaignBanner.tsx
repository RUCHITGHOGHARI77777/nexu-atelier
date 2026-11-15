"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";

interface GuildProvenance {
  guild: string;
  master: string;
  origin: string;
  craft: string;
  quote: string;
}

const GUILD_PROVENANCES: GuildProvenance[] = [
  {
    guild: "Varanasi Silk Handloom Guild",
    master: "Master Weaver Govindram",
    origin: "Mubarakpur, Uttar Pradesh",
    craft: "Pure Katan Silk & Antique Zari",
    quote: "A single six-yard drape requires forty-five days on the pit loom. No automated power loom can replicate the living tension of hand-thrown shuttle threads.",
  },
  {
    guild: "Moradabad Brass & Foundry Guild",
    master: "Ustad Devendra Verma",
    origin: "Moradabad, Uttar Pradesh",
    craft: "Lost-Wax Sand Casting",
    quote: "Each temple urli and bell is poured at 1,150°C into clay hand-moulds. The metal cools slowly to develop deep harmonic resonance and heirloom permanence.",
  },
  {
    guild: "Kutch Ajrakh & Block Guild",
    master: "Dr. Ismail Mohammed Khatri",
    origin: "Ajrakhpur, Gujarat",
    craft: "Natural Indigo & Teakwood Block",
    quote: "Sixteen steps of river washing, gum Arabic mordanting, and hand-carved teakwood stamping. The colors do not fade; with every gentle wash, they mature.",
  },
];

export function EditorialCampaignBanner() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl bg-[#181614] text-white border border-[#2D2824] p-8 sm:p-12 relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2D2824] pb-8">
            <div className="max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                <span>Direct Loom Provenance • Sovereign Artisan Settlement</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-serif">
                Direct Master Guild Provenance
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-xl font-sans">
                Every piece on NEXU ATELIER is individually certified with artisan credentials, weaver colony registration, and direct bank settlement—bypassing retail markups entirely.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/catalog?category=Heirloom+Sarees+%26+Handlooms"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-950 text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs active:scale-98 font-sans"
              >
                <span>Browse Guild Pieces</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {GUILD_PROVENANCES.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#221F1C] border border-[#2E2925] flex flex-col justify-between space-y-4 hover:border-stone-700 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1 font-sans">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span>{item.origin}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2E2925] text-stone-300 border border-stone-700/60 flex items-center gap-1 font-sans">
                      <CheckCircle2 className="w-3 h-3 text-stone-400" />
                      <span>GI Verified</span>
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white font-serif">
                    {item.guild}
                  </h3>
                  <div className="text-xs font-medium text-stone-300 font-sans">
                    {item.master} • <span className="text-stone-500">{item.craft}</span>
                  </div>

                  <p className="text-xs text-stone-400 leading-relaxed italic border-l-2 border-stone-700 pl-3 pt-1 font-serif">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-2 text-[11px] font-medium text-stone-500 border-t border-[#2D2824] flex items-center justify-between font-sans">
                  <span>100% Direct Remittance</span>
                  <span className="text-stone-300 font-semibold">0% Middlemen Cut</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

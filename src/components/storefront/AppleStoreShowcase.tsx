"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface AppleStoryCard {
  id: string;
  eyebrow: string;
  headline: string;
  description: string;
  price: string;
  image: string;
  link: string;
  theme: "light" | "dark";
  tag?: string;
}

const APPLE_STORY_CARDS: AppleStoryCard[] = [
  {
    id: "saree-masterpiece",
    eyebrow: "HERITAGE HANDLOOM",
    headline: "Varanasi Royal Katan.",
    description: "Pure mulberry silk with antique gold Kadwa zari borders, woven by master artisans in Varanasi.",
    price: "₹48,500",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    link: "/product/varanasi-royal-katan-pure-silk-handloom-banarasi-saree",
    theme: "light",
    tag: "Masterpiece",
  },
  {
    id: "studio-audio",
    eyebrow: "PRECISION ACOUSTICS",
    headline: "Genelec 8030C Studio.",
    description: "Bi-amplified active studio monitors engineered with Minimum Diffraction Enclosure for pure spatial sound.",
    price: "₹74,990",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80",
    link: "/product/genelec-8030c-studio-monitor",
    theme: "dark",
    tag: "Studio Grade",
  },
  {
    id: "artisan-living",
    eyebrow: "FOUNDRY & LIVING OBJECTS",
    headline: "Lost-Wax Cast Bronze Urli.",
    description: "Hand-poured bell-metal vessel finished with living patina, crafted by generational metalwrights.",
    price: "₹8,499",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    link: "/catalog?category=Furniture%20%26%20Home%20Decor",
    theme: "light",
    tag: "Limited Craft",
  },
  {
    id: "heritage-tailoring",
    eyebrow: "BESPOKE APPAREL",
    headline: "Organic Handspun Khadi Cut.",
    description: "Tailored Nehru jacket crafted from hand-loomed organic cotton with hand-carved bone buttons.",
    price: "₹6,850",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80",
    link: "/catalog?category=Men%27s%20Fashion%20%26%20Heritage%20Apparel",
    theme: "dark",
    tag: "New Edition",
  },
];

export function AppleStoreShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -460 : 460;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="py-12 bg-white border-y border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Apple-style Editorial Headline with Big Clear Type */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase font-sans">
              The Latest & Greatest
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-serif">
              Take a closer look. <span className="text-zinc-400 font-sans font-normal">A world of craft.</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous story"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                canScrollLeft
                  ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 cursor-pointer shadow-xs"
                  : "bg-zinc-50 text-zinc-300 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Next story"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                canScrollRight
                  ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 cursor-pointer shadow-xs"
                  : "bg-zinc-50 text-zinc-300 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Apple-Style Story Cards Carousel */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto scrollbar-none pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory"
        >
          {APPLE_STORY_CARDS.map((card) => {
            const isDark = card.theme === "dark";

            return (
              <div
                key={card.id}
                className={`relative shrink-0 w-[320px] sm:w-[400px] h-[520px] rounded-3xl overflow-hidden snap-start transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group flex flex-col justify-between p-8 ${
                  isDark ? "bg-zinc-950 text-white" : "bg-[#F5F5F7] text-zinc-950"
                }`}
              >
                {/* Background Image with Apple subtle vignette */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={card.image}
                    alt={card.headline}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      isDark
                        ? "bg-gradient-to-t from-black/90 via-black/50 to-black/30"
                        : "bg-gradient-to-t from-white/95 via-white/70 to-white/30"
                    }`}
                  />
                </div>

                {/* Top Content: Eyebrow + Headline */}
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold tracking-wider uppercase ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      {card.eyebrow}
                    </span>
                    {card.tag && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDark
                            ? "bg-white/10 text-white border border-white/20"
                            : "bg-black/5 text-zinc-800 border border-black/10"
                        }`}
                      >
                        {card.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">
                    {card.headline}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm line-clamp-2 leading-relaxed ${
                      isDark ? "text-zinc-300" : "text-zinc-600"
                    }`}
                  >
                    {card.description}
                  </p>
                </div>

                {/* Bottom Content: Price + Apple Pill Button */}
                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/10">
                  <div>
                    <span className={`text-[11px] block ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      Direct from atelier
                    </span>
                    <span className="text-lg font-bold font-serif">{card.price}</span>
                  </div>

                  <Link
                    href={card.link}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      isDark
                        ? "bg-white text-zinc-950 hover:bg-zinc-200"
                        : "bg-zinc-950 text-white hover:bg-zinc-800"
                    }`}
                  >
                    <span>Explore Piece</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


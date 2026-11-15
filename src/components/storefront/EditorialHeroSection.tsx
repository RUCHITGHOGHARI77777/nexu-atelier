"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function EditorialHeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const [publicSettings, setPublicSettings] = useState<{
    headline?: string;
    subtitle?: string;
    heroImage?: string;
  }>({});

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.settings) {
            setPublicSettings({
              headline: data.settings.homepage_hero_headline,
              subtitle: data.settings.homepage_hero_subtitle,
              heroImage: data.settings.homepage_hero_image,
            });
          }
        }
      } catch {
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      setMousePosition({ x, y });
    });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  const rawHeadline =
    publicSettings.headline || "Heirloom Craftsmanship. Contemporary Form.";
  const cleanedHeadline = rawHeadline.replace(/\s\d{10,}/, "");

  const subtitle =
    publicSettings.subtitle ||
    "Curated textiles, acoustic audio, and sculptural objects directly from verified independent Indian studios.";

  const heroImage =
    publicSettings.heroImage ||
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85";

  return (
    <section className="relative pt-2 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-2xl overflow-hidden bg-zinc-950 text-white min-h-[520px] sm:min-h-[580px] flex flex-col justify-end p-8 sm:p-14 border border-zinc-800/80 shadow-2xl"
        >
          <motion.div
            className="absolute inset-0 z-0"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: mousePosition.x * -16,
                    y: mousePosition.y * -16,
                    scale: 1.04,
                  }
            }
            transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
          >
            <Image
              src={heroImage}
              alt="NEXU ATELIER Campaign"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-2xl space-y-6"
          >
            <div className="space-y-1.5">
              <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase block">
                Autumn / Winter 2026 Collection
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08] font-serif">
                {cleanedHeadline.includes(".") ? (
                  <>
                    <span>{cleanedHeadline.split(".")[0]}.</span>
                    <br />
                    <span className="font-light text-zinc-300">
                      {cleanedHeadline.split(".").slice(1).join(".").trim()}
                    </span>
                  </>
                ) : (
                  cleanedHeadline
                )}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 max-w-xl leading-relaxed">
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/shop"
                className="px-6 py-3 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 font-semibold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <span>Shop Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/collections"
                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 transition-colors inline-flex items-center gap-2"
              >
                <span>Explore Collections</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Truck,
  Award,
  Star,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { useStore, PRELOADED_PRODUCTS } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";

export function BentoHeroSection() {
  const { addToCart, setQuickViewProduct, setSelectedCategory, formatPrice, activeRegion } = useStore();
  const spotlightProduct = PRELOADED_PRODUCTS[0]; // Sony WH-1000XM5
  const [imgSrc, setImgSrc] = useState(spotlightProduct.images[0]);

  // Live 24-hour countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="relative pt-6 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Bento Item 1: Spotlight Deal of the Day (7 Columns) */}
          <div className="lg:col-span-7 rounded-3xl bg-white/75 backdrop-blur-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.07)] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
            {/* Soft Ambient Light Gradient */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-blue-100/60 to-emerald-100/40 blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              {/* Badge & Timer Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>Studio Allocation of the Day</span>
                </span>

                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 bg-slate-100/90 px-3 py-1 rounded-full border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-900">
                    {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
                  </span>
                  <span className="text-[10px] text-slate-500">remaining</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 max-w-xl">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight leading-tight">
                  {spotlightProduct.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                  {spotlightProduct.subtitle} — Hand-tuned carbon acoustic drivers engineered for pure clarity.
                </p>
              </div>

              {/* Pricing & Ratings */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono tracking-tight">
                  {formatPrice(spotlightProduct.price)}
                </span>
                <span className="text-sm text-slate-400 line-through font-mono">
                  {formatPrice(spotlightProduct.mrpPrice)}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Save {formatPrice(spotlightProduct.mrpPrice - spotlightProduct.price)} (23% OFF)
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900 ml-1">{spotlightProduct.rating}</span>
                </div>
                <span>•</span>
                <span className="text-slate-500">{spotlightProduct.reviewCount} verified patron reviews</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ships in 24 Hours</span>
                </span>
              </div>
            </div>

            {/* Product Image & Instant Action Buttons */}
            <div className="pt-6 relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-6 relative h-48 sm:h-56 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 group">
                <Image
                  src={imgSrc}
                  alt={spotlightProduct.title}
                  fill
                  onError={() => setImgSrc("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80")}
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-mono font-semibold">
                  By {spotlightProduct.supplier.name}
                </span>
              </div>

              <div className="sm:col-span-6 space-y-3">
                <button
                  type="button"
                  onClick={() => addToCart(spotlightProduct)}
                  className="w-full py-3.5 px-5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                >
                  <span>Claim Studio Piece (Add to Bag)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setQuickViewProduct(spotlightProduct)}
                  className="w-full py-2.5 px-5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <span>Inspect Specifications & Reviews</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bento Column 2: Secondary Supporting Feature Bento Cards (5 Columns) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {/* Bento Card 2: B2B Procurement with GST Input Credit */}
            <div className="rounded-3xl bg-white/75 backdrop-blur-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.07)] p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    B2B Wholesale Procurement
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeRegion.taxShort} Input Credit
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-950">
                  Bulk Studio Packaging & Custom Corporate Gifting
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct factory tier rates for luxury glass apothecary, organic linen tote bundles, and industrial acoustic panels.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-500">Tier Rates from ₹198/unit</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("B2B Wholesale Packs");
                    const el = document.getElementById("catalog-grid") || document.querySelector("section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Explore B2B Wholesale</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bento Card 3: Multi-Vendor Trust & Logistics Assurance */}
            <div className="rounded-3xl bg-white/75 backdrop-blur-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.07)] p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950">
                    Artisan Escrow & Blue Dart Air Logistics
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Payment is locked safely in RBI-compliant escrow until your consignment is delivered and inspected. Every shipment is consigned with priority air tracking.
                </p>
              </div>

              <div className="pt-4 grid grid-cols-3 gap-2 text-center border-t border-slate-100">
                <div>
                  <span className="font-extrabold text-sm text-slate-950 font-mono block">100%</span>
                  <span className="text-[10px] text-slate-500">Maker Verified</span>
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-950 font-mono block">99.8%</span>
                  <span className="text-[10px] text-slate-500">On-Time Air Dispatch</span>
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-950 font-mono block">₹4.8 Cr+</span>
                  <span className="text-[10px] text-slate-500">Escrow Settled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { SEED_PRODUCTS } from "@/data/seedCatalog";
import { ProductCard } from "./ProductCard";

export const TrendingSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"trending" | "arrivals">("trending");

  const trendingProducts = SEED_PRODUCTS.filter((p) => p.isTrending).slice(0, 4);
  const newArrivals = SEED_PRODUCTS.filter((p) => p.isNewArrival).slice(0, 4);

  const displayed = activeTab === "trending" ? trendingProducts : newArrivals;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block mb-1 font-medium">
            CURATION
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("trending")}
              className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors cursor-pointer ${
                activeTab === "trending"
                  ? "text-zinc-950 border-b-2 border-zinc-950 pb-0.5"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              Trending Pieces
            </button>
            <span className="text-zinc-300 text-lg">/</span>
            <button
              onClick={() => setActiveTab("arrivals")}
              className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors cursor-pointer ${
                activeTab === "arrivals"
                  ? "text-zinc-950 border-b-2 border-zinc-950 pb-0.5"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              New Studio Arrivals
            </button>
          </div>
        </div>

        <Link
          href="/catalog"
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors"
        >
          <span>View all in Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayed.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

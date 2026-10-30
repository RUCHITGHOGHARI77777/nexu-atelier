"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Product } from "@/types/marketplace";
import { ProductCard } from "./ProductCard";

export const TrendingSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"trending" | "arrivals">("trending");
  const [dbFeatured, setDbFeatured] = useState<Product[]>([]);
  const [dbArrivals, setDbArrivals] = useState<Product[]>([]);
  const [fallbackProducts, setFallbackProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLiveProducts() {
      try {
        const [featRes, arrRes, allRes] = await Promise.all([
          fetch("/api/products?featured=true&limit=8"),
          fetch("/api/products?sort=newest&limit=8"),
          fetch("/api/products?limit=8"),
        ]);

        if (featRes.ok) {
          const data = await featRes.json();
          if (Array.isArray(data.products)) {
            setDbFeatured(data.products);
          }
        }

        if (arrRes.ok) {
          const data = await arrRes.json();
          if (Array.isArray(data.products)) {
            setDbArrivals(data.products);
          }
        }

        if (allRes.ok) {
          const data = await allRes.json();
          if (Array.isArray(data.products)) {
            setFallbackProducts(data.products);
          }
        }
      } catch {
        // graceful silence
      } finally {
        setIsLoading(false);
      }
    }

    loadLiveProducts();
  }, []);

  const trendingProducts =
    dbFeatured.length > 0 ? dbFeatured.slice(0, 4) : fallbackProducts.slice(0, 4);
  const newArrivals =
    dbArrivals.length > 0 ? dbArrivals.slice(0, 4) : fallbackProducts.slice(4, 8);

  const displayed = activeTab === "trending" ? trendingProducts : newArrivals;

  if (displayed.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-[11px] font-mono text-amber-700 uppercase tracking-widest block mb-1 font-semibold">
            STUDIO CURATION
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
              Featured Pieces
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
              New Studio Releases
            </button>
          </div>
        </div>

        <Link
          href={activeTab === "trending" ? "/trending" : "/new-arrivals"}
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors"
        >
          <span>Explore All {activeTab === "trending" ? "Featured" : "Releases"}</span>
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

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#E7E7E7]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#888888] font-semibold block mb-1">
            CURATION
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("trending")}
              className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors cursor-pointer ${
                activeTab === "trending"
                  ? "text-[#111111] border-b-2 border-[#111111] pb-0.5"
                  : "text-[#888888] hover:text-[#111111]"
              }`}
            >
              Featured Pieces
            </button>
            <span className="text-[#CCCCCC] text-lg">/</span>
            <button
              onClick={() => setActiveTab("arrivals")}
              className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors cursor-pointer ${
                activeTab === "arrivals"
                  ? "text-[#111111] border-b-2 border-[#111111] pb-0.5"
                  : "text-[#888888] hover:text-[#111111]"
              }`}
            >
              New Releases
            </button>
          </div>
        </div>

        <Link
          href={activeTab === "trending" ? "/trending" : "/new-arrivals"}
          className="text-xs font-semibold text-[#111111] hover:text-[#666666] flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          <span>Explore All {activeTab === "trending" ? "Featured" : "Releases"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayed.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

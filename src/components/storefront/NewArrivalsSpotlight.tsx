"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { StoreProduct, useStore, PRELOADED_PRODUCTS } from "@/context/StoreContext";
import { ProductCardSaaS } from "./ProductCardSaaS";

export function NewArrivalsSpotlight() {
  const { products } = useStore();
  const sourceProducts = products && products.length > 0 ? products : PRELOADED_PRODUCTS;

  // Filter and prioritize genuine master loom, textile, and artisanal workshop releases
  const loomProducts = sourceProducts.filter(
    (p) =>
      p.category === "Fashion & Apparel" ||
      p.title.toLowerCase().includes("silk") ||
      p.title.toLowerCase().includes("wool") ||
      p.title.toLowerCase().includes("loom") ||
      p.title.toLowerCase().includes("hand-") ||
      p.title.toLowerCase().includes("linen")
  );

  const displayList: StoreProduct[] =
    loomProducts.length >= 4
      ? loomProducts.slice(0, 4)
      : [...loomProducts, ...sourceProducts.filter((p) => !loomProducts.includes(p))].slice(0, 4);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-zinc-200 gap-4">
        <div>
          <span className="text-[11px] font-mono text-blue-700 uppercase tracking-widest block mb-1 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>FRESH FROM MASTER LOOMS</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-serif">
            New Studio Releases
          </h2>
        </div>
        <Link
          href="/new-arrivals"
          className="text-xs font-bold text-zinc-900 hover:text-blue-600 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
        >
          <span>View All New Releases</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4-Column Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayList.map((product) => (
          <ProductCardSaaS key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

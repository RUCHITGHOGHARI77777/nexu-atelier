"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { StoreProduct, useStore, PRELOADED_PRODUCTS } from "@/context/StoreContext";
import { ProductCardSaaS } from "./ProductCardSaaS";

export function NewArrivalsSpotlight() {
  const { products } = useStore();
  const sourceProducts = products && products.length > 0 ? products : PRELOADED_PRODUCTS;

  const displayList: StoreProduct[] = React.useMemo(() => {
    if (!sourceProducts || sourceProducts.length === 0) return [];

    const targetCategories = [
      ["Sarees & Handlooms", "Women's Kurtis & Ethnic", "Apparel", "Fine Silks & Handlooms"],
      ["Headphones & Earphones", "Smartphones", "Audio & Electronics", "Electronics", "Computers & Laptops"],
      ["Men's Fashion", "Footwear & Leather", "Leather & Heritage Footwear"],
      ["Furniture & Home Decor", "Home Objects", "Foundry & Brassware"],
    ];

    const selected: StoreProduct[] = [];
    const usedSlugs = new Set<string>();

    for (const catGroup of targetCategories) {
      const match = sourceProducts.find(
        (p) =>
          catGroup.some(
            (c) =>
              p.category?.toLowerCase() === c.toLowerCase() ||
              p.category?.toLowerCase().includes(c.toLowerCase())
          ) &&
          !usedSlugs.has(p.slug) &&
          p.images &&
          p.images.length > 0 &&
          !p.slug.includes("test")
      );
      if (match) {
        selected.push(match);
        usedSlugs.add(match.slug);
      }
    }

    if (selected.length < 4) {
      for (const p of sourceProducts) {
        if (!usedSlugs.has(p.slug) && !p.slug.includes("test") && p.images && p.images.length > 0) {
          selected.push(p);
          usedSlugs.add(p.slug);
          if (selected.length >= 4) break;
        }
      }
    }

    return selected.slice(0, 4);
  }, [sourceProducts]);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-zinc-200 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 font-sans mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            <span>Fresh Master Drops &amp; Studio Releases</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-serif">
            New Studio Releases
          </h2>
        </div>
        <Link
          href="/catalog?sort=newest"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-black group transition-colors shrink-0 pb-1"
        >
          <span>View All Drops</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayList.map((product) => (
          <ProductCardSaaS key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

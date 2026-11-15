"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Layers, ShieldCheck } from "lucide-react";
import { useStore, StoreProduct, PRELOADED_PRODUCTS } from "@/context/StoreContext";
import { ProductCardSaaS } from "./ProductCardSaaS";

interface CategoryShelfConfig {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  exactCategories: string[];
  catalogParam: string;
}

const SHELVES_CONFIG: CategoryShelfConfig[] = [
  {
    id: "sarees-handlooms",
    badge: "Master Handloom Guild",
    title: "Heirloom Sarees & Handloom Silks",
    subtitle: "Museum-grade raw mulberry silks, Varanasi zari borders, and festive drapes directly from weaver looms.",
    exactCategories: ["Heirloom Sarees & Handlooms", "Women's Kurtis & Kurta Sets", "Sarees & Handlooms"],
    catalogParam: "Heirloom Sarees & Handlooms",
  },
  {
    id: "audio-electronics",
    badge: "Acoustic Laboratories",
    title: "Acoustic Audio & Sound Engineering",
    subtitle: "Precision studio monitors, planar magnetic drivers, and industry-leading noise cancellation.",
    exactCategories: ["Headphones & Earphones", "Audio & Electronics"],
    catalogParam: "Headphones & Earphones",
  },
  {
    id: "furniture-home",
    badge: "Foundry & Living Objects",
    title: "Artisan Living & Bronze Foundries",
    subtitle: "Lost-wax cast temple vessels, solid Sheesham wood consoles, and wheel-thrown studio ceramics.",
    exactCategories: ["Furniture & Home Decor", "Home Objects"],
    catalogParam: "Furniture & Home Decor",
  },
  {
    id: "heritage-fashion",
    badge: "Bespoke Heritage Tailoring",
    title: "Heritage Tailoring & Fine Apparel",
    subtitle: "Organic khadi cuts, hand-stitched Nehru jackets, and Goodyear-welted vegetable-tanned leather.",
    exactCategories: ["Men's Fashion & Heritage Apparel", "Footwear & Leather"],
    catalogParam: "Men's Fashion & Heritage Apparel",
  },
];

export function CategoryCuratedShelves() {
  const { products } = useStore();
  const sourceProducts = products && products.length > 0 ? products : PRELOADED_PRODUCTS;

  const shelvesData = useMemo(() => {
    return SHELVES_CONFIG.map((shelf) => {
      const matching = sourceProducts.filter(
        (p) =>
          shelf.exactCategories.some(
            (c) => p.category?.trim().toLowerCase() === c.trim().toLowerCase()
          ) &&
          p.images &&
          p.images.length > 0 &&
          !p.slug.includes("test")
      );

      const curatedItems = matching.slice(0, 4);

      return {
        ...shelf,
        items: curatedItems,
        totalCategoryCount: matching.length,
      };
    });
  }, [sourceProducts]);

  return (
    <div className="space-y-16 py-8">
      {shelvesData.map((shelf) => {
        if (shelf.items.length === 0) return null;

        return (
          <section
            key={shelf.id}
            id={shelf.id}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-200 pb-4 gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
                  <span>{shelf.badge}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 font-serif">
                  {shelf.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  {shelf.subtitle}
                </p>
              </div>

              <Link
                href={`/catalog?category=${encodeURIComponent(shelf.catalogParam)}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-black group transition-colors shrink-0 pb-1"
              >
                <span>View All in {shelf.title.split("&")[0].trim()} ({shelf.totalCategoryCount})</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {shelf.items.map((product) => (
                <ProductCardSaaS key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

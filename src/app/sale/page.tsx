import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { productRepository } from "@/lib/server/product-repository";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Tag, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seasonal Archive & Special Value Drops | NEXU ATELIER",
  description:
    "Explore specially priced atelier creations and end-of-series loom runs direct from makers.",
};

export default async function SalePage() {
  const { products: allProducts } = await productRepository.getProducts({
    limit: 48,
  });

  const discounted = allProducts.filter(
    (p) => p.compareAtPrice && p.compareAtPrice > p.basePrice
  );
  const products = discounted.length > 0 ? discounted : allProducts.slice(0, 12);

  return (
    <div className="min-h-screen bg-zinc-50/50 py-8 sm:py-12 text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <Link href="/" className="hover:text-zinc-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <Link href="/collections" className="hover:text-zinc-950 transition-colors">Collections</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-900 font-bold">Archive & Value Drops</span>
        </nav>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>STUDIO ARCHIVE VALUE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              Archive & Seasonal Drops
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Limited run editions, end-of-bolt handloom textiles, and archive pieces released directly by studios to make bench room for incoming collections.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

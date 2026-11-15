import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { productRepository } from "@/lib/server/product-repository";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Flame, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trending in the Atelier | NEXU ATELIER",
  description:
    "Discover pieces experiencing peak interest, view velocity, and immediate studio dispatch.",
};

export default async function TrendingPage() {
  const { products } = await productRepository.getProducts({
    trending: true,
    limit: 24,
  });

  return (
    <div className="min-h-screen bg-zinc-50/50 py-8 sm:py-12 text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <Link href="/" className="hover:text-zinc-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <Link href="/collections" className="hover:text-zinc-950 transition-colors">Collections</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-900 font-bold">Trending Pieces</span>
        </nav>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>HIGH DISCOVERY VELOCITY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              Trending Atelier Pieces
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Creations seeing accelerated inquiries, rapid bench turnarounds, and collector acclaim across our global markets.
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

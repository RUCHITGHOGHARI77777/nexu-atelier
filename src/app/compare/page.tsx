"use client";

import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, Trash2, ShoppingBag, Star, CheckCircle2, XCircle } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { useCart } from "@/context/CartContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, calculateDiscountPercentage } from "@/lib/formatters";

export default function ComparePage() {
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  if (compareProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mx-auto">
          <Scale className="w-8 h-8 stroke-1" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-950">Product Comparison Ledger is Empty</h1>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
            You have not selected any artisan pieces to compare. Select up to 4 pieces from the studio catalog to inspect materials, dimensions, and craft specifications side-by-side.
          </p>
        </div>
        <Link href="/catalog">
          <Button variant="primary" size="md">
            <span>Browse Studio Catalog</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <Link href="/" className="hover:text-zinc-950">
              Home
            </Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-zinc-950">
              Catalog
            </Link>
            <span>/</span>
            <span className="text-zinc-900 font-semibold">Comparison Table</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-amber-600 stroke-1.5" />
            <span>Artisan Piece Comparison</span>
          </h1>
          <p className="text-xs text-zinc-600">
            Side-by-side material provenance, dimensions, and architectural craft specifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/catalog">
            <Button variant="outline" size="sm" className="text-xs">
              + Add Another Piece
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompare}
            className="text-xs text-zinc-500 hover:text-rose-600"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Clear Table</span>
          </Button>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto border border-zinc-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 divide-x divide-zinc-200 bg-zinc-50">
              <th className="p-4 w-48 text-[11px] font-mono uppercase text-zinc-500 bg-zinc-100 sticky left-0 z-10 font-semibold">
                Specification
              </th>
              {compareProducts.map((p) => (
                <th key={p.id} className="p-4 min-w-[240px] max-w-[280px] align-top space-y-3">
                  <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
                    <ImageWithFallback
                      src={p.images[0]}
                      alt={p.title}
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                    <button
                      onClick={() => removeFromCompare(p.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-rose-600 hover:text-white text-zinc-800 text-xs transition-colors shadow-xs"
                      title="Remove piece"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-950 text-sm hover:underline line-clamp-2">
                      <Link href={`/product/${p.slug}`}>{p.title}</Link>
                    </h3>
                    <p className="text-[11px] text-zinc-500 pt-0.5">{p.vendor.name}</p>
                  </div>
                  <div className="pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => addToCart(p)}
                      disabled={p.stock === 0}
                      className="w-full flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{p.stock === 0 ? "Sold Out" : "Add to Bag"}</span>
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {/* Price Row */}
            <tr className="divide-x divide-zinc-200 hover:bg-zinc-50/50">
              <td className="p-4 font-semibold text-zinc-900 bg-zinc-50 sticky left-0 z-10">
                Price & Value
              </td>
              {compareProducts.map((p) => {
                const discount = calculateDiscountPercentage(p.basePrice, p.compareAtPrice);
                return (
                  <td key={p.id} className="p-4 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-base font-bold text-zinc-950">
                        {formatCurrency(p.basePrice)}
                      </span>
                      {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                        <span className="font-mono text-xs text-zinc-400 line-through">
                          {formatCurrency(p.compareAtPrice)}
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-semibold">
                        {discount}% Atelier Savings
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Rating Row */}
            <tr className="divide-x divide-zinc-200 hover:bg-zinc-50/50">
              <td className="p-4 font-semibold text-zinc-900 bg-zinc-50 sticky left-0 z-10">
                Patron Rating
              </td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span className="font-bold text-xs ml-1 text-zinc-950">{p.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      ({p.reviewCount} verified reviews)
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Category & Studio Row */}
            <tr className="divide-x divide-zinc-200 hover:bg-zinc-50/50">
              <td className="p-4 font-semibold text-zinc-900 bg-zinc-50 sticky left-0 z-10">
                Studio & Origin
              </td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4 space-y-1">
                  <p className="font-semibold text-zinc-950">{p.vendor.name}</p>
                  <p className="text-[11px] text-zinc-500">{p.vendor.location}</p>
                  <Badge variant="outline" className="font-mono text-[10px] bg-zinc-100 text-zinc-700 border-zinc-200">
                    {p.category}
                  </Badge>
                </td>
              ))}
            </tr>

            {/* Stock Availability */}
            <tr className="divide-x divide-zinc-200 hover:bg-zinc-50/50">
              <td className="p-4 font-semibold text-zinc-900 bg-zinc-50 sticky left-0 z-10">
                Stock Status
              </td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">
                  {p.stock > 5 ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ready to Ship ({p.stock} units)</span>
                    </span>
                  ) : p.stock > 0 ? (
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Low Studio Stock ({p.stock} left)</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 font-medium flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sold Out</span>
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Materials & Provenance */}
            <tr className="divide-x divide-zinc-200 hover:bg-zinc-50/50">
              <td className="p-4 font-semibold text-zinc-900 bg-zinc-50 sticky left-0 z-10">
                Craft Materials
              </td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4 text-zinc-700 leading-relaxed text-[11px]">
                  {p.tags.join(" • ")}
                </td>
              ))}
            </tr>

            {/* Available Sizes / Variants */}
            <tr className="divide-x divide-zinc-200 hover:bg-zinc-50/50">
              <td className="p-4 font-semibold text-zinc-900 bg-zinc-50 sticky left-0 z-10">
                Sizing & Variants
              </td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">
                  {p.availableSizes && p.availableSizes.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.availableSizes.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-800 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-500 font-mono text-[10px]">Universal Studio Standard</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Description Summary */}
            <tr className="divide-x divide-zinc-200 hover:bg-zinc-50/50">
              <td className="p-4 font-semibold text-zinc-900 bg-zinc-50 sticky left-0 z-10">
                Curator Description
              </td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4 text-zinc-600 leading-relaxed text-[11px]">
                  {p.subtitle || p.description.slice(0, 140) + "..."}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Return link */}
      <div className="pt-4">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Studio Catalog</span>
        </Link>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatters";

export default function WishlistPage() {
  const { wishlistProducts, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, openCartDrawer } = useCart();

  if (wishlistProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mx-auto">
          <Heart className="w-8 h-8 stroke-1" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">
            Your saved wishlist is empty
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-sm mx-auto">
            Save pieces while exploring the catalog to revisit or purchase later.
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            size="md"
            href="/catalog"
            className="flex items-center gap-2"
          >
            <span>Explore Studio Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const handleMoveToBag = (product: (typeof wishlistProducts)[0]) => {
    addToCart(product);
    removeFromWishlist(product.id);
    openCartDrawer();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-end justify-between pb-4 border-b border-zinc-200">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block font-medium">
            SAVED PIECES
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Curated Wishlist ({wishlistProducts.length})
          </h1>
        </div>

        <button
          onClick={clearWishlist}
          className="text-xs text-zinc-500 hover:text-zinc-950 transition-colors font-medium"
        >
          Clear all saved
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlistProducts.map((product) => (
          <div
            key={product.id}
            className="rounded-xl border border-zinc-200 bg-white shadow-xs hover:border-zinc-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
          >
            <Link
              href={`/product/${product.slug}`}
              className="relative aspect-[4/5] bg-zinc-100 overflow-hidden block"
            >
              <ImageWithFallback
                src={product.images[0]}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 100vw, 300px"
                className="object-cover"
              />
            </Link>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  {product.vendor.name}
                </span>
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-950 hover:text-amber-700 line-clamp-1 transition-colors">
                  <Link href={`/product/${product.slug}`}>{product.title}</Link>
                </h3>
                <p className="font-mono text-xs font-bold text-zinc-950 mt-1">
                  {formatCurrency(product.basePrice)}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMoveToBag(product)}
                  className="flex-1 flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </Button>

                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="p-2 rounded-lg border border-zinc-200 text-zinc-400 hover:text-rose-600 hover:border-zinc-300 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

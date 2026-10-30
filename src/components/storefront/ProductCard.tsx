"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Check, Scale } from "lucide-react";
import { Product } from "@/types/marketplace";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, calculateDiscountPercentage } from "@/lib/formatters";

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const [selectedColor, setSelectedColor] = useState(product.availableColors?.[0]);
  const [isAdded, setIsAdded] = useState(false);

  const discountPercentage = calculateDiscountPercentage(
    product.basePrice,
    product.compareAtPrice
  );

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdded || product.stock === 0) return;
    const success = addToCart(product, { color: selectedColor });
    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const wishlisted = isWishlisted(product.id);
  const inCompare = isInCompare(product.id);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 overflow-hidden text-zinc-900">
      {/* Visual Image Showcase */}
      <div className="relative block w-full aspect-[4/5] bg-zinc-50 overflow-hidden">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${product.title}`}
        >
          <ImageWithFallback
            src={selectedColor?.image || product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none z-10">
          <div className="flex flex-wrap gap-1.5">
            {product.isNewArrival && (
              <Badge variant="neutral" size="sm">
                New Arrival
              </Badge>
            )}
            {product.stock <= 3 && product.stock > 0 && (
              <Badge variant="warning" size="sm">
                Only {product.stock} Left
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="outline" size="sm">
                Sold Out
              </Badge>
            )}
          </div>

          {/* Actions Stack: Wishlist & Compare */}
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                wishlisted
                  ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-sm"
                  : "bg-white/90 text-zinc-700 hover:text-zinc-950 hover:bg-white border border-zinc-200/80 shadow-sm"
              }`}
              aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart
                className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-600 text-rose-600" : ""}`}
              />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (inCompare) {
                  removeFromCompare(product.id);
                } else {
                  addToCompare(product);
                }
              }}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                inCompare
                  ? "bg-amber-500 text-zinc-950 shadow-sm font-bold"
                  : "bg-white/90 text-zinc-700 hover:text-zinc-950 hover:bg-white border border-zinc-200/80 shadow-sm"
              }`}
              aria-label={inCompare ? "Remove from comparison" : "Add to comparison"}
              title={inCompare ? "Remove from comparison" : "Add to comparison"}
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Add Overlay on Desktop Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block z-10">
          <button
            onClick={handleQuickAdd}
            disabled={product.stock === 0 || isAdded}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Added to Bag</span>
              </>
            ) : product.stock === 0 ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div className="space-y-1">
          {/* Vendor and Rating */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="truncate max-w-[170px] text-zinc-500 font-medium">
              {product.vendor.name}
            </span>
            <div className="flex items-center gap-1 font-mono text-zinc-800">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="font-semibold">{product.rating}</span>
              <span className="text-zinc-400 text-[10px]">
                ({product.reviewCount})
              </span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 group-hover:text-amber-700 line-clamp-1 transition-colors">
            <Link href={`/product/${product.slug}`}>{product.title}</Link>
          </h3>
          <p className="text-[11px] text-zinc-500 line-clamp-1">
            {product.subtitle}
          </p>
        </div>

        {/* Color Variants Dots (if available) */}
        {product.availableColors && product.availableColors.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            {product.availableColors.map((color) => (
              <button
                key={color.name}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(color);
                }}
                className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                  selectedColor?.name === color.name
                    ? "border-zinc-900 scale-125 shadow-sm"
                    : "border-zinc-300 opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={`Select ${color.name}`}
              />
            ))}
          </div>
        )}

        {/* Pricing Row */}
        <div className="pt-2 border-t border-zinc-100 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm sm:text-base font-bold text-zinc-950">
              {formatCurrency(product.basePrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
              <span className="font-mono text-xs text-zinc-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          {discountPercentage > 0 && (
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {discountPercentage}% off
            </span>
          )}
        </div>

        {/* Mobile quick add button */}
        <div className="sm:hidden pt-2">
          <button
            onClick={handleQuickAdd}
            disabled={product.stock === 0 || isAdded}
            className="w-full py-2 px-3 rounded-lg bg-zinc-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdded ? "Added to Bag" : "Add to Bag"}
          </button>
        </div>
      </div>
    </div>
  );
};

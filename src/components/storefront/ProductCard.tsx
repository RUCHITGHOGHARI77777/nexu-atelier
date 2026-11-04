"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Check, Scale, Eye } from "lucide-react";
import { Product } from "@/types/marketplace";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useStore } from "@/context/StoreContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Badge } from "@/components/ui/Badge";
import { calculateDiscountPercentage } from "@/lib/formatters";

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { formatPrice } = useCurrency();
  const { setQuickViewProduct } = useStore();
  const [selectedColor, setSelectedColor] = useState(product.availableColors?.[0]);
  const [isAdded, setIsAdded] = useState(false);

  const discountPercentage = calculateDiscountPercentage(
    product.basePrice,
    product.compareAtPrice
  );

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct({
      id: product.id,
      title: product.title,
      price: product.basePrice,
      mrpPrice: product.compareAtPrice || Math.round(product.basePrice * 1.25),
      rating: product.rating,
      reviewsCount: product.reviewCount || 1,
      images: product.images,
      category: product.category,
      supplier: {
        id: product.vendor.id,
        name: product.vendor.name,
        location: product.vendor.location || "India",
        verified: true,
        rating: product.vendor.rating || 5.0,
        badge: "VERIFIED ATELIER",
      } as any,
      stock: product.stock,
      colors: product.availableColors?.map((c) => ({ name: c.name, hex: c.hex })) || [
        { name: "Standard", hex: "#18181b" },
      ],
      sizes: product.availableSizes || ["XS", "S", "M", "L", "XL"],
      specs: {
        Material: product.materials || "Natural Artisan Materials",
        Origin: product.vendor.location || "India",
      },
      description: product.description,
    } as any);
  };

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
    <div className="group relative flex flex-col justify-between rounded-2xl bg-white border border-[#E8E8E4] hover:border-[#D4D4CF] hover:shadow-md transition-all duration-300 overflow-hidden text-[#171717]">
      {/* Visual Image Showcase */}
      <div className="relative block w-full aspect-[4/5] bg-[#FAFAF8] overflow-hidden">
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

          {/* Actions Stack: Wishlist, Quick View & Compare */}
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                wishlisted
                  ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-sm"
                  : "bg-white/95 text-[#171717] hover:text-[#B78B45] hover:bg-white border border-[#E8E8E4] shadow-xs"
              }`}
              aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart
                className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-600 text-rose-600" : ""}`}
              />
            </button>

            <button
              onClick={handleQuickView}
              className="p-2 rounded-full transition-all cursor-pointer bg-white/95 text-[#171717] hover:text-[#B78B45] hover:bg-white border border-[#E8E8E4] shadow-xs"
              aria-label="Quick view"
              title="Quick view"
            >
              <Eye className="w-3.5 h-3.5" />
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
                  ? "bg-[#F8F2E6] text-[#8A631E] border border-[#B78B45] shadow-xs font-bold"
                  : "bg-white/95 text-[#171717] hover:text-[#B78B45] hover:bg-white border border-[#E8E8E4] shadow-xs"
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
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-1.5 border-[#171717] hover:border-[#B78B45] font-semibold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#21866F]" />
                <span className="text-[#21866F]">Added to Bag</span>
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
          <div className="flex items-center justify-between text-[11px] text-[#626262]">
            <span className="truncate max-w-[170px] text-[#626262] font-medium">
              {product.vendor.name}
            </span>
            {product.reviewCount > 0 ? (
              <div className="flex items-center gap-1 font-mono text-[#171717]">
                <Star className="w-3 h-3 fill-[#B78B45] text-[#B78B45]" />
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
                <span className="text-[#767676] text-[10px]">
                  ({product.reviewCount})
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-[#8A631E] bg-[#F8F2E6] px-1.5 py-0.5 rounded border border-[#B78B45]/40 font-medium">
                New Atelier
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-xs sm:text-sm text-[#171717] group-hover:text-[#B78B45] line-clamp-1 transition-colors">
            <Link href={`/product/${product.slug}`}>{product.title}</Link>
          </h3>
          <p className="text-[11px] text-[#626262] line-clamp-1">
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
                    ? "border-[#171717] scale-125 shadow-xs"
                    : "border-[#E8E8E4] opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={`Select ${color.name}`}
              />
            ))}
          </div>
        )}

        {/* Pricing Row */}
        <div className="pt-2 border-t border-[#E8E8E4] flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm sm:text-base font-bold text-[#171717]">
              {formatPrice(product.basePrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
              <span className="font-mono text-xs text-[#767676] line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {discountPercentage > 0 && (
            <span className="text-[10px] font-mono font-bold text-[#21866F] bg-[#EAF6F0] px-1.5 py-0.5 rounded border border-[#21866F]/30">
              {discountPercentage}% off
            </span>
          )}
        </div>

        {/* Mobile quick add button */}
        <div className="sm:hidden pt-2">
          <button
            onClick={handleQuickAdd}
            disabled={product.stock === 0 || isAdded}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAdded ? "Added to Bag" : "Add to Bag"}
          </button>
        </div>
      </div>
    </div>
  );
};

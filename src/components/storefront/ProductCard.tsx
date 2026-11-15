"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Star,
  ShoppingBag,
  Check,
  Eye,
  Truck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Product } from "@/types/marketplace";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useStore } from "@/context/StoreContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { calculateDiscountPercentage } from "@/lib/formatters";

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const { addToCart, openCartDrawer } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const { setQuickViewProduct } = useStore();

  const [selectedColor, setSelectedColor] = useState(product.availableColors?.[0]);
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const discountPercentage = calculateDiscountPercentage(
    product.basePrice,
    product.compareAtPrice
  );
  const savingsAmount = product.compareAtPrice && product.compareAtPrice > product.basePrice
    ? product.compareAtPrice - product.basePrice
    : 0;

  const wishlisted = isWishlisted(product.id);

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct({
      id: product.id,
      slug: product.slug,
      title: product.title,
      subtitle: product.subtitle,
      price: product.basePrice,
      mrpPrice: product.compareAtPrice || Math.round(product.basePrice * 1.25),
      rating: product.rating,
      reviewsCount: product.reviewCount || 1,
      reviewCount: product.reviewCount || 1,
      images: product.images,
      category: product.category as any,
      supplier: {
        id: product.vendor.id,
        name: product.vendor.name,
        location: product.vendor.location || "India",
        verified: true,
        rating: product.vendor.rating || 5.0,
        badge: "VERIFIED ATELIER",
      } as any,
      stock: product.stock,
      colors: product.availableColors?.map((c) => ({ name: c.name, hex: c.hex, image: c.image || "" })) || [
        { name: "Standard", hex: "#18181b", image: product.images[0] || "" },
      ],
      sizes: product.availableSizes || ["Standard"],
      specs: {
        Material: product.materials || "Natural Artisan Materials",
        Origin: product.vendor.location || "India",
      },
      description: product.description,
      reviews: [],
    } as any);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || isAdded || product.stock === 0) return;

    setIsAdding(true);
    const success = addToCart(product, {
      quantity: 1,
      color: selectedColor,
      size: product.availableSizes?.[0],
    });

    if (success) {
      setIsAdded(true);
      openCartDrawer();
      setTimeout(() => {
        setIsAdded(false);
        setIsAdding(false);
      }, 1500);
    } else {
      setIsAdding(false);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;

    const primaryImg = selectedColor?.image || product.images[0] || "";
    const directItem = {
      id: `buynow_${product.id}_${product.availableSizes?.[0] || "std"}`,
      productId: product.id,
      product: {
        id: product.id,
        title: product.title,
        price: product.basePrice,
        slug: product.slug,
        images: product.images.map((img) => ({
          url: img,
          alt: product.title,
          isPrimary: true,
        })),
        vendor: {
          id: product.vendor.id,
          name: product.vendor.name,
        },
      },
      quantity: 1,
      unitPrice: product.basePrice,
      selectedSku: product.id,
      selectedColor: selectedColor
        ? {
            name: selectedColor.name,
            hex: selectedColor.hex,
            image: selectedColor.image || primaryImg,
          }
        : undefined,
      selectedSize: product.availableSizes?.[0],
    };

    try {
      const serialized = JSON.stringify(directItem);
      sessionStorage.setItem("nexu_buy_now_item", serialized);
      localStorage.setItem("nexu_buy_now_item", serialized);
    } catch {}

    window.location.href = "/checkout?direct=1";
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id, product);
  };

  const isBestseller = Boolean(product.isTrending);
  const isFeatured = Boolean(product.isFeatured);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-white border border-zinc-200/90 hover:border-zinc-950/40 hover:shadow-lg transition-all duration-300 overflow-hidden text-zinc-950">
      <div className="relative block w-full aspect-[4/5] bg-zinc-100 overflow-hidden">
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
            className={`object-cover object-center transition-all duration-500 ease-out ${
              product.images[1] && !selectedColor?.image
                ? "group-hover:opacity-0 group-hover:scale-105"
                : "group-hover:scale-105"
            }`}
          />
          {product.images[1] && !selectedColor?.image && (
            <ImageWithFallback
              src={product.images[1]}
              alt={`${product.title} alternate angle`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
            />
          )}
        </Link>

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none z-10">
          <div className="flex flex-col gap-1.5 items-start">
            {isBestseller ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-950 text-white shadow-xs">
                <span>Bestseller</span>
              </span>
            ) : isFeatured ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900 text-white shadow-xs">
                <span>Featured</span>
              </span>
            ) : product.isNewArrival ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900 text-white shadow-xs">
                <span>New Arrival</span>
              </span>
            ) : null}

            {discountPercentage > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/95 text-zinc-950 border border-zinc-200 shadow-2xs">
                {discountPercentage}% OFF
              </span>
            )}

            {product.stock <= 4 && product.stock > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                Only {product.stock} Left
              </span>
            )}
            {product.stock === 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
                Sold Out
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <button
              onClick={handleToggleWishlist}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                wishlisted
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-white/95 hover:bg-white text-zinc-900 border border-zinc-200/90 hover:scale-105"
              }`}
              aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  wishlisted ? "fill-red-600 text-red-600 scale-110" : ""
                }`}
              />
            </button>

            <button
              onClick={handleQuickView}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-white/95 hover:bg-white text-zinc-900 border border-zinc-200/90 shadow-xs hover:scale-105"
              aria-label="Quick view"
              title="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block z-10 pointer-events-auto">
          <button
            onClick={handleQuickView}
            className="w-full py-2 px-3 rounded-lg bg-white/95 hover:bg-white text-zinc-950 font-medium text-xs flex items-center justify-center gap-1.5 shadow-md border border-zinc-200/90 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Quick View</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-mono text-zinc-500 uppercase tracking-wider font-semibold truncate max-w-[140px]">
              {product.category || "Heritage Craft"}
            </span>

            <Link
              href={`/brand/${product.vendor.slug || product.vendor.id}`}
              className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-950 font-medium truncate max-w-[150px] transition-colors"
              title={`Visit ${product.vendor.name} Atelier`}
            >
              {product.vendor.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
              )}
              <span className="truncate">{product.vendor.name}</span>
            </Link>
          </div>

          <h3 className="font-semibold text-sm sm:text-[15px] text-zinc-950 leading-snug line-clamp-1 hover:underline transition-colors">
            <Link href={`/product/${product.slug}`}>{product.title}</Link>
          </h3>

          <p className="text-xs text-zinc-600 line-clamp-1">
            {product.subtitle || product.materials || "Handcrafted by Master Guild"}
          </p>

          <div className="flex items-center gap-2 pt-0.5 text-xs">
            {product.reviewCount > 0 ? (
              <>
                <div className="flex items-center gap-1 text-zinc-950 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-mono">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </>
            ) : (
              <span className="text-[11px] text-zinc-400 font-mono">
                No reviews yet
              </span>
            )}
          </div>
        </div>

        {product.availableColors && product.availableColors.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Shades:</span>
            {product.availableColors.map((color) => (
              <button
                key={color.name}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(color);
                }}
                className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                  selectedColor?.name === color.name
                    ? "border-zinc-950 scale-125 shadow-xs ring-1 ring-zinc-950 ring-offset-1"
                    : "border-zinc-300 opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={`Select ${color.name}`}
              />
            ))}
          </div>
        )}

        <div className="pt-2.5 border-t border-zinc-100 space-y-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-base sm:text-lg font-extrabold text-zinc-950">
                {formatPrice(product.basePrice)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
                <span className="font-mono text-xs text-zinc-400 line-through">
                  M.R.P.: {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            {savingsAmount > 0 && (
              <p className="text-[11px] font-medium text-emerald-700 pt-0.5 font-mono">
                Save {formatPrice(savingsAmount)} ({discountPercentage}% off)
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium">
            <Truck className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
            <span>
              {product.basePrice >= 2500 ? "Eligible for Free Delivery" : "Standard Delivery Available"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={product.stock === 0 || isAdding}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdded
                  ? "bg-emerald-600 text-white"
                  : "bg-white hover:bg-zinc-100 text-zinc-950 border border-zinc-300"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="py-2.5 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Buy Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

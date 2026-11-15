"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  Heart,
  Eye,
  ShoppingBag,
  Star,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
  Truck,
  Sparkles,
} from "lucide-react";
import { StoreProduct, useStore } from "@/context/StoreContext";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types/marketplace";

export function ProductCardSaaS({ product }: { product: StoreProduct }) {
  const router = useRouter();
  const { toggleWishlist, isInWishlist, setQuickViewProduct, openB2BModal, formatPrice } = useStore();
  const cart = useCart();

  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const wishlisted = isInWishlist(product.id);

  const discountPercent = product.mrpPrice > product.price
    ? Math.round(((product.mrpPrice - product.price) / product.mrpPrice) * 100)
    : 0;
  const savingsAmount = product.mrpPrice > product.price
    ? product.mrpPrice - product.price
    : 0;

  const mappedProduct: Product = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle || "",
    description: product.description || "",
    category: product.category as any,
    vendor: {
      id: product.supplier.id,
      name: product.supplier.name,
      slug: (product.supplier as any).slug || product.supplier.id,
      location: product.supplier.location || "India",
      rating: product.supplier.rating || 4.9,
      tagline: (product.supplier as any).tagline || "Master Craft Studio",
      story: (product.supplier as any).story || "",
      totalSales: 150,
      verifiedSince: "2024",
      dispatchTime: "Ships in 24-48 hours",
      avatarUrl: (product.supplier as any).avatarUrl || "",
    },
    basePrice: product.price,
    compareAtPrice: product.mrpPrice,
    currency: "INR",
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.reviewCount || 1,
    images: product.images,
    availableColors: product.colors?.map((c) => ({ name: c.name, hex: c.hex, image: c.image })),
    availableSizes: product.sizes,
    specifications: Object.entries(product.specs || {}).map(([label, value]) => ({ label, value })),
    tags: [product.category, product.badge].filter(Boolean) as string[],
    highlights: [product.subtitle].filter(Boolean),
    materials: product.specs?.["Material"] || product.specs?.["Fabric Composition"] || "Natural Artisan Materials",
    origin: product.supplier.location || "India",
    estimatedDeliveryDays: 3,
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || product.stock <= 0) return;
    setIsAdding(true);

    const success = cart.addToCart(mappedProduct, {
      quantity: 1,
      size: product.sizes?.[0],
      color: product.colors?.[0] ? { name: product.colors[0].name, hex: product.colors[0].hex, image: product.colors[0].image } : undefined,
    });

    if (success) {
      setIsAdded(true);
      cart.openCartDrawer();
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

    const primaryImg = product.images[0] || "";
    const directItem = {
      id: `buynow_${product.id}_${product.sizes?.[0] || "std"}`,
      productId: product.id,
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        slug: product.slug,
        images: product.images.map((img) => ({
          url: img,
          alt: product.title,
          isPrimary: true,
        })),
        vendor: {
          id: product.supplier.id,
          name: product.supplier.name,
        },
      },
      quantity: 1,
      unitPrice: product.price,
      selectedSku: product.id,
      selectedColor: product.colors?.[0]
        ? {
            name: product.colors[0].name,
            hex: product.colors[0].hex,
            image: product.colors[0].image || primaryImg,
          }
        : undefined,
      selectedSize: product.sizes?.[0],
    };

    try {
      const serialized = JSON.stringify(directItem);
      sessionStorage.setItem("nexu_buy_now_item", serialized);
      localStorage.setItem("nexu_buy_now_item", serialized);
    } catch {}

    window.location.href = "/checkout?direct=1";
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  const isBestseller = product.badge && (product.badge.toLowerCase().includes("bestseller") || product.badge.toLowerCase().includes("trending"));
  const isFeatured = product.badge && product.badge.toLowerCase().includes("featured");

  return (
    <div className="group relative rounded-2xl bg-white border border-zinc-200/90 hover:border-zinc-950/40 shadow-xs hover:shadow-lg transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between overflow-hidden text-zinc-950">
      <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/80 mb-4 flex items-center justify-center">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${product.title}`}
        >
          <SafeImage
            src={product.images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"}
            alt={product.title}
            fill
            priority
            loading="eager"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            wrapperClassName={`transition-opacity duration-500 ease-out ${
              product.images[1] ? "group-hover:opacity-0" : ""
            }`}
            className="object-cover p-1 transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {product.images[1] && (
            <SafeImage
              src={product.images[1]}
              alt={`${product.title} alternate view`}
              fill
              loading="eager"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
              wrapperClassName="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
              className="object-cover p-1 transition-transform duration-500 ease-out group-hover:scale-105"
            />
          )}
        </Link>

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10 pointer-events-none">
          {isBestseller ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-zinc-950 text-white shadow-xs">
              Bestseller
            </span>
          ) : isFeatured ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-zinc-900 text-white shadow-xs">
              Featured
            </span>
          ) : product.badge ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-zinc-900 text-white shadow-xs">
              {product.badge}
            </span>
          ) : null}

          {discountPercent > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/95 text-zinc-950 border border-zinc-200 shadow-2xs">
              {discountPercent}% OFF
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

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-xs ${
            wishlisted
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-white/95 hover:bg-white text-zinc-900 border border-zinc-200 hover:scale-105"
          }`}
          title={wishlisted ? "Remove from wishlist" : "Save piece to wishlist"}
          aria-label={wishlisted ? "Remove from wishlist" : "Save piece to wishlist"}
        >
          <Heart className={`w-4 h-4 transition-transform ${wishlisted ? "fill-red-600 text-red-600 scale-110" : ""}`} />
        </button>

        <div className="absolute inset-x-3 bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto hidden sm:block">
          <button
            type="button"
            onClick={handleQuickView}
            className="w-full py-2 px-3 rounded-lg bg-white/95 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md border border-zinc-200 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Quick View</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
            <span className="font-sans text-xs text-zinc-500 font-semibold truncate max-w-[140px]">
              {product.category || "Atelier"}
            </span>

            <Link
              href={`/brand/${product.storeSlug || product.supplier.slug || product.supplier.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-950 font-medium truncate max-w-[150px] transition-colors"
              title={`Visit ${product.supplier.name} Store`}
            >
              {product.supplier.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
              )}
              <span className="truncate">{product.supplier.name}</span>
            </Link>
          </div>

          <h3 className="font-semibold text-zinc-950 text-sm sm:text-[15px] leading-snug line-clamp-1 hover:underline transition-colors">
            <Link href={`/product/${product.slug}`}>
              {product.title}
            </Link>
          </h3>

          <p className="text-xs text-zinc-600 line-clamp-1">
            {product.subtitle || "Authentic Studio Handcrafted Piece"}
          </p>

          <div className="flex items-center gap-2 pt-0.5 text-xs font-sans">
            {product.reviewCount > 0 ? (
              <>
                <div className="flex items-center gap-1 text-zinc-950 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </>
            ) : (
              <span className="text-[11px] text-zinc-400">
                No reviews yet
              </span>
            )}
          </div>
        </div>

        <div className="pt-2.5 border-t border-zinc-100 space-y-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-extrabold text-zinc-950 font-mono">
                {formatPrice(product.price)}
              </span>
              {product.mrpPrice > product.price && (
                <span className="text-xs text-zinc-400 line-through font-mono">
                  M.R.P.: {formatPrice(product.mrpPrice)}
                </span>
              )}
            </div>

            {savingsAmount > 0 && (
              <p className="text-[11px] font-medium text-emerald-700 pt-0.5 font-mono">
                Save {formatPrice(savingsAmount)} ({discountPercent}% off)
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium">
            <Truck className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
            <span>
              {product.price >= 2500 ? "Eligible for Free Delivery" : "Standard Delivery Available"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddToCart}
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

          {product.category === "B2B Wholesale Packs" && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openB2BModal(product);
              }}
              className="w-full mt-1.5 py-1.5 px-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Request Wholesale Volume Pricing</span>
              <ArrowRight className="w-3 h-3 text-zinc-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

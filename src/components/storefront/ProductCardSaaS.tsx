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
  Building2,
  Check,
} from "lucide-react";
import { StoreProduct, useStore } from "@/context/StoreContext";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types/marketplace";

export function ProductCardSaaS({ product }: { product: StoreProduct }) {
  const router = useRouter();
  const { toggleWishlist, isInWishlist, setQuickViewProduct, openB2BModal, formatPrice } = useStore();
  const cart = useCart();

  const [isHovered, setIsHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const wishlisted = isInWishlist(product.id);

  const discountPercent = Math.round(
    ((product.mrpPrice - product.price) / product.mrpPrice) * 100
  );

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
      sessionStorage.setItem("nexu_buy_now_item", JSON.stringify(directItem));
    } catch {}

    router.push("/checkout?direct=1");
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl bg-white border border-zinc-200/90 hover:border-zinc-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out p-4 flex flex-col justify-between overflow-hidden"
    >
      {/* Top Media Container with 4:5 Portrait Ratio */}
      <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 mb-3.5 flex items-center justify-center transition-colors group-hover:bg-zinc-100/50">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${product.title}`}
        >
          <SafeImage
            src={product.images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            className="object-cover p-1 group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {product.badge && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider bg-zinc-950 text-white shadow-xs">
              {product.badge}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-700 text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            wishlisted
              ? "bg-rose-50 text-rose-600 shadow-md ring-1 ring-rose-200"
              : "bg-white/90 hover:bg-white text-zinc-600 hover:text-rose-600 shadow-sm"
          }`}
          title={wishlisted ? "Remove from wishlist" : "Save piece to wishlist"}
          aria-label={wishlisted ? "Remove from wishlist" : "Save piece to wishlist"}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-current text-rose-600" : ""}`} />
        </button>

        {/* Quick View Floating Overlay Trigger */}
        <div className="absolute inset-x-3 bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
          <button
            type="button"
            onClick={handleQuickView}
            className="w-full py-2 px-3 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-zinc-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md border border-zinc-200/80 active:scale-98 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Supplier & Category Strip */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
            <Link
              href={`/store/${product.storeSlug || product.supplier.slug || product.supplier.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              onClick={(e) => e.stopPropagation()}
              className="truncate max-w-[150px] flex items-center gap-1 hover:text-blue-600 transition-colors group/brand"
              title={`Visit ${product.supplier.name} Flagship Brand Boutique`}
            >
              <Building2 className="w-3 h-3 text-zinc-400 group-hover/brand:text-blue-600 shrink-0" />
              <span className="group-hover/brand:underline underline-offset-2">{product.supplier.name}</span>
            </Link>
            <div className="flex items-center text-amber-500 font-bold shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
              <span>{product.rating}</span>
            </div>
          </div>

          {/* Product Title Linked to PDP */}
          <h3 className="font-bold text-zinc-900 text-sm leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
            <Link href={`/product/${product.slug}`}>
              {product.title}
            </Link>
          </h3>

          <p className="text-[11px] text-zinc-500 line-clamp-1">
            {product.subtitle}
          </p>
        </div>

        {/* Pricing & Stock Urgency */}
        <div className="pt-2 border-t border-zinc-100 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-extrabold text-zinc-950 font-mono tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.mrpPrice > product.price && (
                <span className="text-xs text-zinc-400 line-through font-mono">
                  {formatPrice(product.mrpPrice)}
                </span>
              )}
            </div>

            {/* Stock Pill based on actual inventory */}
            {product.stock <= 5 && product.stock > 0 ? (
              <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Only {product.stock} Left
              </span>
            ) : product.stock === 0 ? (
              <span className="text-[10px] font-bold font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Sold Out
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>In Stock</span>
              </span>
            )}
          </div>

          {/* Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1.5">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdded
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
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
              className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Buy Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Request B2B Quote Action (Only for B2B Wholesale category pieces) */}
          {product.category === "B2B Wholesale Packs" && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openB2BModal(product);
              }}
              className="w-full mt-1.5 py-1.5 px-2.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Request Wholesale Volume Pricing</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

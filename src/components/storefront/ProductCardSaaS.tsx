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
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { StoreProduct, useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";

export function ProductCardSaaS({ product }: { product: StoreProduct }) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct, openB2BModal, formatPrice, activeRegion } = useStore();

  const [isHovered, setIsHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80");
  const wishlisted = isInWishlist(product.id);

  const discountPercent = Math.round(
    ((product.mrpPrice - product.price) / product.mrpPrice) * 100
  );

  const handleBuyNow = () => {
    addToCart(product);
    router.push("/checkout");
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl bg-white/75 backdrop-blur-2xl border border-white/90 ring-1 ring-slate-900/5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out p-4 flex flex-col justify-between overflow-hidden"
    >
      {/* Top Media Container with Luxury 4:5 Portrait Ratio */}
      <div
        onClick={() => setQuickViewProduct(product)}
        className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 mb-3.5 cursor-pointer flex items-center justify-center transition-colors group-hover:bg-slate-100/60"
      >
        <SafeImage
          src={product.images[0] || imgSrc}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {product.badge && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider bg-slate-950 text-white shadow-xs">
              {product.badge}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-600 text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            wishlisted
              ? "bg-rose-50 text-rose-600 shadow-md ring-1 ring-rose-200"
              : "bg-white/90 hover:bg-white text-slate-600 hover:text-rose-600 shadow-sm"
          }`}
          title={wishlisted ? "Remove from wishlist" : "Save piece to wishlist"}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Quick View Floating Overlay Trigger */}
        <div className="absolute inset-x-3 bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={() => setQuickViewProduct(product)}
            className="w-full py-2 px-3 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md border border-slate-200/80 active:scale-98 transition-all"
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
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <Link
              href={`/store/${product.storeSlug || product.supplier.slug || product.supplier.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              onClick={(e) => e.stopPropagation()}
              className="truncate max-w-[150px] flex items-center gap-1 hover:text-indigo-600 transition-colors group/brand"
              title={`Visit ${product.supplier.name} Flagship Brand Boutique`}
            >
              <Building2 className="w-3 h-3 text-slate-400 group-hover/brand:text-indigo-600 shrink-0" />
              <span className="group-hover/brand:underline underline-offset-2">{product.supplier.name}</span>
            </Link>
            <div className="flex items-center text-amber-500 font-bold shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
              <span>{product.rating}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => setQuickViewProduct(product)}
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer"
          >
            {product.title}
          </h3>

          <p className="text-[11px] text-slate-500 line-clamp-1">
            {product.subtitle}
          </p>
        </div>

        {/* Pricing & Stock Urgency */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-extrabold text-slate-950 font-mono tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.mrpPrice > product.price && (
                <span className="text-xs text-slate-400 line-through font-mono">
                  {formatPrice(product.mrpPrice)}
                </span>
              )}
            </div>

            {/* Stock Pill */}
            {product.stock <= 5 ? (
              <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Only {product.stock} Left
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
              onClick={() => addToCart(product)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-98"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Bag</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm active:scale-98"
            >
              <span>Buy Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Request B2B Quote Action (Only for B2B Wholesale category pieces) */}
          {product.category === "B2B Wholesale Packs" && (
            <button
              type="button"
              onClick={() => openB2BModal(product)}
              className="w-full mt-1.5 py-1.5 px-2.5 rounded-lg border border-slate-200/80 bg-white/70 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Request Wholesale Volume Pricing</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


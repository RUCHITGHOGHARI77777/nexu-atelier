"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Phone,
  MapPin,
  QrCode,
  Share2,
  Sparkles,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Tag,
  Star,
  ExternalLink,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { getSellerStoreBySlug, SellerBrandStore, DEFAULT_DEMO_SELLER_STORE } from "@/lib/firebase/sellerStoreService";
import { formatCurrency } from "@/lib/formatters";

export default function BrandedStorefrontPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "jaipur-heritage-handlooms";
  const { products, addToCart, showToast } = useStore();

  const [sellerStore, setSellerStore] = useState<SellerBrandStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      const data = await getSellerStoreBySlug(slug);
      setSellerStore(data || {
        ...DEFAULT_DEMO_SELLER_STORE,
        brandName: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        slug,
      });
      setLoading(false);
    }
    loadStore();
  }, [slug]);

  // Filter products relevant to this store or category
  const storeProducts = products.slice(0, 6);

  const handleShareStore = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("Store link copied! Paste directly in WhatsApp bio or Instagram stories 🛍️", "success");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-3 font-mono text-xs text-slate-500">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading Branded Seller Storefront...</p>
      </div>
    );
  }

  const brand = sellerStore || DEFAULT_DEMO_SELLER_STORE;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-900 animate-in fade-in duration-300">
      {/* Back to Marketplace Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Multi-Vendor Marketplace</span>
        </Link>

        <button
          type="button"
          onClick={handleShareStore}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Share Store Link</span>
        </button>
      </div>

      {/* --- SELLER BRAND HERO HEADER CARD --- */}
      <div className="relative rounded-3xl border border-white/90 ring-1 ring-slate-900/5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white shadow-2xl p-6 sm:p-10 overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                0% COMMISSION DIRECT BRAND STORE
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Independent Artisan</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {brand.brandName}
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {brand.tagline}
            </p>

            {/* Seller Contact & Pickup Details */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: <strong className="text-white">{brand.phoneWhatsapp}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{brand.pickupAddress}</span>
              </span>
            </div>
          </div>

          {/* Direct UPI Badge */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-center space-y-1.5 shrink-0">
            <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest block">
              DIRECT BANK UPI SETTLEMENT
            </span>
            <span className="text-sm font-mono font-black text-white block">
              {brand.directUpiId}
            </span>
            <span className="text-[10px] text-slate-400 block">
              100% P2P • Zero Middleman Cut
            </span>
          </div>
        </div>

        {/* Live Meta Pixel Tracking Indicator */}
        {brand.metaPixelId && (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Tag className="w-3 h-3" />
              <span>Meta Pixel Connected: <strong>{brand.metaPixelId}</strong></span>
            </span>
            <span>Instagram & Facebook Ads Ready</span>
          </div>
        )}
      </div>

      {/* --- SELLER'S CATALOG PRODUCTS --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-950">
              Exclusive Pieces from {brand.brandName}
            </h2>
            <p className="text-xs text-slate-500">
              Direct-from-studio pricing with zero retail marketplace markup.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {storeProducts.length} Items Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {storeProducts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/90 backdrop-blur-2xl shadow-xs hover:shadow-md transition-all p-4 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-md text-[10px] font-mono font-bold text-white">
                    {p.category}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-950 line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {p.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs line-through text-slate-400 block font-mono">
                    {formatCurrency(p.mrpPrice)}
                  </span>
                  <span className="text-base font-black font-mono text-slate-950 block">
                    {formatCurrency(p.price)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => addToCart(p)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-98 cursor-pointer transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add to Bag</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

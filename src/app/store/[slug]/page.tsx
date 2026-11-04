"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  MapPin,
  Share2,
  Sparkles,
  ArrowLeft,
  Star,
  Clock,
  Package,
} from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Product } from "@/types/marketplace";

interface SellerProfile {
  id: string;
  slug: string;
  name: string;
  originHub: string | null;
  story: string | null;
  heroImage: string | null;
  verified: boolean;
  rating: number;
  leadTimeDays: number;
  status: string;
  taxIdentifier: string | null;
  activeProductsCount: number;
}

export default function BrandedStorefrontPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "solstice-loom-studio";

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/sellers/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Artisan Studio not found in active collective.");
          } else {
            setError("Failed to load studio details.");
          }
          return;
        }
        const data = await res.json();
        setSeller(data.seller);
        setProducts(data.products || []);
      } catch (err: any) {
        setError(err.message || "Failed to load studio details.");
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [slug]);

  const handleShareStore = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center space-y-4 font-mono text-xs text-zinc-500">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading Verified Artisan Studio Dossier...</p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mx-auto">
          <Store className="w-8 h-8 stroke-1" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">
            {error || "Artisan Studio Not Found"}
          </h1>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">
            The requested studio portfolio may be undergoing curation or moderation review.
          </p>
        </div>
        <div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Master Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-zinc-900 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Share Strip */}
      <div className="flex items-center justify-between">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Master Archive</span>
        </Link>

        <button
          type="button"
          onClick={handleShareStore}
          className="px-3.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
        >
          <Share2 className="w-3.5 h-3.5 text-zinc-600" />
          <span>{copied ? "Link Copied!" : "Share Studio Profile"}</span>
        </button>
      </div>

      {/* --- SELLER BRAND HERO HEADER CARD --- */}
      <div className="relative rounded-3xl border border-zinc-200 bg-white p-6 sm:p-10 shadow-xs overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                INDEPENDENT MAKER COLLECTIVE
              </span>
              {seller.verified && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Maker Studio</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              {seller.name}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              {seller.story ||
                "Dedicated to heritage craft preservation, natural dyeing, and bespoke artisan engineering direct from regional workshops."}
            </p>

            {/* Provenance & Logistics Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-600 pt-2 border-t border-zinc-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>{seller.originHub || "Pan-India Studio"}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Dispatch SLA: {seller.leadTimeDays || 2}-4 business days</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="font-bold text-zinc-900">{seller.rating.toFixed(1)} / 5.0 Rating</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 min-w-[200px] space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                Approved Pieces
              </span>
              <span className="text-2xl font-black text-zinc-950 font-mono">
                {products.length}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-200/80">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                Logistics Partner
              </span>
              <span className="text-xs font-semibold text-zinc-900">
                Blue Dart Air Priority
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- STUDIO CATALOG SECTION --- */}
      <div className="space-y-6">
        <div className="flex items-end justify-between pb-4 border-b border-zinc-200">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
              STUDIO PORTFOLIO
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-950">
              Curated Creations ({products.length})
            </h2>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-zinc-400 stroke-1 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-950">
              No public drops currently live
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              This studio is currently preparing its next batch on the loom. Check back soon for fresh releases.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

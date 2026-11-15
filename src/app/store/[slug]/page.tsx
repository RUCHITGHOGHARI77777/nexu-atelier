"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Store,
  CheckCircle2,
  MapPin,
  Share2,
  ArrowLeft,
  Package,
  SlidersHorizontal,
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
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
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
            setError("Brand profile not found in active directory.");
          } else {
            setError("Failed to load brand profile.");
          }
          return;
        }
        const data = await res.json();
        setSeller(data.seller);
        setProducts(data.products || []);
      } catch (err: any) {
        setError(err.message || "Failed to load brand details.");
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

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#666666]">Loading brand portfolio...</p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#F7F7F7] border border-[#E7E7E7] flex items-center justify-center text-[#666666] mx-auto">
          <Store className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#111111] tracking-tight">
            {error || "Brand Not Found"}
          </h1>
          <p className="text-sm text-[#666666] max-w-md mx-auto">
            The requested brand profile is currently unavailable or undergoing curation review.
          </p>
        </div>
        <div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#111111] text-white text-xs font-medium hover:bg-[#222222] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-[#111111]">
      <div className="flex items-center justify-between border-b border-[#E7E7E7] pb-4">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#666666] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </Link>

        <button
          type="button"
          onClick={handleShareStore}
          className="px-3.5 py-1.5 rounded-lg border border-[#E7E7E7] bg-white hover:bg-[#F7F7F7] text-[#111111] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#666666]" />
          <span>{copied ? "Link Copied" : "Share Brand"}</span>
        </button>
      </div>

      <div className="border border-[#E7E7E7] rounded-2xl bg-white p-6 sm:p-10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-16 h-16 rounded-xl bg-[#171717] text-white flex items-center justify-center font-bold text-2xl tracking-wider shrink-0 shadow-xs">
            {seller.name.charAt(0)}
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
                {seller.name}
              </h1>
              {seller.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F7F7F7] text-[#111111] border border-[#E7E7E7]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Studio</span>
                </span>
              )}
            </div>

            <p className="text-sm text-[#666666] max-w-3xl leading-relaxed">
              {seller.story ||
                "Dedicated to artisan craftsmanship, sustainable materials, and independent design."}
            </p>

            {seller.originHub && (
              <div className="flex items-center gap-2 text-xs text-[#888888] pt-1">
                <MapPin className="w-3.5 h-3.5 text-[#888888]" />
                <span>{seller.originHub}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E7E7] gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#888888] font-semibold block mb-0.5">
              COLLECTION
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
              Products ({filteredProducts.length})
            </h2>
          </div>

          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#888888] mr-1 hidden sm:inline" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#111111] text-white"
                      : "bg-[#F7F7F7] text-[#666666] hover:text-[#111111] border border-[#E7E7E7]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E7E7] bg-white p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-[#888888] stroke-1 mx-auto" />
            <h3 className="text-sm font-semibold text-[#111111]">
              No products found
            </h3>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              There are currently no products available in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Globe,
  Image as ImageIcon,
  ShoppingBag,
  Share2,
  ExternalLink,
  CheckCircle2,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export interface SeoLivePreviewProps {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
  imageUrl?: string;
  altText?: string;
  brand?: string;
  basePrice?: number;
  inStock?: boolean;
  category?: string;
  canonicalUrl?: string;
}

export const SeoLivePreview: React.FC<SeoLivePreviewProps> = ({
  title,
  metaTitle,
  metaDescription,
  slug,
  imageUrl,
  altText,
  brand = "Nexu Atelier",
  basePrice = 4500,
  inStock = true,
  category = "Handcrafted Heritage",
  canonicalUrl,
}) => {
  const [activeTab, setActiveTab] = useState<
    "google" | "images" | "shopping" | "bing" | "social"
  >("google");

  const displayTitle = metaTitle || title || "Authentic Handcrafted Piece";
  const displayDesc =
    metaDescription ||
    "Discover certified handcrafted luxury, bespoke artisan textiles, and master craft decor curated with authentic provenance on Nexu Atelier.";
  const displaySlug = slug || "artisan-piece";
  const fullUrl = canonicalUrl || `https://nexu.studio/product/${displaySlug}`;
  const displayImage =
    imageUrl ||
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
      {/* Header with Switcher Tabs */}
      <div className="p-4 bg-zinc-50/70 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-600" />
            <span>Multi-Channel Search Previews</span>
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Simulated editorial previews across search, discovery, and social networks
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-zinc-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("google")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "google"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
            }`}
          >
            Google Search
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "images"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
            }`}
          >
            Google Images
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shopping")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "shopping"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
            }`}
          >
            Shopping Card
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "bing"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
            }`}
          >
            Bing Search
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("social")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "social"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
            }`}
          >
            Social / OpenGraph
          </button>
        </div>
      </div>

      {/* Content Preview Container */}
      <div className="p-6 bg-white min-h-[190px] flex items-center justify-center">
        {/* 1. Google-Style Search Result */}
        {activeTab === "google" && (
          <div className="w-full max-w-2xl font-sans text-left space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-700">
              <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center text-[9px] font-bold text-white">
                N
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-zinc-900 leading-tight">
                  Nexu Atelier
                </span>
                <span className="text-[11px] text-zinc-500 truncate">
                  https://nexu.studio › product › {displaySlug}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-blue-800 hover:underline cursor-pointer leading-snug pt-1 line-clamp-1">
              {displayTitle}
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2 pt-0.5">
              <span className="text-zinc-500 font-medium mr-1.5">
                {brand} · {formatCurrency(basePrice)} · In stock:
              </span>
              {displayDesc}
            </p>
          </div>
        )}

        {/* 2. Google Images Preview */}
        {activeTab === "images" && (
          <div className="w-full max-w-sm border border-zinc-200 rounded-xl overflow-hidden shadow-xs bg-zinc-50 text-left">
            <div className="relative h-48 w-full bg-zinc-100 flex items-center justify-center overflow-hidden">
              <img
                src={displayImage}
                alt={altText || displayTitle}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                nexu.studio
              </span>
            </div>
            <div className="p-3 bg-white space-y-1">
              <p className="text-xs font-semibold text-zinc-900 truncate">
                {altText || displayTitle}
              </p>
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span className="truncate">{brand} · Nexu Atelier</span>
                <span className="font-mono text-emerald-600 font-medium">
                  {formatCurrency(basePrice)}
                </span>
              </div>
              <div className="pt-1 border-t border-zinc-100 flex items-center gap-1.5 text-[10px] text-zinc-400">
                <ImageIcon className="w-3 h-3" />
                <span className="truncate font-mono">ALT: {altText || "(missing ALT text)"}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Google Shopping Product Card Preview */}
        {activeTab === "shopping" && (
          <div className="w-full max-w-xs border border-zinc-200 rounded-2xl overflow-hidden shadow-xs bg-white text-left hover:shadow-md transition-shadow">
            <div className="relative h-52 w-full bg-zinc-100 flex items-center justify-center overflow-hidden">
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                Free Delivery
              </span>
            </div>
            <div className="p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                {brand}
              </span>
              <h4 className="text-xs font-semibold text-zinc-950 line-clamp-2 leading-snug">
                {displayTitle}
              </h4>
              <div className="pt-1 flex items-baseline gap-2">
                <span className="text-sm font-bold text-zinc-900 font-mono">
                  {formatCurrency(basePrice)}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {inStock ? "In stock" : "Out of stock"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 pt-0.5">
                Atelier verified · Delivered by Nexu Courier
              </p>
            </div>
          </div>
        )}

        {/* 4. Bing-Style Search Result */}
        {activeTab === "bing" && (
          <div className="w-full max-w-2xl font-sans text-left space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800">
              <span>nexu.studio</span>
              <span>›</span>
              <span>product</span>
              <span>›</span>
              <span className="text-zinc-500">{displaySlug}</span>
            </div>
            <h3 className="text-base font-semibold text-blue-900 hover:underline cursor-pointer leading-snug pt-0.5 line-clamp-1">
              {displayTitle}
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
              {displayDesc}
            </p>
          </div>
        )}

        {/* 5. Social / OpenGraph Card Preview */}
        {activeTab === "social" && (
          <div className="w-full max-w-md border border-zinc-200 rounded-xl overflow-hidden shadow-xs bg-white text-left">
            <div className="relative h-44 w-full bg-zinc-100 flex items-center justify-center overflow-hidden">
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3.5 bg-zinc-50/70 border-t border-zinc-200 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block">
                NEXU.STUDIO
              </span>
              <h4 className="text-xs font-bold text-zinc-900 line-clamp-1 leading-snug">
                {displayTitle}
              </h4>
              <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                {displayDesc}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimers & Context Footnote */}
      <div className="px-4 py-2.5 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>Editorial previews are design simulations; actual SERP appearance is governed by each search engine.</span>
        </span>
        <span className="font-mono text-zinc-400">Canonical: {displaySlug}</span>
      </div>
    </div>
  );
};

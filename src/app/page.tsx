"use client";

import React from "react";
import { EditorialHeroSection } from "@/components/storefront/EditorialHeroSection";
import { FeaturedCategories } from "@/components/storefront/FeaturedCategories";
import { NewArrivalsSpotlight } from "@/components/storefront/NewArrivalsSpotlight";
import { CuratedLookbookSection } from "@/components/storefront/CuratedLookbookSection";
import { TrendingSection } from "@/components/storefront/TrendingSection";
import { ArtisanStudiosShowcase } from "@/components/storefront/ArtisanStudiosShowcase";
import { EditorialCampaignBanner } from "@/components/storefront/EditorialCampaignBanner";
import { StorefrontFilterBar } from "@/components/storefront/StorefrontFilterBar";
import { ProductGridSaaS } from "@/components/storefront/ProductGridSaaS";
import { BrandStorySection } from "@/components/storefront/BrandStorySection";
import { NewsletterSection } from "@/components/storefront/NewsletterSection";

export default function StorefrontHomePage() {
  return (
    <div className="space-y-4 pb-16">
      {/* 1. Asymmetrical Magazine Editorial Hero */}
      <EditorialHeroSection />

      {/* 2. Main Studio Disciplines & Shopping Categories Grid */}
      <FeaturedCategories />

      {/* 3. New Studio Releases & Fresh Drops Spotlight */}
      <NewArrivalsSpotlight />

      {/* 4. Curated Lookbook Split Magazine Edit */}
      <CuratedLookbookSection />

      {/* 5. Trending Products & Best Sellers Interactive Switcher */}
      <TrendingSection />

      {/* 6. Multi-Vendor Marketplace: Verified Independent Ateliers */}
      <ArtisanStudiosShowcase />

      {/* 7. Special Campaign: Direct From The Loom (0% Middlemen Markup) */}
      <EditorialCampaignBanner />

      {/* 8. Full Marketplace Interactive Catalog Exploration & Faceted Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-200 pb-4 gap-2">
          <div>
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block mb-1 font-semibold">
              COMPLETE COLLECTION
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-serif">
              Explore All Studio Pieces
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Faceted search across handlooms, acoustic laboratories, and bronze foundries.
          </p>
        </div>

        {/* Filter Bar */}
        <StorefrontFilterBar />

        {/* High-Resolution Dynamic Product Grid */}
        <ProductGridSaaS />
      </section>

      {/* 9. Brand Heritage, Craft Lineage & Escrow Security Pillars */}
      <BrandStorySection />

      {/* 10. The Nexu Salon: Newsletter & Drop Notifications */}
      <NewsletterSection />
    </div>
  );
}

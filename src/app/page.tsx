import React from "react";
import { HeroSection } from "@/components/storefront/HeroSection";
import { FeaturedCategories } from "@/components/storefront/FeaturedCategories";
import { TrendingSection } from "@/components/storefront/TrendingSection";
import { ArtisanSpotlight } from "@/components/storefront/ArtisanSpotlight";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { TrustHighlights } from "@/components/storefront/TrustHighlights";
import { NewsletterSection } from "@/components/storefront/NewsletterSection";

export default function StorefrontHomePage() {
  return (
    <div className="space-y-4">
      {/* 1. Hero Section: Editorial typography & featured studio drop */}
      <HeroSection />

      {/* 2. Taxonomy & Curated Collections */}
      <FeaturedCategories />

      {/* 3. Trending Pieces & New Studio Releases */}
      <TrendingSection />

      {/* 4. Independent Maker & Studio Spotlight */}
      <ArtisanSpotlight />

      {/* Patron Discovery History */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RecentlyViewed limit={4} />
      </div>

      {/* 5. Trust, Escrow & Delivery Highlights */}
      <TrustHighlights />

      {/* 6. Studio Dispatch Newsletter Subscription */}
      <NewsletterSection />
    </div>
  );
}

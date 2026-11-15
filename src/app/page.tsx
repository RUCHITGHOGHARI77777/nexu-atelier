"use client";

import React from "react";
import { EditorialHeroSection } from "@/components/storefront/EditorialHeroSection";
import { MarketplacePortalsGuideSection } from "@/components/storefront/MarketplacePortalsGuideSection";
import { TrustHighlights } from "@/components/storefront/TrustHighlights";
import { DepartmentQuickJumpBar } from "@/components/storefront/DepartmentQuickJumpBar";
import { FestiveGrandShowcase } from "@/components/storefront/FestiveGrandShowcase";
import { FeaturedCategories } from "@/components/storefront/FeaturedCategories";
import { NewArrivalsSpotlight } from "@/components/storefront/NewArrivalsSpotlight";
import { CategoryCuratedShelves } from "@/components/storefront/CategoryCuratedShelves";
import { AppleStoreShowcase } from "@/components/storefront/AppleStoreShowcase";
import { CuratedLookbookSection } from "@/components/storefront/CuratedLookbookSection";
import { TrendingSection } from "@/components/storefront/TrendingSection";
import { ArtisanStudiosShowcase } from "@/components/storefront/ArtisanStudiosShowcase";
import { EditorialCampaignBanner } from "@/components/storefront/EditorialCampaignBanner";
import { StorefrontFilterBar } from "@/components/storefront/StorefrontFilterBar";
import { ProductGridSaaS } from "@/components/storefront/ProductGridSaaS";
import { BrandStorySection } from "@/components/storefront/BrandStorySection";
import { BecomeSupplierSection } from "@/components/storefront/BecomeSupplierSection";
import { NewsletterSection } from "@/components/storefront/NewsletterSection";

export default function StorefrontHomePage() {
  const [sectionVisibility, setSectionVisibility] = React.useState({
    showCuratedCategories: true,
    showTrending: true,
    showArtisanStudios: true,
  });

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isMounted && data?.settings) {
          setSectionVisibility({
            showCuratedCategories: data.settings.homepage_show_curated_categories !== "false",
            showTrending: data.settings.homepage_show_trending !== "false",
            showArtisanStudios: data.settings.homepage_show_artisan_studios !== "false",
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-4 pb-16">
      <EditorialHeroSection />

      <MarketplacePortalsGuideSection />

      <TrustHighlights />

      <DepartmentQuickJumpBar />

      <FestiveGrandShowcase />

      {sectionVisibility.showCuratedCategories && <FeaturedCategories />}

      <NewArrivalsSpotlight />

      <CategoryCuratedShelves />

      <AppleStoreShowcase />

      <CuratedLookbookSection />

      {sectionVisibility.showTrending && <TrendingSection />}

      {sectionVisibility.showArtisanStudios && <ArtisanStudiosShowcase />}

      <EditorialCampaignBanner />

      <section id="marketplace-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-200 pb-4 gap-2">
          <div>
            <span className="text-xs font-semibold text-zinc-500 block mb-1 font-sans">
              Complete Atelier Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-serif">
              Explore All Studio Pieces
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Faceted search across handlooms, acoustic laboratories, and bronze foundries.
          </p>
        </div>

        <StorefrontFilterBar />

        <ProductGridSaaS initialLimit={8} />
      </section>

      <BecomeSupplierSection />

      <BrandStorySection />

      <NewsletterSection />
    </div>
  );
}

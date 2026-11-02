"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";
import { BentoHeroSection } from "@/components/storefront/BentoHeroSection";
import { StorefrontFilterBar } from "@/components/storefront/StorefrontFilterBar";
import { ProductGridSaaS } from "@/components/storefront/ProductGridSaaS";
import { TrustHighlights } from "@/components/storefront/TrustHighlights";
import { NewsletterSection } from "@/components/storefront/NewsletterSection";
import { SupplierPortalSaaS } from "@/components/supplier/SupplierPortalSaaS";
import { AdminCommandCenterSaaS } from "@/components/admin/AdminCommandCenterSaaS";

export default function StorefrontHomePage() {
  const { activeRole } = useStore();

  // 1. Role-based view switching for seamless instant demo inspection
  if (activeRole === "supplier") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <SupplierPortalSaaS />
      </div>
    );
  }

  if (activeRole === "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <AdminCommandCenterSaaS />
      </div>
    );
  }

  // 2. Default: Customer Storefront
  return (
    <div className="space-y-8 pb-16">
      {/* 1. Promotional Bento Hero Section with Deal of the Day & Live Countdown */}
      <BentoHeroSection />

      {/* 2. Main Storefront Catalog Section with Filters & Interactive Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Interactive Filter & Sort Control Bar */}
        <StorefrontFilterBar />

        {/* High-Converting Product Cards Grid */}
        <ProductGridSaaS />
      </section>

      {/* 3. Enterprise Escrow Trust Strip */}
      <TrustHighlights />

      {/* 4. Studio Dispatch Newsletter */}
      <NewsletterSection />
    </div>
  );
}

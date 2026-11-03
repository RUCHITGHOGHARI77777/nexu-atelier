"use client";

import React, { useState } from "react";
import { BentoHeroSection } from "@/components/storefront/BentoHeroSection";
import { StorefrontFilterBar } from "@/components/storefront/StorefrontFilterBar";
import { ProductGridSaaS } from "@/components/storefront/ProductGridSaaS";
import { TrustHighlights } from "@/components/storefront/TrustHighlights";
import { NewsletterSection } from "@/components/storefront/NewsletterSection";

export default function StorefrontHomePage() {
  return (
    <div className="space-y-10 pb-16">
      {/* 1. Curated Luxury Bento Hero Section with Deal of the Day */}
      <BentoHeroSection />

      {/* 2. Main Storefront Catalog Section with Filters & Interactive Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Category & Attribute Filter Bar */}
        <StorefrontFilterBar />

        {/* High-Resolution Luxury Product Cards Grid */}
        <ProductGridSaaS />
      </section>

      {/* 3. 4-Pillar Customer Trust & Escrow Guarantee Strip */}
      <TrustHighlights />

      {/* 4. Atelier Newsletter & Private Collection Drop Notifications */}
      <NewsletterSection />
    </div>
  );
}

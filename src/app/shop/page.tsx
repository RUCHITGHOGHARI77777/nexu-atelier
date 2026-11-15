"use client";

import React, { Suspense } from "react";
import { CatalogContent, CatalogFallback } from "@/components/catalog/CatalogView";

export default function ShopPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogContent />
    </Suspense>
  );
}

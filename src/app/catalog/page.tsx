"use client";

import React, { Suspense } from "react";
import { CatalogContent, CatalogFallback } from "@/components/catalog/CatalogView";

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogContent />
    </Suspense>
  );
}

"use client";

import React, { useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { SupplierPortalSaaS } from "@/components/supplier/SupplierPortalSaaS";

export default function SellerPage() {
  const { setActiveRole } = useStore();

  useEffect(() => {
    setActiveRole("supplier");
  }, [setActiveRole]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      <SupplierPortalSaaS />
    </div>
  );
}

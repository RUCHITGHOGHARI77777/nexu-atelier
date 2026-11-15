"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { CustomerStorefrontNavbar } from "./CustomerStorefrontNavbar";
import { SellerPortalNavbar } from "./SellerPortalNavbar";
import { AdminPortalNavbar } from "./AdminPortalNavbar";

export function AppNavigation() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <AdminPortalNavbar />;
  }

  if (pathname.startsWith("/seller")) {
    return <SellerPortalNavbar />;
  }

  return <CustomerStorefrontNavbar />;
}


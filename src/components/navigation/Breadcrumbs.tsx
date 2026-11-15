"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Shield, Store } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  customItems?: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
}

const SEGMENT_LABELS: Record<string, string> = {
  shop: "Catalog",
  catalog: "Catalog",
  categories: "All Disciplines",
  category: "Category",
  product: "Product",
  store: "Artisan Studios",
  cart: "Shopping Bag",
  checkout: "Checkout",
  "track-order": "Track Order",
  contact: "Concierge & Support",
  about: "About NEXU",
  accessibility: "Accessibility",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  "return-refund-policy": "Returns & Refunds",
  "shipping-policy": "Shipping Policy",
  account: "Patron Account",
  wishlist: "Wishlist",

  seller: "Seller Hub",
  products: "Products & Catalog",
  orders: "Orders & Shipments",
  inventory: "Inventory Management",
  payouts: "GST & Escrow Payouts",
  apply: "Become a Seller",

  admin: "Global Governance",
  sellers: "Sellers & KYC Verification",
  users: "Patron & User Governance",
  finance: "Platform Finance & Ledgers",
  "audit-logs": "Audit & Security Logs",
  automations: "Background Automations",
  metrics: "Platform Metrics",
};

function formatSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Breadcrumbs({
  customItems,
  className = "",
  showHomeIcon = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  let items: BreadcrumbItem[] = [];

  if (customItems && customItems.length > 0) {
    items = customItems;
  } else {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const isSeller = segments[0] === "seller";
    const isAdmin = segments[0] === "admin";

    let rootLabel = "Home";
    let rootHref = "/";

    if (isSeller) {
      rootLabel = "Seller Hub";
      rootHref = "/seller";
    } else if (isAdmin) {
      rootLabel = "Governance";
      rootHref = "/admin";
    }

    if ((isSeller || isAdmin) && segments.length === 1) {
      items.push({ label: rootLabel });
    } else {
      items.push({ label: rootLabel, href: rootHref });

      const startIdx = isSeller || isAdmin ? 1 : 0;
      let currentHref = isSeller ? "/seller" : isAdmin ? "/admin" : "";

      for (let i = startIdx; i < segments.length; i++) {
        const segment = segments[i];
        currentHref += `/${segment}`;
        const isLast = i === segments.length - 1;

        items.push({
          label: formatSegment(segment),
          href: isLast ? undefined : currentHref,
        });
      }
    }
  }

  const isSeller = pathname.startsWith("/seller");
  const isAdmin = pathname.startsWith("/admin");
  const RootIcon = isSeller ? Store : isAdmin ? Shield : Home;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-xs text-zinc-500 font-mono ${className}`}
    >
      <ol className="flex items-center gap-1.5 flex-wrap list-none p-0 m-0">
        {items.map((item, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="flex items-center gap-1.5 shrink-0">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
              {isLast || !item.href ? (
                <span
                  className="text-zinc-900 font-bold truncate max-w-xs sm:max-w-md"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-zinc-950 transition-colors flex items-center gap-1"
                >
                  {isFirst && showHomeIcon && (
                    <RootIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  )}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

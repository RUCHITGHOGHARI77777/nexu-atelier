"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Boxes,
  Truck,
  IndianRupee,
  Store,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Ban,
  Star,
} from "lucide-react";
import { SellerProfile } from "@/types/seller";
import { Badge } from "@/components/ui/Badge";

interface SellerNavProps {
  seller: SellerProfile | null;
}

export function SellerNav({ seller }: SellerNavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/seller", label: "Studio Dashboard", icon: LayoutDashboard },
    { href: "/seller/products", label: "Catalog & Pieces", icon: Package },
    { href: "/seller/products/new", label: "Create Piece", icon: PlusCircle },
    { href: "/seller/inventory", label: "Stock & Inventory", icon: Boxes },
    { href: "/seller/orders", label: "Order Fulfillment", icon: Truck },
    { href: "/seller/payouts", label: "Payouts & Finance", icon: IndianRupee },
    { href: "/seller/privacy", label: "Privacy & Banking", icon: ShieldCheck },
    { href: "/seller/reputation", label: "Reputation & Reviews", icon: Star },
  ];

  return (
    <aside className="w-full md:w-64 border-r border-zinc-800 bg-[#09090b] flex flex-col shrink-0">
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Artisan Studio Portal
          </span>
          {seller?.status === "APPROVED" && (
            <Badge variant="success" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Verified
            </Badge>
          )}
          {seller?.status === "PENDING" && (
            <Badge variant="warning" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Review
            </Badge>
          )}
          {seller?.status === "REJECTED" && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-rose-400 border-rose-800">
              <Ban className="w-3 h-3 text-rose-400" />
              Rejected
            </Badge>
          )}
        </div>
        <h2 className="text-base font-semibold text-zinc-100 truncate">
          {seller?.name || "Artisan Workshop"}
        </h2>
        <p className="text-xs text-zinc-400 truncate mt-0.5">
          {seller?.originHub || "Artisan Hub"}
        </p>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-medium transition-colors ${
                isActive
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-zinc-100" : "text-zinc-500"}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-zinc-500" />
            Customer Storefront
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
        </Link>
      </div>
    </aside>
  );
}

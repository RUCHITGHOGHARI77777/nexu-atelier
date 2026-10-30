"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Sparkles,
  ShoppingBag,
  Scale,
  TicketPercent,
  Landmark,
  Users,
  ShieldAlert,
  Settings,
  ArrowUpRight,
  ShieldCheck,
  Star,
  Layers,
  Cpu,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Operations Overview", icon: LayoutDashboard },
  { href: "/admin/sellers", label: "Seller Management", icon: Store },
  { href: "/admin/products", label: "Catalog Moderation", icon: Sparkles },
  { href: "/admin/categories", label: "Category Taxonomy", icon: Layers },
  { href: "/admin/reviews", label: "Reviews & Moderation", icon: Star },
  { href: "/admin/orders", label: "Order Operations", icon: ShoppingBag },
  { href: "/admin/disputes", label: "Disputes & Refunds", icon: Scale },
  { href: "/admin/coupons", label: "Coupons & Offers", icon: TicketPercent },
  { href: "/admin/finances", label: "Financial Ledger", icon: Landmark },
  { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/admin/automations", label: "Automations & Outbox", icon: Cpu },
  { href: "/admin/users", label: "User Accounts", icon: Users },
  { href: "/admin/audit-logs", label: "Security Audit Trail", icon: ShieldAlert },
  { href: "/admin/settings", label: "Platform Policies", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950/70 p-5 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Brand / Admin Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
              Nexu Console
            </span>
            <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-300 font-mono">
              Super Admin
            </Badge>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            Platform governance & governance workspace
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {ADMIN_NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-colors ${
                  isActive
                    ? "bg-zinc-100 text-zinc-950 font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-zinc-950" : "text-zinc-500"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Cross-Portal Jump Links */}
      <div className="pt-4 border-t border-zinc-800/80 space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block px-1">
          Workspace Bridges
        </span>
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 rounded transition-colors"
        >
          <span>Live Storefront</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
        </Link>
        <Link
          href="/seller"
          target="_blank"
          className="flex items-center justify-between px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 rounded transition-colors"
        >
          <span>Seller Studio</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
        </Link>
      </div>
    </aside>
  );
}

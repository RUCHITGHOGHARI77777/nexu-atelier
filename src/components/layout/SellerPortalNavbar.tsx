"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  Package,
  Layers,
  BarChart3,
  IndianRupee,
  ExternalLink,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  ChevronDown,
  ArrowLeft,
  Boxes,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { FirebaseAuthModal } from "@/components/auth/FirebaseAuthModal";

export function SellerPortalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const { showToast } = useStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const activeStoreName = authUser?.name?.includes("Solstice")
    ? "Solstice Handloom Textiles"
    : "Solstice Handloom Textiles"; // Default verified studio

  const navLinks = [
    { label: "Dashboard", href: "/seller", icon: BarChart3, exact: true },
    { label: "Orders & Shipping", href: "/seller/orders", icon: Package },
    { label: "Catalog & Products", href: "/seller/products", icon: Layers },
    { label: "Inventory", href: "/seller/inventory", icon: Boxes },
    { label: "GST & Payouts", href: "/seller/payouts", icon: IndianRupee },
  ];

  const handleSignOut = async () => {
    await logout();
    showToast("Seller signed out securely.", "info");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white text-[#171717] border-b border-[#E8E8E4] shadow-xs">
      {/* Top Seller Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Seller Brand & Title */}
          <div className="flex items-center gap-4">
            <Link href="/seller" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-white transition-colors">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#171717]">
                    NEXU SELLER HUB
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#EAF6F0] border border-[#21866F]/30 text-[#21866F]">
                    Merchant Portal
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                  <span>Store: <strong className="text-[#171717]">{activeStoreName}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>0% Commission Verified</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Action Links */}
          <div className="flex items-center gap-3">
            {/* View Live Storefront */}
            <Link
              href="/store/jaipur-heritage-handlooms"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] hover:bg-white text-[#171717] text-xs font-semibold transition-colors"
              title="Open Public Brand Storefront"
            >
              <span>View Live Store</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* Return to Customer Shopping */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] hover:bg-white text-[#171717] text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Customer Storefront</span>
            </Link>

            {/* Seller Account / Sign Out */}
            {authUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-900/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Seller Login
              </button>
            )}
          </div>
        </div>

        {/* Secondary Sub-Navigation Tabs */}
        <nav className="flex items-center gap-1 pt-3 mt-1 border-t border-[#E8E8E4] overflow-x-auto scrollbar-none">
          {navLinks.map((tab) => {
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? "bg-[#FAFAF8] text-[#171717] font-bold border-b-2 border-[#21866F]"
                    : "text-[#767676] hover:text-[#171717] hover:bg-[#FAFAF8]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}


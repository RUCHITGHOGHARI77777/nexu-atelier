"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Building2,
  Lock,
  Layers,
  Sparkles,
  ChevronDown,
  X,
  Store,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import { useStore, RoleType } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";

export function NavbarSaaS() {
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    activeRole,
    setActiveRole,
    wishlist,
    cartTotalCount,
    cartSubtotal,
    setIsCartDrawerOpen,
    showToast,
  } = useStore();

  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const categories = [
    "All",
    "Electronics",
    "Fashion & Apparel",
    "Home & Kitchen",
    "B2B Wholesale Packs",
  ];

  const handleRoleChange = (role: RoleType) => {
    setActiveRole(role);
    if (role === "supplier") {
      showToast("Switched to Supplier / Vendor Portal Hub", "info");
    } else if (role === "admin") {
      showToast("Switched to Admin Command Center", "info");
    } else {
      showToast("Switched to Customer Storefront", "success");
    }
    // Stay on or navigate to home page where role-based view is rendered instantly
    if (window.location.pathname !== "/") {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
      {/* Top Thin Micro-Utility Strip */}
      <div className="hidden lg:block border-b border-slate-100 bg-slate-50/60 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] font-medium text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Vendor Architectural SaaS Engine</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>256-Bit Escrow Hold System</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold">Pan-India Express Free Dispatch &gt; ₹2,500</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>GSTIN: 27AABCN8942Q1Z9</span>
            <span className="text-slate-300">•</span>
            <Link href="/account" className="hover:text-slate-900 transition-colors">
              Patron Account Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* 1. Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-102 transition-transform">
              N
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-950 tracking-tight">
                  NEXU ATELIER
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Enterprise
                </span>
              </div>
              <span className="text-[10px] text-slate-500 tracking-wider block font-mono">
                Bespoke Multi-Vendor Marketplace
              </span>
            </div>
          </Link>

          {/* 2. Live Working Search Bar + Category Dropdown */}
          <div className="hidden md:flex flex-1 max-w-xl items-center relative">
            <div className="w-full flex items-center rounded-xl border border-slate-200/90 bg-white/80 shadow-xs focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-slate-900 transition-all overflow-hidden">
              {/* Category selector button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50/80 hover:bg-slate-100 border-r border-slate-200 flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span className="max-w-[110px] truncate">{selectedCategory}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isCategoryMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 text-xs">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoryMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 transition-colors ${
                          selectedCategory === cat
                            ? "bg-slate-900 text-white font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input field */}
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-slate-400 ml-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pieces, makers, electronics, apparel, wholesale..."
                  className="w-full px-3 py-2 text-xs bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1.5 text-slate-400 hover:text-slate-700 mr-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. ROLE SWITCHER PILL (Segmented Control for Showcase Evaluation) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-semibold shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => handleRoleChange("customer")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRole === "customer"
                  ? "bg-white text-slate-950 shadow-xs font-bold ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🛍️</span>
              <span className="hidden sm:inline">Storefront</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("supplier")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRole === "supplier"
                  ? "bg-white text-slate-950 shadow-xs font-bold ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📦</span>
              <span className="hidden sm:inline">Supplier</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRole === "admin"
                  ? "bg-white text-slate-950 shadow-xs font-bold ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🛡️</span>
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>

          {/* 4. Wishlist & Cart Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Wishlist Heart */}
            <Link
              href="/wishlist"
              className="relative p-2.5 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-white text-slate-700 hover:text-slate-950 transition-colors shadow-2xs"
              title="Saved Collection"
            >
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              {cartTotalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] font-extrabold">
                  {cartTotalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-2.5 md:hidden">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white/90 shadow-2xs px-3 py-2 text-xs">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pieces, makers, categories..."
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


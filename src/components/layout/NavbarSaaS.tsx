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
  Star,
  Check,
  Globe,
} from "lucide-react";
import { useStore, RoleType } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";
import { REGIONS } from "@/lib/currency";
import { FirebaseAuthModal } from "@/components/auth/FirebaseAuthModal";
import { useAuth } from "@/context/AuthContext";

export function NavbarSaaS() {
  const router = useRouter();
  const { user: authUser } = useAuth();
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
    whiteLabelConfig,
    activeRegion,
    setActiveRegion,
    formatPrice,
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = useStore();

  const displayUser = authUser
    ? {
        displayName: authUser.name,
        role: authUser.role,
      }
    : currentUser;

  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);

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
    if (window.location.pathname !== "/") {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
      <div className="hidden lg:block border-b border-slate-100 bg-slate-50/60 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] font-medium text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Multi-Region Commerce: <strong className="text-slate-950 font-bold">{activeRegion.flag} {activeRegion.name} ({activeRegion.currency})</strong></span>
            </span>
            <span className="text-slate-300">•</span>
            <span>Tax Standard: <strong className="text-slate-800 font-semibold">{activeRegion.taxName}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold">
              Express Free Delivery &gt; {formatPrice(activeRegion.shippingThresholdINR)}
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors font-mono cursor-pointer"
              title="Firebase Auth & Identity Engine (Click to Switch Identity)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">🟢 Cloud Sync Active (Real-Time Ledger)</span>
            </button>
            <span className="text-slate-300">•</span>
            <span>{activeRegion.taxIdLabel}: <strong className="text-slate-800">{activeRegion.taxIdDefault}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-indigo-700 font-semibold">Gateway: {activeRegion.paymentGatewayName}</span>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="hover:text-slate-900 transition-colors font-semibold cursor-pointer"
            >
              {displayUser ? `👤 ${displayUser.displayName.split(" ")[0]} (${displayUser.role})` : "Sign In"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-102 transition-transform ${
              whiteLabelConfig.accentColor === "emerald"
                ? "bg-emerald-600 text-white"
                : whiteLabelConfig.accentColor === "amber"
                ? "bg-amber-600 text-white"
                : whiteLabelConfig.accentColor === "slate"
                ? "bg-slate-900 text-white"
                : "bg-blue-600 text-white"
            }`}>
              {whiteLabelConfig.brandName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-950 tracking-tight">
                  {whiteLabelConfig.brandName}
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Enterprise
                </span>
              </div>
              <span className="text-[10px] text-slate-500 tracking-wider block font-mono">
                {whiteLabelConfig.brandSubtitle}
              </span>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl items-center relative">
            <div className="w-full flex items-center rounded-xl border border-slate-200/90 bg-white/80 shadow-xs focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-slate-900 transition-all overflow-hidden">
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
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <span>🛡️</span>
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>

          <Link
            href="/store/jaipur-heritage-handlooms"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs shrink-0"
            title="View 0% Commission Seller Store Example"
          >
            <span>0% Comm Store 🚀</span>
          </Link>

          <Link
            href="/reviews"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-2xs shrink-0"
            title="Verified Reviews & 9.9/10 Trust Wall"
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Trust Wall (9.9/10)</span>
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRegionMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white/80 hover:bg-white text-slate-800 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
              title="Switch Country, Currency & Tax Engine"
            >
              <span className="text-sm leading-none">{activeRegion.flag}</span>
              <span className="font-mono">{activeRegion.currency}</span>
              <span className="text-[10px] text-slate-400 font-mono">({activeRegion.symbol.trim()})</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isRegionMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 ring-1 ring-slate-900/10 shadow-[0_15px_40px_rgba(15,23,42,0.12)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Select Region & Tax Standard
                  </span>
                  <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                    Live Real-Time
                  </span>
                </div>

                <div className="space-y-1">
                  {Object.values(REGIONS).map((reg) => {
                    const isSelected = activeRegion.code === reg.code;
                    return (
                      <button
                        key={reg.code}
                        type="button"
                        onClick={() => {
                          setActiveRegion(reg.code);
                          setIsRegionMenuOpen(false);
                          showToast(
                            `Switched to ${reg.name} (${reg.currency}). Tax: ${reg.taxShort} applied!`,
                            "success"
                          );
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-sm"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">{reg.flag}</span>
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>{reg.name}</span>
                              <span
                                className={`text-[10px] font-mono px-1 rounded ${
                                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {reg.currency} ({reg.symbol.trim()})
                              </span>
                            </div>
                            <span
                              className={`text-[10px] block font-mono ${
                                isSelected ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              {reg.taxShort} • {reg.paymentGatewayName.split("/")[0].trim()}
                            </span>
                          </div>
                        </div>

                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-white text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Firebase Auth Profile & Role Switcher"
            >
              <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                {displayUser ? displayUser.displayName.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="hidden lg:inline truncate max-w-[100px]">
                {displayUser ? displayUser.displayName.split(" ")[0] : "Sign In"}
              </span>
              <span className="text-[9px] font-mono text-slate-800 uppercase bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                {displayUser ? displayUser.role : "Guest"}
              </span>
            </button>

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

            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              {cartTotalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#F8F2E6] text-[#B78B45] border border-[#B78B45]/30 font-mono text-[10px] font-bold">
                  {cartTotalCount}
                </span>
              )}
            </button>
          </div>
        </div>

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

      <FirebaseAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}


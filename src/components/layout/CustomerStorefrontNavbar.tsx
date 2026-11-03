"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  ChevronDown,
  X,
  User,
  LogOut,
  Package,
  MapPin,
  Shield,
  HelpCircle,
  Store,
  Menu,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { REGIONS } from "@/lib/currency";
import { FirebaseAuthModal } from "@/components/auth/FirebaseAuthModal";

export function CustomerStorefrontNavbar() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    wishlist,
    cartTotalCount,
    setIsCartDrawerOpen,
    activeRegion,
    setActiveRegion,
    formatPrice,
    showToast,
  } = useStore();

  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const categories = [
    { label: "All Collections", value: "All" },
    { label: "Fashion & Silks", value: "Fashion & Apparel" },
    { label: "Audio & Acoustics", value: "Electronics" },
    { label: "Home & Ceramics", value: "Home & Kitchen" },
    { label: "B2B Wholesale", value: "B2B Wholesale Packs" },
  ];

  const handleCategorySelect = (catValue: string) => {
    setSelectedCategory(catValue);
    if (catValue === "All") {
      router.push("/shop");
    } else if (window.location.pathname !== "/") {
      router.push("/shop?category=" + encodeURIComponent(catValue));
    }
  };

  const handleSignOut = async () => {
    await logout();
    setIsUserMenuOpen(false);
    showToast("Signed out securely.", "info");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-2xl border-b border-slate-200/90 shadow-[0_2px_15px_rgba(0,0,0,0.03)] transition-all">
      {/* 1. Top Announcement & Utility Strip */}
      <div className="border-b border-slate-100 bg-slate-50/80 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] font-medium text-slate-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-900 font-semibold">
              Complimentary Express Delivery
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              Orders over {formatPrice(activeRegion.shippingThresholdINR)}
            </span>
          </div>

          <div className="flex items-center gap-5 text-slate-600">
            {/* Currency / Region Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRegionMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 hover:text-slate-950 transition-colors font-mono cursor-pointer"
              >
                <span>{activeRegion.flag}</span>
                <span className="font-semibold">{activeRegion.currency}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isRegionMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Select Currency & Country
                  </div>
                  <div className="space-y-1 mt-1">
                    {Object.values(REGIONS).map((reg) => (
                      <button
                        key={reg.code}
                        type="button"
                        onClick={() => {
                          setActiveRegion(reg.code);
                          setIsRegionMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          activeRegion.code === reg.code
                            ? "bg-slate-900 text-white font-bold"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{reg.flag}</span>
                          <span>{reg.name}</span>
                        </span>
                        <span className="font-mono text-[10px] opacity-80">{reg.currency}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-300">•</span>

            {/* Link to Seller Hub */}
            <Link
              href="/seller"
              className="hover:text-slate-950 transition-colors flex items-center gap-1 font-medium text-slate-700"
            >
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Seller Hub</span>
            </Link>

            <span className="text-slate-300">•</span>

            {/* Help / Contact */}
            <Link
              href="/account/tickets"
              className="hover:text-slate-950 transition-colors text-slate-600 hidden sm:inline"
            >
              Support
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Storefront Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-sm tracking-widest shadow-xs">
                N
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg text-slate-950 tracking-tight leading-none">
                  NEXU ATELIER
                </span>
                <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400 mt-0.5">
                  Artisan Marketplace
                </span>
              </div>
            </Link>

            {/* Primary Category Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === cat.value
                      ? "text-slate-950 bg-slate-100 font-bold"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Search Bar (Center / Desktop) */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search luxury silks, acoustic audio, homeware..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Customer Actions: Account, Wishlist, Bag */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Account Menu / Sign In Trigger */}
            <div className="relative">
              {authUser ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-800 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {authUser.name ? authUser.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="truncate max-w-[100px] hidden sm:inline">
                      {authUser.name ? authUser.name.split(" ")[0] : "Account"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{authUser.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{authUser.email}</div>
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>My Orders & Tracking</span>
                        </Link>

                        <Link
                          href="/account/addresses"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>Saved Addresses</span>
                        </Link>

                        <Link
                          href="/account/privacy"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-slate-400" />
                          <span>Privacy & Data Sovereignty</span>
                        </Link>

                        {/* If user is seller or admin, show dedicated link */}
                        {authUser.role === "seller" && (
                          <Link
                            href="/seller"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-indigo-700 bg-indigo-50/60 font-semibold hover:bg-indigo-50 transition-colors"
                          >
                            <Store className="w-4 h-4 text-indigo-600" />
                            <span>Switch to Seller Portal</span>
                          </Link>
                        )}

                        {authUser.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-900 bg-slate-100 font-bold hover:bg-slate-200 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-slate-900" />
                            <span>Super Admin Center</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 mt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-700 hover:bg-rose-50 transition-colors font-medium cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-800 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-600" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              className="relative p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-colors shadow-2xs"
              title="Saved Collection"
            >
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-900 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Shopping Bag Trigger */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              {cartTotalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-slate-950 font-mono text-[10px] font-black">
                  {cartTotalCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pt-3 pb-2 border-t border-slate-100 mt-3 space-y-3">
            {/* Search Input for Mobile */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collection..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    handleCategorySelect(cat.value);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedCategory === cat.value
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Global Auth Modal */}
      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}

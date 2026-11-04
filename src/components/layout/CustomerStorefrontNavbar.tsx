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
  Sparkles,
  RotateCcw,
  Bell,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { REGIONS } from "@/lib/currency";
import { FirebaseAuthModal } from "@/components/auth/FirebaseAuthModal";
import { StorefrontMegaMenu } from "./StorefrontMegaMenu";

export function CustomerStorefrontNavbar() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const { totals: cartTotals, openCartDrawer } = useCart();
  const { wishlistCount } = useWishlist();
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

  const totalBagCount = cartTotals?.itemCount > 0 ? cartTotals.itemCount : cartTotalCount;
  const totalWishlistCount = wishlistCount > 0 ? wishlistCount : (wishlist?.length || 0);

  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<"collections" | "guilds" | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const leaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterMenu = (menu: "collections" | "guilds") => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setActiveMegaMenu(menu);
  };

  const handleToggleMenu = (menu: "collections" | "guilds") => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setActiveMegaMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMouseLeaveHeader = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 250);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMegaMenu(null);
        setIsUserMenuOpen(false);
        setIsRegionMenuOpen(false);
        setIsMobileMenuOpen(false);
        setIsSearchFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const popularSearches = [
    "Chanderi Silk",
    "Bandhej Saree",
    "SoundPulse Earbuds",
    "Brass Urli",
    "Leather Derby",
  ];

  const handleCategorySelect = (catValue: string) => {
    setSelectedCategory(catValue);
    if (catValue === "All") {
      router.push("/shop");
    } else {
      router.push("/shop?category=" + encodeURIComponent(catValue));
    }
    setActiveMegaMenu(null);
  };

  const handleSignOut = async () => {
    await logout();
    setIsUserMenuOpen(false);
    showToast("Signed out securely.", "info");
  };

  return (
    <header
      className="sticky top-0 z-50 relative w-full bg-white border-b border-zinc-200 shadow-xs transition-all"
      onMouseLeave={handleMouseLeaveHeader}
    >
      {/* 1. Top Announcement & Utility Strip */}
      <div className="border-b border-zinc-100 bg-zinc-50/90 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] font-medium text-zinc-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-zinc-900 font-semibold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500 inline-block" />
              <span>Complimentary Express Air Delivery</span>
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500">
              Orders over {formatPrice(activeRegion.shippingThresholdINR)}
            </span>
            <span className="text-zinc-300 hidden md:inline">•</span>
            <span className="text-zinc-500 hidden md:inline">
              100% Direct From Verified Indian Artisan Studios
            </span>
          </div>

          <div className="flex items-center gap-5 text-zinc-600">
            {/* Currency / Region Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRegionMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 hover:text-zinc-950 transition-colors font-mono cursor-pointer"
                title="Select Currency"
              >
                <span>{activeRegion.flag}</span>
                <span className="font-semibold text-zinc-900">{activeRegion.currency}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {isRegionMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-white border border-zinc-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
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
                            ? "bg-zinc-900 text-white font-bold"
                            : "hover:bg-zinc-100 text-zinc-700"
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

            <span className="text-zinc-300">•</span>

            {/* Customer Order Tracking */}
            <Link
              href="/track-order"
              className="hover:text-zinc-950 transition-colors flex items-center gap-1 font-medium text-zinc-700"
            >
              <Package className="w-3.5 h-3.5 text-zinc-500" />
              <span>Track Order</span>
            </Link>

            <span className="text-zinc-300">•</span>

            {/* Help / Concierge */}
            <Link
              href="/contact"
              className="hover:text-zinc-950 transition-colors text-zinc-600 hidden sm:inline"
            >
              Concierge
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Storefront Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-6">
          {/* Brand Logo & Editorial Wordmark */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] flex items-center justify-center font-bold text-sm tracking-widest shadow-xs">
                N
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg text-zinc-950 tracking-wider leading-none">
                  NEXU ATELIER
                </span>
                <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 mt-0.5">
                  Artisan Marketplace
                </span>
              </div>
            </Link>

            {/* Primary Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              <Link
                href="/shop"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              >
                Catalog
              </Link>

              {/* Collections Trigger (Opens Mega Menu) */}
              <button
                type="button"
                onMouseEnter={() => handleMouseEnterMenu("collections")}
                onClick={() => handleToggleMenu("collections")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  activeMegaMenu === "collections"
                    ? "text-zinc-950 bg-zinc-100 font-bold"
                    : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50"
                }`}
              >
                <span>Collections</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {/* Guilds / Disciplines Trigger (Opens Mega Menu) */}
              <button
                type="button"
                onMouseEnter={() => handleMouseEnterMenu("guilds")}
                onClick={() => handleToggleMenu("guilds")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  activeMegaMenu === "guilds"
                    ? "text-zinc-950 bg-zinc-100 font-bold"
                    : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50"
                }`}
              >
                <span>Guilds</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              <Link
                href="/new-arrivals"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              >
                New Arrivals
              </Link>

              <Link
                href="/best-sellers"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              >
                Best Sellers
              </Link>

              <Link
                href="/store/solstice-loom-studio"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors flex items-center gap-1"
              >
                <Store className="w-3.5 h-3.5 text-zinc-500" />
                <span>Ateliers</span>
              </Link>

              <Link
                href="/about"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              >
                Heritage
              </Link>
            </nav>
          </div>

          {/* Search Bar (Center / Desktop) */}
          <div className="flex-1 max-w-md hidden md:block relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="Search luxury silks, acoustic audio, cast brass..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200 bg-zinc-50/80 hover:bg-white focus:bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Suggestions Dropdown */}
            {isSearchFocused && !searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-zinc-200 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold block mb-2 px-1">
                  Popular Patron Searches
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {popularSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={() => {
                        setSearchQuery(item);
                        router.push(`/shop?q=${encodeURIComponent(item)}`);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-800 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {authUser.name ? authUser.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="truncate max-w-[100px] hidden sm:inline">
                      {authUser.name ? authUser.name.split(" ")[0] : "Account"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-white border border-zinc-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                        <div className="text-xs font-bold text-zinc-900 truncate">{authUser.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono truncate">{authUser.email}</div>
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          href="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors font-medium"
                        >
                          <User className="w-4 h-4 text-zinc-400" />
                          <span>Patron Overview</span>
                        </Link>

                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                        >
                          <Package className="w-4 h-4 text-zinc-400" />
                          <span>My Orders & Tracking</span>
                        </Link>

                        <Link
                          href="/account/addresses"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-zinc-400" />
                          <span>Saved Addresses</span>
                        </Link>

                        <Link
                          href="/account/returns"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 text-zinc-400" />
                          <span>Returns & Exchanges</span>
                        </Link>

                        <Link
                          href="/account/notifications"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                        >
                          <Bell className="w-4 h-4 text-zinc-400" />
                          <span>Notification Center</span>
                        </Link>

                        <Link
                          href="/account/privacy"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-zinc-400" />
                          <span>Security & Privacy</span>
                        </Link>

                        <Link
                          href="/account/tickets"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4 text-zinc-400" />
                          <span>Concierge Tickets</span>
                        </Link>
                      </div>

                      <div className="border-t border-zinc-100 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-medium cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              className="relative p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 transition-colors shadow-2xs"
              title="Saved Collection"
            >
              <Heart className="w-4 h-4" />
              {totalWishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-900 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                  {totalWishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Trigger */}
            <button
              type="button"
              onClick={() => {
                if (openCartDrawer) {
                  openCartDrawer();
                } else {
                  setIsCartDrawerOpen(true);
                }
              }}
              className="relative px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              {totalBagCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#F8F2E6] text-[#B78B45] border border-[#B78B45]/30 font-mono text-[10px] font-black">
                  {totalBagCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-3 border-t border-zinc-100 mt-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search Input for Mobile */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                    setIsMobileMenuOpen(false);
                  }
                }}
                placeholder="Search luxury silks, acoustic audio..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-xs bg-zinc-50"
              />
            </div>

            {/* Mobile Primary Links */}
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <Link
                href="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold"
              >
                All Catalog
              </Link>
              <Link
                href="/collections"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold"
              >
                Lookbooks
              </Link>
              <Link
                href="/new-arrivals"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold"
              >
                New Arrivals
              </Link>
              <Link
                href="/best-sellers"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold"
              >
                Best Sellers
              </Link>
              <Link
                href="/categories"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold"
              >
                Guild Disciplines
              </Link>
              <Link
                href="/store/solstice-loom-studio"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold"
              >
                Artisan Studios
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold flex items-center justify-between"
              >
                <span>Saved Wishlist</span>
                {totalWishlistCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-zinc-900 text-white font-mono text-[10px] font-bold">
                    {totalWishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold flex items-center justify-between"
              >
                <span>Shopping Bag</span>
                {totalBagCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-zinc-900 text-white font-mono text-[10px] font-bold">
                    {totalBagCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold"
              >
                Patron Account
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Desktop Mega Menu */}
      <StorefrontMegaMenu
        isOpen={Boolean(activeMegaMenu)}
        activeMenu={activeMegaMenu}
        onClose={() => setActiveMegaMenu(null)}
        onMouseEnter={() => {
          if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
            leaveTimerRef.current = null;
          }
        }}
      />

      {/* Global Auth Modal */}
      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}

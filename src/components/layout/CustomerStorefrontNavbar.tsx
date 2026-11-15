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
import { PortalSwitcherPill } from "@/components/navigation/PortalSwitcherPill";

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
      <div className="border-b border-[#E7E7E7] bg-[#F7F7F7] py-2 px-4 sm:px-6 lg:px-8 text-xs text-[#666666]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#111111] font-medium">
              Complimentary Express Delivery
            </span>
            <span className="text-[#CCCCCC]">•</span>
            <span>
              Orders over {formatPrice(activeRegion.shippingThresholdINR)}
            </span>
            <span className="text-[#CCCCCC] hidden md:inline">•</span>
            <span className="hidden md:inline">
              Verified Independent Indian Studios
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <PortalSwitcherPill currentPortal="customer" />

            <span className="text-[#CCCCCC]">•</span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRegionMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 hover:text-[#111111] transition-colors font-mono cursor-pointer"
                title="Select Currency"
              >
                <span>{activeRegion.flag}</span>
                <span className="font-semibold text-[#111111]">{activeRegion.currency}</span>
                <ChevronDown className="w-3 h-3 text-[#888888]" />
              </button>

              {isRegionMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-white border border-[#E7E7E7] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] border-b border-[#E7E7E7]">
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
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          activeRegion.code === reg.code
                            ? "bg-[#111111] text-white font-medium"
                            : "hover:bg-[#F7F7F7] text-[#111111]"
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

            <span className="text-[#CCCCCC]">•</span>

            <Link
              href="/track-order"
              className="hover:text-[#111111] transition-colors flex items-center gap-1 font-medium text-[#666666]"
            >
              <Package className="w-3.5 h-3.5 text-[#888888]" />
              <span>Track Order</span>
            </Link>

            <span className="text-[#CCCCCC]">•</span>

            <Link
              href="/seller/apply"
              className="text-[#111111] hover:underline font-medium transition-colors"
            >
              Become a Seller
            </Link>

            <span className="text-[#CCCCCC] hidden lg:inline">•</span>

            <Link
              href="/seller"
              className="hover:text-[#111111] transition-colors text-[#666666] hidden lg:inline"
            >
              Supplier Portal
            </Link>

            <span className="text-[#CCCCCC]">•</span>

            <Link
              href="/contact"
              className="hover:text-[#111111] transition-colors text-[#666666] hidden sm:inline"
            >
              Concierge
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
                N
              </div>
              <span className="font-bold text-base sm:text-lg text-[#111111] tracking-wider leading-none">
                NEXU ATELIER
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 ml-4">
              <Link
                href="/shop"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors"
              >
                Catalog
              </Link>

              <button
                type="button"
                onMouseEnter={() => handleMouseEnterMenu("collections")}
                onClick={() => handleToggleMenu("collections")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  activeMegaMenu === "collections"
                    ? "text-[#111111] bg-[#F7F7F7] font-semibold"
                    : "text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7]"
                }`}
              >
                <span>Collections</span>
                <ChevronDown className="w-3 h-3 text-[#888888]" />
              </button>

              <Link
                href="/new-arrivals"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors"
              >
                New Arrivals
              </Link>

              <Link
                href="/store/solstice-loom-studio"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors"
              >
                Brands
              </Link>

              <Link
                href="/categories"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors"
              >
                Categories
              </Link>
            </nav>
          </div>

          <div className="flex-1 max-w-md hidden md:block relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#888888] absolute left-3 pointer-events-none" />
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
                placeholder="Search textiles, audio, sculptural homeware..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#E7E7E7] bg-[#F7F7F7] hover:bg-white focus:bg-white text-xs text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-[#111111] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 p-1 text-[#888888] hover:text-[#111111]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isSearchFocused && !searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#E7E7E7] shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#888888] font-semibold block mb-2 px-1">
                  Popular Searches
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
                      className="px-2.5 py-1 rounded-md text-xs bg-[#F7F7F7] hover:bg-[#111111] hover:text-white text-[#111111] transition-colors border border-[#E7E7E7]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              {authUser ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E7E7E7] hover:border-[#CCCCCC] bg-white text-[#111111] text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-[10px]">
                      {authUser.name ? authUser.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="truncate max-w-[100px] hidden sm:inline">
                      {authUser.name ? authUser.name.split(" ")[0] : "Account"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#888888]" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-white border border-[#E7E7E7] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-[#E7E7E7] mb-1">
                        <div className="text-xs font-bold text-[#111111] truncate">{authUser.name}</div>
                        <div className="text-[10px] text-[#666666] font-mono truncate">{authUser.email}</div>
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          href="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#111111] hover:bg-[#F7F7F7] transition-colors font-medium"
                        >
                          <User className="w-4 h-4 text-[#888888]" />
                          <span>Account Overview</span>
                        </Link>

                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#111111] hover:bg-[#F7F7F7] transition-colors"
                        >
                          <Package className="w-4 h-4 text-[#888888]" />
                          <span>My Orders & Tracking</span>
                        </Link>

                        <Link
                          href="/account/addresses"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#111111] hover:bg-[#F7F7F7] transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-[#888888]" />
                          <span>Saved Addresses</span>
                        </Link>

                        <Link
                          href="/account/returns"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#111111] hover:bg-[#F7F7F7] transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 text-[#888888]" />
                          <span>Returns & Exchanges</span>
                        </Link>

                        <Link
                          href="/account/privacy"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#111111] hover:bg-[#F7F7F7] transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#888888]" />
                          <span>Security & Privacy</span>
                        </Link>
                      </div>

                      <div className="border-t border-[#E7E7E7] mt-1 pt-1 space-y-0.5">
                        <Link
                          href="/seller"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#111111] hover:bg-[#F7F7F7] transition-colors font-medium"
                        >
                          <Store className="w-4 h-4 text-[#888888]" />
                          <span>Supplier Portal</span>
                        </Link>
                        <Link
                          href="/seller/apply"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#111111] hover:bg-[#F7F7F7] transition-colors font-medium"
                        >
                          <User className="w-4 h-4 text-[#888888]" />
                          <span>Become a Verified Seller</span>
                        </Link>
                      </div>

                      <div className="border-t border-[#E7E7E7] mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-medium cursor-pointer"
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E7E7E7] hover:border-[#CCCCCC] bg-white hover:bg-[#F7F7F7] text-[#111111] text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#888888]" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            <Link
              href="/wishlist"
              className="relative p-2.5 rounded-lg border border-[#E7E7E7] bg-white hover:bg-[#F7F7F7] text-[#111111] transition-colors shadow-2xs"
              title="Saved Wishlist"
            >
              <Heart className="w-4 h-4" />
              {totalWishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#111111] text-white font-mono text-[9px] font-bold flex items-center justify-center">
                  {totalWishlistCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => {
                if (openCartDrawer) {
                  openCartDrawer();
                } else {
                  setIsCartDrawerOpen(true);
                }
              }}
              className="relative px-4 py-2.5 rounded-lg bg-[#111111] hover:bg-[#222222] text-white text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              {totalBagCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-[#111111] font-mono text-[10px] font-bold">
                  {totalBagCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-lg border border-[#E7E7E7] text-[#111111] hover:bg-[#F7F7F7] transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-3 border-t border-zinc-100 mt-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
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

            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <Link
                href="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] font-medium"
              >
                All Catalog
              </Link>
              <Link
                href="/collections"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] font-medium"
              >
                Collections
              </Link>
              <Link
                href="/new-arrivals"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] font-medium"
              >
                New Arrivals
              </Link>
              <Link
                href="/best-sellers"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] font-medium"
              >
                Best Sellers
              </Link>
              <Link
                href="/categories"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] font-medium"
              >
                Categories
              </Link>
              <Link
                href="/store/solstice-loom-studio"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] font-medium"
              >
                Featured Brands
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] font-medium flex items-center justify-between"
              >
                <span>Saved Wishlist</span>
                {totalWishlistCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#111111] text-white font-mono text-[10px] font-bold">
                    {totalWishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] font-medium flex items-center justify-between"
              >
                <span>Shopping Bag</span>
                {totalBagCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#111111] text-white font-mono text-[10px] font-bold">
                    {totalBagCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] font-medium col-span-2"
              >
                Account Overview
              </Link>
            </div>

            <div className="pt-2 border-t border-[#E7E7E7] flex flex-col gap-1.5">
              <Link
                href="/seller/apply"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#F7F7F7] border border-[#E7E7E7] text-[#111111] font-medium text-xs flex items-center justify-between"
              >
                <span>Become a Verified Seller</span>
                <span className="text-[10px] font-mono font-bold bg-[#111111] text-white px-2 py-0.5 rounded">Join</span>
              </Link>
              <Link
                href="/seller"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-white border border-[#E7E7E7] text-[#111111] font-medium text-xs flex items-center gap-2"
              >
                <Store className="w-3.5 h-3.5 text-[#888888]" />
                <span>Supplier Portal Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </div>

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

      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}

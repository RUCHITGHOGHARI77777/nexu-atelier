"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  ArrowRight,
  User,
  Package,
  MapPin,
  LogOut,
  ChevronDown,
  Globe,
  Truck,
  Sparkles,
  Layers,
  Bell,
  RotateCcw,
  LifeBuoy,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Product } from "@/types/marketplace";
import { CurrencyCode, SUPPORTED_CURRENCIES } from "@/types/international";

interface NavCategory {
  id: string;
  slug: string;
  name: string;
  _count?: { products: number };
}

export const Header: React.FC = () => {
  const router = useRouter();
  const { totals, openCartDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const { currency, setCurrency, activeMarket, setMarket, formatPrice, availableMarkets } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread notifications count for authenticated customer
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }
    fetch("/api/customer/notifications?unread=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.unreadCount === "number") {
          setUnreadNotifications(data.unreadCount);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  // Fetch real database categories for navigation
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  // Live search suggestion filter querying real database
  useEffect(() => {
    const q = searchQuery.trim();
    setSelectedSuggestionIndex(-1);
    if (!q) {
      setSearchResults([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.products)) {
            setSearchResults(data.products);
          }
        }
      } catch {
        // graceful silence
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(target)
      ) {
        setIsAccountMenuOpen(false);
      }
      if (
        currencyMenuRef.current &&
        !currencyMenuRef.current.contains(target)
      ) {
        setIsCurrencyMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectSuggestion = (slug: string) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSelectedSuggestionIndex(-1);
    router.push(`/product/${slug}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchResults.length === 0) {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setSelectedSuggestionIndex(-1);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === "Enter") {
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchResults.length) {
        e.preventDefault();
        handleSelectSuggestion(searchResults[selectedSuggestionIndex].slug);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsSearchOpen(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleLogout = async () => {
    setIsAccountMenuOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200 transition-all shadow-xs text-zinc-900">
      {/* Top Utility Banner: Market & Direct Track links */}
      <div className="hidden sm:block border-b border-zinc-100 bg-zinc-50/70 text-[11px] text-zinc-500 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono text-zinc-700 font-medium">
              VERIFIED ATELIER DIRECT COLLECTIVE
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500">100% Escrow Protection</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/track-order"
              className="hover:text-zinc-950 transition-colors flex items-center gap-1.5 text-zinc-600 font-medium"
            >
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              <span>Track Consignment</span>
            </Link>

            <span className="text-zinc-300">•</span>

            {/* Currency & Region Selector */}
            <div className="relative" ref={currencyMenuRef}>
              <button
                onClick={() => setIsCurrencyMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 font-mono text-zinc-700 hover:text-zinc-950 font-semibold cursor-pointer"
                aria-label="Select currency and region"
              >
                <span>{activeMarket.flagEmoji}</span>
                <span>{currency}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {isCurrencyMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 font-mono text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                    Select Market
                  </div>
                  {availableMarkets.map((m) => (
                    <button
                      key={m.code}
                      onClick={() => {
                        setMarket(m.code);
                        setIsCurrencyMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer ${
                        activeMarket.code === m.code ? "bg-amber-50/60 font-semibold text-zinc-950" : "text-zinc-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{m.flagEmoji}</span>
                        <span>{m.name}</span>
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {m.defaultCurrency}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4 py-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-zinc-700 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold tracking-tighter text-sm">
              NX
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-zinc-950 group-hover:text-amber-700 transition-colors">
                NEXU ATELIER
              </span>
              <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-500">
                ARTISAN COLLECTIVE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-zinc-600">
            <Link
              href="/catalog"
              className="hover:text-zinc-950 transition-colors py-1"
            >
              All Pieces
            </Link>
            <Link
              href="/categories"
              className="hover:text-zinc-950 transition-colors py-1"
            >
              Disciplines
            </Link>
            <Link
              href="/collections"
              className="hover:text-zinc-950 transition-colors py-1"
            >
              Collections
            </Link>
            {categories.slice(0, 3).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="hover:text-zinc-950 transition-colors py-1"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Functional Search Bar */}
          <div className="flex-1 max-w-md mx-2 relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search pieces, makers, materials..."
                className="w-full bg-zinc-100 text-xs text-zinc-900 placeholder-zinc-500 rounded-lg border border-zinc-200 hover:border-zinc-300 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 pl-9 pr-14 py-2 transition-all"
              />
              <span className="hidden sm:inline-block absolute right-2.5 text-[10px] text-zinc-500 font-mono bg-zinc-200/80 px-1.5 py-0.5 rounded border border-zinc-300/50 pointer-events-none">
                Ctrl+K
              </span>
            </form>

            {/* Live Suggestions Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden z-50 py-1"
              >
                <div className="px-3 py-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-100 bg-zinc-50">
                  Matching Pieces ({searchResults.length})
                </div>
                {searchResults.map((product, idx) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectSuggestion(product.slug)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors group cursor-pointer ${
                      idx === selectedSuggestionIndex
                        ? "bg-amber-50 text-zinc-950 ring-1 ring-amber-500/40"
                        : "hover:bg-zinc-50 text-zinc-800"
                    }`}
                  >
                    <div>
                      <div className="text-zinc-900 group-hover:text-amber-700 font-medium">
                        {product.title}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {product.vendor.name} • {product.category}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-zinc-950 font-bold">
                      {formatPrice(product.basePrice)}
                    </span>
                  </button>
                ))}
                <div className="p-2 border-t border-zinc-100 bg-zinc-50">
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full py-1 text-center text-xs text-zinc-600 hover:text-zinc-950 font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>View all matching results</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Empty Suggestions State */}
            {isSearchOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl p-4 z-50 text-center space-y-2"
              >
                <p className="text-xs text-zinc-600">
                  No catalog pieces matching &ldquo;<span className="text-zinc-950 font-semibold">{searchQuery.trim()}</span>&rdquo;
                </p>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Search full studio catalog</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Customer Account Button / Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              {isAuthenticated && user ? (
                <button
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition-colors text-xs font-medium cursor-pointer"
                  aria-label="Customer account menu"
                >
                  <User className="w-4 h-4 text-zinc-600" />
                  <span className="hidden md:inline max-w-[100px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-zinc-800 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition-colors text-xs font-semibold"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* Account Dropdown */}
              {isAccountMenuOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-2xl py-2 z-50 text-xs text-zinc-800">
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <p className="font-semibold text-zinc-950 truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-500 font-mono truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/account"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-zinc-500" />
                      <span>Account Overview</span>
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                    >
                      <Package className="w-4 h-4 text-zinc-500" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      href="/account/returns"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-zinc-500" />
                      <span>Returns & Replacements</span>
                    </Link>

                    <Link
                      href="/account/tickets"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                    >
                      <LifeBuoy className="w-4 h-4 text-zinc-500" />
                      <span>Support Concierge</span>
                    </Link>

                    <Link
                      href="/account/notifications"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-zinc-500" />
                        <span>Notifications</span>
                      </div>
                      {unreadNotifications > 0 && (
                        <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/account/addresses"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-zinc-500" />
                      <span>Saved Addresses</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-zinc-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Link */}
            {isAuthenticated && (
              <Link
                href="/account/notifications"
                className="relative p-2 text-zinc-700 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors"
                aria-label={`View notifications (${unreadNotifications} unread)`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="relative p-2 text-zinc-700 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors"
              aria-label={`View saved items (${wishlistCount})`}
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Bag / Cart Trigger */}
            <button
              onClick={openCartDrawer}
              className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shadow-sm"
              aria-label={`Shopping bag with ${totals.itemCount} items`}
            >
              <ShoppingBag className="w-4 h-4 text-zinc-200" />
              <span className="hidden sm:inline text-xs font-semibold">Bag</span>
              {totals.itemCount > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-zinc-950 text-[10px] font-mono font-bold rounded-full flex items-center justify-center">
                  {totals.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute top-0 bottom-0 left-0 w-3/4 max-w-xs bg-white border-r border-zinc-200 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                <span className="font-bold text-sm tracking-tight text-zinc-950">
                  NAVIGATION
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-zinc-500 hover:text-zinc-950 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Market / Currency Switcher */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  Market & Currency
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {availableMarkets.map((m) => (
                    <button
                      key={m.code}
                      onClick={() => setMarket(m.code)}
                      className={`px-2 py-1.5 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors ${
                        activeMarket.code === m.code
                          ? "bg-zinc-900 text-white font-bold"
                          : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      <span>{m.flagEmoji} {m.code}</span>
                      <span className="font-mono text-[10px] opacity-80">{m.defaultCurrency}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Account Strip in Mobile */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                {isAuthenticated && user ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-bold text-zinc-950">{user.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-200 text-[11px]">
                      <Link
                        href="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-zinc-700 hover:text-zinc-950 font-medium"
                      >
                        Account
                      </Link>
                      <span>•</span>
                      <Link
                        href="/account/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-zinc-700 hover:text-zinc-950 font-medium"
                      >
                        Orders
                      </Link>
                      <span>•</span>
                      <button
                        onClick={handleLogout}
                        className="text-rose-600 font-medium cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600">Patron Account</span>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-1 rounded bg-zinc-900 text-white font-bold"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>

              <nav className="flex flex-col gap-2.5 text-sm">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-950 font-semibold"
                >
                  Home
                </Link>
                <Link
                  href="/catalog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-700 hover:text-zinc-950 font-medium"
                >
                  All Catalog Pieces
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-700 hover:text-zinc-950 font-medium"
                >
                  All Disciplines
                </Link>
                <Link
                  href="/collections"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-700 hover:text-zinc-950 font-medium"
                >
                  Curated Collections
                </Link>
                <Link
                  href="/track-order"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Consignment</span>
                </Link>

                <div className="pt-2 border-t border-zinc-200">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Disciplines
                  </span>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-1 text-xs text-zinc-600 hover:text-zinc-950 block"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-200 space-y-1">
                  <Link
                    href="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-1 text-xs text-zinc-700 hover:text-zinc-950 font-medium flex items-center justify-between"
                  >
                    <span>Shopping Bag</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {totals.itemCount} items
                    </span>
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-1 text-xs text-zinc-700 hover:text-zinc-950 font-medium flex items-center justify-between"
                  >
                    <span>Saved Pieces</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {wishlistCount} saved
                    </span>
                  </Link>
                </div>
              </nav>
            </div>

            <div className="pt-6 border-t border-zinc-200 text-[11px] text-zinc-500 font-mono">
              Nexu Atelier • Verified Guild Studios
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

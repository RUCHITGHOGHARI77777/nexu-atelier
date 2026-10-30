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
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types/marketplace";

export const Header: React.FC = () => {
  const router = useRouter();
  const { totals, openCartDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

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
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=5`);
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

  // Click outside to close search & account dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
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
    router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4 py-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-zinc-700 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors"
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
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-zinc-600">
            <Link
              href="/catalog"
              className="hover:text-zinc-950 transition-colors py-1"
            >
              All Catalog
            </Link>
            <Link
              href="/catalog?category=Apparel"
              className="hover:text-zinc-950 transition-colors py-1"
            >
              Apparel
            </Link>
            <Link
              href="/catalog?category=Audio%20%26%20Tech"
              className="hover:text-zinc-950 transition-colors py-1"
            >
              Audio & Tech
            </Link>
            <Link
              href="/catalog?category=Footwear"
              className="hover:text-zinc-950 transition-colors py-1"
            >
              Footwear
            </Link>
            <Link
              href="/catalog?category=Objects%20%26%20Living"
              className="hover:text-zinc-950 transition-colors py-1"
            >
              Objects & Living
            </Link>
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
                      ₹{product.basePrice.toLocaleString("en-IN")}
                    </span>
                  </button>
                ))}
                <div className="p-2 border-t border-zinc-100 bg-zinc-50">
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full py-1 text-center text-xs text-zinc-600 hover:text-zinc-950 font-medium flex items-center justify-center gap-1"
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
                  className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
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
                >
                  <X className="w-5 h-5" />
                </button>
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

              <nav className="flex flex-col gap-3 text-sm">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-900 font-semibold"
                >
                  Home
                </Link>
                <Link
                  href="/catalog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-700 hover:text-zinc-950 font-medium"
                >
                  All Catalog
                </Link>
                <Link
                  href="/catalog?category=Apparel"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-600 hover:text-zinc-950"
                >
                  Apparel
                </Link>
                <Link
                  href="/catalog?category=Audio%20%26%20Tech"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-400 hover:text-white"
                >
                  Audio & Tech
                </Link>
                <Link
                  href="/catalog?category=Footwear"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-400 hover:text-white"
                >
                  Footwear
                </Link>
                <Link
                  href="/catalog?category=Objects%20%26%20Living"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-400 hover:text-white"
                >
                  Objects & Living
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-300 hover:text-white font-medium flex items-center justify-between"
                >
                  <span>Shopping Bag</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {totals.itemCount} items
                  </span>
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-zinc-300 hover:text-white font-medium flex items-center justify-between"
                >
                  <span>Saved Wishlist</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {wishlistCount} saved
                  </span>
                </Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-zinc-800 text-[11px] text-zinc-500 font-mono">
              Nexu Atelier • Verified Guild Studios
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

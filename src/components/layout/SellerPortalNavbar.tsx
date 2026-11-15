"use client";

import React, { useState, useEffect } from "react";
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
  Settings,
  Star,
  PlusCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { FirebaseAuthModal } from "@/components/auth/FirebaseAuthModal";
import { PortalSwitcherPill } from "@/components/navigation/PortalSwitcherPill";

export function SellerPortalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const { showToast } = useStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      try {
        const res = await fetch("/api/seller/profile");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSellerProfile(data.seller || null);
        }
      } catch {
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeStoreName = sellerProfile?.name || authUser?.name || "Solstice Handloom Textiles";
  const activeStoreSlug = sellerProfile?.slug || "solstice-loom-studio";
  const commissionRate = sellerProfile?.commissionRatePercent ?? 10;

  const navLinks = [
    { label: "Dashboard", href: "/seller", icon: BarChart3, exact: true },
    { label: "Fulfillment", href: "/seller/orders", icon: Package },
    { label: "Catalog", href: "/seller/products", icon: Layers, exact: true },
    { label: "New Piece", href: "/seller/products/new", icon: PlusCircle },
    { label: "Inventory", href: "/seller/inventory", icon: Boxes },
    { label: "Billing & Invoices", href: "/seller/billing", icon: FileText },
    { label: "Payouts & Ledger", href: "/seller/payouts", icon: IndianRupee },
    { label: "Store & Banking", href: "/seller/privacy", icon: Settings },
    { label: "Reputation", href: "/seller/reputation", icon: Star },
  ];

  const handleSignOut = async () => {
    await logout();
    showToast("Seller signed out securely.", "info");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white text-slate-900 border-b border-slate-200 shadow-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/seller" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-black transition-colors shrink-0">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-950 font-sans">
                    NEXU SELLER HUB
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 border border-emerald-200 text-emerald-800 tracking-wider">
                    Verified Merchant
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-normal flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span>Studio: <strong className="text-slate-900 font-semibold">{activeStoreName}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{commissionRate}% Fee</span>
                  </span>
                  {sellerProfile?.originHub && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 text-xs">{sellerProfile.originHub}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <PortalSwitcherPill currentPortal="seller" />

            <Link
              href={`/store/${activeStoreSlug}`}
              target="_blank"
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors shadow-2xs"
              title="Open Public Brand Storefront"
            >
              <span>View Live Store</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>

            {authUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Seller Login
              </button>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-1.5 pt-2.5 mt-2.5 border-t border-slate-100 overflow-x-auto scrollbar-none">
          {navLinks.map((tab) => {
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? "bg-slate-900 text-white font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
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


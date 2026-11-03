"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Activity,
  Users,
  Store,
  FileCheck,
  Server,
  ArrowLeft,
  LogOut,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { FirebaseAuthModal } from "@/components/auth/FirebaseAuthModal";

export function AdminPortalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const { showToast } = useStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const navLinks = [
    { label: "Overview & Metrics", href: "/admin" },
    { label: "Sellers & KYC", href: "/admin/sellers" },
    { label: "Product Moderation", href: "/admin/products" },
    { label: "User Governance", href: "/admin/users" },
    { label: "Audit & Security Logs", href: "/admin/audit-logs" },
    { label: "Platform Finance", href: "/admin/finance" },
  ];

  const handleSignOut = async () => {
    await logout();
    showToast("Admin signed out securely.", "info");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950 text-white border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Admin Identity */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                    NEXU GLOBAL GOVERNANCE
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-950 border border-indigo-700/60 text-indigo-300">
                    Super Admin
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <span>Cluster: <strong className="text-slate-200">PostgreSQL 17.10</strong></span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold">Zero-Trust Scoped</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Cross-Portal Links */}
          <div className="flex items-center gap-3">
            <Link
              href="/seller"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Seller Hub</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Customer Storefront</span>
            </Link>

            {authUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-900/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Admin Login
              </button>
            )}
          </div>
        </div>

        {/* Secondary Sub-Navigation */}
        <nav className="flex items-center gap-2 pt-3 mt-1 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          {navLinks.map((tab) => {
            const isActive = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  isActive
                    ? "text-white bg-indigo-950/80 border border-indigo-700/50 shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {tab.label}
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


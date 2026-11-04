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
    <header className="sticky top-0 z-40 w-full bg-white text-[#171717] border-b border-[#E8E8E4] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Admin Identity */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] flex items-center justify-center font-bold text-sm shadow-xs">
                <Shield className="w-4 h-4 text-[#B78B45]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#171717]">
                    NEXU GLOBAL GOVERNANCE
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#F8F2E6] border border-[#B78B45]/30 text-[#B78B45]">
                    Super Admin
                  </span>
                </div>
                <div className="text-[11px] text-[#767676] font-mono flex items-center gap-2">
                  <span>Cluster: <strong className="text-[#171717]">PostgreSQL 17.10</strong></span>
                  <span className="text-[#E8E8E4]">•</span>
                  <span className="text-[#21866F] font-semibold">Zero-Trust Scoped</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Cross-Portal Links */}
          <div className="flex items-center gap-3">
            <Link
              href="/seller"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] hover:bg-white text-[#171717] text-xs font-medium transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-[#767676]" />
              <span>Seller Hub</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] hover:bg-white text-[#171717] text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3 h-3 text-[#767676]" />
              <span>Customer Storefront</span>
            </Link>

            {authUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#F2D6D6] bg-[#FAF0F0] hover:bg-[#FBEAEA] text-[#A63232] text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Admin Login
              </button>
            )}
          </div>
        </div>

        {/* Secondary Sub-Navigation */}
        <nav className="flex items-center gap-2 pt-3 mt-1 border-t border-[#E8E8E4] overflow-x-auto scrollbar-none">
          {navLinks.map((tab) => {
            const isActive = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  isActive
                    ? "text-[#171717] bg-[#FAFAF8] border border-[#171717] shadow-xs"
                    : "text-[#767676] hover:text-[#171717] hover:bg-[#FAFAF8]"
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


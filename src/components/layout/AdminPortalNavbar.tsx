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
import { PortalSwitcherPill } from "@/components/navigation/PortalSwitcherPill";

export function AdminPortalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const { showToast } = useStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const navLinks = [
    { label: "Overview & Metrics", href: "/admin" },
    { label: "Setup Wizard", href: "/admin/setup" },
    { label: "Demo Status & Outbox", href: "/admin/demo-status" },
    { label: "Enterprise Security", href: "/admin/security" },
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
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] flex items-center justify-center font-bold text-sm shadow-xs">
                <Shield className="w-4 h-4 text-[#B78B45]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-950 font-serif">
                    Nexu Admin Center
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                    Administrator
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 font-sans flex items-center gap-2">
                  <span>Marketplace Governance</span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-emerald-700 font-medium">Secured Session</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <PortalSwitcherPill currentPortal="admin" />

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
                <LogOut className="w-3 h-3 text-[#A63232]" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <nav className="bg-[#FAFAF8] border-t border-[#E8E8E4] overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-white text-zinc-950 border border-[#E8E8E4] font-semibold shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-white/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}

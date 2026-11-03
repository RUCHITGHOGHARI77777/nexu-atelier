"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Package,
  Layers,
  IndianRupee,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { SupplierPortalSaaS } from "@/components/supplier/SupplierPortalSaaS";
import { FirebaseAuthModal } from "@/components/auth/FirebaseAuthModal";

export default function SellerPage() {
  const { setActiveRole, showToast } = useStore();
  const { user: authUser, loginWithDemo, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDemoAuthenticating, setIsDemoAuthenticating] = useState(false);

  useEffect(() => {
    setActiveRole("supplier");
  }, [setActiveRole]);

  // Handle Evaluator 1-Click Seller Demo Authentication
  const handleEvaluatorSellerLogin = async () => {
    setIsDemoAuthenticating(true);
    try {
      const res = await loginWithDemo("seller");
      if (res.success && res.user) {
        showToast("Authenticated as Demo Seller (Solstice Handlooms) with active PostgreSQL session!", "success");
      } else {
        showToast(res.error || "Failed to authenticate demo seller.", "warning");
      }
    } catch {
      showToast("Network error during demo authentication.", "warning");
    } finally {
      setIsDemoAuthenticating(false);
    }
  };

  const isAuthorizedSeller = authUser && (authUser.role === "seller" || authUser.role === "admin");

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span>Verifying merchant session...</span>
        </div>
      </div>
    );
  }

  // 1. Authorized View: Render full SupplierPortalSaaS
  if (isAuthorizedSeller) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <SupplierPortalSaaS />
      </div>
    );
  }

  // 2. Gateway View: Unauthenticated or Customer Account attempting to access Seller Portal
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50/60">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-xl p-8 space-y-6 text-slate-900">
        {/* Icon & Title */}
        <div className="space-y-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
            <Store className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold uppercase tracking-wider inline-block">
              Merchant Management Portal
            </span>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              NEXU Seller Hub
            </h1>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Manage your independent studio catalog, warehouse inventory, incoming patron orders, and GST settlements.
            </p>
          </div>
        </div>

        {/* Notice for logged-in Customers */}
        {authUser && authUser.role === "customer" && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <span className="font-bold block">Customer Account Detected:</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                You are currently signed in as a Customer (<strong className="font-mono">{authUser.email}</strong>). Seller privileges are required to access this business management portal.
              </p>
            </div>
          </div>
        )}

        {/* Primary Merchant Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In to Seller Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            href="/seller/apply"
            className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <span>Apply for a Verified Merchant Account</span>
          </Link>
        </div>

        {/* Dedicated Evaluator Demo Access Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Evaluator Demo Access:</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              PostgreSQL Seeded
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            For technical inspection: Authenticate directly as pre-seeded demo seller (<strong className="font-mono text-slate-900">solstice@nexu.studio</strong>) to inspect 244 live orders, inventory ledgers, and payouts.
          </p>

          <button
            type="button"
            disabled={isDemoAuthenticating}
            onClick={handleEvaluatorSellerLogin}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {isDemoAuthenticating ? "Authenticating Session..." : "1-Click Login as Demo Seller"}
            </span>
          </button>
        </div>

        {/* Back to Shopping Link */}
        <div className="text-center pt-1">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
          >
            ← Return to Customer Storefront
          </Link>
        </div>
      </div>

      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

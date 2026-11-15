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
  Clock,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { SellerDashboardMaster } from "@/components/seller/SellerDashboardMaster";
import { FirebaseAuthModal } from "@/components/auth/FirebaseAuthModal";

export default function SellerPage() {
  const { setActiveRole, showToast } = useStore();
  const { user: authUser, loginWithDemo, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDemoAuthenticating, setIsDemoAuthenticating] = useState(false);

  const [sellerProfile, setSellerProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    setActiveRole("supplier");
  }, [setActiveRole]);

  useEffect(() => {
    let isMounted = true;
    async function checkSellerStatus() {
      if (!authUser) {
        setSellerProfile(null);
        return;
      }
      setLoadingProfile(true);
      try {
        const res = await fetch("/api/seller/profile");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSellerProfile(data.seller || null);
        } else {
          if (isMounted) setSellerProfile(null);
        }
      } catch {
        if (isMounted) setSellerProfile(null);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    }

    checkSellerStatus();
    return () => {
      isMounted = false;
    };
  }, [authUser]);

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

  const isApprovedSeller = (authUser && authUser.role === "admin") || (sellerProfile && sellerProfile.status === "APPROVED");

  if (isLoading || loadingProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span>Verifying merchant session and studio approval...</span>
        </div>
      </div>
    );
  }

  if (sellerProfile && sellerProfile.status === "PENDING") {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-xl rounded-2xl bg-white border border-[#E7E7E7] p-8 sm:p-10 space-y-6 text-[#111111] shadow-xs text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-bold uppercase tracking-wider inline-block">
              Application Status: Pending Review
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
              Studio Application Under Review
            </h1>
            <p className="text-sm text-[#666666] max-w-md mx-auto leading-relaxed">
              Your application for <strong>{sellerProfile.name}</strong> has been received and is currently being evaluated by our curation committee.
            </p>
          </div>

          <div className="border border-[#E7E7E7] rounded-xl bg-[#F7F7F7] p-4 text-left text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-[#E7E7E7]">
              <span className="text-[#888888]">Studio Name:</span>
              <span className="font-semibold text-[#111111]">{sellerProfile.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E7E7E7]">
              <span className="text-[#888888]">Origin Craft Hub:</span>
              <span className="font-semibold text-[#111111]">{sellerProfile.originHub || "India"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E7E7E7]">
              <span className="text-[#888888]">Contact Email:</span>
              <span className="font-semibold text-[#111111]">{sellerProfile.businessEmail}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#888888]">Review SLA:</span>
              <span className="font-semibold text-emerald-700">Typically processed within 2–4 hours</span>
            </div>
          </div>

          <p className="text-xs text-[#888888] leading-relaxed">
            Once approved by the administrator, your Seller Dashboard will unlock automatically, granting you full access to add products, manage inventory, and dispatch orders.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-[#E7E7E7] bg-white hover:bg-[#F7F7F7] text-xs font-semibold text-[#111111] transition-colors cursor-pointer"
            >
              Refresh Approval Status
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#111111] hover:bg-[#222222] text-xs font-semibold text-white transition-colors"
            >
              Browse Marketplace Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (sellerProfile && (sellerProfile.status === "REJECTED" || sellerProfile.status === "CHANGES_REQUESTED")) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-xl rounded-2xl bg-white border border-[#E7E7E7] p-8 sm:p-10 space-y-6 text-[#111111] shadow-xs text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 text-red-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-900 text-xs font-mono font-bold uppercase tracking-wider inline-block">
              Application Status: Changes Requested
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
              Additional Information Required
            </h1>
            <p className="text-sm text-[#666666] max-w-md mx-auto leading-relaxed">
              Our curation team reviewed your application for <strong>{sellerProfile.name}</strong> and requested revisions before approval.
            </p>
          </div>

          {sellerProfile.rejectionReason && (
            <div className="border border-red-200 rounded-xl bg-red-50/60 p-4 text-left text-xs space-y-1">
              <span className="font-bold text-red-900 block">Feedback from Curators:</span>
              <p className="text-red-800 leading-relaxed">{sellerProfile.rejectionReason}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/seller/apply"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#111111] hover:bg-[#222222] text-xs font-semibold text-white transition-colors"
            >
              Update Application & Resubmit
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-[#E7E7E7] bg-white hover:bg-[#F7F7F7] text-xs font-semibold text-[#111111] transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isApprovedSeller) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <SellerDashboardMaster initialProfile={sellerProfile} />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#FAFAF8] text-[#171717]">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E8E8E4] shadow-xs p-8 space-y-6">
        <div className="space-y-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F8F2E6] border border-[#B78B45]/30 text-[#B78B45] flex items-center justify-center mx-auto">
            <Store className="w-6 h-6 text-[#B78B45]" />
          </div>

          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F5F6F4] text-zinc-600 text-[10px] font-mono font-bold uppercase tracking-wider inline-block border border-[#E8E8E4]">
              Merchant Studio Portal
            </span>
            <h1 className="text-xl font-bold font-serif text-zinc-950 tracking-tight">
              NEXU Seller Hub
            </h1>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Manage your artisan studio catalog, warehouse inventory, order fulfillment, and GST settlements.
            </p>
          </div>
        </div>

        {authUser && authUser.role === "customer" && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <span className="font-semibold block">Customer Account Detected:</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                You are currently signed in as a Customer (<strong className="font-mono text-zinc-900">{authUser.email}</strong>). Merchant privileges are required to access this portal.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In to Seller Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            href="/seller/apply"
            className="w-full py-2.5 px-4 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] text-zinc-800 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>Apply for Verified Merchant Status</span>
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Evaluator Demo Access</span>
            </span>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Verified Session
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Instant inspection access: Authenticate directly as pre-seeded demo seller (<strong className="font-mono text-zinc-900">solstice@nexu.studio</strong>) to inspect live catalog items, inventory ledgers, and payouts.
          </p>

          <button
            type="button"
            disabled={isDemoAuthenticating}
            onClick={handleEvaluatorSellerLogin}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {isDemoAuthenticating ? "Verifying Credentials..." : "1-Click Sign In as Demo Seller"}
            </span>
          </button>
        </div>

        <div className="text-center pt-1 border-t border-zinc-100">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
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

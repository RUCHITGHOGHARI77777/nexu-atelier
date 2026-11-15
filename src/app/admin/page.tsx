"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { AdminCommandCenterSaaS } from "@/components/admin/AdminCommandCenterSaaS";
import { FirebaseAuthModal } from "@/components/auth/FirebaseAuthModal";

export default function AdminPage() {
  const { setActiveRole, showToast } = useStore();
  const { user: authUser, loginWithDemo, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDemoAuthenticating, setIsDemoAuthenticating] = useState(false);

  useEffect(() => {
    setActiveRole("admin");
  }, [setActiveRole]);

  const handleEvaluatorAdminLogin = async () => {
    setIsDemoAuthenticating(true);
    try {
      const res = await loginWithDemo("admin");
      if (res.success && res.user) {
        showToast("Authenticated as Platform Super Admin.", "success");
      } else {
        showToast(res.error || "Failed to authenticate admin session.", "warning");
      }
    } catch {
      showToast("Network error during administrator authentication.", "warning");
    } finally {
      setIsDemoAuthenticating(false);
    }
  };

  const isAuthorizedAdmin = authUser && authUser.role === "admin";

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAFAF8]">
        <div className="flex items-center gap-3 text-zinc-600 font-sans text-xs">
          <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <span>Verifying administrator credentials...</span>
        </div>
      </div>
    );
  }

  if (isAuthorizedAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <AdminCommandCenterSaaS />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#FAFAF8] text-[#171717]">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E8E8E4] shadow-xs p-8 space-y-6">
        <div className="space-y-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F8F2E6] border border-[#B78B45]/30 text-[#B78B45] flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-[#B78B45]" />
          </div>

          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F5F6F4] text-zinc-600 text-[10px] font-mono font-bold uppercase tracking-wider inline-block border border-[#E8E8E4]">
              Executive Gateway
            </span>
            <h1 className="text-xl font-bold font-serif text-zinc-950 tracking-tight">
              Platform Administration
            </h1>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Central marketplace governance for merchant verification, catalog moderation, and escrow payouts.
            </p>
          </div>
        </div>

        {authUser && authUser.role !== "admin" && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <span className="font-semibold block">Access Restricted:</span>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                The active session (<strong className="font-mono text-zinc-900">{authUser.email}</strong>) does not hold platform administrator rights.
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
            <span>Sign In to Admin Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Platform Owner Demo Access</span>
            </span>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Verified Session
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Instant inspection access: Authenticate as Platform Owner (<strong className="font-mono text-zinc-900">admin@nexu.studio</strong>) to review seller KYC, commission reports, and order tracking.
          </p>

          <button
            type="button"
            disabled={isDemoAuthenticating}
            onClick={handleEvaluatorAdminLogin}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {isDemoAuthenticating ? "Verifying Credentials..." : "1-Click Sign In as Administrator"}
            </span>
          </button>
        </div>

        <div className="text-center pt-1 border-t border-zinc-100">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
          >
            ← Back to Storefront
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

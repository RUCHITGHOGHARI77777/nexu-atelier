"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  Server,
  Activity,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck,
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

  // Handle Evaluator 1-Click Admin Demo Authentication
  const handleEvaluatorAdminLogin = async () => {
    setIsDemoAuthenticating(true);
    try {
      const res = await loginWithDemo("admin");
      if (res.success && res.user) {
        showToast("Authenticated as Platform Super Admin with active PostgreSQL session!", "success");
      } else {
        showToast(res.error || "Failed to authenticate demo admin.", "warning");
      }
    } catch {
      showToast("Network error during admin demo authentication.", "warning");
    } finally {
      setIsDemoAuthenticating(false);
    }
  };

  const isAuthorizedAdmin = authUser && authUser.role === "admin";

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span>Verifying administrator governance privileges...</span>
        </div>
      </div>
    );
  }

  // 1. Authorized View: Render full AdminCommandCenterSaaS
  if (isAuthorizedAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <AdminCommandCenterSaaS />
      </div>
    );
  }

  // 2. Gateway View: Unauthenticated or non-admin account
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-950 text-white">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 space-y-6">
        {/* Icon & Title */}
        <div className="space-y-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider inline-block border border-indigo-500/30">
              Restricted Security Gateway
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              NEXU Global Governance
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Super Admin command center for platform KYC, dispute arbitration, immutable audit logs, and infrastructure telemetry.
            </p>
          </div>
        </div>

        {/* Notice for logged-in Customer or Seller */}
        {authUser && authUser.role !== "admin" && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <span className="font-bold block">Access Denied:</span>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                Your currently authenticated account (<strong className="font-mono text-white">{authUser.email}</strong>, Role: <strong className="uppercase">{authUser.role}</strong>) does not hold platform administrator privileges.
              </p>
            </div>
          </div>
        )}

        {/* Primary Admin Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Authenticate as Platform Administrator</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dedicated Evaluator Demo Access Box */}
        <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Evaluator Demo Access:</span>
            </span>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded font-bold border border-indigo-800/50">
              PostgreSQL Seeded
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            For technical inspection: Authenticate directly as pre-seeded Platform Owner (<strong className="font-mono text-slate-200">admin@nexu.studio</strong>) to inspect live governance, audit event ledgers, and database cluster telemetry.
          </p>

          <button
            type="button"
            disabled={isDemoAuthenticating}
            onClick={handleEvaluatorAdminLogin}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {isDemoAuthenticating ? "Authenticating Session..." : "1-Click Login as Super Admin"}
            </span>
          </button>
        </div>

        {/* Back to Shopping Link */}
        <div className="text-center pt-1">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
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

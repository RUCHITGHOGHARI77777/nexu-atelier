"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  ArrowRight,
  X,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Layers,
  Lock,
  Truck,
  FileText,
  Boxes,
  Users,
  Compass,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

interface MarketplacePortalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MarketplacePortalGuideModal({ isOpen, onClose }: MarketplacePortalGuideModalProps) {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useStore();
  const [activeTab, setActiveTab] = useState<"portals" | "workflows" | "credentials">("portals");
  const [isLoadingRole, setIsLoadingRole] = useState<string | null>(null);

  if (!isOpen) return null;

  const handle1ClickLogin = async (role: "customer" | "seller" | "admin", redirectPath: string) => {
    try {
      setIsLoadingRole(role);
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Demo login failed", "warning");
        return;
      }

      showToast(`Authenticated as Demo ${role.toUpperCase()}. Redirecting...`, "success");
      onClose();
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to switch role", "warning");
    } finally {
      setIsLoadingRole(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col text-zinc-900 overflow-hidden font-sans">
        
        <div className="p-5 sm:p-6 border-b border-zinc-200 flex items-start justify-between gap-4 bg-zinc-50/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-600">
                NEXU ATELIER PLATFORM DIRECTORY &amp; ARCHITECTURE GUIDE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-950 tracking-tight">
              3 Integrated Portals • Where Should You Go?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
              This marketplace operates three distinct, synchronized portals for each stakeholder. Select your role or click below to launch any portal with 1-click pre-configured demo access.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer shrink-0"
            aria-label="Close portal directory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 border-b border-zinc-200 flex items-center gap-4 bg-white text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("portals")}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "portals"
                ? "border-zinc-950 text-zinc-950"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>The 3 Portals Explained</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workflows")}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "workflows"
                ? "border-zinc-950 text-zinc-950"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>&quot;What Should I Click?&quot; (Workflow Guide)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("credentials")}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "credentials"
                ? "border-zinc-950 text-zinc-950"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Demo Accounts &amp; Passwords</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {activeTab === "portals" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-400 transition-all shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 text-zinc-800 tracking-wider">
                      Patron / Buyer
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-950">1. Customer Storefront</h3>
                    <p className="text-[11px] font-mono text-zinc-500 mt-0.5">Route: / or /catalog</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600 leading-relaxed">
                    <p className="font-semibold text-zinc-900">Why does this exist?</p>
                    <p>
                      For shoppers to discover verified master artisans, add pieces from multiple distinct studios into one bag, and place orders.
                    </p>
                    <div className="pt-2 space-y-1 text-[11px] text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Faceted multi-attribute search &amp; filter</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Instant UPI QR &amp; NetBanking demo pay</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>5-Stage Blue Dart courier live tracking</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>7-Day doorstep direct return &amp; refund</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push("/");
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Open Storefront</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-400 transition-all shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-900 border border-amber-200 tracking-wider">
                      Makers &amp; Studios
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-950">2. Seller Studio Hub</h3>
                    <p className="text-[11px] font-mono text-zinc-500 mt-0.5">Route: /seller</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600 leading-relaxed">
                    <p className="font-semibold text-zinc-900">Why does this exist?</p>
                    <p>
                      For independent craft studios to manage their catalog, monitor real-time stock variants, dispatch orders, and track earnings.
                    </p>
                    <div className="pt-2 space-y-1 text-[11px] text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Product creation with size/color variants</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Inventory control &amp; low-stock alerts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Order packing &amp; Blue Dart AWB dispatch</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>14-day escrow ledger &amp; CA GST reports</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin("seller", "/seller")}
                    disabled={isLoadingRole === "seller"}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoadingRole === "seller" ? "Entering..." : "1-Click Launch Seller Hub"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-400 transition-all shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-900 border border-emerald-200 tracking-wider">
                      Platform Owner
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-950">3. Admin Control Center</h3>
                    <p className="text-[11px] font-mono text-zinc-500 mt-0.5">Route: /admin</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600 leading-relaxed">
                    <p className="font-semibold text-zinc-900">Why does this exist?</p>
                    <p>
                      For marketplace owners to enforce quality standards, approve seller KYC, moderate listings, and inspect statutory financial ledgers.
                    </p>
                    <div className="pt-2 space-y-1 text-[11px] text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Seller onboarding &amp; GSTIN verification</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Product quality moderation &amp; approval</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Platform commission (10%) &amp; GMV overview</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Cryptographic tamper-evident audit ledger</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin("admin", "/admin")}
                    disabled={isLoadingRole === "admin"}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoadingRole === "admin" ? "Entering..." : "1-Click Launch Admin Center"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === "workflows" && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-600">
                Click any specific goal below to instantly jump to the exact portal and page that handles it:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  {
                    goal: "I want to shop & place a multi-vendor order",
                    portal: "Customer Storefront",
                    path: "/catalog",
                    action: () => { onClose(); router.push("/catalog"); },
                  },
                  {
                    goal: "I want to simulate 5-stage express delivery & live van tracking",
                    portal: "Order Tracking",
                    path: "/track-order",
                    action: () => { onClose(); router.push("/track-order"); },
                  },
                  {
                    goal: "I want to upload a new artisan product with variants",
                    portal: "Seller Hub",
                    path: "/seller/products/new",
                    action: () => handle1ClickLogin("seller", "/seller/products/new"),
                  },
                  {
                    goal: "I want to inspect & adjust stock counts or SKUs",
                    portal: "Seller Hub",
                    path: "/seller/inventory",
                    action: () => handle1ClickLogin("seller", "/seller/inventory"),
                  },
                  {
                    goal: "I want to pack, dispatch & generate Blue Dart AWBs",
                    portal: "Seller Hub",
                    path: "/seller/orders",
                    action: () => handle1ClickLogin("seller", "/seller/orders"),
                  },
                  {
                    goal: "I want to approve/reject new seller applications (KYC)",
                    portal: "Admin Center",
                    path: "/admin/sellers",
                    action: () => handle1ClickLogin("admin", "/admin/sellers"),
                  },
                  {
                    goal: "I want to moderate and approve pending products",
                    portal: "Admin Center",
                    path: "/admin/products",
                    action: () => handle1ClickLogin("admin", "/admin/products"),
                  },
                  {
                    goal: "I want to view platform commission vs seller GMV finances",
                    portal: "Admin Center",
                    path: "/admin/finance",
                    action: () => handle1ClickLogin("admin", "/admin/finance"),
                  },
                  {
                    goal: "I want to verify SHA-256 cryptographic audit logs",
                    portal: "Admin Center",
                    path: "/admin/audit-logs",
                    action: () => handle1ClickLogin("admin", "/admin/audit-logs"),
                  },
                  {
                    goal: "I want to test payment & courier outbox simulators",
                    portal: "Admin Center",
                    path: "/admin/demo-status",
                    action: () => handle1ClickLogin("admin", "/admin/demo-status"),
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={item.action}
                    className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-400 text-left transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block">
                        {item.portal} • {item.path}
                      </span>
                      <p className="text-xs font-semibold text-zinc-950 group-hover:text-black mt-0.5">
                        {item.goal}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "credentials" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-600">
                You can manually log in on any portal or use the 1-click launch buttons below. All demo credentials operate on simulated, isolated test data.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-950">Customer Account</span>
                    <span className="text-[10px] font-mono uppercase bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded-full font-semibold">Buyer</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 bg-white p-2.5 rounded-xl border border-zinc-200">
                    <p><span className="text-zinc-500">Email:</span> patron@nexu.studio</p>
                    <p><span className="text-zinc-500">Pass:</span> Patron@123</p>
                    <p><span className="text-zinc-500">Name:</span> Aarav Mehta</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin("customer", "/")}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors"
                  >
                    Sign In as Customer
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-950">Artisan Seller Account</span>
                    <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">Studio</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 bg-white p-2.5 rounded-xl border border-zinc-200">
                    <p><span className="text-zinc-500">Email:</span> artisan@nexu.studio</p>
                    <p><span className="text-zinc-500">Pass:</span> Artisan@123</p>
                    <p><span className="text-zinc-500">Store:</span> Solstice Loom Studio</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin("seller", "/seller")}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors"
                  >
                    Sign In as Artisan Seller
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-950">Platform Super Admin</span>
                    <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">Operator</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 bg-white p-2.5 rounded-xl border border-zinc-200">
                    <p><span className="text-zinc-500">Email:</span> admin@nexu.studio</p>
                    <p><span className="text-zinc-500">Pass:</span> Admin@123</p>
                    <p><span className="text-zinc-500">Scope:</span> Full Multi-Tenant Admin</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin("admin", "/admin")}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors"
                  >
                    Sign In as Super Admin
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Single PostgreSQL 17 Database • Strict Multi-Tenant Separation Enforced</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/track-order"
              onClick={onClose}
              className="text-zinc-700 hover:text-black font-medium underline underline-offset-2"
            >
              Order Tracking
            </Link>
            <span>•</span>
            <Link
              href="/help"
              onClick={onClose}
              className="text-zinc-700 hover:text-black font-medium underline underline-offset-2"
            >
              System Docs &amp; FAQs
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

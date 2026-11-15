"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  ArrowRight,
  Compass,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { MarketplacePortalGuideModal } from "@/components/navigation/MarketplacePortalGuideModal";

export function MarketplacePortalsGuideSection() {
  const router = useRouter();
  const { showToast } = useStore();
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handle1ClickLogin = async (role: "customer" | "seller" | "admin", redirectPath: string) => {
    try {
      setLoadingRole(role);
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

      showToast(`Logged in as Demo ${role.toUpperCase()}. Launching portal...`, "success");
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to switch role", "warning");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl border border-zinc-200 bg-[#FAF9F5] p-6 sm:p-10 shadow-xs relative overflow-hidden">
          
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none hidden lg:block">
            <Layers className="w-80 h-80 text-zinc-950" />
          </div>

          <div className="relative z-10 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200/80 pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-sans font-semibold text-zinc-700 bg-white px-3 py-1 rounded-full border border-zinc-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-950"></span>
                  <span>Architecture Guide • Multi-Vendor Ecosystem</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950 tracking-tight">
                  Choose Your Marketplace Portal
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed font-sans">
                  NEXU ATELIER connects three distinct operational worlds into one unified PostgreSQL database. Explore the customer experience, test seller fulfillment, or inspect owner governance below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-900 text-xs font-semibold inline-flex items-center gap-2 shadow-2xs transition-all active:scale-98 cursor-pointer shrink-0 font-sans"
              >
                <Compass className="w-4 h-4 text-zinc-700" />
                <span>Open Architecture Guide &amp; Workflow Map</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col justify-between hover:border-zinc-400 transition-all shadow-xs group">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-zinc-100 text-zinc-800 tracking-wider font-sans">
                      Patron / Buyer
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-zinc-950 font-serif">1. Customer Storefront</h3>
                    <p className="text-xs text-zinc-500 font-sans mt-0.5">Where buyers discover &amp; commission craft</p>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Discover verified weavers and master foundries. Add products from multiple sellers to a single bag, checkout with instant UPI simulation, and track 5-stage express delivery.
                  </p>

                  <div className="space-y-1.5 text-xs text-zinc-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Curated multi-vendor catalog &amp; search</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>NPCI 256-bit simulated UPI QR payment</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>5-stage Blue Dart express live tracking</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>7-day doorstep returns &amp; instant refund</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-zinc-100">
                  <Link
                    href="/catalog"
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <span>Browse Curated Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col justify-between hover:border-zinc-400 transition-all shadow-xs group">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-900 border border-amber-200 tracking-wider">
                      Artisan / Maker
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-zinc-950 font-serif">2. Seller Studio Hub</h3>
                    <p className="text-xs text-zinc-500 font-sans mt-0.5">Where independent makers manage operations</p>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Dedicated merchant portal for verified studios. Create products with SKUs, monitor low stock alerts, pack and dispatch orders with real Blue Dart AWBs, and monitor escrow earnings.
                  </p>

                  <div className="space-y-1.5 text-xs text-zinc-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Product upload wizard &amp; image gallery</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Multi-variant inventory &amp; stock sync</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Order dispatch &amp; courier packing workflow</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>14-day escrow ledger &amp; CA GST export</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin("seller", "/seller")}
                    disabled={loadingRole === "seller"}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>{loadingRole === "seller" ? "Entering Hub..." : "1-Click Enter as Solstice Studio"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col justify-between hover:border-zinc-400 transition-all shadow-xs group">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-900 border border-emerald-200 tracking-wider">
                      Platform Owner
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-zinc-950 font-serif">3. Admin Control Center</h3>
                    <p className="text-xs text-zinc-500 font-sans mt-0.5">Where operators govern marketplace standards</p>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Full platform governance. Review &amp; approve seller KYC applications, moderate product quality, monitor multi-vendor split orders, review 10% commission revenues, and verify audit hashes.
                  </p>

                  <div className="space-y-1.5 text-xs text-zinc-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Seller KYC review, approval &amp; suspension</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Product catalog moderation queue</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Platform commission (10%) &amp; GMV ledger</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>SHA-256 tamper-evident cryptographic log</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin("admin", "/admin")}
                    disabled={loadingRole === "admin"}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>{loadingRole === "admin" ? "Entering Admin..." : "1-Click Enter as Super Admin"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <MarketplacePortalGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </>
  );
}

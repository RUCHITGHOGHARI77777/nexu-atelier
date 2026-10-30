"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SellerProfile } from "@/types/seller";
import { SellerNav } from "@/components/seller/SellerNav";
import { AlertCircle, Clock, Ban, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    async function fetchSellerProfile() {
      try {
        const res = await fetch("/api/seller/profile");
        if (res.status === 401) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const data = await res.json();
        if (!data.seller && pathname !== "/seller/apply") {
          // User is not yet registered as a seller -> redirect to application
          router.push("/seller/apply");
          return;
        }

        setSeller(data.seller || null);
        setIsApproved(data.isApproved || false);
      } catch {
        // Handle gracefully
      } finally {
        setIsFetching(false);
      }
    }

    fetchSellerProfile();
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-100 rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
            Verifying Studio Credentials...
          </span>
        </div>
      </div>
    );
  }

  // If on application page, render children directly without full sidebar
  if (pathname === "/seller/apply") {
    return <div className="min-h-screen bg-[#05050a]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col md:flex-row text-zinc-100">
      <SellerNav seller={seller} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Onboarding Notice Banners */}
        {seller?.status === "PENDING" && (
          <div className="bg-amber-950/40 border-b border-amber-800/60 px-6 py-3 flex items-center justify-between text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Studio Application Under Review:</strong> Your workshop credentials are being inspected by our curation team. Product publishing and dispatch actions will unlock once verified.
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              ETA: ~24 Hours
            </span>
          </div>
        )}

        {seller?.status === "REJECTED" && (
          <div className="bg-rose-950/40 border-b border-rose-800/60 px-6 py-3 flex items-center justify-between text-rose-200 text-xs">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Application Ineligible:</strong> {seller.rejectionReason || "Studio documentation did not meet marketplace artisan authenticity criteria."}
              </span>
            </div>
            <Link href="/seller/apply" className="underline hover:text-white text-xs font-medium">
              Re-apply with updated details
            </Link>
          </div>
        )}

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

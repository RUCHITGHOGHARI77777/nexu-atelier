"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { ShieldAlert, LogIn, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === "admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Verifying administrator privileges...</span>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-zinc-950 border border-zinc-800 rounded-lg text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-zinc-100">
              Administrative Access Restricted
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This operations area is protected and requires an authorized account with <code className="text-zinc-200 font-mono">ADMIN</code> credentials.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login">
              <Button size="sm" className="w-full bg-zinc-100 text-zinc-900 hover:bg-white flex items-center justify-center gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                Sign In as Administrator
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="w-full">
                Return to Storefront
              </Button>
            </Link>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-800/60">
            Pre-seeded admin: <strong className="text-zinc-300">admin@nexu.studio</strong> / <strong className="text-zinc-300">AdminPass123!</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-zinc-100 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto">
        <AdminNav />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

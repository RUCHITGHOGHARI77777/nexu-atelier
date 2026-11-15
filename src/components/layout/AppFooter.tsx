"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function AppFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/seller")) {
    return (
      <footer className="py-6 px-4 bg-[#FAFAF8] border-t border-[#E8E8E4] text-center text-xs text-[#767676] font-mono">
        <span>NEXU Enterprise Multi-Store SaaS Engine &copy; {new Date().getFullYear()}</span>
        <span className="mx-2">•</span>
        <span>PostgreSQL 17.10 Isolated Ledger</span>
      </footer>
    );
  }

  return <Footer />;
}


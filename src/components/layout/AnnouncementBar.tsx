"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

export const AnnouncementBar: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("nexu_announcement_dismissed");
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("nexu_announcement_dismissed", "true");
  };

  if (isDismissed) return null;

  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800/80 text-zinc-300 text-xs py-2 px-4 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-ochre inline-block" />
          <span className="tracking-wide">NEXU ATELIER</span>
        </div>

        <div className="text-center font-medium truncate text-xs">
          Direct artisan patronage • Complimentary delivery above ₹2,500 • Commission code{" "}
          <Link
            href="/promotions"
            className="text-ochre font-mono font-semibold underline underline-offset-2 hover:text-ochre-light transition-colors"
          >
            NEXUFIRST
          </Link>{" "}
          for 15% off
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/promotions"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-ochre hover:text-ochre-light transition-colors"
          >
            <span>Offers</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
            aria-label="Dismiss announcement"
            title="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

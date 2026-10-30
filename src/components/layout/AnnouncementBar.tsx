"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

export const AnnouncementBar: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(true);
  const [bannerText, setBannerText] = useState<string>("Complimentary Pan-India Insured Express Delivery on Curated Orders Above ₹2,500");
  const [bannerEnabled, setBannerEnabled] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("nexu_announcement_dismissed");
    if (!dismissed) {
      setIsDismissed(false);
    }

    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.homepage_banner_text) {
            setBannerText(data.settings.homepage_banner_text);
          }
          if (data.settings.homepage_banner_enabled === "false") {
            setBannerEnabled(false);
          }
        }
      })
      .catch(() => {
        // Fallback to default
      });
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("nexu_announcement_dismissed", "true");
  };

  if (isDismissed || !bannerEnabled) return null;

  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800/80 text-zinc-300 text-xs py-2 px-4 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          <span className="tracking-wide">NEXU ATELIER</span>
        </div>

        <div className="text-center font-medium truncate text-xs">
          {bannerText}
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

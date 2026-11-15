"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { DemoModeBadge } from "@/components/common/DemoModeBadge";

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
      });
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("nexu_announcement_dismissed", "true");
  };

  if (isDismissed || !bannerEnabled) return null;

  return (
    <div className="w-full bg-[#F7F7F7] border-b border-[#E7E7E7] text-[#111111] text-xs py-2 px-4 select-none transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#666666]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#111111] inline-block" />
          <span className="tracking-widest font-semibold text-[#111111]">NEXU ATELIER</span>
        </div>

        <div className="text-center font-medium truncate text-xs text-[#111111]">
          {bannerText}
        </div>

        <div className="flex items-center gap-3">
          <DemoModeBadge />
          <Link
            href="/promotions"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#111111] hover:underline transition-colors"
          >
            <span>Offers</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={handleDismiss}
            className="text-[#929292] hover:text-[#171717] p-0.5 rounded transition-colors"
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

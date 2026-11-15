"use client";

import React, { useState } from "react";
import { Compass, ChevronDown } from "lucide-react";
import { MarketplacePortalGuideModal } from "./MarketplacePortalGuideModal";

interface PortalSwitcherPillProps {
  currentPortal?: "customer" | "seller" | "admin";
  className?: string;
}

export function PortalSwitcherPill({ currentPortal = "customer", className = "" }: PortalSwitcherPillProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getPortalLabel = () => {
    switch (currentPortal) {
      case "seller":
        return "Seller Hub • Switch Portal";
      case "admin":
        return "Admin Center • Switch Portal";
      default:
        return "Explore 3 Portals";
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
          currentPortal === "admin"
            ? "bg-zinc-900 text-white hover:bg-black border border-zinc-700"
            : currentPortal === "seller"
            ? "bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300"
            : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-300/80"
        } ${className}`}
        title="View 3 Marketplace Portals & Architecture Guide"
      >
        <Compass className="w-3.5 h-3.5" />
        <span>{getPortalLabel()}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      <MarketplacePortalGuideModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}


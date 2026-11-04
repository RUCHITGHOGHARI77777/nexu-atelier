"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, MapPin } from "lucide-react";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  activeMenu: "collections" | "guilds" | null;
}

export const StorefrontMegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onClose,
  onMouseEnter,
  activeMenu,
}) => {
  if (!isOpen || !activeMenu) return null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-white border-b border-[#E8E8E4] shadow-xl z-50 transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeMenu === "collections" && (
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Col 1: Curated Seasonal Edits (3 cols) */}
            <div className="col-span-3 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#767676] font-semibold block border-b border-[#E8E8E4] pb-2">
                Seasonal Lookbooks
              </span>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link
                    href="/collections"
                    onClick={onClose}
                    className="font-medium text-[#171717] hover:text-[#B78B45] transition-colors flex items-center justify-between group"
                  >
                    <span>Autumn / Winter 2026 Drop</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F8F2E6] text-[#8A631E] border border-[#B78B45]/40">
                      NEW
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?category=Apparel"
                    onClick={onClose}
                    className="text-[#626262] hover:text-[#171717] transition-colors block py-0.5"
                  >
                    Royal Benaras & Chanderi Silks
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?category=Objects%20%26%20Living"
                    onClick={onClose}
                    className="text-[#626262] hover:text-[#171717] transition-colors block py-0.5"
                  >
                    Lost-Wax Cast Brassware
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?category=Audio%20%26%20Tech"
                    onClick={onClose}
                    className="text-[#626262] hover:text-[#171717] transition-colors block py-0.5"
                  >
                    Audiophile Acoustic Monitors
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?category=Footwear"
                    onClick={onClose}
                    className="text-[#626262] hover:text-[#171717] transition-colors block py-0.5"
                  >
                    Bench-Made Heritage Footwear
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 2: Featured Artisan Studios (3 cols) */}
            <div className="col-span-3 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#767676] font-semibold block border-b border-[#E8E8E4] pb-2">
                Independent Ateliers
              </span>
              <ul className="space-y-3 text-xs">
                <li>
                  <Link
                    href="/store/solstice-loom-studio"
                    onClick={onClose}
                    className="block group p-2.5 rounded-xl hover:bg-[#FAFAF8] border border-transparent hover:border-[#E8E8E4] transition-all"
                  >
                    <div className="font-semibold text-[#171717] group-hover:text-[#B78B45] flex items-center gap-1.5">
                      <span>Solstice Loom Studio</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#21866F]" />
                    </div>
                    <p className="text-[11px] text-[#626262] mt-0.5">
                      Surat & Ahmedabad • Mulberry Silks & Khadi
                    </p>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?q=Jaipur"
                    onClick={onClose}
                    className="block group p-2.5 rounded-xl hover:bg-[#FAFAF8] border border-transparent hover:border-[#E8E8E4] transition-all"
                  >
                    <div className="font-semibold text-[#171717] group-hover:text-[#B78B45]">
                      Jaipur Heritage Looms
                    </div>
                    <p className="text-[11px] text-[#626262] mt-0.5">
                      Rajasthan • Natural Vegetable Dye Hand-Blocks
                    </p>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?q=Kashmir"
                    onClick={onClose}
                    className="block group p-2.5 rounded-xl hover:bg-[#FAFAF8] border border-transparent hover:border-[#E8E8E4] transition-all"
                  >
                    <div className="font-semibold text-[#171717] group-hover:text-[#B78B45]">
                      Kashmir Pashmina Guild
                    </div>
                    <p className="text-[11px] text-[#626262] mt-0.5">
                      Srinagar • Grade-A Handspun Cashmere
                    </p>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 & 4: Editorial Visual Feature Card (6 cols) */}
            <div className="col-span-6 grid grid-cols-2 gap-4">
              <Link
                href="/product/chanderi-silk-embroidered-anarkali-robe"
                onClick={onClose}
                className="group relative rounded-2xl overflow-hidden bg-[#FAFAF8] border border-[#E8E8E4] aspect-4/3 flex flex-col justify-end p-5 text-white shadow-xs"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                <Image
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"
                  alt="Chanderi Silk Saree"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="relative z-20 space-y-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300 font-semibold">
                    Masterpiece Spotlight
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:underline">
                    Chanderi Embroidered Robe
                  </h4>
                  <p className="text-[11px] text-zinc-300 line-clamp-1">
                    Hand-woven with real gold thread zari in Surat, Gujarat.
                  </p>
                </div>
              </Link>

              <Link
                href="/collections"
                onClick={onClose}
                className="group relative rounded-2xl overflow-hidden bg-[#FAFAF8] border border-[#E8E8E4] aspect-4/3 flex flex-col justify-end p-5 text-white shadow-xs"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                <Image
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
                  alt="Artisan Studio"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="relative z-20 space-y-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-blue-300 font-semibold">
                    The Living Heritage
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:underline">
                    Meet the Loom Masters
                  </h4>
                  <p className="text-[11px] text-zinc-300 line-clamp-1">
                    Direct studio commissions eliminating intermediary showroom markups.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {activeMenu === "guilds" && (
          <div className="grid grid-cols-4 gap-6">
            <Link
              href="/shop?category=Apparel"
              onClick={onClose}
              className="group p-4 rounded-2xl border border-[#E8E8E4] hover:border-[#B78B45] bg-white hover:shadow-sm transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E8E4] text-[#171717] group-hover:border-[#B78B45] group-hover:text-[#B78B45] shadow-2xs flex items-center justify-center font-bold text-xs transition-colors">
                TX
              </div>
              <h4 className="text-xs font-bold text-[#171717] group-hover:text-[#B78B45] transition-colors">
                Fine Textiles & Silks
              </h4>
              <p className="text-[11px] text-[#626262] line-clamp-2">
                Handspun raw mulberry silks, organic khadi robes, and heirloom sarees.
              </p>
            </Link>

            <Link
              href="/shop?category=Audio%20%26%20Tech"
              onClick={onClose}
              className="group p-4 rounded-2xl border border-[#E8E8E4] hover:border-[#B78B45] bg-white hover:shadow-sm transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E8E4] text-[#171717] group-hover:border-[#B78B45] group-hover:text-[#B78B45] shadow-2xs flex items-center justify-center font-bold text-xs transition-colors">
                AU
              </div>
              <h4 className="text-xs font-bold text-[#171717] group-hover:text-[#B78B45] transition-colors">
                Acoustic Engineering
              </h4>
              <p className="text-[11px] text-[#626262] line-clamp-2">
                Bespoke point-to-point tube amplifiers and solid-walnut studio monitors.
              </p>
            </Link>

            <Link
              href="/shop?category=Objects%20%26%20Living"
              onClick={onClose}
              className="group p-4 rounded-2xl border border-[#E8E8E4] hover:border-[#B78B45] bg-white hover:shadow-sm transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E8E4] text-[#171717] group-hover:border-[#B78B45] group-hover:text-[#B78B45] shadow-2xs flex items-center justify-center font-bold text-xs transition-colors">
                BR
              </div>
              <h4 className="text-xs font-bold text-[#171717] group-hover:text-[#B78B45] transition-colors">
                Foundry & Brassware
              </h4>
              <p className="text-[11px] text-[#626262] line-clamp-2">
                Heavy cast brass temple urlis, incense burners, and terracotta vessels.
              </p>
            </Link>

            <Link
              href="/shop?category=Footwear"
              onClick={onClose}
              className="group p-4 rounded-2xl border border-[#E8E8E4] hover:border-[#B78B45] bg-white hover:shadow-sm transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E8E4] text-[#171717] group-hover:border-[#B78B45] group-hover:text-[#B78B45] shadow-2xs flex items-center justify-center font-bold text-xs transition-colors">
                FW
              </div>
              <h4 className="text-xs font-bold text-[#171717] group-hover:text-[#B78B45] transition-colors">
                Leather Goods & Footwear
              </h4>
              <p className="text-[11px] text-[#626262] line-clamp-2">
                Goodyear-welted derbies, full-grain card folios, and artisan sandals.
              </p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

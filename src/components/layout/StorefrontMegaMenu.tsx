"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, MapPin } from "lucide-react";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeMenu: "collections" | "guilds" | null;
}

export const StorefrontMegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose, activeMenu }) => {
  if (!isOpen || !activeMenu) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-2xl border-b border-zinc-200/90 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeMenu === "collections" && (
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Col 1: Curated Seasonal Edits (3 cols) */}
            <div className="col-span-3 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold block border-b border-zinc-100 pb-2">
                Seasonal Lookbooks
              </span>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link
                    href="/collections"
                    onClick={onClose}
                    className="font-medium text-zinc-900 hover:text-blue-600 transition-colors flex items-center justify-between group"
                  >
                    <span>Autumn / Winter 2026 Drop</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      NEW
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?category=Fashion%20%26%20Apparel"
                    onClick={onClose}
                    className="text-zinc-600 hover:text-zinc-950 transition-colors block py-0.5"
                  >
                    Royal Benaras & Chanderi Silks
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?category=Home%20%26%20Kitchen"
                    onClick={onClose}
                    className="text-zinc-600 hover:text-zinc-950 transition-colors block py-0.5"
                  >
                    Lost-Wax Cast Brassware
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?category=Electronics"
                    onClick={onClose}
                    className="text-zinc-600 hover:text-zinc-950 transition-colors block py-0.5"
                  >
                    Audiophile Acoustic Monitors
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?category=B2B%20Wholesale%20Packs"
                    onClick={onClose}
                    className="text-zinc-600 hover:text-zinc-950 transition-colors block py-0.5"
                  >
                    B2B Guild Wholesale Commissions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 2: Featured Artisan Studios (3 cols) */}
            <div className="col-span-3 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold block border-b border-zinc-100 pb-2">
                Independent Ateliers
              </span>
              <ul className="space-y-3 text-xs">
                <li>
                  <Link
                    href="/store/solstice-loom-studio"
                    onClick={onClose}
                    className="block group p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all"
                  >
                    <div className="font-semibold text-zinc-900 group-hover:text-blue-600 flex items-center gap-1.5">
                      <span>Solstice Loom Studio</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Surat & Ahmedabad • Mulberry Silks & Khadi
                    </p>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?search=Jaipur"
                    onClick={onClose}
                    className="block group p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all"
                  >
                    <div className="font-semibold text-zinc-900 group-hover:text-blue-600">
                      Jaipur Heritage Looms
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Rajasthan • Natural Vegetable Dye Hand-Blocks
                    </p>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?search=Kashmir"
                    onClick={onClose}
                    className="block group p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all"
                  >
                    <div className="font-semibold text-zinc-900 group-hover:text-blue-600">
                      Kashmir Pashmina Guild
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Srinagar • Grade-A Handspun Cashmere
                    </p>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 & 4: Editorial Visual Feature Card (6 cols) */}
            <div className="col-span-6 grid grid-cols-2 gap-4">
              <Link
                href="/product/chanderi-silk-festive-saree"
                onClick={onClose}
                className="group relative rounded-2xl overflow-hidden bg-zinc-900 aspect-4/3 flex flex-col justify-end p-5 text-white shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                <Image
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"
                  alt="Chanderi Silk Saree"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="relative z-20 space-y-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300">
                    Masterpiece Spotlight
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:underline">
                    Chanderi Zari Silk Saree
                  </h4>
                  <p className="text-[11px] text-zinc-300 line-clamp-1">
                    Hand-woven with real silver thread zari in Madhya Pradesh.
                  </p>
                </div>
              </Link>

              <Link
                href="/collections"
                onClick={onClose}
                className="group relative rounded-2xl overflow-hidden bg-zinc-900 aspect-4/3 flex flex-col justify-end p-5 text-white shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                <Image
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
                  alt="Artisan Studio"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="relative z-20 space-y-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-blue-300">
                    The Living Heritage
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:underline">
                    Meet the Loom Masters
                  </h4>
                  <p className="text-[11px] text-zinc-300 line-clamp-1">
                    Direct commissions eliminating 100% of middlemen markups.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {activeMenu === "guilds" && (
          <div className="grid grid-cols-4 gap-6">
            <Link
              href="/category/apparel"
              onClick={onClose}
              className="group p-4 rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                TX
              </div>
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600">
                Fine Textiles & Silks
              </h4>
              <p className="text-[11px] text-zinc-500 line-clamp-2">
                Handspun raw mulberry silks, organic khadi robes, and heirloom sarees.
              </p>
            </Link>

            <Link
              href="/shop?category=Electronics"
              onClick={onClose}
              className="group p-4 rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                AU
              </div>
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600">
                Acoustic Engineering
              </h4>
              <p className="text-[11px] text-zinc-500 line-clamp-2">
                Bespoke point-to-point tube amplifiers and solid-walnut studio monitors.
              </p>
            </Link>

            <Link
              href="/shop?category=Home%20%26%20Kitchen"
              onClick={onClose}
              className="group p-4 rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                BR
              </div>
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600">
                Foundry & Brassware
              </h4>
              <p className="text-[11px] text-zinc-500 line-clamp-2">
                Heavy cast brass temple urlis, incense burners, and terracotta vessels.
              </p>
            </Link>

            <Link
              href="/shop?category=B2B%20Wholesale%20Packs"
              onClick={onClose}
              className="group p-4 rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                B2B
              </div>
              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600">
                Guild Wholesale & Boutique
              </h4>
              <p className="text-[11px] text-zinc-500 line-clamp-2">
                Curated bulk lots for international luxury retailers and interior designers.
              </p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

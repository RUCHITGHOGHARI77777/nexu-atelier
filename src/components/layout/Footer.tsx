import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Terminal, ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-zinc-200 text-zinc-600 text-xs mt-24 shadow-xs">
      {/* Top Banner Provenance Strip */}
      <div className="border-b border-zinc-200 bg-zinc-50/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-zinc-600 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold text-zinc-800">VERIFIED ARTISAN COLLECTIVE • PAN-INDIA DISPATCH</span>
          </div>
          <p className="text-zinc-500">
            Curated directly from verified master looms, acoustic laboratories, and sand-casting ateliers.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                NX
              </div>
              <span className="font-extrabold text-sm tracking-tight text-zinc-950">
                NEXU ATELIER & MARKETPLACE
              </span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed max-w-sm">
              An open-source multi-vendor marketplace connecting verified independent
              studios, heritage loom master weavers, and industrial hardware engineers
              directly with global design patrons.
            </p>
            <div className="pt-2 flex items-center gap-4 text-[11px] font-mono text-zinc-500">
              <span>Next.js 14 App Router</span>
              <span>•</span>
              <span>TypeScript Strict</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>

          {/* Col 2: Catalog Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Curated Collections
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/catalog?category=Apparel" className="hover:text-zinc-950 transition-colors">
                  Artisan Apparel & Silks
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Audio%20%26%20Tech" className="hover:text-zinc-950 transition-colors">
                  Acoustic Tech & Monocoques
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Footwear" className="hover:text-zinc-950 transition-colors">
                  Goodyear-Welted Footwear
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Objects%20%26%20Living" className="hover:text-zinc-950 transition-colors">
                  Cast Brass & Studio Objects
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Accessories" className="hover:text-zinc-950 transition-colors">
                  Box Calf Leather Goods
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Patron Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Patron Services
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-zinc-950 transition-colors">
                  Our Atelier Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-zinc-950 transition-colors">
                  Concierge Desk
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-zinc-950 transition-colors">
                  Frequently Asked
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-zinc-950 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/promotions" className="hover:text-amber-700 transition-colors font-medium text-amber-600">
                  Promotions & Vouchers
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Transparency & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Legal & Trust
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/policies/shipping" className="hover:text-zinc-950 transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/policies/cancellation" className="hover:text-zinc-950 transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/refunds" className="hover:text-zinc-950 transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-zinc-950 transition-colors">
                  Privacy & Data Ethics
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-zinc-950 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-14 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div>
            © 2026 Nexu Atelier. Authentic craft, zero middleman markups. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/catalog" className="hover:text-zinc-950 transition-colors">
              Browse Catalog
            </Link>
            <Link href="/cart" className="hover:text-zinc-950 transition-colors">
              Cart Summary
            </Link>
            <Link href="/wishlist" className="hover:text-zinc-950 transition-colors">
              Saved Pieces
            </Link>
            <Link href="/contact" className="hover:text-zinc-950 transition-colors">
              Contact Desk
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

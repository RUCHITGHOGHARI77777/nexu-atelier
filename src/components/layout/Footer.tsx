import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Terminal, ArrowUpRight, Truck, RefreshCw, CreditCard, Lock } from "lucide-react";

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
              directly with discerning global patrons.
            </p>
            <div className="pt-2 flex items-center gap-4 text-[11px] font-mono text-zinc-500">
              <span>Next.js 14 App Router</span>
              <span>•</span>
              <span>TypeScript Strict</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>

          {/* Col 2: Catalog Disciplines & Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Disciplines & Discovery
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/catalog" className="hover:text-zinc-950 transition-colors">
                  All Studio Pieces
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-zinc-950 transition-colors font-medium">
                  Guild Disciplines
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-zinc-950 transition-colors">
                  Curated Collections
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="hover:text-zinc-950 transition-colors">
                  New Studio Releases
                </Link>
              </li>
              <li>
                <Link href="/best-sellers" className="hover:text-zinc-950 transition-colors">
                  Most Patroned
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-zinc-950 transition-colors">
                  Trending Pieces
                </Link>
              </li>
              <li>
                <Link href="/sale" className="hover:text-amber-700 transition-colors text-amber-600 font-medium">
                  Archive & Value Drops
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
                <Link href="/track-order" className="hover:text-zinc-950 transition-colors font-medium text-amber-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Track Consignment</span>
                </Link>
              </li>
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
                <Link href="/promotions" className="hover:text-amber-700 transition-colors">
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
                <Link href="/policies/replacement" className="hover:text-zinc-950 transition-colors font-medium text-zinc-800">
                  7-Day Studio Exchange
                </Link>
              </li>
              <li>
                <Link href="/policies/refunds" className="hover:text-zinc-950 transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/policies/cancellation" className="hover:text-zinc-950 transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-zinc-950 transition-colors font-medium text-zinc-800">
                  Accessibility (WCAG)
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

        {/* Payment Assurance Strip */}
        <div className="mt-12 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>256-BIT ENCRYPTED CHECKOUT • ESCROW SECURED</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {["UPI", "RuPay", "Visa", "Mastercard", "NetBanking", "Cash on Delivery"].map((badge) => (
              <span
                key={badge}
                className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200/80 text-[10px] font-mono text-zinc-700 font-semibold"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div>
            © 2026 Nexu Atelier. Authentic craft, zero middleman markups. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/catalog" className="hover:text-zinc-950 transition-colors">
              Browse Catalog
            </Link>
            <Link href="/track-order" className="hover:text-zinc-950 transition-colors">
              Track Order
            </Link>
            <Link href="/accessibility" className="hover:text-zinc-950 transition-colors">
              Accessibility
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

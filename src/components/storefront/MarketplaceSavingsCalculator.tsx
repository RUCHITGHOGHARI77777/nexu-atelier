"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Percent,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  IndianRupee,
  HelpCircle,
  Layers,
  Store,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useStore } from "@/context/StoreContext";

interface MarketplaceSavingsCalculatorProps {
  onOpenLaunchModal: () => void;
}

export function MarketplaceSavingsCalculator({ onOpenLaunchModal }: MarketplaceSavingsCalculatorProps) {
  const { formatPrice, activeRegion } = useStore();
  // Sliders
  const [monthlySales, setMonthlySales] = useState<number>(100000); // default ₹1,00,000
  const [returnRate, setReturnRate] = useState<number>(15); // default 15%
  const [activeTab, setActiveTab] = useState<"calculator" | "matrix">("calculator");

  // Dynamic calculations based on real Indian e-commerce marketplace structures:
  // Amazon/Flipkart: Average 18% commission + 10.5% return logistics & non-refundable pick & pack fee on returns
  const amazonFlipkartLoss = useMemo(() => {
    const commission = monthlySales * 0.18; // 18% commission average across categories
    const rtoCost = monthlySales * (returnRate / 100) * 0.70; // 70% of item value lost in two-way courier + RTO fee
    return Math.round(commission + rtoCost);
  }, [monthlySales, returnRate]);

  // Meesho: 0% explicit commission, but 12% hidden ad pressure + 80% shipping penalty on RTO/customer returns
  const meeshoLoss = useMemo(() => {
    const rtoPenalties = monthlySales * (returnRate / 100) * 0.85; // heavy reverse courier deductions
    const forcedAds = monthlySales * 0.065; // ~6.5% required ads to get visible catalog impressions
    return Math.round(rtoPenalties + forcedAds);
  }, [monthlySales, returnRate]);

  // Shopify: ₹1,999/mo base subscription + 2% payment gateway fee + app subscriptions (~₹2,500/mo)
  const shopifyLoss = useMemo(() => {
    const basePlan = 1999;
    const gatewayFees = monthlySales * 0.02;
    const essentialApps = 2500;
    return Math.round(basePlan + gatewayFees + essentialApps);
  }, [monthlySales]);

  // Our Platform: 0% commission, 0% platform deductions, 0 hidden ad fees
  const ourPlatformFee = 0;
  const ourExtraProfit = amazonFlipkartLoss; // Extra money that stays in seller's bank account

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/90 ring-1 ring-slate-900/5 bg-gradient-to-b from-white/95 via-white/80 to-emerald-50/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,23,42,0.05)] p-6 sm:p-10 space-y-8 my-10">
      {/* Background Accent Mesh Glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-sky-100/40 blur-3xl pointer-events-none" />

      {/* Top Banner Tag & Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold tracking-wide shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
          <span>ZERO COMMISSION REVOLUTION FOR INDIAN SELLERS</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
          Stop Bleeding Profits on Amazon, Flipkart & Meesho.
        </h2>

        <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
          See exactly how much money big marketplaces secretly take from your hard work in hidden commissions, reverse courier penalties, and ad taxes — and how much you save on your own branded store.
        </p>

        {/* Tab Switcher: Calculator vs Full Comparison Matrix */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("calculator")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "calculator"
                ? "bg-slate-950 text-white shadow-md shadow-slate-950/15"
                : "bg-white/80 hover:bg-slate-100 text-slate-700 border border-slate-200/80"
            }`}
          >
            📊 Live Profit Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "matrix"
                ? "bg-slate-950 text-white shadow-md shadow-slate-950/15"
                : "bg-white/80 hover:bg-slate-100 text-slate-700 border border-slate-200/80"
            }`}
          >
            ⚖️ 5-Way Marketplace Matrix
          </button>
        </div>
      </div>

      {activeTab === "calculator" ? (
        /* --- TAB 1: INTERACTIVE CALCULATOR SLIDERS & PROFIT HERO --- */
        <div className="space-y-8 relative">
          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs">
            {/* Slider 1: Monthly Sales */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Your Estimated Monthly Sales (GMV)</span>
                </label>
                <span className="text-sm font-extrabold font-mono text-slate-950 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  {formatPrice(monthlySales)}
                </span>
              </div>
              <input
                type="range"
                min="20000"
                max="1000000"
                step="10000"
                value={monthlySales}
                onChange={(e) => setMonthlySales(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{formatPrice(20000)}/mo</span>
                <span>{formatPrice(500000)}/mo</span>
                <span>{formatPrice(1000000)}/mo</span>
              </div>
            </div>

            {/* Slider 2: Return Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-rose-500" />
                  <span>Average Marketplace Return / RTO Rate</span>
                </label>
                <span className="text-sm font-extrabold font-mono text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                  {returnRate}% Returns
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={returnRate}
                onChange={(e) => setReturnRate(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>5% (Low RTO)</span>
                <span>15% (Typical Clothing)</span>
                <span>40% (High COD)</span>
              </div>
            </div>
          </div>

          {/* Dynamic Result Cards Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Amazon / Flipkart */}
            <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Amazon / Flipkart</span>
                <span className="text-[10px] font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  -18% Comm + RTO
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-2xl font-black font-mono text-rose-600 block">
                  -{formatPrice(amazonFlipkartLoss)}
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  15%–25% Commission + High Closing Fee + RTO Return Penalty + 14-Day Payout Hold. Seller loses 28%+ of revenue.
                </span>
              </div>
            </div>

            {/* Meesho */}
            <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Meesho Marketplace</span>
                <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Heavy Reverse Penalty
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-2xl font-black font-mono text-amber-700 block">
                  -{formatPrice(meeshoLoss)}
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Heavy Reverse Shipping Penalty (₹120–₹160 per return) + Compulsory Ads Cost + Zero Brand Identity. Margin wiped out on returns.
                </span>
              </div>
            </div>

            {/* Shopify */}
            <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Shopify + Gateway</span>
                <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Subscription + 2%
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-2xl font-black font-mono text-indigo-700 block">
                  -{formatPrice(shopifyLoss)}
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  $29–$299/month (₹2,000+/mo) Subscription + Paid Apps + 2% Transaction Fees. Too expensive for small/medium sellers.
                </span>
              </div>
            </div>

            {/* Our Platform: 100% Free Highlight Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 space-y-2.5 relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-20">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                  🏆 Our Direct Brand Store
                </span>
                <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  0% FEE FOREVER
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-2xl font-black font-mono text-white block">
                  +{formatPrice(ourExtraProfit)}
                </span>
                <span className="text-[11px] text-emerald-100 block font-medium leading-tight">
                  0% Commission + ₹0 Monthly Fee + ₹0 Return Penalty + Instant Direct Bank/UPI Settlement + Free Custom Brand Link.
                </span>
              </div>
            </div>
          </div>

          {/* Big Green Impact Callout & Launch CTA */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                  100% Zero Commission • Direct P2P Settlement
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-400">
                Extra Net Profit You Keep Every Month: {formatPrice(ourExtraProfit)}
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Launch your branded online store at <code className="text-emerald-300 font-mono">/store/your-brand</code> in 60 seconds. Connect your direct bank/UPI VPA, keep 100% of customer payments, and escape marketplace penalties forever.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenLaunchModal}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
            >
              <Store className="w-4 h-4 text-slate-950" />
              <span>Launch My Free Brand Store (60s) 🚀</span>
            </button>
          </div>
        </div>
      ) : (
        /* --- TAB 2: DETAILED 5-WAY COMPARISON MATRIX --- */
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="p-4 font-bold text-slate-900 w-1/4">Feature / Term</th>
                <th className="p-4 font-bold text-slate-700">Amazon / Flipkart</th>
                <th className="p-4 font-bold text-slate-700">Meesho</th>
                <th className="p-4 font-bold text-slate-700">Shopify</th>
                <th className="p-4 font-extrabold text-emerald-700 bg-emerald-50/80 border-l border-r border-emerald-200">
                  ✨ Our Platform (Free)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-950">Marketplace Commission</td>
                <td className="p-4 text-rose-600 font-semibold">12% to 25% per order</td>
                <td className="p-4 text-slate-600">0% direct (heavy ad costs)</td>
                <td className="p-4 text-slate-600">2% transaction cut</td>
                <td className="p-4 font-black text-emerald-700 bg-emerald-50/40 border-l border-r border-emerald-200">
                  0% FOREVER FREE
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-950">Payment Settlement Time</td>
                <td className="p-4 text-slate-600">7 to 14 Days delayed</td>
                <td className="p-4 text-slate-600">7 Days delayed</td>
                <td className="p-4 text-slate-600">3 to 5 Days (Pushed to PG)</td>
                <td className="p-4 font-bold text-emerald-700 bg-emerald-50/40 border-l border-r border-emerald-200">
                  INSTANT (0 Seconds via Direct UPI)
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-950">Customer Phone & WhatsApp Data</td>
                <td className="p-4 text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Masked / Hidden (Amazon owns them)</span>
                </td>
                <td className="p-4 text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Hidden (Zero repeat marketing)</span>
                </td>
                <td className="p-4 text-emerald-700 font-medium">Owned (Plugin needed)</td>
                <td className="p-4 font-bold text-emerald-700 bg-emerald-50/40 border-l border-r border-emerald-200">
                  100% DIRECT CUSTOMER OWNERSHIP
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-950">RTO / Customer Return Penalty</td>
                <td className="p-4 text-rose-600">Seller bears two-way shipping + pick fee</td>
                <td className="p-4 text-rose-600">₹140-₹220 deducted from seller balance</td>
                <td className="p-4 text-slate-600">Seller manages courier</td>
                <td className="p-4 font-bold text-emerald-700 bg-emerald-50/40 border-l border-r border-emerald-200">
                  0% PLATFORM PENALTIES (Address Verification)
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-950">Branded Packaging & Logo</td>
                <td className="p-4 text-slate-600">Amazon/Flipkart branded tape only</td>
                <td className="p-4 text-slate-600">Meesho generic tape</td>
                <td className="p-4 text-emerald-700 font-medium">Your own brand</td>
                <td className="p-4 font-bold text-emerald-700 bg-emerald-50/40 border-l border-r border-emerald-200">
                  YOUR LOGO & GST TAX SLIPS
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-950">Monthly Software Costs</td>
                <td className="p-4 text-slate-600">Hidden in deductions</td>
                <td className="p-4 text-slate-600">Hidden in ad auction</td>
                <td className="p-4 text-rose-600">₹1,999/mo + ~₹2,500 apps</td>
                <td className="p-4 font-black text-emerald-700 bg-emerald-50/40 border-l border-r border-emerald-200">
                  ₹0 / MONTH (100% Free)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


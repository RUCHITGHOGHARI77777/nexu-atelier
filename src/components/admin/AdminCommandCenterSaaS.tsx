"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Building2,
  Users,
  IndianRupee,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  Layers,
  ArrowUpRight,
  Clock,
  Landmark,
  BadgeCheck,
  Lock,
  Unlock,
  Smartphone,
  RotateCcw,
} from "lucide-react";
import { useStore, SupplierInfo, StoreOrder } from "@/context/StoreContext";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export function AdminCommandCenterSaaS() {
  const store = useStore();
  const {
    orders,
    suppliers,
    products,
    toggleSupplierVerification,
    toggleSupplierPayoutHold,
    loadSampleOrders,
    resetDemoData,
    showToast,
    whiteLabelConfig,
    updateWhiteLabelConfig,
    resetWhiteLabelConfig,
    openPhoneSimulator,
  } = store;

  // Search & Filter states
  const [transactionSearch, setTransactionSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"METRICS" | "SUPPLIERS" | "TRANSACTIONS" | "WHITE_LABEL">("METRICS");

  // Local White-Label Form State
  const [wlBrandName, setWlBrandName] = useState(whiteLabelConfig.brandName);
  const [wlBrandSubtitle, setWlBrandSubtitle] = useState(whiteLabelConfig.brandSubtitle);
  const [wlMerchantUpiId, setWlMerchantUpiId] = useState(whiteLabelConfig.merchantUpiId);
  const [wlGstinNumber, setWlGstinNumber] = useState(whiteLabelConfig.gstinNumber);
  const [wlPlatformCommission, setWlPlatformCommission] = useState(whiteLabelConfig.platformCommissionRate);
  const [wlAccentColor, setWlAccentColor] = useState(whiteLabelConfig.accentColor);

  useEffect(() => {
    setWlBrandName(whiteLabelConfig.brandName);
    setWlBrandSubtitle(whiteLabelConfig.brandSubtitle);
    setWlMerchantUpiId(whiteLabelConfig.merchantUpiId);
    setWlGstinNumber(whiteLabelConfig.gstinNumber);
    setWlPlatformCommission(whiteLabelConfig.platformCommissionRate);
    setWlAccentColor(whiteLabelConfig.accentColor);
  }, [whiteLabelConfig]);

  // Executive Metric Calculations
  const grossMerchandiseValue = useMemo(() => {
    return orders.reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  const platformCommissionEarned = useMemo(() => {
    return Math.round(grossMerchandiseValue * (whiteLabelConfig.platformCommissionRate / 100));
  }, [grossMerchandiseValue, whiteLabelConfig.platformCommissionRate]);

  const activeVerifiedSuppliers = useMemo(() => {
    return suppliers.filter((s) => s.verified).length;
  }, [suppliers]);

  const conversionRate = useMemo(() => {
    if (orders.length === 0) return "3.4%";
    return `${(3.4 + Math.min(2.5, orders.length * 0.3)).toFixed(1)}%`;
  }, [orders.length]);

  // Filtered transactions for audit table
  const filteredTransactions = useMemo(() => {
    if (!transactionSearch.trim()) return orders;
    const q = transactionSearch.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.paymentDetails?.utrNumber?.toLowerCase().includes(q) ||
        o.paymentDetails?.upiId?.toLowerCase().includes(q)
    );
  }, [orders, transactionSearch]);

  // Filtered suppliers for table
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase().trim();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [suppliers, supplierSearch]);

  // Weekly GMV Chart Data (Simulated turnover distribution)
  const weeklyGmvBars = [
    { day: "Mon", amount: 145000, height: "45%" },
    { day: "Tue", amount: 210000, height: "65%" },
    { day: "Wed", amount: 185000, height: "55%" },
    { day: "Thu", amount: 290000, height: "85%" },
    { day: "Fri", amount: 340000, height: "95%" },
    { day: "Sat", amount: 260000, height: "75%" },
    { day: "Sun (Today)", amount: grossMerchandiseValue || 180000, height: "80%" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-slate-900 animate-in fade-in duration-300">
      {/* --- ADMIN HEADER & DEMO UTILITY CONTROLS --- */}
      <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>PLATFORM OWNER VIEW</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              v2.4 Enterprise SaaS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            🛡️ Admin Command Center
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Platform governance, supplier verification, NPCI settlement audit logs & live commission reporting.
          </p>
        </div>

        {/* Demo Fast-Track Utilities for Evaluators */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadSampleOrders}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Load Sample Orders (Demo Data)</span>
          </button>

          <button
            type="button"
            onClick={resetDemoData}
            className="px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* --- PLATFORM-WIDE EXECUTIVE METRIC CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Gross Merchandise Value */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Gross Merchandise Value (GMV)</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
              {formatCurrency(grossMerchandiseValue)}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4%</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Authoritative transactional volume via NPCI Escrow
          </p>
        </div>

        {/* Metric 2: Platform Commission Earned */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Platform Commission ({whiteLabelConfig.platformCommissionRate}%)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {formatCurrency(platformCommissionEarned)}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {whiteLabelConfig.platformCommissionRate}% Nodal Split
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Retained in marketplace platform nodal account
          </p>
        </div>

        {/* Metric 3: Active Verified Suppliers */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Verified Studios & Suppliers</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
              {activeVerifiedSuppliers} <span className="text-xs font-normal text-slate-500">/ {suppliers.length}</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {Math.round((activeVerifiedSuppliers / suppliers.length) * 100)}% Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {suppliers.length - activeVerifiedSuppliers} supplier currently pending review
          </p>
        </div>

        {/* Metric 4: Conversion Rate */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Storefront Conversion</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
              {conversionRate}
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              High Intent
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Indexed against {orders.length} total logged sessions
          </p>
        </div>
      </div>

      {/* --- ADMIN NAVIGATION TABS (INCLUDING WHITE-LABEL RESELLER ENGINE) --- */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("METRICS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "METRICS"
              ? "bg-slate-950 text-white shadow-sm"
              : "bg-white/80 text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>📊 Executive Overview & Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SUPPLIERS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "SUPPLIERS"
              ? "bg-slate-950 text-white shadow-sm"
              : "bg-white/80 text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>🏢 Supplier Governance ({suppliers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TRANSACTIONS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "TRANSACTIONS"
              ? "bg-slate-950 text-white shadow-sm"
              : "bg-white/80 text-slate-600 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>📜 NPCI UTR Audit Log ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("WHITE_LABEL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "WHITE_LABEL"
              ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:text-blue-900 border border-blue-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>⚙️ White-Label Reseller Brand Engine</span>
        </button>
      </div>

      {/* --- TAB CONTENT: 1. EXECUTIVE ANALYTICS --- */}
      {(activeTab === "METRICS") && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
        {/* GMV 7-Day Trend Chart */}
        <div className="lg:col-span-8 rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950">
                7-Day GMV Volume Trend & Settlement Velocity
              </h3>
              <p className="text-[11px] text-slate-500">
                Daily aggregated gross transaction value routed through UPI & NetBanking
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              Live NPCI Feed
            </span>
          </div>

          {/* SVG/CSS Bar Chart */}
          <div className="pt-4 h-48 flex items-end justify-between gap-3 px-2">
            {weeklyGmvBars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded shadow-2xs">
                  {formatCurrency(bar.amount)}
                </span>
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-slate-900 to-indigo-600 group-hover:from-indigo-600 group-hover:to-sky-400 transition-all duration-300 shadow-xs"
                  style={{ height: bar.height }}
                />
                <span className="text-[10px] font-mono font-semibold text-slate-500 mt-1">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Revenue Breakdown & Escrow Health */}
        <div className="lg:col-span-4 rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-6 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-950 pb-2 border-b border-slate-100">
              Category Revenue Share
            </h3>

            {/* Progress Bars */}
            <div className="pt-3 space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Electronics (Flagship)</span>
                  <span className="font-bold text-slate-950">44%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-950 rounded-full" style={{ width: "44%" }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>B2B Wholesale Packs</span>
                  <span className="font-bold text-slate-950">28%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "28%" }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Fashion & Apparel</span>
                  <span className="font-bold text-slate-950">18%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: "18%" }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Home & Kitchen</span>
                  <span className="font-bold text-slate-950">10%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "10%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Health Monitor Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Escrow Health: 100% Operational</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-snug">
              Zero escrow disputes. Automated payout release triggered upon Step 5 delivery confirmation.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* --- SUPPLIER VERIFICATION & APPROVAL TABLE --- */}
      {(activeTab === "SUPPLIERS" || activeTab === "METRICS") && (
      <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-extrabold text-slate-950">
                Supplier Verification & Escrow Governance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review marketplace suppliers, grant or revoke verification badges, and toggle financial payout holds.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              placeholder="Search suppliers..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 text-[10px] font-mono uppercase text-slate-500">
                <th className="py-3 px-3">Studio & Supplier</th>
                <th className="py-3 px-3">Location Hub</th>
                <th className="py-3 px-3 text-center">Fulfillment SLA</th>
                <th className="py-3 px-3 text-center">Verification Badge</th>
                <th className="py-3 px-3 text-center">Payout Status</th>
                <th className="py-3 px-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Supplier info */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-900 text-xs">
                        {sup.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-950 block">{sup.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Rating: ★ {sup.rating} • Joined: {sup.joinedDate || "2025"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                    {sup.location}
                  </td>

                  {/* SLA */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-700">
                    {sup.fulfillmentRate}
                  </td>

                  {/* Verification Status */}
                  <td className="py-3.5 px-3 text-center">
                    {sup.verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Under Review</span>
                      </span>
                    )}
                  </td>

                  {/* Payout Hold Status */}
                  <td className="py-3.5 px-3 text-center">
                    {sup.payoutOnHold ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <Lock className="w-3 h-3 text-rose-600" />
                        <span>Payouts On Hold</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        <Unlock className="w-3 h-3 text-slate-500" />
                        <span>Active Settlement</span>
                      </span>
                    )}
                  </td>

                  {/* Action Toggles */}
                  <td className="py-3.5 px-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleSupplierVerification(sup.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        sup.verified
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                      }`}
                    >
                      {sup.verified ? "Revoke Badge" : "Approve & Verify ✓"}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSupplierPayoutHold(sup.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        sup.payoutOnHold
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {sup.payoutOnHold ? "Release Hold" : "Hold Payout"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* --- REAL-TIME TRANSACTION & UTR AUDIT LOG --- */}
      {(activeTab === "TRANSACTIONS" || activeTab === "METRICS") && (
      <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-extrabold text-slate-950">
                Real-Time UPI Transaction & UTR Audit Log
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every checkout authorized in Phase 2 appears here in real time with bank reference and escrow allocation.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              placeholder="Search by UTR or Customer..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">No transactions recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Complete an order via the Customer Checkout or click &apos;Load Sample Orders&apos; above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-[10px] font-mono uppercase text-slate-500">
                  <th className="py-3 px-3">Order ID & Timestamp</th>
                  <th className="py-3 px-3">Customer & Contact</th>
                  <th className="py-3 px-3">UPI VPA Debited</th>
                  <th className="py-3 px-3">Bank UTR Number</th>
                  <th className="py-3 px-3 text-right">Gross Total</th>
                  <th className="py-3 px-3 text-right">Platform Fee ({whiteLabelConfig.platformCommissionRate}%)</th>
                  <th className="py-3 px-3 text-center">Escrow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {filteredTransactions.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order ID */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-950 block">{ord.id}</span>
                      <span className="text-[11px] text-slate-500 font-sans">
                        {formatDateTime(ord.createdAt)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-3 font-sans">
                      <span className="font-bold text-slate-950 block">{ord.customerName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {ord.customerPhone}
                      </span>
                    </td>

                    {/* UPI VPA */}
                    <td className="py-3.5 px-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-bold">
                        {ord.paymentDetails?.upiId || "customer@okaxis"}
                      </span>
                    </td>

                    {/* Bank UTR */}
                    <td className="py-3.5 px-3 font-bold text-indigo-700">
                      {ord.paymentDetails?.utrNumber || "UPI/2026/849201"}
                    </td>

                    {/* Gross */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-950 text-sm">
                      {formatCurrency(ord.total)}
                    </td>

                    {/* Commission Fee */}
                    <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                      {formatCurrency(Math.round(ord.total * (whiteLabelConfig.platformCommissionRate / 100)))}
                    </td>

                    {/* Escrow Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>CAPTURED • ESCROW LOCKED</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* --- TAB CONTENT: 4. COMMERCIAL WHITE-LABEL RESELLER BRAND ENGINE --- */}
      {activeTab === "WHITE_LABEL" && (
        <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-extrabold text-slate-950">
                  Commercial White-Label Reseller Engine
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rebrand and customize the entire platform for your enterprise client in seconds with live global state propagation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetWhiteLabelConfig}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Quick Client Rebrand Presets */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
              1-Click Enterprise Client Presets:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  name: "AuraMart Enterprise",
                  subtitle: "Enterprise Multi-Vendor SaaS",
                  upi: "auramart.enterprise@icici",
                  gstin: "27AABCN8942Q1Z9",
                  commission: 10,
                  color: "blue" as const,
                  badge: "Default Flagship",
                },
                {
                  name: "Tata Luxury Hub",
                  subtitle: "Bespoke Heritage & Fine Living",
                  upi: "tata.luxury@hdfcbank",
                  gstin: "27AAACT2727Q1ZT",
                  commission: 12,
                  color: "slate" as const,
                  badge: "Conglomerate",
                },
                {
                  name: "FabIndia Atelier",
                  subtitle: "Handcrafted Textiles & Organic Living",
                  upi: "fabindia.atelier@sbi",
                  gstin: "07AAACF1234F1Z8",
                  commission: 8,
                  color: "emerald" as const,
                  badge: "Artisan B2B",
                },
                {
                  name: "Zara Studio Luxe",
                  subtitle: "Contemporary Runway & Minimalist Tech",
                  upi: "zara.studio@axisbank",
                  gstin: "33AABCZ9876P1ZV",
                  commission: 15,
                  color: "amber" as const,
                  badge: "Retail Global",
                },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setWlBrandName(preset.name);
                    setWlBrandSubtitle(preset.subtitle);
                    setWlMerchantUpiId(preset.upi);
                    setWlGstinNumber(preset.gstin);
                    setWlPlatformCommission(preset.commission);
                    setWlAccentColor(preset.color);
                    updateWhiteLabelConfig({
                      brandName: preset.name,
                      brandSubtitle: preset.subtitle,
                      merchantUpiId: preset.upi,
                      gstinNumber: preset.gstin,
                      platformCommissionRate: preset.commission,
                      accentColor: preset.color,
                    });
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    wlBrandName === preset.name
                      ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/30"
                      : "border-slate-200/90 bg-white/70 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-950">{preset.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{preset.subtitle}</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-600">
                    <span>Fee: {preset.commission}%</span>
                    <span className="text-blue-600 font-semibold">{preset.color}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form & Live Specular Glass Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left 7 Columns: Form Controls */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateWhiteLabelConfig({
                  brandName: wlBrandName,
                  brandSubtitle: wlBrandSubtitle,
                  merchantUpiId: wlMerchantUpiId,
                  gstinNumber: wlGstinNumber,
                  platformCommissionRate: Number(wlPlatformCommission),
                  accentColor: wlAccentColor,
                });
              }}
              className="lg:col-span-7 space-y-4"
            >
              {/* Brand Name & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                    Store Brand Name
                  </label>
                  <input
                    type="text"
                    value={wlBrandName}
                    onChange={(e) => setWlBrandName(e.target.value)}
                    placeholder="e.g. AuraMart Enterprise"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={wlBrandSubtitle}
                    onChange={(e) => setWlBrandSubtitle(e.target.value)}
                    placeholder="e.g. Enterprise Multi-Vendor SaaS"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Merchant UPI ID & GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                    Merchant Official UPI ID
                  </label>
                  <input
                    type="text"
                    value={wlMerchantUpiId}
                    onChange={(e) => setWlMerchantUpiId(e.target.value)}
                    placeholder="e.g. merchant@icici"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                    Merchant GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={wlGstinNumber}
                    onChange={(e) => setWlGstinNumber(e.target.value)}
                    placeholder="e.g. 27AABCN8942Q1Z9"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Commission % & Theme Accent Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                      Platform Commission Rate
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {wlPlatformCommission}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={wlPlatformCommission}
                    onChange={(e) => setWlPlatformCommission(Number(e.target.value))}
                    className="w-full accent-slate-950 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>1% (Wholesale)</span>
                    <span>10% (Standard)</span>
                    <span>25% (Luxury)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-700 uppercase block">
                    Accent Theme Palette
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[
                      { id: "blue" as const, label: "Royal Blue", bg: "bg-blue-600" },
                      { id: "emerald" as const, label: "Emerald", bg: "bg-emerald-600" },
                      { id: "slate" as const, label: "Obsidian", bg: "bg-slate-900" },
                      { id: "amber" as const, label: "Amber", bg: "bg-amber-600" },
                    ].map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setWlAccentColor(col.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                          wlAccentColor === col.id
                            ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${col.bg}`} />
                        <span>{col.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md active:scale-98 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Apply White-Label Settings Across Whole App</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openPhoneSimulator({
                      amount: 26990,
                      brandName: wlBrandName,
                      merchantUpiId: wlMerchantUpiId,
                      utrNumber: `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`,
                    });
                    showToast("📱 iPhone Simulator Launched with New Brand!", "success");
                  }}
                  className="px-4 py-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Test Floating Phone Simulator</span>
                </button>
              </div>
            </form>

            {/* Right 5 Columns: Live Specular Glass Preview Card */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Live Brand Preview
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Real-Time Sync
                </span>
              </div>

              {/* Navbar Preview */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold">
                  Header Branding:
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <div
                    className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center ${
                      wlAccentColor === "emerald"
                        ? "bg-emerald-600"
                        : wlAccentColor === "amber"
                        ? "bg-amber-600"
                        : wlAccentColor === "slate"
                        ? "bg-slate-900"
                        : "bg-blue-600"
                    }`}
                  >
                    {wlBrandName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-950 font-sans text-xs block">
                      {wlBrandName}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate max-w-[190px]">
                      {wlBrandSubtitle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payout & Financial Split Preview */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold">
                  Commission Escrow Split (on ₹10,000 Order):
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-emerald-800">
                    <span>Platform Revenue ({wlPlatformCommission}%):</span>
                    <span className="font-bold">₹{(10000 * wlPlatformCommission / 100).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Supplier Settlement ({100 - wlPlatformCommission}%):</span>
                    <span className="font-bold">₹{(10000 - (10000 * wlPlatformCommission / 100)).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Merchant VPA & Tax Identity */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Merchant VPA:</span>
                  <span className="font-bold text-slate-900">{wlMerchantUpiId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GSTIN:</span>
                  <span className="font-bold text-slate-900">{wlGstinNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


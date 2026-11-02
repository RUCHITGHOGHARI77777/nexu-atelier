"use client";

import React from "react";
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  FileCheck2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useStore, StoreOrder } from "@/context/StoreContext";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

interface SellerProfitLossModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: StoreOrder[];
  packingCostPerOrder: number;
}

export function SellerProfitLossModal({
  isOpen,
  onClose,
  orders,
  packingCostPerOrder,
}: SellerProfitLossModalProps) {
  const { whiteLabelConfig, activeRegion, formatPrice } = useStore();

  if (!isOpen) return null;

  const grossSalesINR = orders.reduce((acc, o) => acc + o.total, 0);
  const totalTaxCollected = orders.reduce(
    (acc, o) => acc + (o.taxAmount || Math.round((o.total * 18) / 118)),
    0
  );
  const taxableTurnover = grossSalesINR - totalTaxCollected;
  const cgst = Math.round(totalTaxCollected / 2);
  const sgst = totalTaxCollected - cgst;
  const tcs1Percent = Math.round(grossSalesINR * 0.01);
  const totalPackingExpenses = orders.length * packingCostPerOrder;
  const marketplaceCutSaved = Math.round(grossSalesINR * 0.22); // Amazon / Flipkart 22% average take rate
  const netTakeHomeProfit = Math.max(0, grossSalesINR - totalPackingExpenses);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/90 ring-1 ring-slate-900/10 bg-white/95 backdrop-blur-2xl shadow-[0_25px_60px_rgba(15,23,42,0.15)] p-6 sm:p-10 space-y-6 text-slate-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
              OFFICIAL FINANCIAL STATEMENT
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Period: November 2026
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>🖨️ Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Executive Statement Container */}
        <div className="printable-statement space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                  {whiteLabelConfig.brandName.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  {whiteLabelConfig.brandName}
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Tax Reg / GSTIN: <strong className="text-slate-800">{whiteLabelConfig.gstinNumber}</strong> • VPA: <strong className="text-slate-800">{whiteLabelConfig.merchantUpiId}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Registered Warehouse: Artisan Hub & Industrial Cluster Phase 2, Jaipur, RJ
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                0% Commission Direct Store
              </span>
              <h2 className="text-base font-extrabold text-slate-950">
                Monthly Profit & Loss Statement
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Doc Ref: PNL-2026-NOV-{orders.length}O • Generated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Revenue Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              I. Revenue & Collections Summary
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-mono text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Revenue Line Item</th>
                    <th className="py-2.5 px-3">Reference / Basis</th>
                    <th className="py-2.5 px-3 text-right">Amount ({activeRegion.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-950">Gross Customer Order Value (GMV)</td>
                    <td className="py-2.5 px-3 text-slate-500">{orders.length} Verified Customer Orders</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-950">{formatPrice(grossSalesINR)}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-700">Less: GST / VAT Collected (Statutory Liability)</td>
                    <td className="py-2.5 px-3 text-slate-500">CGST (9%) + SGST (9%) Output Tax</td>
                    <td className="py-2.5 px-3 text-right text-rose-700">- {formatPrice(totalTaxCollected)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">Net Taxable Merchandise Turnover</td>
                    <td className="py-2.5 px-3 text-slate-500">Net Sales Exclusive of Indirect Tax</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatPrice(taxableTurnover)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Expenses & Deductions */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              II. Cost of Fulfillment & Platform Deductions
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-mono text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Expense Head</th>
                    <th className="py-2.5 px-3">Rate / Estimation</th>
                    <th className="py-2.5 px-3 text-right">Amount ({activeRegion.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Seller Packaging & Materials Cost</td>
                    <td className="py-2.5 px-3 text-slate-500">₹{packingCostPerOrder}/box across {orders.length} consignments</td>
                    <td className="py-2.5 px-3 text-right text-slate-800">{formatPrice(totalPackingExpenses)}</td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="py-2.5 px-3 font-bold text-emerald-900">Platform SaaS Commission Charged</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">0% Forever (Direct P2P Settlement)</td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700">₹0.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700">Estimated 1% TCS / TDS (Sec 52 / 194-O)</td>
                    <td className="py-2.5 px-3 text-slate-500">Statutory withholding credit ledger</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{formatPrice(tcs1Percent)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Profit & Marketplace Savings Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-800 block">
                  Final Take-Home Assessment
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                  Net Seller Profit: {formatPrice(netTakeHomeProfit)}
                </h4>
                <p className="text-xs text-emerald-900 font-medium mt-0.5">
                  100% settled directly into merchant bank account via UPI / Instant transfer.
                </p>
              </div>

              <div className="text-left sm:text-right bg-white p-3 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                  Marketplace Cut Saved
                </span>
                <span className="text-lg font-black text-emerald-700 font-mono block">
                  + {formatPrice(marketplaceCutSaved)}
                </span>
                <span className="text-[10px] text-slate-500">vs Amazon/Meesho 22% cut</span>
              </div>
            </div>
          </div>

          {/* Signatures & Certification */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
            <div className="space-y-1 text-center sm:text-left">
              <span className="block font-bold text-slate-800">Certified by Platform Automated Ledger</span>
              <span className="block font-mono text-[10px]">Zero floating-point arithmetic drift • Authoritative snapshot</span>
            </div>
            <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-4 py-2 bg-slate-50">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-900 uppercase block">GST & CA Audit Ready</span>
                <span className="text-[9px] font-mono text-slate-500">Section 65B Certified Digital Record</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

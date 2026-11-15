"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Sparkles,
  Lock,
  Copy,
  Check,
  X,
  ExternalLink,
  CreditCard,
  Truck,
  Mail,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function DemoModeBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium tracking-wide bg-stone-900 text-stone-100 hover:bg-stone-800 transition-colors shadow-sm border border-stone-700/50 cursor-pointer"
        title="Click to view Demo Mode active status and seeded credentials"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>DEMO MODE</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-[#FAF8F5] border border-stone-300 rounded-2xl shadow-2xl overflow-hidden text-stone-900 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-[#F2EDE4] border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold tracking-tight text-stone-900">
                    Platform Demo Sandbox
                  </h3>
                  <p className="text-xs text-stone-600 font-mono">
                    Zero Real Money • Simulated Couriers • Outbox Safe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-mono">
                  Active Sandbox Adapters
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-900 block">Payment Sandbox</span>
                      <span className="text-stone-500 text-[11px]">Razorpay Test / Sandbox (₹0 live charge)</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-start gap-2">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-900 block">3PL Logistics</span>
                      <span className="text-stone-500 text-[11px]">Simulated Shiprocket (Unique demo AWBs)</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-start gap-2">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-900 block">Demo Outbox</span>
                      <span className="text-stone-500 text-[11px]">Emails & WhatsApp captured without dispatch</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-900 block">PostgreSQL 17</span>
                      <span className="text-stone-500 text-[11px]">Live atomic database & audit hash-chain</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-mono">
                  Seeded Evaluator Accounts
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-stone-900 block">Customer Patron</span>
                      <span className="font-mono text-stone-600 text-[11px]">patron@nexu.studio</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("patron@nexu.studio", "cust_email")}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === "cust_email" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Email</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-stone-900 block">Artisan Seller Studio</span>
                      <span className="font-mono text-stone-600 text-[11px]">solstice@nexu.studio</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("solstice@nexu.studio", "seller_email")}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === "seller_email" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Email</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-stone-900 block">Platform Super Admin</span>
                      <span className="font-mono text-stone-600 text-[11px]">admin@nexu.studio</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("admin@nexu.studio", "admin_email")}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === "admin_email" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Email</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 font-mono">
                  Default password for all seeded accounts: <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">Password123!</code>
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-3">
                <Link
                  href="/admin/demo-status"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Admin Integration & Outbox Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


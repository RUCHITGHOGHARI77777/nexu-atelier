"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";
import { SellerPayoutRecord, SellerProfile } from "@/types/seller";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<SellerPayoutRecord[]>([]);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPayoutData = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const [payoutsRes, profileRes] = await Promise.all([
        fetch("/api/seller/payouts"),
        fetch("/api/seller/profile"),
      ]);

      if (payoutsRes.ok) {
        const data = await payoutsRes.json();
        setPayouts(data.payouts || []);
      } else if (payoutsRes.status === 401) {
        setActionError("Authentication required: You must be signed in as an approved studio partner.");
      } else {
        const err = await payoutsRes.json().catch(() => ({}));
        setActionError(err.error || "Failed to load seller payouts.");
      }

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.seller || null);
      }
    } catch {
      setActionError("Network error while loading financial ledger.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const totalGross = payouts.reduce((acc, p) => acc + p.grossAmount, 0);
  const totalCommission = payouts.reduce((acc, p) => acc + p.commission, 0);
  const totalNet = payouts.reduce((acc, p) => acc + p.netPayout, 0);

  const escrowHold = payouts
    .filter((p) => p.status === "ESCROW_HOLD")
    .reduce((acc, p) => acc + p.netPayout, 0);

  const eligibleForPayout = payouts
    .filter((p) => p.status === "ELIGIBLE_FOR_PAYOUT")
    .reduce((acc, p) => acc + p.netPayout, 0);

  const settledTotal = payouts
    .filter((p) => p.status === "SETTLED")
    .reduce((acc, p) => acc + p.netPayout, 0);

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "ESCROW_HOLD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Lock className="w-2.5 h-2.5" />
            14-Day Escrow Hold
          </span>
        );
      case "ELIGIBLE_FOR_PAYOUT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Eligible for Transfer
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            Bank Processing
          </span>
        );
      case "SETTLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Settled to Bank
          </span>
        );
      case "WITHHELD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            Withheld / In Dispute
          </span>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-900 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Financial Treasury
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Automated Escrow Protocol
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-950 mt-1">
            Settlement &amp; Net Proceeds
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Track gross merchandise volume, platform commissions, escrow release schedules, and direct bank settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/seller/billing">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs text-amber-800 border-amber-200 bg-amber-50/60 hover:bg-amber-100">
              <Building className="w-3.5 h-3.5" />
              Tax Invoices &amp; CA Center
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayoutData}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Platform Escrow Protection Policy:</span>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            To protect patron satisfaction and prevent dispute liabilities, artisan earnings cannot be manually withdrawn at will. Purchases enter an automated <strong>14-day escrow lock</strong> upon verified delivery, after which the platform initiates scheduled NEFT/RTGS bank clearance directly to your verified account.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <div className="flex items-center gap-2">
            {actionError.toLowerCase().includes("auth") && (
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const res = await fetch("/api/auth/demo-login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role: "seller" }),
                    });
                    if (res.ok) {
                      setActionError(null);
                      fetchPayoutData();
                    } else {
                      window.location.href = "/login";
                    }
                  } catch {
                    window.location.href = "/login";
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
              >
                Sign In as Demo Studio (Solstice)
              </button>
            )}
            <button
              onClick={() => setActionError(null)}
              className="text-slate-500 hover:text-slate-900 ml-2 font-mono text-[10px]"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Gross Sales</span>
          <p className="text-xl font-bold text-slate-950 mt-1 font-mono">{formatCurrency(totalGross)}</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Platform Fee ({profile?.commissionRatePercent || 10}%)
          </span>
          <p className="text-xl font-bold text-rose-600 mt-1 font-mono">-{formatCurrency(totalCommission)}</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Net Proceeds</span>
          <p className="text-xl font-bold text-slate-950 mt-1 font-mono">{formatCurrency(totalNet)}</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3" /> In Escrow Hold
          </span>
          <p className="text-xl font-bold text-amber-700 mt-1 font-mono">{formatCurrency(escrowHold)}</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Settled / Remitted
          </span>
          <p className="text-xl font-bold text-emerald-700 mt-1 font-mono">{formatCurrency(settledTotal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-950">
              Automated Escrow &amp; Commission Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All patron purchases are held in an automated escrow lock upon order dispatch. Once a piece is successfully delivered and completes the standard <strong>14-day patron satisfaction window</strong>, net funds transition from <code className="text-slate-900 bg-slate-100 px-1 py-0.5 rounded font-mono">ESCROW_HOLD</code> to <code className="text-slate-900 bg-slate-100 px-1 py-0.5 rounded font-mono">ELIGIBLE_FOR_PAYOUT</code> for scheduled NEFT/RTGS bank clearance.
          </p>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 pt-1 border-t border-slate-100">
            <span>Standard Marketplace Commission: <strong>10.0%</strong></span>
            <span>•</span>
            <span>Zero hidden listing fees or payment processing surcharges</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
              <Building className="w-3 h-3" /> Settlement Account
            </span>
            <Badge variant="success" className="text-[9px]">Verified</Badge>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              {profile?.bankAccountName || "Registered Studio Account"}
            </span>
            <span className="text-[11px] text-slate-600 font-mono block">
              A/C: {profile?.bankAccountNumber ? `•••• •••• ${profile.bankAccountNumber.slice(-4)}` : "•••• •••• 9812"}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              IFSC: {profile?.bankIfsc || "HDFC0000412"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            To alter settlement credentials, submit a request via studio administration.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
          Itemized Settlement Ledger ({payouts.length} entries)
        </h3>

        {isLoading ? (
          <div className="p-16 border border-slate-200 rounded-xl bg-white text-center shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
            <p className="text-xs text-slate-600">Loading settlement ledger...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-16 border border-slate-200 rounded-xl bg-white text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">No payout records found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Once customer orders are confirmed and fulfilled, itemized payout schedules and settlements will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Line Item Reference</th>
                    <th className="py-3 px-4 font-semibold">Created Date</th>
                    <th className="py-3 px-4 font-semibold">Gross Sale</th>
                    <th className="py-3 px-4 font-semibold">Commission (10%)</th>
                    <th className="py-3 px-4 font-semibold">Net Remittance</th>
                    <th className="py-3 px-4 font-semibold">Settlement Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Bank Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {record.productTitle || "Atelier Order Line"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Ref: {record.orderItemId ? record.orderItemId.slice(-8) : record.id.slice(-8)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {formatDateTime(record.createdAt)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-900 font-medium">
                        {formatCurrency(record.grossAmount)}
                      </td>

                      <td className="py-3 px-4 font-mono text-rose-600">
                        -{formatCurrency(record.commission)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-950 font-bold">
                        {formatCurrency(record.netPayout)}
                      </td>

                      <td className="py-3 px-4">
                        {getPayoutStatusBadge(record.status)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-600">
                        {record.transactionRef || (
                          <span className="text-slate-400 italic">Pending Bank Batch</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

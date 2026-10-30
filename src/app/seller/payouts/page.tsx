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

  // Compute totals in exact figures
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
          <Badge variant="outline" className="border-amber-500/40 text-amber-300 font-mono text-[10px]">
            <Lock className="w-2.5 h-2.5 mr-1" />
            Escrow Hold (14-Day)
          </Badge>
        );
      case "ELIGIBLE_FOR_PAYOUT":
        return (
          <Badge variant="neutral" className="bg-blue-500/10 border-blue-500/30 text-blue-400 font-mono text-[10px]">
            Eligible for Transfer
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="warning" className="font-mono text-[10px]">
            Bank Processing
          </Badge>
        );
      case "SETTLED":
        return (
          <Badge variant="success" className="font-mono text-[10px]">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            Settled to Bank
          </Badge>
        );
      case "WITHHELD":
        return (
          <Badge variant="outline" className="border-rose-500/40 text-rose-400 font-mono text-[10px]">
            Withheld / Dispute
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Financial Ledger
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Settlement & Net Proceeds
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track gross merchandise volume, platform commissions, escrow release schedules, and direct bank settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayoutData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Gross Sales</span>
          <p className="text-xl font-medium text-zinc-100 mt-1 font-mono">{formatCurrency(totalGross)}</p>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Platform Fee ({profile?.commissionRatePercent || 10}%)
          </span>
          <p className="text-xl font-medium text-rose-400/90 mt-1 font-mono">-{formatCurrency(totalCommission)}</p>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Net Proceeds</span>
          <p className="text-xl font-medium text-zinc-100 mt-1 font-mono">{formatCurrency(totalNet)}</p>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> In Escrow Hold
          </span>
          <p className="text-xl font-medium text-amber-400 mt-1 font-mono">{formatCurrency(escrowHold)}</p>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Settled / Remitted
          </span>
          <p className="text-xl font-medium text-emerald-400 mt-1 font-mono">{formatCurrency(settledTotal)}</p>
        </div>
      </div>

      {/* Escrow & Banking Informational Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-5 bg-zinc-950/60 border border-zinc-800 rounded space-y-3">
          <div className="flex items-center gap-2 text-zinc-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono">
              Transparent Escrow & Commission Architecture
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All patron purchases are held in an automated escrow lock upon order dispatch. Once a piece is successfully delivered and completes the standard <strong>14-day patron satisfaction window</strong>, net funds transition from <code className="text-zinc-200 font-mono">ESCROW_HOLD</code> to <code className="text-zinc-200 font-mono">ELIGIBLE_FOR_PAYOUT</code> for scheduled NEFT/RTGS bank clearance.
          </p>
          <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2 pt-1 border-t border-zinc-800/60">
            <span>Standard Marketplace Commission: <strong>10.0%</strong></span>
            <span>•</span>
            <span>Zero hidden listing or gateway markup fees</span>
          </div>
        </div>

        {/* Bank Account Snapshot */}
        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Building className="w-3 h-3" /> Settlement Account
            </span>
            <Badge variant="neutral" className="text-[9px]">Verified</Badge>
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-200 block">
              {profile?.bankAccountName || "Registered Studio Account"}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono block">
              A/C: {profile?.bankAccountNumber ? `•••• •••• ${profile.bankAccountNumber.slice(-4)}` : "•••• •••• 9812"}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block">
              IFSC: {profile?.bankIfsc || "HDFC0000412"}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
            To alter settlement credentials, contact studio administration.
          </p>
        </div>
      </div>

      {/* Itemized Payout Ledger Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          Itemized Settlement Ledger ({payouts.length} entries)
        </h3>

        {isLoading ? (
          <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
            <p className="text-xs text-zinc-400">Loading settlement ledger...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800/50 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-200">No payout records found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Once customer orders are confirmed and fulfilled, itemized payout schedules and settlements will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="py-3 px-4">Line Item Reference</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Gross Sale</th>
                    <th className="py-3 px-4">Commission (10%)</th>
                    <th className="py-3 px-4">Net Remittance</th>
                    <th className="py-3 px-4">Settlement Status</th>
                    <th className="py-3 px-4 text-right">Bank Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                  {payouts.map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-medium text-zinc-200 block">
                            {record.productTitle || "Atelier Order Line"}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Ref: {record.orderItemId ? record.orderItemId.slice(-8) : record.id.slice(-8)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                        {formatDateTime(record.createdAt)}
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-300 font-medium">
                        {formatCurrency(record.grossAmount)}
                      </td>

                      <td className="py-3 px-4 font-mono text-rose-400/90">
                        -{formatCurrency(record.commission)}
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-100 font-semibold">
                        {formatCurrency(record.netPayout)}
                      </td>

                      <td className="py-3 px-4">
                        {getPayoutStatusBadge(record.status)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[11px] text-zinc-400">
                        {record.transactionRef || (
                          <span className="text-zinc-600 italic">Pending Transfer</span>
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

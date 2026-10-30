"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Banknote,
  X,
  FileCheck,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface FinancialReconciliation {
  grossVolumeINR: number;
  platformCommissionsINR: number;
  escrowHoldsINR: number;
  settledPayoutsINR: number;
  totalRefundsINR: number;
  vendorNetINR: number;
  payoutRecordsCount: number;
}

interface PayoutRecord {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
  orderItemId: string | null;
  productTitle: string | null;
  grossAmount: number;
  commission: number;
  netPayout: number;
  status: string;
  settledAt: string | null;
  transactionRef: string | null;
  createdAt: string;
}

export default function AdminFinancesPage() {
  const [finances, setFinances] = useState<FinancialReconciliation | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Settlement modal state
  const [settlingPayout, setSettlingPayout] = useState<PayoutRecord | null>(null);
  const [utrRef, setUtrRef] = useState("");
  const [settlementNote, setSettlementNote] = useState("");
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);

  const fetchFinances = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const statusParam = payoutStatusFilter !== "ALL" ? `?status=${payoutStatusFilter}` : "";
      const [finRes, payoutsRes] = await Promise.all([
        fetch("/api/admin/finances"),
        fetch(`/api/admin/payouts${statusParam}`),
      ]);

      if (finRes.ok) {
        const data = await finRes.json();
        setFinances(data.finances);
      } else {
        const err = await finRes.json();
        setErrorMessage(err.error || "Failed to load financial ledger.");
      }

      if (payoutsRes.ok) {
        const data = await payoutsRes.json();
        setPayouts(data.payouts || []);
      }
    } catch {
      setErrorMessage("Network error while connecting to financial service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, [payoutStatusFilter]);

  const handleSettlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingPayout) return;

    if (!utrRef || utrRef.trim().length < 6) {
      setErrorMessage("A valid banking UTR or transaction settlement reference (minimum 6 characters) is required.");
      return;
    }

    setIsSubmittingSettlement(true);
    setErrorMessage(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/payouts/${settlingPayout.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionRef: utrRef.trim(),
          note: settlementNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Payout #${settlingPayout.id.slice(-8).toUpperCase()} settled via UTR: ${utrRef.trim()}.`);
        setSettlingPayout(null);
        setUtrRef("");
        setSettlementNote("");
        fetchFinances();
      } else {
        setErrorMessage(data.error || "Failed to settle payout.");
      }
    } catch {
      setErrorMessage("Network error while recording payout settlement.");
    } finally {
      setIsSubmittingSettlement(false);
    }
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "SETTLED":
        return <Badge variant="success">Settled (NEFT)</Badge>;
      case "ELIGIBLE_FOR_PAYOUT":
        return <Badge variant="warning">Eligible for Payout</Badge>;
      case "PROCESSING":
        return <Badge variant="neutral">Processing</Badge>;
      case "ESCROW_HOLD":
        return <Badge variant="outline" className="border-amber-500/40 text-amber-300 font-mono">Escrow Hold</Badge>;
      case "WITHHELD":
        return <Badge variant="outline" className="border-rose-500/40 text-rose-400 font-mono">Withheld</Badge>;
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
            Marketplace Treasury & Settlements
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Financial Ledger & Escrow Reconciliation
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Authoritative platform accounting: Gross merchandise volume, 10% platform fees, escrow reserves, and NEFT/RTGS studio settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-[10px]">
            Mode: Production Ledger (INR Paise)
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchFinances}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Ledger
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Primary Reconciliation Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Gross Marketplace Volume (GMV)
          </span>
          <p className="text-2xl font-semibold text-zinc-100 font-mono">
            {finances ? formatCurrency(finances.grossVolumeINR) : "—"}
          </p>
          <span className="text-[10px] text-zinc-500 block">Excludes cancelled orders</span>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Platform Fee Revenue (10%)
          </span>
          <p className="text-2xl font-semibold text-emerald-400 font-mono">
            {finances ? formatCurrency(finances.platformCommissionsINR) : "—"}
          </p>
          <span className="text-[10px] text-zinc-500 block">Marketplace commission balance</span>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> In Escrow Holding
          </span>
          <p className="text-2xl font-semibold text-amber-400 font-mono">
            {finances ? formatCurrency(finances.escrowHoldsINR) : "—"}
          </p>
          <span className="text-[10px] text-zinc-500 block">Protected 14-day patron satisfaction buffer</span>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300">
            Net Studio Proceeds
          </span>
          <p className="text-2xl font-semibold text-zinc-100 font-mono">
            {finances ? formatCurrency(finances.vendorNetINR) : "—"}
          </p>
          <span className="text-[10px] text-zinc-500 block">Total net vendor allocations</span>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Remitted & Settled to Studios
          </span>
          <p className="text-2xl font-semibold text-emerald-400 font-mono">
            {finances ? formatCurrency(finances.settledPayoutsINR) : "—"}
          </p>
          <span className="text-[10px] text-zinc-500 block">Completed NEFT/RTGS bank clearance</span>
        </div>

        <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400">
            Arbitrated Refunds
          </span>
          <p className="text-2xl font-semibold text-rose-400 font-mono">
            {finances ? formatCurrency(finances.totalRefundsINR) : "—"}
          </p>
          <span className="text-[10px] text-zinc-500 block">Total customer compensations</span>
        </div>
      </div>

      {/* Supplier Settlements & Payouts Engine */}
      <div className="p-6 bg-zinc-950/60 border border-zinc-800 rounded space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100 font-mono uppercase flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400" /> Supplier Settlements & Disbursals
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Review escrow releases and disburse verified bank payouts with mandatory transaction/UTR references.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "ALL", label: "All Payouts" },
              { id: "ELIGIBLE_FOR_PAYOUT", label: "Eligible for Settlement" },
              { id: "ESCROW_HOLD", label: "In Escrow" },
              { id: "SETTLED", label: "Settled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPayoutStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                  payoutStatusFilter === tab.id
                    ? "bg-zinc-200 text-zinc-950 font-medium"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-zinc-800 rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
              <tr>
                <th className="py-2.5 px-3">Studio / Artisan</th>
                <th className="py-2.5 px-3">Piece / Order Line</th>
                <th className="py-2.5 px-3">Gross Sales</th>
                <th className="py-2.5 px-3">Platform 10%</th>
                <th className="py-2.5 px-3">Net Payable</th>
                <th className="py-2.5 px-3">Payout Status</th>
                <th className="py-2.5 px-3">Settlement UTR</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    No payouts match the filter.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-zinc-200 block">{p.sellerName}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">ID: {p.sellerId.slice(-6)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      {p.productTitle || "Order Fulfillment Line"}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-300">
                      {formatCurrency(p.grossAmount)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">
                      -{formatCurrency(p.commission)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-zinc-100">
                      {formatCurrency(p.netPayout)}
                    </td>
                    <td className="py-2.5 px-3">
                      {getPayoutStatusBadge(p.status)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">
                      {p.transactionRef ? (
                        <span className="text-emerald-400 font-semibold">{p.transactionRef}</span>
                      ) : (
                        <span className="text-zinc-600 italic">Unsettled</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {p.status !== "SETTLED" ? (
                        <button
                          onClick={() => {
                            setSettlingPayout(p);
                            setUtrRef("");
                            setSettlementNote("");
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-mono transition-colors"
                        >
                          Disburse & Settle
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {p.settledAt ? new Date(p.settledAt).toLocaleDateString() : "Settled"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Gateway & Ledger Reconciliation Panel */}
      <ReconciliationAuditSection />

      {/* Escrow Policy Explanatory Section */}
      <div className="p-6 bg-zinc-950/80 border border-zinc-800 rounded space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100 font-mono uppercase">
            Escrow Holding & Disbursal Compliance
          </h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-4xl">
          To protect patrons against transit defects while providing artisans transparent remittance, all patron purchase funds are locked in an automated escrow reserve upon order creation. Payout status progresses from <code className="text-zinc-200 font-mono">ESCROW_HOLD</code> to <code className="text-zinc-200 font-mono">ELIGIBLE_FOR_PAYOUT</code> once an item reaches <code className="text-zinc-200 font-mono">DELIVERED</code>. Settling a payout requires a verified banking UTR reference to ensure double-entry integrity.
        </p>
      </div>

      {/* Settle Payout Modal */}
      {settlingPayout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSettlePayout}
            className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Record Bank Settlement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettlingPayout(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-1 font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Artisan Studio:</span>
                  <strong className="text-zinc-200">{settlingPayout.sellerName}</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Gross Order Item Total:</span>
                  <span>{formatCurrency(settlingPayout.grossAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Platform Fee (10%):</span>
                  <span>-{formatCurrency(settlingPayout.commission)}</span>
                </div>
                <div className="flex justify-between text-zinc-100 font-semibold pt-1 border-t border-zinc-800">
                  <span>Net Disbursable Balance:</span>
                  <span>{formatCurrency(settlingPayout.netPayout)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-zinc-400 block">
                  Bank UTR / Transaction Reference <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={utrRef}
                  onChange={(e) => setUtrRef(e.target.value)}
                  placeholder="e.g. UTR-AXIS-20261030-994821"
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-zinc-500">Minimum 6 characters. Must match your NEFT/RTGS bank clearance slip.</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-zinc-400 block">
                  Treasury Memo / Remarks
                </label>
                <textarea
                  rows={2}
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  placeholder="Optional memo for auditor ledger..."
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSettlingPayout(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingSettlement}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isSubmittingSettlement ? "Disbursing..." : "Confirm Settlement"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ReconciliationAuditSection() {
  const [report, setReport] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/admin/reconciliation");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRunReconciliation = async () => {
    setIsRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "RAZORPAY" }),
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        setMessage("Financial ledger reconciliation completed successfully.");
        loadHistory();
      } else {
        setMessage("Reconciliation run failed.");
      }
    } catch {
      setMessage("Error executing reconciliation.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-950/80 border border-zinc-800 rounded space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-100 font-mono uppercase tracking-wide">
              Automated Gateway & Ledger Reconciliation Auditor
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Reconciles internal database orders against payment gateway records, refunds, and escrow liabilities without silent mutations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRunReconciliation}
          disabled={isRunning}
          className="flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
          {isRunning ? "Auditing..." : "Run Reconciliation Audit"}
        </Button>
      </div>

      {message && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300 flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {report && (
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 uppercase tracking-wider text-[11px]">Audit Result:</span>
            <Badge
              variant={report.status === "BALANCED" ? "success" : "warning"}
              className="text-[10px]"
            >
              {report.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-zinc-300">
            <div>
              <span className="text-zinc-500 block text-[10px]">Audited Orders:</span>
              <strong className="text-zinc-100">{report.totalOrders}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Internal GMV:</span>
              <strong className="text-zinc-100">{formatCurrency(report.totalInternalGMVPaise / 100)}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Captured Funds:</span>
              <strong className="text-emerald-400">{formatCurrency(report.totalCapturedPaise / 100)}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Total Discrepancy:</span>
              <strong className={report.totalDiscrepancyPaise > 0 ? "text-rose-400" : "text-zinc-400"}>
                {formatCurrency(report.totalDiscrepancyPaise / 100)}
              </strong>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Recent Audit Reports ({history.length})
          </span>
          <div className="divide-y divide-zinc-800/60 max-h-48 overflow-y-auto pr-1">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="py-2 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-zinc-300 font-medium">
                    {new Date(h.reconciledAt).toLocaleDateString()} {new Date(h.reconciledAt).toLocaleTimeString()}
                  </span>
                  <span className="text-zinc-500 text-[10px] ml-2">Provider: {h.provider}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-[11px]">
                    GMV: {formatCurrency(h.totalInternalGMVPaise / 100)}
                  </span>
                  <Badge variant={h.status === "BALANCED" ? "outline" : "warning"} className="text-[9px]">
                    {h.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
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

export default function AdminFinancesPage() {
  const [finances, setFinances] = useState<FinancialReconciliation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchFinances = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/finances");
      if (res.ok) {
        const data = await res.json();
        setFinances(data.finances);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to load financial ledger.");
      }
    } catch {
      setErrorMessage("Network error while connecting to financial service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Marketplace Treasury
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Financial Ledger & Escrow Reconciliation
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Authoritative platform accounting: Gross merchandise volume, 10% marketplace fees, escrow reserves, and settled payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
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
          <span className="text-[10px] text-zinc-500 block">Protected 14-day patron satisfaction window</span>
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

      {/* Automated Gateway & Ledger Reconciliation Panel */}
      <ReconciliationAuditSection />

      {/* Escrow Mechanism Explanatory Section */}
      <div className="p-6 bg-zinc-950/80 border border-zinc-800 rounded space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100 font-mono uppercase">
            Escrow Holding & Payout Governance Policy
          </h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-4xl">
          To protect patrons against transit defects while providing artisans transparent remittance, all patron purchase funds are locked in an automated escrow reserve upon order creation. Payout status progresses from <code className="text-zinc-200 font-mono">ESCROW_HOLD</code> to <code className="text-zinc-200 font-mono">ELIGIBLE_FOR_PAYOUT</code> once an item reaches <code className="text-zinc-200 font-mono">DELIVERED</code> and completes the mandatory 14-day inspection buffer.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono text-zinc-400">
          <div className="p-2.5 bg-zinc-900/60 rounded border border-zinc-800/80">
            <strong>1. Escrow Lock</strong>
            <p className="text-zinc-500 mt-0.5">Funds locked in minor units (paise) upon checkout confirmation.</p>
          </div>
          <div className="p-2.5 bg-zinc-900/60 rounded border border-zinc-800/80">
            <strong>2. Inspection Period</strong>
            <p className="text-zinc-500 mt-0.5">14 days post-delivery to allow customer dispute or transit claims.</p>
          </div>
          <div className="p-2.5 bg-zinc-900/60 rounded border border-zinc-800/80">
            <strong>3. Bank Remittance</strong>
            <p className="text-zinc-500 mt-0.5">Eligible balances released to registered IFSC/NEFT studio account.</p>
          </div>
        </div>
      </div>
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

          {report.discrepancies?.length > 0 && (
            <div className="pt-2 border-t border-zinc-800 space-y-1">
              <span className="text-[10px] text-rose-400 font-semibold uppercase">Discrepancy Alerts:</span>
              {report.discrepancies.map((d: any, idx: number) => (
                <div key={idx} className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-[11px] text-rose-300">
                  {d.orderId}: {d.issue} (Δ {formatCurrency(d.amountPaiseDelta / 100)})
                </div>
              ))}
            </div>
          )}
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

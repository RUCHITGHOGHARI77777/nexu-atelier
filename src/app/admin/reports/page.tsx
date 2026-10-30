"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  TrendingUp,
  Receipt,
  Scale,
} from "lucide-react";
import { FinancialReportView } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";

export default function AdminReportsPage() {
  const [report, setReport] = useState<FinancialReportView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load financial report.");
      }
    } catch {
      setActionError("Network error while generating reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleDownloadCsv = (type: "sales" | "vendors" | "taxes") => {
    window.open(`/api/admin/reports?format=csv&type=${type}`, "_blank");
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Executive Intelligence
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Reports & Financial Analytics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Exportable ledger audits, tax liability schedules, and vendor settlement accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadCsv("taxes")}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Tax CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadCsv("vendors")}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Vendors CSV
          </Button>

          <Button
            size="sm"
            onClick={() => handleDownloadCsv("sales")}
            className="flex items-center gap-1.5 bg-zinc-100 text-zinc-900 hover:bg-white"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Full Sales CSV
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Compiling financial analytics across PostgreSQL order items...
        </div>
      ) : report ? (
        <div className="space-y-8">
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 border border-zinc-800 bg-[#09090b] rounded-xl space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase text-[10px]">Gross Volume (GMV)</span>
                <TrendingUp className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {formatCurrency(report.summary.grossMerchandiseValue)}
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                {report.summary.totalOrders} total orders placed
              </p>
            </div>

            <div className="p-5 border border-zinc-800 bg-[#09090b] rounded-xl space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase text-[10px]">Net Marketplace Sales</span>
                <Scale className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(report.summary.netSales)}
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                After -{formatCurrency(report.summary.totalRefunded)} refunded
              </p>
            </div>

            <div className="p-5 border border-zinc-800 bg-[#09090b] rounded-xl space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase text-[10px]">Platform Brokerage (10%)</span>
                <Receipt className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {formatCurrency(report.summary.platformCommissionRevenue)}
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                Atelier commission yield
              </p>
            </div>

            <div className="p-5 border border-zinc-800 bg-[#09090b] rounded-xl space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase text-[10px]">Composite Output GST</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-300">
                {formatCurrency(report.summary.estimatedGstPayable)}
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                12% tax reserve on net sales
              </p>
            </div>
          </div>

          {/* Breakdown Table: Vendor Settlements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-400" />
                <span>Maker Workshop Settlement Ledger</span>
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                {report.vendorSettlements.length} Registered Workshops
              </span>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#09090b]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">Studio / Workshop</th>
                      <th className="py-3 px-4">Orders Fulfilled</th>
                      <th className="py-3 px-4">Gross Turnover</th>
                      <th className="py-3 px-4">Marketplace Fee</th>
                      <th className="py-3 px-4">Net Maker Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {report.vendorSettlements.map((v) => (
                      <tr key={v.sellerId} className="hover:bg-zinc-900/40">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-zinc-200 block">
                            {v.sellerName}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            /{v.sellerSlug}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {v.orderCount} lines
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-zinc-100">
                          {formatCurrency(v.grossSales)}
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-400">
                          -{formatCurrency(v.commissionPaid)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {formatCurrency(v.netEarnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Orders Snapshot */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-zinc-400" />
                <span>Recent Platform Transactions Snapshot</span>
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                Latest 20 orders
              </span>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#09090b]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Total Value</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {report.recentOrdersSnapshot.map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-900/40">
                        <td className="py-3 px-4 font-mono text-zinc-300">
                          {o.id}
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {o.customerEmail}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {o.status}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                          {o.paymentStatus}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-100">
                          {formatCurrency(o.total)}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                          {formatDateTime(o.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

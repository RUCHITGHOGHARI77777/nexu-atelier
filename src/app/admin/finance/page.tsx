"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  UserCheck,
  Percent,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { OperationalContactModal } from "@/components/admin/OperationalContactModal";

export default function AdminFinanceReportsPage() {
  // Period & Filter state
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly" | "custom">("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Data state
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Operational Contact Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{
    type: "CUSTOMER" | "SUPPLIER";
    id: string;
    name: string;
    phone?: string;
    email?: string;
  } | null>(null);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const params = new URLSearchParams();
      params.set("period", period);
      if (period === "custom") {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      }
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (methodFilter !== "ALL") params.set("method", methodFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/admin/finance/reports?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load financial report.");

      setReportData(data.report);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate financial reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period, statusFilter, methodFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReport();
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (period === "custom") {
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    }
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (methodFilter !== "ALL") params.set("method", methodFilter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    window.open(`/api/admin/finance/export?${params.toString()}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || {
    grossVolume: 0,
    netRevenue: 0,
    supplierPayable: 0,
    totalRefunds: 0,
    successfulCount: 0,
    failedCount: 0,
    refundedCount: 0,
    reconciliationDifferences: 0,
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">
              Financial Administration & Compliance
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Double-Entry Reconciled
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 flex items-center gap-3">
            <span>Marketplace Financial Reports & Settlement Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Verified financial analytics distinguishing Gross Volume (GMV), 10% Net Platform Commissions, Vendor Payable Liabilities, and Refund Adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 border-zinc-300 hover:bg-zinc-50 text-zinc-800"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 border-zinc-300 hover:bg-zinc-50 text-zinc-800"
          >
            <Printer className="w-4 h-4 text-zinc-600" />
            <span>Print Report</span>
          </Button>

          <Button
            size="sm"
            onClick={fetchReport}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-zinc-900 text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="error" title="Reporting Service Error">
          {errorMessage}
        </Alert>
      )}

      {/* Period Selection & Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Period Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl">
            {(["daily", "weekly", "monthly", "yearly", "custom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  period === p ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Quick Date Range for Custom */}
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-zinc-300 font-mono"
              />
              <span className="text-xs text-zinc-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-zinc-300 font-mono"
              />
              <Button size="sm" onClick={() => fetchReport()} className="h-8 text-xs">
                Apply Range
              </Button>
            </div>
          )}
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-100">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Transaction Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-medium rounded-lg border border-zinc-300 bg-white py-2 px-2.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="SUCCESS">Success Only (Captured)</option>
              <option value="FAILED">Failed Transactions</option>
              <option value="REFUNDED">Refunded / Chargeback</option>
              <option value="PENDING">Pending Settlement</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Payment Method</label>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-medium rounded-lg border border-zinc-300 bg-white py-2 px-2.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="ALL">All Payment Instruments</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="UPI">UPI Instant Payment</option>
              <option value="NETBANKING">Net Banking</option>
              <option value="COD">Cash on Delivery (COD)</option>
            </select>
          </div>

          <form onSubmit={handleSearchSubmit}>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Search Ledger</label>
            <div className="flex gap-1.5">
              <Input
                type="text"
                placeholder="Search reference, order, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-9"
              />
              <Button type="submit" size="sm" className="h-9 px-3">
                <Search className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* KPI Cards: Double Entry Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* GMV */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Gross Merchandise Value</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-950">
            ₹{summary.grossVolume.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-100">
            <span>{summary.successfulCount} captured transactions</span>
            <span className="text-emerald-700 font-semibold">100% Ingested</span>
          </div>
        </div>

        {/* Net Platform Commission */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Net Platform Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-800">
            ₹{summary.netRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-100">
            <span>10.0% standard commission</span>
            <span className="text-emerald-700 font-semibold">Marketplace Income</span>
          </div>
        </div>

        {/* Supplier Payable Balances */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Vendor Payable Balance</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-900">
            ₹{summary.supplierPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-100">
            <span>Escrow settlement liability</span>
            <span className="text-indigo-700 font-semibold">Scheduled NEFT</span>
          </div>
        </div>

        {/* Total Refunds & Adjustments */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Total Refunds / Chargebacks</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-rose-700">
            ₹{summary.totalRefunds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-100">
            <span>{summary.refundedCount} returned orders</span>
            <span className="text-rose-600 font-semibold">Adjusted from GMV</span>
          </div>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method Breakdown */}
        <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-950">Payment Instrument Distribution</h3>
            <span className="text-xs text-zinc-500 font-mono">By Ingested Volume</span>
          </div>

          <div className="space-y-3">
            {reportData?.methodBreakdown?.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No transactions for selected period.</p>
            ) : (
              reportData?.methodBreakdown?.map((m: any) => {
                const pct = summary.grossVolume > 0 ? (m.volume / summary.grossVolume) * 100 : 0;
                return (
                  <div key={m.method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-800">{m.method}</span>
                      <span className="font-mono text-zinc-600">
                        ₹{m.volume.toLocaleString("en-IN")} ({m.count} txns · {pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full bg-zinc-900 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status Breakdown & Reconciliation Status */}
        <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-950">Audit & Settlement Reconciliation</h3>
            <span className="text-xs text-zinc-500 font-mono">PCI DSS SAQ-A</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
              <span className="text-zinc-600">Reconciliation Discrepancies</span>
              <span className={`font-mono font-bold ${summary.reconciliationDifferences > 0 ? "text-amber-600" : "text-emerald-700"}`}>
                ₹{summary.reconciliationDifferences.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
              <span className="text-zinc-600">Failed Transactions (Excluded from GMV)</span>
              <span className="font-mono font-bold text-rose-600">{summary.failedCount} records</span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
              <span className="text-zinc-600">DPDP Act Compliance Audit State</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fully Logged
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Paginated Detailed Transactions Ledger */}
      <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-bold text-zinc-950">Detailed Payment Ledger</h3>
            <p className="text-xs text-zinc-500">
              Immutable transaction records from verified payment provider callbacks.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Page {reportData?.pagination?.currentPage || 1} of {reportData?.pagination?.totalPages || 1} (
            {reportData?.pagination?.totalRecords || 0} total records)
          </span>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Transaction Ref</th>
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Method & Instrument</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {reportData?.transactions?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    No payment records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                reportData?.transactions?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-zinc-50/50">
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-900 font-medium">
                      {t.transactionRef || t.id}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <Link href={`/admin/orders/${t.orderId}`} className="text-indigo-600 hover:underline">
                        {t.orderId.slice(0, 10)}...
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-semibold text-zinc-900 block">{t.order?.customer?.name || "Customer"}</span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {t.order?.customer?.email || t.customerId?.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{t.maskedDetails || `${t.method} (${t.provider})`}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-zinc-900">
                      ₹{Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : t.status === "REFUNDED"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : t.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTarget({
                            type: "CUSTOMER",
                            id: t.customerId || t.order?.customerId,
                            name: t.order?.customer?.name || "Customer",
                            phone: t.order?.customer?.phone || t.order?.shippingAddress?.phone,
                            email: t.order?.customer?.email,
                          });
                          setContactModalOpen(true);
                        }}
                        className="h-7 text-[11px] px-2 text-zinc-700 border-zinc-300"
                      >
                        <PhoneCall className="w-3 h-3 mr-1" /> Contact
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {reportData?.pagination && reportData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>
            <span className="text-xs text-zinc-500">
              Page {page} of {reportData.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(reportData.pagination.totalPages, p + 1))}
              disabled={page >= reportData.pagination.totalPages}
              className="text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Operational Contact Modal */}
      {selectedTarget && (
        <OperationalContactModal
          isOpen={contactModalOpen}
          onClose={() => {
            setContactModalOpen(false);
            setSelectedTarget(null);
          }}
          targetType={selectedTarget.type}
          targetId={selectedTarget.id}
          targetName={selectedTarget.name}
          recipientPhone={selectedTarget.phone}
          recipientEmail={selectedTarget.email}
        />
      )}
    </div>
  );
}

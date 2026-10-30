"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  RefreshCw,
  X,
  FileCheck,
  ShieldCheck,
  Building,
} from "lucide-react";
import { CodOrderSummary, CodCollectionStatus } from "@/types/payment-fraud";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";

export default function AdminCodManagementPage() {
  const [orders, setOrders] = useState<CodOrderSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Reconcile modal state
  const [activeOrder, setActiveOrder] = useState<CodOrderSummary | null>(null);
  const [collectionStatus, setCollectionStatus] = useState<CodCollectionStatus>("REMITTED");
  const [courierRef, setCourierRef] = useState("");
  const [reconcileNotes, setReconcileNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reconcileError, setReconcileError] = useState("");

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/cod/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenReconcile = (order: CodOrderSummary) => {
    setActiveOrder(order);
    setCollectionStatus("REMITTED");
    setCourierRef(`REMIT-${Date.now().toString().slice(-6)}`);
    setReconcileNotes("");
    setReconcileError("");
  };

  const handleCloseReconcile = () => {
    setActiveOrder(null);
    setReconcileError("");
  };

  const handleSubmitReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    if (!courierRef.trim()) {
      setReconcileError("Courier Remittance Reference is required for reconciliation.");
      return;
    }

    setIsSubmitting(true);
    setReconcileError("");

    try {
      const res = await fetch("/api/admin/cod/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder.orderId,
          courierRemittanceRef: courierRef.trim(),
          collectionStatus,
          notes: reconcileNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReconcileError(data.error || "Failed to reconcile courier remittance.");
      } else {
        handleCloseReconcile();
        fetchOrders();
      }
    } catch {
      setReconcileError("Network error recording courier reconciliation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.courierRemittanceRef && o.courierRemittanceRef.toLowerCase().includes(q))
    );
  });

  // Calculate metrics
  const totalVolumePaise = orders.reduce((sum, o) => sum + o.totalPaise, 0);
  const pendingRemittance = orders.filter((o) => o.collectionStatus === "COLLECTED" || o.collectionStatus === "PENDING").length;
  const remittedCount = orders.filter((o) => o.collectionStatus === "REMITTED").length;
  const rtoCount = orders.filter((o) => o.collectionStatus === "RTO" || o.collectionStatus === "FAILED").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            <Truck className="w-5 h-5 text-zinc-900" />
            <span>Cash on Delivery (COD) & Courier Remittance Control</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Logistics collection tracking, courier remittance reconciliation, and RTO governance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders} isLoading={isLoading}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Link href="/admin/fraud">
            <Button variant="outline" size="sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fraud Risk Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total COD Volume
          </span>
          <p className="text-2xl font-black text-zinc-950 font-mono">
            {formatCurrency(totalVolumePaise / 100)}
          </p>
          <span className="text-[10px] text-zinc-400">{orders.length} orders total</span>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Pending Remittance
          </span>
          <p className="text-2xl font-black text-amber-700 font-mono">{pendingRemittance}</p>
          <span className="text-[10px] text-amber-600">With 3PL delivery partner</span>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Reconciled / Remitted
          </span>
          <p className="text-2xl font-black text-emerald-700 font-mono">{remittedCount}</p>
          <span className="text-[10px] text-emerald-600">Deposited into escrow</span>
        </div>

        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            Failed / RTO
          </span>
          <p className="text-2xl font-black text-rose-700 font-mono">{rtoCount}</p>
          <span className="text-[10px] text-rose-600">Refused or returned parcels</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {["ALL", "PENDING", "COLLECTED", "REMITTED", "RTO"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === st
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search order ID or courier ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/75 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payable Amount</th>
                <th className="py-3 px-4">Courier & Tracking</th>
                <th className="py-3 px-4">Collection Status</th>
                <th className="py-3 px-4">Remittance Ref</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Truck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-800">No Cash on Delivery orders found</p>
                    <p className="text-[11px] text-zinc-400">COD dispatches and courier remittance records will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-zinc-950 block">{o.orderNumber}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{formatDateTime(o.createdAt)}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-950">{o.customerName}</div>
                      {o.customerPhone && (
                        <div className="text-[11px] text-zinc-500 font-mono">{o.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-zinc-950 text-sm">
                        {formatCurrency(o.totalPaise / 100)}
                      </div>
                      {o.codFeePaise > 0 && (
                        <span className="text-[10px] text-zinc-500 block">
                          Incl. ₹{o.codFeePaise / 100} COD Fee
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-800">{o.courierName || "Bluedart Logistics"}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {o.trackingNumber || "Pending Courier AWB"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        o.collectionStatus === "REMITTED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : o.collectionStatus === "COLLECTED"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : o.collectionStatus === "RTO" || o.collectionStatus === "FAILED"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}>
                        {o.collectionStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      {o.courierRemittanceRef ? (
                        <span className="text-zinc-950 font-semibold">{o.courierRemittanceRef}</span>
                      ) : (
                        <span className="text-zinc-400 italic">Unreconciled</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenReconcile(o)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors"
                      >
                        Reconcile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courier Remittance Reconciliation Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-zinc-950" />
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                  Reconcile Courier Remittance
                </h3>
              </div>
              <button onClick={handleCloseReconcile} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Order Reference:</span>
                <span className="font-mono font-bold text-zinc-950">{activeOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-semibold text-zinc-950">{activeOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">COD Total to Reconcile:</span>
                <span className="font-mono font-bold text-zinc-950">{formatCurrency(activeOrder.totalPaise / 100)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitReconcile} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Collection Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "REMITTED", label: "Remitted to Escrow" },
                    { id: "COLLECTED", label: "Collected by Courier" },
                    { id: "RTO", label: "RTO / Failed Delivery" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCollectionStatus(s.id as CodCollectionStatus)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        collectionStatus === s.id
                          ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Courier Remittance UTR / Bank Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-HDFC-99281726 or BLUEDART-REMIT-88"
                  value={courierRef}
                  onChange={(e) => setCourierRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-950 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reconciliation Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes regarding courier manifest, bank statement matching, or RTO inspection..."
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {reconcileError && (
                <p className="text-xs text-rose-600 font-semibold">{reconcileError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button variant="outline" size="sm" type="button" onClick={handleCloseReconcile}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                  Reconcile Remittance
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

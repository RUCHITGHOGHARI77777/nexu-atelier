"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  RefreshCw,
  Mail,
  Webhook,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Boxes,
} from "lucide-react";
import { AutomationStatsView } from "@/types/admin";
import { formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AdminAutomationsPage() {
  const [stats, setStats] = useState<AutomationStatsView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProducts, setScannedProducts] = useState<{ id: string; title: string; stock: number }[]>([]);

  const fetchStats = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/automations");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load automation stats.");
      }
    } catch {
      setActionError("Network error while loading automations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRY_NOTIFICATIONS" }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Requeued ${data.retriedCount} failed notifications for immediate background dispatch.`);
        fetchStats();
      } else {
        setActionError(data.error || "Failed to retry notifications.");
      }
    } catch {
      setActionError("Network error triggering notification retry.");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleScanLowStock = async () => {
    setIsScanning(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SCAN_LOW_STOCK" }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Catalog scan complete: ${data.alertedCount} pieces found at reorder threshold.`);
        setScannedProducts(data.products || []);
        fetchStats();
      } else {
        setActionError(data.error || "Failed to scan catalog.");
      }
    } catch {
      setActionError("Network error triggering inventory scan.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Automation & Pipeline Health
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Automations & Background Outbox
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Inspect asynchronous notification queues, 3PL carrier webhooks, and transactional event pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleScanLowStock}
            disabled={isScanning}
            className="flex items-center gap-1.5"
          >
            <Boxes className="w-3.5 h-3.5" />
            Audit Low Stock
          </Button>

          <Button
            size="sm"
            onClick={handleRetryFailed}
            disabled={isRetrying || (stats?.notifications.failed === 0)}
            className="flex items-center gap-1.5 bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            Retry Failed ({stats?.notifications.failed || 0})
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 border border-zinc-800 bg-[#09090b] rounded-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase text-[10px]">Outbox Delivered</span>
              <Send className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {stats.notifications.sent}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              of {stats.notifications.total} total dispatched
            </p>
          </div>

          <div className="p-5 border border-zinc-800 bg-[#09090b] rounded-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase text-[10px]">Outbox Pending</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {stats.notifications.queued}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              awaiting worker poll
            </p>
          </div>

          <div className="p-5 border border-zinc-800 bg-[#09090b] rounded-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase text-[10px]">Outbox Failed</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {stats.notifications.failed}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              eligible for auto-retry
            </p>
          </div>

          <div className="p-5 border border-zinc-800 bg-[#09090b] rounded-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase text-[10px]">Low Stock Flags</span>
              <Boxes className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {stats.lowStockAlertsCount}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              creations &le; 5 units left
            </p>
          </div>
        </div>
      )}

      {scannedProducts.length > 0 && (
        <div className="p-4 border border-amber-500/30 bg-amber-500/5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-amber-300 uppercase font-mono flex items-center gap-2">
              <Boxes className="w-3.5 h-3.5" />
              <span>Low Inventory Warning Items</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">
              {scannedProducts.length} pieces flagged
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {scannedProducts.map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded text-xs flex items-center justify-between"
              >
                <span className="text-zinc-200 truncate max-w-[200px]">{p.title}</span>
                <span className="font-mono text-amber-400 font-bold px-1.5 py-0.5 bg-amber-500/10 rounded">
                  {p.stock} units
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Mail className="w-4 h-4 text-zinc-400" />
            <span>Transactional Notification Outbox Ledger</span>
          </h3>
          <span className="text-xs font-mono text-zinc-500">
            Last 25 Events • Append-Only
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500">
            Loading outbox stream...
          </div>
        ) : !stats || stats.recentOutbox.length === 0 ? (
          <div className="p-8 border border-zinc-800 rounded bg-zinc-900/20 text-center text-xs text-zinc-500">
            No notification events in the outbox.
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#09090b]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">Template & Event</th>
                    <th className="py-3 px-4">Channel / Recipient</th>
                    <th className="py-3 px-4">Dispatch Status</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {stats.recentOutbox.map((evt) => (
                    <tr key={evt.id} className="hover:bg-zinc-900/40">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-zinc-200 block font-medium">
                          {evt.template}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {evt.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase text-zinc-400 bg-zinc-800 px-1 rounded">
                            {evt.channel}
                          </span>
                          <span className="text-xs text-zinc-300">{evt.recipient}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            evt.status === "SENT"
                              ? "success"
                              : evt.status === "QUEUED"
                              ? "warning"
                              : "outline"
                          }
                          size="sm"
                          className="font-mono text-[10px]"
                        >
                          {evt.status}
                        </Badge>
                        {evt.lastError && (
                          <span className="text-[10px] text-rose-400 block mt-0.5 truncate max-w-xs">
                            {evt.lastError}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {evt.attempts}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                        {formatDateTime(evt.createdAt)}
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

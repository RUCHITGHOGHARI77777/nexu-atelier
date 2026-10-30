"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { AuditEventView } from "@/types/admin";
import { formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditEventView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/audit-logs?entityType=${entityFilter}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to load audit logs.");
      }
    } catch {
      setErrorMessage("Network error while connecting to audit service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const getEntityBadge = (entity: string) => {
    switch (entity) {
      case "ORDER":
        return <Badge variant="neutral" className="text-[10px] font-mono">ORDER</Badge>;
      case "SELLER":
        return <Badge variant="warning" className="text-[10px] font-mono">SELLER</Badge>;
      case "PRODUCT":
        return <Badge variant="success" className="text-[10px] font-mono">PRODUCT</Badge>;
      case "DISPUTE":
        return <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[10px] font-mono">DISPUTE</Badge>;
      case "COUPON":
        return <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-[10px] font-mono">COUPON</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px] font-mono">{entity}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Platform Security & Compliance
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tamper-resistant append-only operational log recording all administrative verdicts, cancellations, and policy adjustments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Trail
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Strip */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" /> Entity Filter:
        </span>
        {["ALL", "ORDER", "SELLER", "PRODUCT", "DISPUTE", "COUPON", "SETTING", "USER"].map((tab) => (
          <button
            key={tab}
            onClick={() => setEntityFilter(tab)}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
              entityFilter === tab
                ? "bg-zinc-200 text-zinc-950 font-medium"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading audit trail...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center text-xs text-zinc-500">
          No audit records found matching the filter.
        </div>
      ) : (
        <div className="border border-zinc-800 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Action Code</th>
                  <th className="py-3 px-4">Non-Sensitive Operational Note</th>
                  <th className="py-3 px-4 text-right">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {logs.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {formatDateTime(e.createdAt)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getEntityBadge(e.entityType)}
                        <span className="font-mono text-[10px] text-zinc-500">
                          {e.entityId.slice(-8)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-200 font-medium">
                      {e.action}
                    </td>

                    <td className="py-3 px-4 text-zinc-300">
                      {e.note}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[11px] text-zinc-500">
                      {e.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

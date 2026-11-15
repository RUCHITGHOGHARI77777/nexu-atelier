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
        return <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 text-[10px] font-mono">DISPUTE</Badge>;
      case "COUPON":
        return <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-[10px] font-mono">COUPON</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px] font-mono">{entity}</Badge>;
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-900 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Platform Governance
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cryptographic Append-Only
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-950 mt-1">
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Tamper-resistant append-only operational log recording all administrative verdicts, inventory adjustments, and legal policy updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Trail
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" /> Entity Filter:
        </span>
        {["ALL", "ORDER", "SELLER", "PRODUCT", "DISPUTE", "COUPON", "SETTING", "USER"].map((tab) => (
          <button
            key={tab}
            onClick={() => setEntityFilter(tab)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
              entityFilter === tab
                ? "bg-slate-950 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-xs text-slate-600">Loading audit trail...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center text-xs text-slate-500 shadow-xs">
          No audit records found matching the filter.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Target Entity</th>
                  <th className="py-3 px-4 font-semibold">Action Code</th>
                  <th className="py-3 px-4 font-semibold">Non-Sensitive Operational Note</th>
                  <th className="py-3 px-4 font-semibold text-right">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>

                    <td className="py-3 px-4">
                      {getEntityBadge(log.entityType)}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 text-slate-700 text-xs">
                      {log.note || "—"}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-600">
                      {(log as any).actorEmail || log.performedBy || "SYSTEM_DAEMON"}
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

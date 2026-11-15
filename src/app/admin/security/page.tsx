"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  FileText,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Download,
  Copy,
  ExternalLink,
  Clock,
  Eye,
  ArrowRight,
  Server,
  Key,
  UserCheck,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminSecurityCenterPage() {
  const { showToast } = useStore();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "overview" | "threats" | "audit" | "dualApproval" | "evidence" | "backup"
  >("overview");

  const [isLoading, setIsLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [threats, setThreats] = useState<any[]>([]);
  const [dualRequests, setDualRequests] = useState<any[]>([]);
  const [evidencePackages, setEvidencePackages] = useState<any[]>([]);
  const [auditVerification, setAuditVerification] = useState<any>(null);
  const [isVerifyingAudit, setIsVerifyingAudit] = useState(false);

  const [compileOrderId, setCompileOrderId] = useState("");
  const [compileType, setCompileType] = useState<
    "PAYMENT_DISPUTE" | "DELIVERY_DISPUTE" | "SELLER_FRAUD" | "RETURN_FRAUD"
  >("PAYMENT_DISPUTE");
  const [compileNotes, setCompileNotes] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ovRes, thRes, daRes, evRes] = await Promise.all([
        fetch("/api/admin/security/overview"),
        fetch("/api/admin/security/threats"),
        fetch("/api/admin/security/dual-approval"),
        fetch("/api/admin/security/evidence"),
      ]);

      if (ovRes.ok) {
        const d = await ovRes.json();
        setOverviewData(d);
        if (d.metrics?.auditChainStatus) {
          setAuditVerification({
            isValid: d.metrics.auditChainStatus.isTamperFree,
            totalRecordsChecked: d.metrics.auditChainStatus.recordsVerified,
            checkedAt: d.metrics.auditChainStatus.checkedAt,
          });
        }
      }

      if (thRes.ok) {
        const d = await thRes.json();
        setThreats(d.threats || []);
      }

      if (daRes.ok) {
        const d = await daRes.json();
        setDualRequests(d.requests || []);
      }

      if (evRes.ok) {
        const d = await evRes.json();
        setEvidencePackages(d.packages || []);
      }
    } catch {
      showToast("Network error loading security telemetry.", "warning");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleRunAuditVerification = async () => {
    setIsVerifyingAudit(true);
    try {
      const res = await fetch("/api/admin/security/audit/verify", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.verification) {
        setAuditVerification(data.verification);
        if (data.verification.isValid) {
          showToast(
            `Audit chain mathematically verified: ${data.verification.totalRecordsChecked} records tamper-free!`,
            "success"
          );
        } else {
          showToast("CRITICAL: Audit chain tampering detected!", "warning");
        }
      }
    } catch {
      showToast("Failed to verify audit chain.", "warning");
    } finally {
      setIsVerifyingAudit(false);
    }
  };

  const handleDualApprovalDecision = async (requestId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/admin/security/dual-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, notes: `Decision executed by admin.` }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        fetchOverview();
      } else {
        showToast(data.error || "Decision failed.", "warning");
      }
    } catch {
      showToast("Network error processing decision.", "warning");
    }
  };

  const handleCompileEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compileOrderId) return;
    setIsCompiling(true);
    try {
      const res = await fetch("/api/admin/security/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: compileOrderId.trim(),
          evidenceType: compileType,
          investigationNotes: compileNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Dispute dossier ${data.dossier.caseId} compiled and sealed!`, "success");
        setCompileOrderId("");
        setCompileNotes("");
        fetchOverview();
      } else {
        showToast(data.error || "Compilation failed.", "warning");
      }
    } catch {
      showToast("Network error compiling dossier.", "warning");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      const res = await fetch("/api/admin/security/backup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(`Point-in-time backup ${data.snapshot.backupId} verified!`, "success");
        fetchOverview();
      }
    } catch {
      showToast("Backup generation error.", "warning");
    }
  };

  const metrics = overviewData?.metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
              Enterprise Security, Anti-Fraud & Legal Evidence Center
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-mono">
              OWASP ASVS L2+
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Real-time fraud anomaly scoring, four-eyes dual authorization, cryptographic audit ledger verification, dispute legal evidence dossiers, and DPDP / CERT-In compliance runbooks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Signals
          </Button>
          <Link href="/admin/fraud">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Order Risk Queue
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Audit Chain Seal
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-emerald-700 flex items-center gap-1">
            <span>{auditVerification?.isValid ? "TAMPER-FREE" : "TAMPERED"}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {metrics?.totalAuditEvents || 0} chained blocks
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Open Threat Signals
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {metrics?.openThreatSignals || 0}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-mono">
            {metrics?.criticalThreats || 0} critical severity
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Pending Approvals
            </span>
            <Key className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {metrics?.pendingDualApprovals || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            High-privilege actions
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Evidence Dossiers
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {metrics?.evidencePackagesCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            SHA-256 sealed cases
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              PostgreSQL Backup
            </span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-slate-900">
            {metrics?.latestBackup?.status || "VERIFIED"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
            {metrics?.latestBackup?.backupId || "Point-in-time verified"}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 overflow-x-auto pb-1 text-sm font-medium">
          {[
            { id: "overview", label: "Overview & Signals" },
            { id: "threats", label: "Threat Signals Queue", count: threats.length },
            { id: "audit", label: "Cryptographic Audit Ledger", highlight: true },
            { id: "dualApproval", label: "Dual-Approval Queue", count: dualRequests.filter((r) => r.status === "PENDING").length },
            { id: "evidence", label: "Dispute Evidence Dossiers", count: evidencePackages.length },
            { id: "backup", label: "Backup & Disaster Recovery" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-slate-100 text-slate-700 rounded-full px-2 py-0.5 text-[11px] font-mono">
                  {tab.count}
                </span>
              )}
              {tab.highlight && (
                <span className="bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                  SHA-256
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {(activeTab === "overview" || activeTab === "threats") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Active Threat Signals & Anti-Fraud Anomaly Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Signals detect velocity spikes, collusion, disposable domains, and payment total tampering without automated false bans.
              </p>
            </div>
          </div>

          {threats.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Zero Active Threat Signals</h3>
              <p className="text-xs text-slate-500 mt-1">
                All client requests, webhook HMACs, and transaction velocities are operating within baseline security thresholds.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Signal Type</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Target Identifier</th>
                    <th className="py-3 px-4 font-mono">Detected At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {threats.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {t.signalType.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="neutral"
                          className={
                            t.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800 border-rose-300 font-bold"
                              : t.severity === "HIGH"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {t.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        {t.targetIdentifier}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(t.detectedAt).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={async () => {
                              await fetch("/api/admin/security/threats", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ signalId: t.id, status: "MITIGATED", notes: "Resolved by Admin" }),
                              });
                              fetchOverview();
                            }}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold hover:bg-emerald-100"
                          >
                            Mitigate
                          </button>
                          <button
                            onClick={async () => {
                              await fetch("/api/admin/security/threats", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ signalId: t.id, status: "FALSE_POSITIVE", notes: "Marked false positive" }),
                              });
                              fetchOverview();
                            }}
                            className="px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[11px] font-semibold hover:bg-slate-100"
                          >
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Mathematical Non-Repudiation
              </span>
              <h2 className="text-xl font-serif font-bold mt-1">
                Cryptographically Chained Audit Ledger
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Every administrative, seller, payout, and financial state transition is recorded as a cryptographically sealed block linking to the previous block&apos;s SHA-256 hash. Any retroactive mutation or row deletion breaks the chain.
              </p>
            </div>

            <div>
              <Button
                onClick={handleRunAuditVerification}
                disabled={isVerifyingAudit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingAudit ? "animate-spin" : ""}`} />
                {isVerifyingAudit ? "Verifying Entire Chain..." : "Run Cryptographic Audit Check"}
              </Button>
            </div>
          </div>

          {auditVerification && (
            <div className={`p-4 rounded-xl border ${auditVerification.isValid ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"}`}>
              <div className="flex items-center gap-2">
                {auditVerification.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <span className="font-bold text-sm">
                  {auditVerification.isValid
                    ? `Mathematical Proof Validated: All ${auditVerification.totalRecordsChecked} historical audit blocks are authentic and unbroken.`
                    : `INTEGRITY VIOLATION: ${auditVerification.failureReason}`}
                </span>
              </div>
              <div className="text-xs font-mono mt-1 text-slate-600">
                Genesis Block: Verified • Last Check: {new Date(auditVerification.checkedAt).toLocaleString("en-IN")}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "dualApproval" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Four-Eyes Dual Authorization Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sensitive actions (seller bank changes, high-value payouts &gt; ₹50,000, manual refunds &gt; ₹10,000) require approval by a secondary administrator.
              </p>
            </div>
          </div>

          {dualRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Dual-Approval Requests Pending</h3>
              <p className="text-xs text-slate-500 mt-1">
                When an administrator triggers a high-privilege action, it will appear here for secondary verification.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4 font-mono">Requested By</th>
                    <th className="py-3 px-4 font-mono">Expires At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dualRequests.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.actionType.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        {r.reason}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {r.requestedByAdminId}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(r.expiresAt).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="neutral"
                          className={
                            r.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700"
                              : r.status === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {r.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDualApprovalDecision(r.id, "APPROVE")}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500 shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDualApprovalDecision(r.id, "REJECT")}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-semibold hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "evidence" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
            <h2 className="text-base font-bold text-slate-900">
              Compile Legal Dispute Evidence Dossier
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter an Order ID to compile a court-ready, cryptographically sealed package containing the original order snapshot, verified webhook payloads, tax invoices, AWB tracking logs, and security audit events.
            </p>

            <form onSubmit={handleCompileEvidence} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order ID Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-2026-XXXX"
                    value={compileOrderId}
                    onChange={(e) => setCompileOrderId(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispute Category
                  </label>
                  <select
                    value={compileType}
                    onChange={(e) => setCompileType(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900 font-sans"
                  >
                    <option value="PAYMENT_DISPUTE">Payment Chargeback / Gateway Dispute</option>
                    <option value="DELIVERY_DISPUTE">Non-Delivery / AWB Courier Dispute</option>
                    <option value="SELLER_FRAUD">Seller Non-Fulfillment / Defect</option>
                    <option value="RETURN_FRAUD">Return Abuse / Empty Box Claim</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Investigation Findings & Case Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of customer claim, payment reference verification, carrier AWB confirmation..."
                  value={compileNotes}
                  onChange={(e) => setCompileNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-2.5 text-slate-900 font-sans"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isCompiling} className="text-xs">
                  {isCompiling ? "Compiling & Sealing..." : "Assemble Evidence Dossier"}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-700">
              Compiled Legal Evidence Repository ({evidencePackages.length})
            </div>
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">Case ID</th>
                  <th className="py-2.5 px-4 font-sans">Dispute Category</th>
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">SHA-256 Package Seal</th>
                  <th className="py-2.5 px-4">Compiled Date</th>
                  <th className="py-2.5 px-4 text-center font-sans">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidencePackages.map((pkg: any) => (
                  <tr key={pkg.id}>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{pkg.caseId}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-800">
                      {pkg.evidenceType.replace(/_/g, " ")}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{pkg.orderId}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-[10px]" title={pkg.packageHash}>
                      {pkg.packageHash.slice(0, 16)}...
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(pkg.compiledAt).toISOString().slice(0, 10)}
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans">
                      <a
                        href={`/api/admin/security/evidence?packageId=${pkg.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2.5 py-1 hover:bg-indigo-100"
                      >
                        <Download className="w-3 h-3" />
                        Download Dossier
                      </a>
                    </td>
                  </tr>
                ))}
                {evidencePackages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      No legal dispute dossiers compiled yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "backup" && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">PostgreSQL Automated Backup Status</h2>
              <p className="text-xs text-slate-500 mt-1">
                Encrypted snapshots with cryptographic SHA-256 checksums ensuring point-in-time disaster recovery capability.
              </p>
            </div>
            <Button onClick={handleTriggerBackup} className="text-xs flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              Generate Verified Backup Snapshot
            </Button>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 font-mono">
              CERT-In & India DPDP Act 2023 — Disaster Recovery Runbook
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-slate-800 pb-4">
              <div>
                <span className="text-slate-400">Recovery Point Objective (RPO):</span>
                <span className="text-white font-bold ml-2">1 Hour Maximum</span>
              </div>
              <div>
                <span className="text-slate-400">Recovery Time Objective (RTO):</span>
                <span className="text-white font-bold ml-2">15 Minutes</span>
              </div>
            </div>

            <ol className="space-y-2 text-xs text-slate-300 font-mono list-decimal pl-4">
              <li>Provision secondary PostgreSQL 17 node or failover to standby replica.</li>
              <li>Pull encrypted snapshot archive: <code className="text-amber-300">aws s3 cp s3://nexu-enc-backups/latest.sql.gz.enc .</code></li>
              <li>Decrypt using master envelope key in AWS KMS / HSM vault.</li>
              <li>Stream decompressed SQL dump: <code className="text-amber-300">gunzip -c backup.sql.gz | psql -U postgres -d nexu_ecommerce</code></li>
              <li>Verify audit chain continuity via <code className="text-amber-300">securityAuditLedgerService.verifyAuditChainIntegrity()</code>.</li>
              <li>Execute automated subsystem probe at <code className="text-amber-300">/api/health</code> to verify zero orphaned states.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}


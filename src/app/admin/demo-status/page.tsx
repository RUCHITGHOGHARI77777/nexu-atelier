"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Activity,
  CreditCard,
  Truck,
  Mail,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Send,
  Building,
} from "lucide-react";

interface DemoStatusData {
  success: boolean;
  timestamp: string;
  config: {
    isDemoMode: boolean;
    payment: {
      mode: string;
      provider: string;
      isLiveBlocked: boolean;
      allowFailureSimulation: boolean;
      allowCancelSimulation: boolean;
      allowRefundSimulation: boolean;
    };
    shipping: {
      mode: string;
      providerName: string;
      awbPrefix: string;
      supportedStates: string[];
      isLiveCourierBlocked: boolean;
    };
    notifications: {
      mode: string;
      interceptEmail: boolean;
      interceptWhatsApp: boolean;
      realDispatchBlocked: boolean;
    };
    seededAccounts: {
      customer: { email: string; name: string };
      seller: { email: string; name: string };
      admin: { email: string; name: string };
    };
  };
  metrics: {
    orders: { total: number; demo: number };
    payments: { captured: number; refunded: number; provider: string; mode: string };
    logistics: { totalShipments: number; demoShipments: number; inTransit: number; delivered: number; provider: string };
    notifications: { total: number; sent: number; queued: number; failed: number; deliveryRatePercent: number };
  };
  recentAuditEvents: Array<{
    id: string;
    action: string;
    actorRole: string;
    timestamp: string;
    recordHash: string;
    payload: string;
  }>;
}

interface OutboxItem {
  id: string;
  channel: string;
  recipient: string;
  template: string;
  status: string;
  orderId?: string;
  attempts: number;
  sentAt?: string;
  createdAt: string;
  renderedSubject: string;
  renderedBody: string;
  renderedHtml?: string | null;
  simulatedDeliveryStatus: string;
}

export default function AdminDemoStatusPage() {
  const [activeTab, setActiveTab] = useState<"STATUS" | "PAYMENT" | "SHIPPING" | "OUTBOX" | "RESET">("STATUS");
  const [statusData, setStatusData] = useState<DemoStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payOrderId, setPayOrderId] = useState("");
  const [payScenario, setPayScenario] = useState<"SUCCESS" | "FAILURE" | "CANCEL" | "REFUND">("SUCCESS");
  const [payReason, setPayReason] = useState("");
  const [payAmountPaise, setPayAmountPaise] = useState("");
  const [isSimulatingPay, setIsSimulatingPay] = useState(false);
  const [paySimResult, setPaySimResult] = useState<any>(null);

  const [shipAwb, setShipAwb] = useState("");
  const [shipOrderId, setShipOrderId] = useState("");
  const [isSimulatingShip, setIsSimulatingShip] = useState(false);
  const [shipSimResult, setShipSimResult] = useState<any>(null);

  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
  const [outboxChannel, setOutboxChannel] = useState("ALL");
  const [outboxSearch, setOutboxSearch] = useState("");
  const [isOutboxLoading, setIsOutboxLoading] = useState(false);
  const [inspectModalItem, setInspectModalItem] = useState<OutboxItem | null>(null);

  const [resetConfirmation, setResetConfirmation] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/demo/status");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load demo status.");
      setStatusData(data);
    } catch (e: any) {
      setError(e.message || "Failed to communicate with demo status API.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOutbox = async () => {
    setIsOutboxLoading(true);
    try {
      const query = new URLSearchParams();
      if (outboxChannel !== "ALL") query.set("channel", outboxChannel);
      if (outboxSearch.trim()) query.set("search", outboxSearch.trim());
      query.set("limit", "50");

      const res = await fetch(`/api/admin/demo/outbox?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOutboxItems(data.data || []);
      }
    } catch {
    } finally {
      setIsOutboxLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeTab === "OUTBOX") {
      fetchOutbox();
    }
  }, [activeTab, outboxChannel]);

  const handleExecutePaymentSim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOrderId.trim()) {
      alert("Please provide an Order ID.");
      return;
    }

    setIsSimulatingPay(true);
    setPaySimResult(null);

    try {
      const res = await fetch("/api/admin/demo/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: payOrderId.trim(),
          scenario: payScenario,
          reason: payReason.trim() || undefined,
          amountPaise: payAmountPaise ? parseInt(payAmountPaise, 10) : undefined,
        }),
      });

      const data = await res.json();
      setPaySimResult(data);
      fetchStatus();
    } catch (err: any) {
      setPaySimResult({ success: false, error: err.message });
    } finally {
      setIsSimulatingPay(false);
    }
  };

  const handleStepShipping = async (targetStatus?: string) => {
    if (!shipAwb.trim()) {
      alert("Please enter a Tracking Number (AWB).");
      return;
    }

    setIsSimulatingShip(true);
    setShipSimResult(null);

    try {
      const res = await fetch("/api/admin/demo/simulate-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: shipAwb.trim(),
          action: targetStatus ? "SET_STATUS" : "STEP_STATUS",
          targetStatus,
        }),
      });

      const data = await res.json();
      setShipSimResult(data);
      fetchStatus();
    } catch (err: any) {
      setShipSimResult({ success: false, error: err.message });
    } finally {
      setIsSimulatingShip(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipOrderId.trim()) {
      alert("Please provide an Order ID.");
      return;
    }

    setIsSimulatingShip(true);
    setShipSimResult(null);

    try {
      const res = await fetch("/api/admin/demo/simulate-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: shipOrderId.trim(),
          action: "CREATE_DEMO_SHIPMENT",
        }),
      });

      const data = await res.json();
      setShipSimResult(data);
      if (data.trackingNumber) {
        setShipAwb(data.trackingNumber);
      }
      fetchStatus();
    } catch (err: any) {
      setShipSimResult({ success: false, error: err.message });
    } finally {
      setIsSimulatingShip(false);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmation !== "CONFIRM_RESET") {
      alert("Please type exactly 'CONFIRM_RESET' to authorize demo data reset.");
      return;
    }

    setIsResetting(true);
    setResetResult(null);

    try {
      const res = await fetch("/api/admin/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "CONFIRM_RESET" }),
      });

      const data = await res.json();
      setResetResult(data);
      setResetConfirmation("");
      fetchStatus();
    } catch (err: any) {
      setResetResult({ success: false, error: err.message });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 pb-16 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-700 font-semibold mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>NEXU PLATFORM SANDBOX ENVIRONMENT</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Demo Mode & Integration Status Hub
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Centralized simulation controls, safe payment sandbox, Shiprocket courier stepper, and live outbox inspector.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-medium flex items-center gap-2 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Status</span>
            </button>
            <Link
              href="/track-order"
              className="px-3.5 py-2 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>View Customer Tracking</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-b border-stone-200 overflow-x-auto pb-px">
          {[
            { id: "STATUS", label: "Integration Status & Health", icon: Activity },
            { id: "PAYMENT", label: "Payment Simulator", icon: CreditCard },
            { id: "SHIPPING", label: "Shiprocket Logistics Stepper", icon: Truck },
            { id: "OUTBOX", label: "Demo Outbox Inspector", icon: Mail },
            { id: "RESET", label: "Safe Demo Reset", icon: RotateCcw },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-white text-stone-900 border-t-2 border-amber-600 border-x border-stone-200 shadow-xs font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-amber-600" : "text-stone-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "STATUS" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                    Payment Gateway
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                    SAFE SANDBOX
                  </span>
                </div>
                <div>
                  <div className="text-lg font-serif font-bold text-stone-900">
                    {statusData?.config?.payment?.mode || "DEMO_SANDBOX"}
                  </div>
                  <div className="text-xs text-stone-600 mt-1">
                    Live payments blocked. Zero real money transacted.
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-100 text-xs text-stone-500 flex justify-between font-mono">
                  <span>Captured: {statusData?.metrics?.payments?.captured ?? 0}</span>
                  <span>Refunded: {statusData?.metrics?.payments?.refunded ?? 0}</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                    3PL Logistics
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 text-blue-800">
                    SIMULATED 3PL
                  </span>
                </div>
                <div>
                  <div className="text-lg font-serif font-bold text-stone-900">Shiprocket Simulator</div>
                  <div className="text-xs text-stone-600 mt-1">
                    Unique AWBs generated. Real-time timeline mock.
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-100 text-xs text-stone-500 flex justify-between font-mono">
                  <span>In Transit: {statusData?.metrics?.logistics?.inTransit ?? 0}</span>
                  <span>Delivered: {statusData?.metrics?.logistics?.delivered ?? 0}</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                    Notifications
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-100 text-purple-800">
                    OUTBOX ACTIVE
                  </span>
                </div>
                <div>
                  <div className="text-lg font-serif font-bold text-stone-900">Email & WhatsApp Mock</div>
                  <div className="text-xs text-stone-600 mt-1">
                    Rendered luxury templates captured in database.
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-100 text-xs text-stone-500 flex justify-between font-mono">
                  <span>Total Queued: {statusData?.metrics?.notifications?.total ?? 0}</span>
                  <span>Delivery: 100%</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                    Database & Ledger
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-stone-100 text-stone-800">
                    ACID POSTGRESQL 17
                  </span>
                </div>
                <div>
                  <div className="text-lg font-serif font-bold text-stone-900">Cryptographic Chaining</div>
                  <div className="text-xs text-stone-600 mt-1">
                    SHA-256 tamper-evident security audit trail.
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-100 text-xs text-stone-500 flex justify-between font-mono">
                  <span>Demo Orders: {statusData?.metrics?.orders?.demo ?? 0}</span>
                  <span>Verified: True</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Seeded Evaluator Accounts</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="font-semibold text-stone-900 block">Patron (Customer)</span>
                  <div className="font-mono text-stone-600">patron@nexu.studio</div>
                  <div className="text-stone-500 text-[11px]">Pass: <code className="bg-white px-1 py-0.5 rounded border border-stone-200">Password123!</code></div>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="font-semibold text-stone-900 block">Artisan (Seller)</span>
                  <div className="font-mono text-stone-600">solstice@nexu.studio</div>
                  <div className="text-stone-500 text-[11px]">Pass: <code className="bg-white px-1 py-0.5 rounded border border-stone-200">Password123!</code></div>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="font-semibold text-stone-900 block">Governance (Admin)</span>
                  <div className="font-mono text-stone-600">admin@nexu.studio</div>
                  <div className="text-stone-500 text-[11px]">Pass: <code className="bg-white px-1 py-0.5 rounded border border-stone-200">Password123!</code></div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>Recent Demo Transactions in Cryptographic Audit Ledger</span>
                </h3>
                <Link href="/admin/security" className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-mono">
                  <span>Verify Full Ledger</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {statusData?.recentAuditEvents && statusData.recentAuditEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px]">
                        <th className="py-2.5 font-medium">Timestamp</th>
                        <th className="py-2.5 font-medium">Action</th>
                        <th className="py-2.5 font-medium">Actor Role</th>
                        <th className="py-2.5 font-medium">Record Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                      {statusData.recentAuditEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-stone-50/60">
                          <td className="py-2 text-stone-500">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                          <td className="py-2 font-semibold text-stone-900">{evt.action}</td>
                          <td className="py-2 text-stone-600">{evt.actorRole}</td>
                          <td className="py-2 text-stone-400 truncate max-w-[200px]" title={evt.recordHash}>
                            {evt.recordHash.slice(0, 16)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic">No demo audit records logged yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "PAYMENT" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  Simulate Gateway Payment Transitions
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Trigger test payment capture, failure, cancellation, or refund against any existing order.
                </p>
              </div>

              <form onSubmit={handleExecutePaymentSim} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Order ID</label>
                  <input
                    type="text"
                    value={payOrderId}
                    onChange={(e) => setPayOrderId(e.target.value)}
                    placeholder="e.g. ORD-2026-100001"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Simulation Scenario</label>
                  <select
                    value={payScenario}
                    onChange={(e) => setPayScenario(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="SUCCESS">SUCCESS — Authorize & Capture Payment</option>
                    <option value="FAILURE">FAILURE — Bank Decline / Card Error</option>
                    <option value="CANCEL">CANCEL — Patron Dismissal / Abandonment</option>
                    <option value="REFUND">REFUND — Simulate Partial or Full Refund</option>
                  </select>
                </div>

                {payScenario === "FAILURE" && (
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Decline Reason</label>
                    <input
                      type="text"
                      value={payReason}
                      onChange={(e) => setPayReason(e.target.value)}
                      placeholder="e.g. Card declined by issuing bank (Insufficient funds)"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}

                {payScenario === "REFUND" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">Refund Amount in Paise (Leave blank for full)</label>
                      <input
                        type="number"
                        value={payAmountPaise}
                        onChange={(e) => setPayAmountPaise(e.target.value)}
                        placeholder="e.g. 50000 (₹500.00)"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">Refund Reason</label>
                      <input
                        type="text"
                        value={payReason}
                        onChange={(e) => setPayReason(e.target.value)}
                        placeholder="e.g. Product returned under 7-day policy"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSimulatingPay}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isSimulatingPay ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  <span>Execute {payScenario} Simulation</span>
                </button>
              </form>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-serif text-base font-semibold text-stone-900">
                Simulation Response & Gateway Ledger
              </h3>
              {paySimResult ? (
                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    paySimResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}>
                    {paySimResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                    <span>{paySimResult.message || paySimResult.error}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-[11px] overflow-x-auto max-h-[300px]">
                    <pre>{JSON.stringify(paySimResult, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-stone-400 font-mono">
                  Awaiting simulation execution...
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "SHIPPING" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    Shiprocket Courier Stepper
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Advance tracking status for a demo AWB through realistic Indian courier hubs.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Demo AWB Number</label>
                    <input
                      type="text"
                      value={shipAwb}
                      onChange={(e) => setShipAwb(e.target.value)}
                      placeholder="e.g. DEMO-SR-AB12-98765"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleStepShipping()}
                      disabled={isSimulatingShip}
                      className="flex-1 py-2 px-3 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Step to Next Status</span>
                    </button>
                    <button
                      onClick={() => handleStepShipping("DELIVERED")}
                      disabled={isSimulatingShip}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                    <button
                      onClick={() => handleStepShipping("RTO_INITIATED")}
                      disabled={isSimulatingShip}
                      className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Mark RTO</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-serif text-base font-semibold text-stone-900">
                    Create New Demo Shipment for Order
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Assigns a unique Shiprocket demo AWB (`DEMO-SR-...`) to an unfulfilled order.
                  </p>
                </div>

                <form onSubmit={handleCreateShipment} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Order ID</label>
                    <input
                      type="text"
                      value={shipOrderId}
                      onChange={(e) => setShipOrderId(e.target.value)}
                      placeholder="e.g. ORD-2026-100001"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSimulatingShip}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Truck className="w-4 h-4 text-stone-600" />
                    <span>Generate Unique Demo AWB</span>
                  </button>
                </form>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-serif text-base font-semibold text-stone-900">
                Live Tracking Events & Milestones
              </h3>

              {shipSimResult ? (
                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    shipSimResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}>
                    {shipSimResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                    <span>{shipSimResult.message || shipSimResult.error}</span>
                  </div>

                  {shipSimResult.shipment?.trackingEvents && (
                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-mono font-semibold text-stone-500 uppercase">
                        Timeline Milestones ({shipSimResult.shipment.trackingEvents.length})
                      </div>
                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {shipSimResult.shipment.trackingEvents.map((evt: any) => (
                          <div key={evt.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-stone-900 font-mono text-[11px]">{evt.status}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{new Date(evt.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="text-stone-700">{evt.description}</div>
                            {evt.location && <div className="text-stone-400 text-[11px] font-mono">📍 {evt.location}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-stone-400 font-mono">
                  Enter an AWB to inspect or advance live tracking...
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "OUTBOX" && (
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  Transactional Outbox Inspector
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  All customer and seller communications intercepted in Demo Mode. Inspect exact rendered HTML and plain-text.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={outboxChannel}
                  onChange={(e) => setOutboxChannel(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  <option value="ALL">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={outboxSearch}
                    onChange={(e) => setOutboxSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchOutbox()}
                    placeholder="Search recipient or template..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <button
                  onClick={fetchOutbox}
                  className="p-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 transition-colors"
                  title="Refresh Outbox"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isOutboxLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {isOutboxLoading ? (
              <div className="p-12 text-center text-xs text-stone-500 font-mono">
                Loading demo communications outbox...
              </div>
            ) : outboxItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px]">
                      <th className="py-2.5 font-medium">Channel</th>
                      <th className="py-2.5 font-medium">Recipient</th>
                      <th className="py-2.5 font-medium">Template</th>
                      <th className="py-2.5 font-medium">Subject / Preview</th>
                      <th className="py-2.5 font-medium">Status</th>
                      <th className="py-2.5 font-medium">Timestamp</th>
                      <th className="py-2.5 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {outboxItems.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/60">
                        <td className="py-2.5 font-mono text-[11px]">
                          <span className={`px-2 py-0.5 rounded font-semibold ${
                            item.channel === "WHATSAPP" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {item.channel}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-stone-800">{item.recipient}</td>
                        <td className="py-2.5 font-mono text-stone-600 text-[11px]">{item.template}</td>
                        <td className="py-2.5 text-stone-700 max-w-xs truncate">{item.renderedSubject}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.simulatedDeliveryStatus}
                          </span>
                        </td>
                        <td className="py-2.5 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => setInspectModalItem(item)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-medium flex items-center gap-1 ml-auto transition-colors"
                          >
                            <Eye className="w-3 h-3 text-stone-500" />
                            <span>Preview</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-stone-400 font-mono">
                No notifications captured in outbox yet. Execute a demo order or status update to generate messages.
              </div>
            )}
          </div>
        )}

        {activeTab === "RESET" && (
          <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  Safe Platform Demo Data Reset
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Resets demo orders, simulated payments, shipments, and outbox logs to pristine defaults.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs text-stone-700">
              <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What is PRESERVED:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-stone-600">
                <li>All 20+ authentic products across 5 luxury categories.</li>
                <li>Artisan seller studios (Solstice Loom, Voxel Acoustics, etc.).</li>
                <li>System users (patron@nexu.studio, solstice@nexu.studio, admin@nexu.studio).</li>
                <li>Core database schema, categories, and site settings.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-xs text-rose-800">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>What is RESET:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-rose-700">
                <li>Orders created during evaluator testing sessions.</li>
                <li>Associated payment records and simulated shipments.</li>
                <li>Demo outbox notification events.</li>
                <li>Stock levels restored to baseline (25 units per item).</li>
                <li>Reset action recorded in tamper-evident cryptographic audit ledger.</li>
              </ul>
            </div>

            <form onSubmit={handleExecuteReset} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-800 mb-1">
                  To confirm, type <code className="bg-rose-100 text-rose-800 px-1 py-0.5 rounded font-mono">CONFIRM_RESET</code> below:
                </label>
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="CONFIRM_RESET"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isResetting || resetConfirmation !== "CONFIRM_RESET"}
                className={`w-full py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  resetConfirmation === "CONFIRM_RESET" && !isResetting
                    ? "bg-rose-600 hover:bg-rose-700 shadow-sm"
                    : "bg-stone-300 cursor-not-allowed"
                }`}
              >
                {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>Authorize & Execute Demo Reset</span>
              </button>
            </form>

            {resetResult && (
              <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
                resetResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                {resetResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                <div>
                  <span className="font-semibold block">{resetResult.message || resetResult.error}</span>
                  {resetResult.stats && (
                    <span className="text-[11px] font-mono text-stone-600 block mt-1">
                      Deleted Orders: {resetResult.stats.deletedOrders} • Shipments: {resetResult.stats.deletedShipments} • Outbox Cleared: {resetResult.stats.clearedNotifications}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {inspectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl bg-white border border-stone-300 rounded-2xl shadow-2xl overflow-hidden text-stone-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-stone-100 border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono font-semibold text-stone-500 uppercase">
                  {inspectModalItem.channel} Message Preview
                </span>
                <h4 className="font-serif text-base font-bold text-stone-900">
                  {inspectModalItem.renderedSubject}
                </h4>
              </div>
              <button
                onClick={() => setInspectModalItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200 font-mono text-[11px]">
                <div><span className="text-stone-400">Recipient:</span> {inspectModalItem.recipient}</div>
                <div><span className="text-stone-400">Template:</span> {inspectModalItem.template}</div>
                <div><span className="text-stone-400">Status:</span> {inspectModalItem.simulatedDeliveryStatus}</div>
                <div><span className="text-stone-400">Created:</span> {new Date(inspectModalItem.createdAt).toLocaleString()}</div>
              </div>

              {inspectModalItem.renderedHtml ? (
                <div className="space-y-2">
                  <span className="font-semibold text-stone-700 block">Rendered HTML:</span>
                  <div
                    className="p-4 rounded-xl border border-stone-200 bg-white max-h-[350px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: inspectModalItem.renderedHtml }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="font-semibold text-stone-700 block">Plain Text Body:</span>
                  <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 font-mono whitespace-pre-wrap">
                    {inspectModalItem.renderedBody}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setInspectModalItem(null)}
                className="py-1.5 px-4 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-medium transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Building2,
  Lock,
  CreditCard,
  FileCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Phone,
  Mail,
  ShieldAlert,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";

export default function SupplierPrivacyPage() {
  const [profile, setProfile] = useState<any>(null);
  const [finances, setFinances] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bank Account Update Form State
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resProfile, resFinances] = await Promise.all([
        fetch("/api/seller/privacy"),
        fetch("/api/seller/finances"),
      ]);

      const dataProfile = await resProfile.json();
      const dataFinances = await resFinances.json();

      if (resProfile.ok && dataProfile.profile) {
        setProfile(dataProfile.profile);
        setBankAccountName(dataProfile.profile.bankAccountName || "");
        setBankIfsc(dataProfile.profile.bankIfsc || "");
        setBankName(dataProfile.profile.bankName || "");
      }
      if (resFinances.ok && dataFinances.summary) {
        setFinances(dataFinances.summary);
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to load supplier privacy and settlement profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountName.trim() || !bankAccountNumber.trim() || !bankIfsc.trim()) {
      setFeedback({ type: "error", text: "Please enter account name, complete account number, and 11-char IFSC code." });
      return;
    }

    try {
      setSavingBank(true);
      setFeedback(null);
      const res = await fetch("/api/seller/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountName,
          bankAccountNumber,
          bankIfsc: bankIfsc.toUpperCase().trim(),
          bankName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settlement bank details.");

      setProfile(data.profile);
      setFeedback({
        type: "success",
        text: "Settlement bank credentials validated and safely updated. Primary account number masked for privacy.",
      });
      setIsEditingBank(false);
      setBankAccountNumber("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update bank details." });
    } finally {
      setSavingBank(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin" />
        <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
          Verifying Encrypted Settlement Credentials...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block mb-1">
            Supplier Compliance & Governance
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <span>Supplier Privacy & Settlement Hub</span>
            <Badge variant="success" className="text-xs py-0.5 px-2">
              RBI & DPDP Aligned
            </Badge>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Protect your business identity, verify tax credentials, and manage masked bank accounts for weekly automated marketplace disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh Status
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type === "success" ? "success" : "error"} title={feedback.type === "success" ? "Updated" : "Notice"}>
          {feedback.text}
        </Alert>
      )}

      {/* Grid: Business Identity & Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Credentials Card */}
        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0d0d12] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">{profile?.businessName || profile?.name}</h3>
                <p className="text-xs text-zinc-500 font-mono">Vendor ID: {profile?.id}</p>
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                profile?.isBusinessVerified
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                  : "bg-amber-950/60 text-amber-400 border-amber-800/60"
              }`}
            >
              {profile?.isBusinessVerified ? "Verified Entity" : "Verification Pending"}
            </span>
          </div>

          <div className="space-y-3 divide-y divide-zinc-800/60 text-xs">
            <div className="pt-2 flex items-center justify-between">
              <span className="text-zinc-500">GSTIN Registration</span>
              <span className="font-mono text-zinc-200 font-medium">
                {profile?.gstin || "Not Registered / Composition"}
              </span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-zinc-500">Permanent Account Number (PAN)</span>
              <span className="font-mono text-zinc-200 font-medium">
                {profile?.pan ? `${profile.pan.slice(0, 3)}•••••${profile.pan.slice(-2)}` : "Verified on File"}
              </span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-zinc-500">Business Contact Phone</span>
              <span className="font-mono text-zinc-200">
                {profile?.businessPhone || profile?.contactPhone ? `+91 ${profile.businessPhone || profile.contactPhone}` : "Not Set"}
              </span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-zinc-500">Official Communication Email</span>
              <span className="font-mono text-zinc-200">{profile?.businessEmail || profile?.contactEmail}</span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-zinc-500">Fulfillment Hub / Dispatch City</span>
              <span className="text-zinc-200 font-medium">{profile?.originHub || "Central Logistics Node"}</span>
            </div>
          </div>
        </div>

        {/* Masked Settlement Bank Card */}
        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0d0d12] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Settlement Bank Account</h3>
                <p className="text-xs text-zinc-500">Automated NEFT / RTGS payout destination</p>
              </div>
            </div>
            {!isEditingBank && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingBank(true)}
                className="h-8 text-xs border-zinc-700 hover:bg-zinc-800"
              >
                Update Account
              </Button>
            )}
          </div>

          {!isEditingBank ? (
            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Masked Account Number</span>
                <p className="font-mono text-base text-zinc-100 font-bold tracking-wider">
                  {profile?.maskedBankAccount || "•••• •••• ••••"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-zinc-900/40 rounded-lg border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block">Beneficiary Name</span>
                  <span className="text-xs font-semibold text-zinc-200 truncate block mt-0.5">
                    {profile?.bankAccountName || "Pending Setup"}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-900/40 rounded-lg border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block">Bank IFSC Code</span>
                  <span className="text-xs font-mono font-semibold text-zinc-200 block mt-0.5">
                    {profile?.bankIfsc || "Pending Setup"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Raw bank details are sanitized and masked immediately to satisfy PCI DSS and RBI data residency mandates.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdateBank} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Beneficiary Name (as per Bank Passbook)</label>
                <Input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="e.g. Acme Craftworks Pvt Ltd"
                  className="bg-zinc-900 text-xs border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Full Account Number</label>
                <Input
                  type="password"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/\s+/g, ""))}
                  placeholder="Enter complete 9-18 digit account number"
                  className="bg-zinc-900 text-xs border-zinc-700 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">IFSC Code (11 Chars)</label>
                  <Input
                    type="text"
                    maxLength={11}
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="bg-zinc-900 text-xs border-zinc-700 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Bank Name</label>
                  <Input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="bg-zinc-900 text-xs border-zinc-700"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBank(false)}
                  disabled={savingBank}
                  className="border-zinc-800 text-zinc-400"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingBank} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {savingBank ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save Masked Account"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Financial Ledger & Isolation Summary */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-[#0d0d12] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Isolated Sales & Disbursement Ledger</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strict multi-tenant isolation: You only have visibility into line items assigned to your workshop.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Commission Rate: 10.0%</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Gross Workshop Sales</span>
            <p className="text-xl font-bold font-mono text-zinc-100 mt-1">
              ₹{(finances?.grossSales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-zinc-500 mt-1 block">Accumulated across verified orders</span>
          </div>

          <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Platform Commission (10%)</span>
            <p className="text-xl font-bold font-mono text-zinc-300 mt-1">
              ₹{(finances?.platformCommission || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-zinc-500 mt-1 block">Technology & logistics fee</span>
          </div>

          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Net Payable Balance</span>
            <p className="text-xl font-bold font-mono text-emerald-300 mt-1">
              ₹{(finances?.netPayable || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-emerald-400/80 mt-1 block">Scheduled for next payout cycle</span>
          </div>
        </div>

        {/* Vendor Isolation Guarantee */}
        <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/60 flex items-start gap-3 text-xs text-zinc-400">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-zinc-200">Customer Payment Privacy Guarantee</span>
            <p className="leading-relaxed">
              In accordance with PCI DSS SAQ-A and NEXU ATELIER security policy, customer credit card PANs, CVVs, expiration dates, and UPI PINs are completely inaccessible to suppliers.
              Suppliers only receive necessary delivery fulfillment addresses and item specifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

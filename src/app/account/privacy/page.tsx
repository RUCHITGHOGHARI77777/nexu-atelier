"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  Smartphone,
  Mail,
  CreditCard,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  EyeOff,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export default function CustomerPrivacyCenterPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [privacyProfile, setPrivacyProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentWhatsapp, setConsentWhatsapp] = useState(false);
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  const [retentionPref, setRetentionPref] = useState("STANDARD_7_YEARS");
  const [savingConsents, setSavingConsents] = useState(false);

  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneFeedback, setPhoneFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [sendingEmailToken, setSendingEmailToken] = useState(false);
  const [emailTokenInput, setEmailTokenInput] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [paymentRecords, setPaymentRecords] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [showErasureModal, setShowErasureModal] = useState(false);
  const [erasureReason, setErasureReason] = useState("");
  const [submittingErasure, setSubmittingErasure] = useState(false);
  const [erasureFeedback, setErasureFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    loadPrivacyData();
    loadPaymentHistory();
  }, [isAuthenticated]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const loadPrivacyData = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch("/api/customer/privacy");
      const data = await res.json();
      if (res.ok && data.profile) {
        setPrivacyProfile(data.profile);
        setPhoneInput(data.profile.phone || "");
        setConsentMarketing(Boolean(data.profile.consentMarketing));
        setConsentWhatsapp(Boolean(data.profile.consentWhatsapp));
        setConsentAnalytics(Boolean(data.profile.consentAnalytics));
        setRetentionPref(data.profile.dataRetentionPreference || "STANDARD_7_YEARS");
      }
    } catch {
      setProfileMessage({ type: "error", text: "Failed to load customer privacy profile." });
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      setLoadingPayments(true);
      const res = await fetch("/api/customer/payments");
      const data = await res.json();
      if (res.ok && data.records) {
        setPaymentRecords(data.records);
      }
    } catch {
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleSaveConsents = async () => {
    try {
      setSavingConsents(true);
      setProfileMessage(null);
      const res = await fetch("/api/customer/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentMarketing,
          consentWhatsapp,
          consentAnalytics,
          dataRetentionPreference: retentionPref,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update consent preferences.");
      setPrivacyProfile(data.profile);
      setProfileMessage({ type: "success", text: "Privacy consents and retention preferences saved in compliance ledger." });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Failed to save privacy settings." });
    } finally {
      setSavingConsents(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      setPhoneFeedback({ type: "error", text: "Please enter a valid 10-digit mobile number." });
      return;
    }
    try {
      setSendingOtp(true);
      setPhoneFeedback(null);
      const res = await fetch("/api/customer/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone: phoneInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch OTP.");
      setOtpSent(true);
      setOtpCooldown(60);
      setPhoneFeedback({
        type: "success",
        text: "Cryptographic 6-digit OTP generated and dispatched via Meta WhatsApp Cloud API. Valid for 5 minutes.",
      });
    } catch (err: any) {
      setPhoneFeedback({ type: "error", text: err.message || "Failed to send OTP." });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.trim().length !== 6) {
      setPhoneFeedback({ type: "error", text: "Please enter the 6-digit verification code." });
      return;
    }
    try {
      setVerifyingOtp(true);
      setPhoneFeedback(null);
      const res = await fetch("/api/customer/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone: phoneInput, otp: otpInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const remaining = data.remainingAttempts !== undefined ? ` (${data.remainingAttempts} attempts remaining)` : "";
        throw new Error((data.error || "Invalid OTP.") + remaining);
      }
      setPhoneFeedback({ type: "success", text: "Phone number verified and bound to your account successfully." });
      setOtpSent(false);
      setOtpInput("");
      loadPrivacyData();
    } catch (err: any) {
      setPhoneFeedback({ type: "error", text: err.message || "OTP verification failed." });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSendEmailVerification = async () => {
    try {
      setSendingEmailToken(true);
      setEmailFeedback(null);
      const res = await fetch("/api/customer/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email token.");
      setEmailFeedback({
        type: "success",
        text: "Verification token generated and sent to your registered email address.",
      });
    } catch (err: any) {
      setEmailFeedback({ type: "error", text: err.message || "Failed to dispatch email verification." });
    } finally {
      setSendingEmailToken(false);
    }
  };

  const handleVerifyEmailToken = async () => {
    if (!emailTokenInput.trim()) {
      setEmailFeedback({ type: "error", text: "Please paste your email verification token." });
      return;
    }
    try {
      setVerifyingEmail(true);
      setEmailFeedback(null);
      const res = await fetch("/api/customer/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", token: emailTokenInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid verification token.");
      setEmailFeedback({ type: "success", text: "Email verified successfully." });
      setEmailTokenInput("");
      loadPrivacyData();
    } catch (err: any) {
      setEmailFeedback({ type: "error", text: err.message || "Email verification failed." });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleDownloadPersonalArchive = async () => {
    try {
      setIsExporting(true);
      const res = await fetch("/api/customer/data-export?format=json");
      if (!res.ok) throw new Error("Failed to compile personal data archive.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexu_personal_data_dpdp_${user?.id || "patron"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Data export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleErasureRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingErasure(true);
      setErasureFeedback(null);
      const res = await fetch("/api/customer/data-subject-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "ERASURE", reason: erasureReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erasure request rejected.");
      setErasureFeedback({
        type: "success",
        text: data.message || "Erasure request registered. Statutory review period initiated.",
      });
      setErasureReason("");
      setShowErasureModal(false);
    } catch (err: any) {
      setErasureFeedback({ type: "error", text: err.message || "Failed to submit erasure request." });
    } finally {
      setSubmittingErasure(false);
    }
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
        <p className="text-sm text-zinc-500 font-mono">Loading Privacy & Security Ledger...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <Shield className="w-12 h-12 text-zinc-400 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900">Authentication Required</h2>
        <p className="text-sm text-zinc-600">Please sign in to access your personal privacy and payment security center.</p>
        <Link href="/login?redirect=/account/privacy">
          <Button className="w-full">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/account"
              className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Account Overview
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 flex items-center gap-3">
            <span>Customer Privacy & Security Center</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              DPDP Act 2023 Compliant
            </span>
          </h1>
          <p className="text-sm text-zinc-600 mt-1.5">
            Manage your personal verification credentials, payment privacy isolation, statutory data consent, and data subject rights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPersonalArchive}
            disabled={isExporting}
            className="flex items-center gap-2 text-zinc-700 border-zinc-200 hover:bg-zinc-50"
          >
            {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download My Data (JSON)</span>
          </Button>
        </div>
      </div>

      {profileMessage && (
        <Alert variant={profileMessage.type === "success" ? "success" : "error"} title={profileMessage.type === "success" ? "Notice" : "Error"}>
          {profileMessage.text}
        </Alert>
      )}

      {erasureFeedback && (
        <Alert variant={erasureFeedback.type === "success" ? "success" : "error"} title="Data Subject Request">
          {erasureFeedback.text}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Mobile Phone Authentication</h3>
                <p className="text-xs text-zinc-500">Cryptographic OTP verification for high-security checkout</p>
              </div>
            </div>
            {privacyProfile?.isPhoneVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> Unverified
              </span>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Registered Mobile Number</label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  disabled={privacyProfile?.isPhoneVerified && !otpSent}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || otpCooldown > 0}
                  className="whitespace-nowrap"
                >
                  {sendingOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Resend" : "Send OTP"}
                </Button>
              </div>
            </div>

            {otpSent && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <label className="block text-xs font-medium text-zinc-800">Enter 6-Digit WhatsApp Code</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="••••••"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="font-mono tracking-widest text-center text-base"
                  />
                  <Button size="sm" onClick={handleVerifyOtp} disabled={verifyingOtp} className="whitespace-nowrap">
                    {verifyingOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify Code"}
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-500">Max 3 attempts per verification code. Rate limit enforced.</p>
              </div>
            )}

            {phoneFeedback && (
              <p className={`text-xs ${phoneFeedback.type === "success" ? "text-emerald-700" : "text-rose-600"}`}>
                {phoneFeedback.text}
              </p>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Email Address Ownership</h3>
                <p className="text-xs text-zinc-500">Authoritative channel for order contracts and invoices</p>
              </div>
            </div>
            {privacyProfile?.isEmailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> Unverified
              </span>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Registered Email Address</label>
              <Input type="email" value={privacyProfile?.email || user.email} disabled className="bg-zinc-50 font-mono text-sm" />
            </div>

            {!privacyProfile?.isEmailVerified ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">Verification Link or Token</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendEmailVerification}
                    disabled={sendingEmailToken}
                    className="h-7 text-xs"
                  >
                    {sendingEmailToken ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Request Link"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Paste 64-char token if verifying manually"
                    value={emailTokenInput}
                    onChange={(e) => setEmailTokenInput(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Button size="sm" onClick={handleVerifyEmailToken} disabled={verifyingEmail} className="whitespace-nowrap h-9">
                    {verifyingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Email cryptographically validated on {privacyProfile?.emailVerifiedAt ? new Date(privacyProfile.emailVerifiedAt).toLocaleDateString() : "file"}.</span>
              </div>
            )}

            {emailFeedback && (
              <p className={`text-xs ${emailFeedback.type === "success" ? "text-emerald-700" : "text-rose-600"}`}>
                {emailFeedback.text}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                <span>Payment Privacy & Zero Sensitive Card Storage</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-300">
                  PCI DSS SAQ-A
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                NEXU ATELIER servers never view, process, or store CVV codes, full 16-digit card numbers, or UPI PINs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold">Tokenized Security</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Your Isolated Payment Ledger</h3>
            <span className="text-xs text-zinc-500 font-mono">{paymentRecords.length} records on file</span>
          </div>

          {loadingPayments ? (
            <div className="py-6 text-center text-xs text-zinc-400 font-mono">Loading payment records...</div>
          ) : paymentRecords.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500">
              No previous payment transactions recorded for your account.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Method & Masked Instrument</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {paymentRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-900 font-medium">
                        {rec.transactionRef || rec.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{rec.maskedDetails || `${rec.method} (${rec.provider})`}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-900">
                        ₹{Number(rec.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : rec.status === "REFUNDED"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-900" />
              <span>DPDP Act 2023 Consent & Preference Governance</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Under India’s Digital Personal Data Protection Act 2023, you retain sovereign rights over processing purposes.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleSaveConsents}
            disabled={savingConsents}
            className="flex items-center gap-1.5"
          >
            {savingConsents ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Save Preferences</span>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors bg-white">
            <div className="pr-4 space-y-1">
              <label htmlFor="consent-marketing" className="text-sm font-semibold text-zinc-900 cursor-pointer">
                Promotional & Seasonal Collection Dispatch
              </label>
              <p className="text-xs text-zinc-600">
                Receive curated quarterly editorial releases and newly onboarded atelier announcements via WhatsApp and Email.
              </p>
            </div>
            <input
              id="consent-marketing"
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors bg-white">
            <div className="pr-4 space-y-1">
              <label htmlFor="consent-whatsapp" className="text-sm font-semibold text-zinc-900 cursor-pointer">
                Instant WhatsApp Dispatch & Courier Alerts
              </label>
              <p className="text-xs text-zinc-600">
                Allow courier tracking tokens, delivery OTPs, and return confirmations to be delivered via verified WhatsApp Business.
              </p>
            </div>
            <input
              id="consent-whatsapp"
              type="checkbox"
              checked={consentWhatsapp}
              onChange={(e) => setConsentWhatsapp(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors bg-white">
            <div className="pr-4 space-y-1">
              <label htmlFor="consent-analytics" className="text-sm font-semibold text-zinc-900 cursor-pointer">
                Privacy-Preserving Telemetry & Recommendation Tailoring
              </label>
              <p className="text-xs text-zinc-600">
                Permit pseudonymized browsing telemetry to refine storefront search relevance and prevent bot fraud.
              </p>
            </div>
            <input
              id="consent-analytics"
              type="checkbox"
              checked={consentAnalytics}
              onChange={(e) => setConsentAnalytics(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
              Statutory Data Retention Schedule
            </label>
            <select
              value={retentionPref}
              onChange={(e) => setRetentionPref(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-zinc-200 bg-white py-2 px-3 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="STANDARD_7_YEARS">Standard Commercial Retention (7 Years — Indian Tax & GST Compliance)</option>
              <option value="MINIMAL_LEGAL">Minimal Statutory Retention (Audit Period Only)</option>
              <option value="STRICT_1_YEAR">Strict 1-Year Active Archival (Purge non-essential logs annually)</option>
            </select>
            <p className="text-[11px] text-zinc-500">
              Tax, invoices, and accounting vouchers remain retained for statutory periods mandated by Section 36 of the CGST Act 2017.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
            <FileText className="w-5 h-5 text-zinc-900" />
            <span>Data Subject Rights (DPDP Section 11 & 12)</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Exercise your rights of access, portability, rectification, or complete account erasure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 font-semibold text-sm">
              <Download className="w-4 h-4 text-zinc-700" />
              <span>Export Personal Archive</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Obtain a machine-readable JSON package containing all your profiles, saved addresses, verified contact records, and order histories.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPersonalArchive}
              disabled={isExporting}
              className="w-full bg-white hover:bg-zinc-100"
            >
              {isExporting ? "Compiling..." : "Download JSON Package"}
            </Button>
          </div>

          <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-3">
            <div className="flex items-center gap-2 text-rose-950 font-semibold text-sm">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Right to Erasure (Forget Me)</span>
            </div>
            <p className="text-xs text-rose-900/80 leading-relaxed">
              Submit a formal request to erase your personal profile. Blocked if any open orders or pending financial disputes exist.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowErasureModal(true)}
              className="w-full text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
            >
              Request Account Erasure
            </Button>
          </div>
        </div>
      </div>

      {showErasureModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="erasure-modal-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 relative text-zinc-900">
            <button
              type="button"
              onClick={() => setShowErasureModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-600 pr-8">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-600" />
              <h3 id="erasure-modal-title" className="text-lg font-bold text-zinc-950">
                Confirm Erasure Request
              </h3>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              In accordance with Section 12 of the DPDP Act 2023, submitting an erasure request initiates a statutory review.
              All active orders must be completed or refunded before an erasure can proceed.
            </p>

            <form onSubmit={handleErasureRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reason for Erasure (Optional)
                </label>
                <textarea
                  value={erasureReason}
                  onChange={(e) => setErasureReason(e.target.value)}
                  placeholder="e.g. Closing account, no longer purchasing..."
                  className="w-full text-xs p-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-zinc-50 focus:bg-white transition-colors"
                  rows={3}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowErasureModal(false)}
                  disabled={submittingErasure}
                  className="w-full sm:w-auto px-4 py-2 border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={submittingErasure}
                  isLoading={submittingErasure}
                  className="w-full sm:w-auto px-4 py-2 !bg-red-600 hover:!bg-red-700 active:!bg-red-800 !text-white hover:!text-white focus:!text-white active:!text-white !border-red-600 hover:!border-red-700 font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  {submittingErasure ? "Submitting..." : "Confirm Erasure Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

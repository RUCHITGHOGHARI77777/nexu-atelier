"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Smartphone,
  Copy,
  Check,
  X,
  ArrowRight,
  Clock,
  Sparkles,
  CreditCard,
  Building,
  AlertCircle,
  QrCode,
  Bell,
  Volume2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatCurrency } from "@/lib/formatters";
import { useStore } from "@/context/StoreContext";

interface InteractivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: "UPI" | "CARD" | "NET_BANKING" | "WALLET" | "COD";
  upiApp?: string;
  upiId?: string;
  bankName?: string;
  walletName?: string;
  payableAmountINR: number;
  customerName: string;
  customerPhone?: string;
  onPaymentSuccess: (details: {
    method: string;
    bankRef: string;
    vpa?: string;
    bankName?: string;
    notes?: string;
  }) => void;
}

export function InteractivePaymentModal({
  isOpen,
  onClose,
  method,
  upiApp = "gpay",
  upiId = "customer@okaxis",
  bankName = "HDFC Bank",
  walletName = "Paytm",
  payableAmountINR,
  customerName,
  customerPhone = "+91 98765 43210",
  onPaymentSuccess,
}: InteractivePaymentModalProps) {
  const { showToast, whiteLabelConfig, openPhoneSimulator } = useStore();
  const [stage, setStage] = useState<"IDLE" | "AUTHORIZING" | "SUCCESS">("IDLE");
  const [secondsLeft, setSecondsLeft] = useState(299); // 4m 59s overall expiry
  const [authCountdown, setAuthCountdown] = useState(4); // 4s auto-approval timer
  const [copied, setCopied] = useState(false);
  const [showPushNotification, setShowPushNotification] = useState(false);
  const [otpValue, setOtpValue] = useState("123456");
  const [upiViewMode, setUpiViewMode] = useState<"enter_id" | "scan_qr">("enter_id");
  const [customUpiId, setCustomUpiId] = useState(upiId || "customer@okaxis");
  const [generatedUtr, setGeneratedUtr] = useState("");
  const [paymentTimestamp, setPaymentTimestamp] = useState("");

  // Soft Web-Audio sound synthesizer for push notification & success chime
  const playSound = (type: "notification" | "success") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "notification") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Success chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.5);
        });
      }
    } catch {
      // Audio not permitted or supported
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!isOpen || stage !== "IDLE") return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, stage]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setStage("IDLE");
      setSecondsLeft(299);
      setShowPushNotification(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(whiteLabelConfig.merchantUpiId || "auramart.enterprise@icici");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerMobilePush = () => {
    playSound("notification");
    setShowPushNotification(true);
    setTimeout(() => {
      setShowPushNotification(false);
    }, 7000);
  };

  const triggerSuccess = React.useCallback(() => {
    setStage("SUCCESS");
    playSound("success");

    const utr = `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const formattedTime =
      now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

    setGeneratedUtr(utr);
    setPaymentTimestamp(formattedTime);

    showToast("UTR Verified & Official Invoice Generated ✅", "success");

    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#10b981", "#0ea5e9", "#f59e0b", "#6366f1"],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      onPaymentSuccess({
        method,
        bankRef: utr,
        vpa: customUpiId || upiId || "customer@okaxis",
        bankName,
        notes: `Simulated live payment authorization via ${method} (${customUpiId || upiApp.toUpperCase()})`,
      });
    }, 1800);
  }, [method, customUpiId, upiId, bankName, upiApp, onPaymentSuccess]);

  // Handle 4-second auto-approval & countdown when stage is AUTHORIZING
  useEffect(() => {
    if (stage !== "AUTHORIZING") return;
    setAuthCountdown(4);

    const timer = setInterval(() => {
      setAuthCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, triggerSuccess]);

  const handleStartUpiPayment = () => {
    playSound("notification");
    setShowPushNotification(true);
    setStage("AUTHORIZING");
    showToast("UPI Payment Request Sent to Mobile 📱", "info");

    // Launch floating Smartphone Notification & PIN Simulator
    openPhoneSimulator({
      amount: payableAmountINR,
      brandName: whiteLabelConfig.brandName,
      merchantUpiId: whiteLabelConfig.merchantUpiId,
      onApprove: triggerSuccess,
    });

    setTimeout(() => {
      setShowPushNotification(false);
    }, 8000);
  };

  const handleSimulateApproval = () => {
    triggerSuccess();
  };

  const appDisplayName =
    upiApp === "gpay"
      ? "Google Pay"
      : upiApp === "phonepe"
      ? "PhonePe"
      : upiApp === "paytm"
      ? "Paytm"
      : upiApp === "bhim"
      ? "BHIM UPI"
      : "Custom UPI";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Simulated Smartphone Floating Push Notification */}
      {showPushNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 max-w-md w-full px-4 animate-in slide-in-from-top-6 duration-300">
          <div className="bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.18)] rounded-2xl p-4 flex items-start gap-3.5 ring-1 ring-zinc-900/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-0.5">
                <span className="font-semibold text-zinc-800 flex items-center gap-1">
                  <span>{appDisplayName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                </span>
                <span className="font-mono">Now</span>
              </div>
              <p className="text-xs font-bold text-zinc-950 truncate">
                Payment Request: {formatCurrency(payableAmountINR)}
              </p>
              <p className="text-[11px] text-zinc-600 line-clamp-1 mt-0.5">
                {whiteLabelConfig.brandName} has requested payment. Tap below or use Smartphone Simulator to authorize.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPushNotification(false)}
              className="text-zinc-400 hover:text-zinc-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Glass Modal Window */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/95 ring-1 ring-slate-900/10 shadow-[0_25px_70px_rgba(15,23,42,0.18)] max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Subtle Water Shimmer Gradient Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-sky-400 to-indigo-500" />

        {/* Modal Top Bar */}
        <div className="p-6 pb-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
              {whiteLabelConfig.brandName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">
                {whiteLabelConfig.brandName.toUpperCase()} PAY • ESCROW GATEWAY
              </span>
              <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-1.5">
                <span>
                  {method === "UPI"
                    ? "UPI Smart QR & Mobile Collect"
                    : method === "CARD"
                    ? "3D Secure Bank Gateway"
                    : method === "NET_BANKING"
                    ? `${bankName} NetBanking Portal`
                    : method === "COD"
                    ? "Cash on Delivery Verification"
                    : "Digital Wallet Gateway"}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={stage === "AUTHORIZING"}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Ribbon */}
        <div className="bg-gradient-to-r from-zinc-50 via-slate-50 to-zinc-50 px-6 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-xs text-zinc-600 font-medium">Authoritative Payable Amount:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-zinc-500 font-mono">INR</span>
            <span className="text-xl font-extrabold text-zinc-950 font-mono tracking-tight">
              {formatCurrency(payableAmountINR)}
            </span>
          </div>
        </div>

        {/* Body Content by Stage */}
        <div className="p-6 space-y-5">
          {stage === "IDLE" && (
            <>
              {/* --- UPI VIEW --- */}
              {method === "UPI" && (
                <div className="space-y-4">
                  {/* Mode Switcher Tabs */}
                  <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setUpiViewMode("enter_id")}
                      className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        upiViewMode === "enter_id"
                          ? "bg-white text-zinc-950 shadow-xs"
                          : "text-zinc-600 hover:text-zinc-950"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Enter UPI ID / VPA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiViewMode("scan_qr")}
                      className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        upiViewMode === "scan_qr"
                          ? "bg-white text-zinc-950 shadow-xs"
                          : "text-zinc-600 hover:text-zinc-950"
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan Dynamic QR</span>
                    </button>
                  </div>

                  {upiViewMode === "enter_id" ? (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-semibold text-zinc-700 block mb-1">
                          Virtual Payment Address (UPI ID)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={customUpiId}
                            onChange={(e) => setCustomUpiId(e.target.value)}
                            placeholder="e.g. customer@okaxis or 9876543210@ybl"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white font-mono text-xs text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                          />
                          <span className="absolute right-3 top-2.5 text-[11px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified VPA</span>
                          </span>
                        </div>
                      </div>

                      {/* Quick UPI ID Suggestion Pills */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-zinc-500 font-medium">Quick Select Demo UPI:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "customer@okaxis",
                            "9876543210@ybl",
                            "patron@okhdfcbank",
                            "founder@icici",
                          ].map((id) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setCustomUpiId(id)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
                                customUpiId === id
                                  ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                                  : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                              }`}
                            >
                              {id}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Instant 256-Bit Escrow Protection</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Clicking Verify & Pay will send an instant payment authorization request to your UPI application.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartUpiPayment}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Pay {formatCurrency(payableAmountINR)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Dynamic Interactive QR Code */}
                      <div className="relative mx-auto w-44 h-44 p-3 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col items-center justify-center overflow-hidden group">
                        {/* Simulated laser scan bar animation */}
                        <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_#10b981] animate-bounce pointer-events-none" />

                        {/* QR Code SVG */}
                        <div className="relative w-full h-full flex items-center justify-center">
                          <svg
                            viewBox="0 0 100 100"
                            className="w-full h-full text-zinc-900"
                            fill="currentColor"
                          >
                            {/* 3 Position Detection Patterns */}
                            <rect x="0" y="0" width="30" height="30" rx="4" fill="black" />
                            <rect x="4" y="4" width="22" height="22" rx="2" fill="white" />
                            <rect x="8" y="8" width="14" height="14" rx="2" fill="black" />

                            <rect x="70" y="0" width="30" height="30" rx="4" fill="black" />
                            <rect x="74" y="4" width="22" height="22" rx="2" fill="white" />
                            <rect x="78" y="8" width="14" height="14" rx="2" fill="black" />

                            <rect x="0" y="70" width="30" height="30" rx="4" fill="black" />
                            <rect x="4" y="74" width="22" height="22" rx="2" fill="white" />
                            <rect x="8" y="78" width="14" height="14" rx="2" fill="black" />

                            {/* Center Logo Area Shield */}
                            <circle cx="50" cy="50" r="14" fill="white" />
                            <circle cx="50" cy="50" r="10" fill="#09090b" />
                            <text
                              x="50"
                              y="54"
                              textAnchor="middle"
                              fill="white"
                              fontSize="9"
                              fontWeight="bold"
                              fontFamily="sans-serif"
                            >
                              N
                            </text>

                            {/* Random Matrix Modules */}
                            <rect x="36" y="6" width="6" height="6" fill="black" />
                            <rect x="46" y="6" width="6" height="6" fill="black" />
                            <rect x="56" y="6" width="6" height="6" fill="black" />
                            <rect x="36" y="16" width="6" height="6" fill="black" />
                            <rect x="56" y="16" width="6" height="6" fill="black" />
                            <rect x="6" y="36" width="6" height="6" fill="black" />
                            <rect x="16" y="36" width="6" height="6" fill="black" />
                            <rect x="26" y="36" width="6" height="6" fill="black" />
                            <rect x="6" y="56" width="6" height="6" fill="black" />
                            <rect x="16" y="56" width="6" height="6" fill="black" />
                            <rect x="26" y="46" width="6" height="6" fill="black" />
                            <rect x="68" y="36" width="6" height="6" fill="black" />
                            <rect x="78" y="36" width="6" height="6" fill="black" />
                            <rect x="88" y="36" width="6" height="6" fill="black" />
                            <rect x="68" y="56" width="6" height="6" fill="black" />
                            <rect x="88" y="56" width="6" height="6" fill="black" />
                            <rect x="36" y="68" width="6" height="6" fill="black" />
                            <rect x="46" y="68" width="6" height="6" fill="black" />
                            <rect x="56" y="68" width="6" height="6" fill="black" />
                            <rect x="36" y="78" width="6" height="6" fill="black" />
                            <rect x="56" y="88" width="6" height="6" fill="black" />
                            <rect x="46" y="88" width="6" height="6" fill="black" />
                            <rect x="78" y="78" width="6" height="6" fill="black" />
                            <rect x="88" y="88" width="6" height="6" fill="black" />
                          </svg>
                        </div>

                        <span className="text-[10px] font-mono text-zinc-500 font-semibold mt-1">
                          Scan with Google Pay / PhonePe / Paytm
                        </span>
                      </div>

                      {/* VPA Copy Bar */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            Official Merchant VPA:
                          </span>
                          <span className="font-mono font-bold text-zinc-950">
                            {whiteLabelConfig.merchantUpiId}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyVpa}
                          className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-700 hover:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:bg-zinc-50 transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartUpiPayment}
                        className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>Simulate Scanned & Authorize {formatCurrency(payableAmountINR)}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* --- CARD VIEW --- */}
              {method === "CARD" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-950 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-zinc-700" />
                        <span>HDFC / ICICI 3D Secure Gateway</span>
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">OTP Sent</span>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      An authentic one-time password has been dispatched to your mobile ending in **10.
                    </p>
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                        Enter 6-Digit Bank OTP:
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value)}
                        className="w-full px-4 py-2.5 text-center font-mono font-bold tracking-widest text-lg rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateApproval}
                    className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Payment & Release Escrow</span>
                  </button>
                </div>
              )}

              {/* --- NET BANKING VIEW --- */}
              {method === "NET_BANKING" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-950 flex items-center gap-2">
                        <Building className="w-4 h-4 text-zinc-700" />
                        <span>{bankName} Corporate & Retail Portal</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Connected
                      </span>
                    </div>
                    <p className="text-zinc-600 text-[11px]">
                      Customer ID: <strong className="text-zinc-900 font-mono">NEXU_PATRON_784</strong>
                    </p>
                    <p className="text-zinc-600 text-[11px]">
                      Account Type: Savings Escrow Account
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateApproval}
                    className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm NetBanking Debit & Place Commission</span>
                  </button>
                </div>
              )}

              {/* --- WALLET & COD VIEWS --- */}
              {(method === "WALLET" || method === "COD") && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-zinc-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {method === "COD"
                          ? "Cash on Delivery Pre-dispatch Confirmed"
                          : `${walletName} Authorization Ready`}
                      </span>
                    </div>
                    <p className="text-zinc-600 text-[11px]">
                      {method === "COD"
                        ? "Delivery agent will collect cash or UPI QR scan upon courier handover."
                        : `Authorized wallet debit of ${formatCurrency(payableAmountINR)} from ${walletName}.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateApproval}
                    className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Generate Official Receipt</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* --- STAGE: AUTHORIZING ANIMATION --- */}
          {stage === "AUTHORIZING" && (
            <div className="py-8 text-center space-y-6 animate-in fade-in duration-200">
              {/* Circular Countdown Timer */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#E2E8F0"
                    strokeWidth="7"
                  />
                  {/* Animated Countdown Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * authCountdown) / 4}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-900">
                  <span className="font-mono text-2xl font-black">{authCountdown}s</span>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Auto</span>
                </div>
              </div>

              {/* Pulsing Status Text */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Waiting for approval on mobile app...</span>
                </div>
                <p className="text-xs text-zinc-600 font-mono">
                  Push request dispatched to <strong className="text-zinc-900">{customUpiId}</strong>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Auto-approving in {authCountdown}s or click below to approve instantly for evaluation.
                </p>
              </div>

              {/* Instant Evaluation Fast-Track Approval Button */}
              <button
                type="button"
                onClick={handleSimulateApproval}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Mobile UPI Approval (Click to Approve)</span>
              </button>
            </div>
          )}

          {/* --- STAGE: SUCCESS CELEBRATION --- */}
          {stage === "SUCCESS" && (
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                  PAID • ESCROW SECURED
                </span>
                <h4 className="text-lg font-black text-zinc-950">
                  Payment Successfully Authorized!
                </h4>
                <p className="text-xs text-zinc-600">
                  Instant authorization captured via NPCI UPI Switch.
                </p>
              </div>

              {/* Transaction Reference & Meta Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-left space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
                  <span className="text-zinc-500 text-[11px]">Transaction UTR No:</span>
                  <span className="font-bold text-zinc-950">{generatedUtr || "UPI/2026/849201"}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
                  <span className="text-zinc-500 text-[11px]">Timestamp:</span>
                  <span className="text-zinc-800 text-[11px]">{paymentTimestamp || "Just now"}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
                  <span className="text-zinc-500 text-[11px]">UPI VPA Debited:</span>
                  <span className="text-zinc-900 font-semibold">{customUpiId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[11px]">Payment Method:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    UPI Instant Settlement
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-indigo-600 font-medium">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Redirecting to Live Order Tracking & Branded Receipt...</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Security Guarantee */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>RBI Escrow Compliance • ISO 27001 Certified Infrastructure • 100% Guaranteed</span>
        </div>
      </div>
    </div>
  );
}


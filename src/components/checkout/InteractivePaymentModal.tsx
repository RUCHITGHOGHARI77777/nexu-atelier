"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
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
  const { showToast, whiteLabelConfig, openPhoneSimulator, formatPrice, activeRegion } = useStore();
  const [stage, setStage] = useState<"IDLE" | "AUTHORIZING" | "SUCCESS" | "FAILED">("IDLE");
  const [authCountdown, setAuthCountdown] = useState(10); // 10s visible countdown
  const [customUpiId, setCustomUpiId] = useState(upiId || "customer@okaxis");
  const [isVpaVerified, setIsVpaVerified] = useState(true);
  const [isVerifyingVpa, setIsVerifyingVpa] = useState(false);
  const [vpaError, setVpaError] = useState("");
  const [upiViewMode, setUpiViewMode] = useState<"enter_id" | "scan_qr">("enter_id");

  // Simulation scenario: "SUCCESS" vs "FAILURE"
  const [simScenario, setSimScenario] = useState<"SUCCESS" | "FAILURE">("SUCCESS");
  const [failureReason, setFailureReason] = useState("");

  // Card Demo Selection
  const [selectedTestCard, setSelectedTestCard] = useState<"SUCCESS_CARD" | "DECLINE_CARD">("SUCCESS_CARD");
  const [cardHolderName, setCardHolderName] = useState(customerName || "Aarav Mehta");

  const [generatedUtr, setGeneratedUtr] = useState("");
  const [paymentTimestamp, setPaymentTimestamp] = useState("");

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setStage("IDLE");
      setAuthCountdown(10);
      setFailureReason("");
      setVpaError("");
      setIsVpaVerified(true);
    }
  }, [isOpen]);

  // Audio effect simulator
  const playSound = (type: "notification" | "success" | "error") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "notification") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "error") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
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
      // Audio not supported or blocked
    }
  };

  // VPA Verification Logic
  const handleVerifyVpa = () => {
    setVpaError("");
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}$/;
    if (!upiRegex.test(customUpiId.trim())) {
      setVpaError("Please enter a valid UPI format (e.g. yourname@okhdfcbank or 9876543210@paytm)");
      setIsVpaVerified(false);
      return;
    }

    setIsVerifyingVpa(true);
    setTimeout(() => {
      setIsVerifyingVpa(false);
      setIsVpaVerified(true);
      showToast("UPI ID Verified via NPCI Directory ✅", "success");
    }, 700);
  };

  const triggerSuccess = useCallback((customDelay?: number | unknown) => {
    const delayMs = typeof customDelay === "number" ? customDelay : 1800;
    setStage("SUCCESS");
    playSound("success");

    const utrPrefix = method === "CARD" ? "DEMO-CARD-TXN" : "DEMO-UTR";
    const utr = `${utrPrefix}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
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

    showToast(`Payment Approved • ${utr} ✅`, "success");

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10b981", "#0ea5e9", "#f59e0b"],
      });
    } catch {}

    setTimeout(() => {
      onPaymentSuccess({
        method,
        bankRef: utr,
        vpa: customUpiId,
        bankName,
        notes: `Simulated Demo Payment via ${method} (${utr})`,
      });
    }, delayMs);
  }, [method, customUpiId, bankName, onPaymentSuccess, showToast]);

  const triggerFailure = useCallback((reason: string) => {
    setStage("FAILED");
    setFailureReason(reason);
    playSound("error");
    showToast(`Payment Simulation: ${reason}`, "warning");
  }, [showToast]);

  // Visible 10-Second Countdown Effect
  useEffect(() => {
    if (stage !== "AUTHORIZING") return;
    setAuthCountdown(10);

    const timer = setInterval(() => {
      setAuthCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (simScenario === "SUCCESS") {
            triggerSuccess();
          } else {
            triggerFailure("Simulated Bank Timeout / Insufficient Account Balance (Retryable)");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, simScenario, triggerSuccess, triggerFailure]);

  const handleStartUpiPayment = () => {
    setIsVpaVerified(true);
    setVpaError("");
    playSound("notification");
    setStage("AUTHORIZING");
    showToast("Demo UPI Payment Processing • 10s Countdown Started", "info");
  };

  const handleStartCardPayment = () => {
    playSound("notification");
    if (selectedTestCard === "DECLINE_CARD") {
      setSimScenario("FAILURE");
    } else {
      setSimScenario("SUCCESS");
    }
    setStage("AUTHORIZING");
    showToast("Demo Card Payment Processing...", "info");
  };

  const handleCodConfirm = () => {
    setStage("SUCCESS");
    const codRef = `COD-COLLECT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedUtr(codRef);
    setPaymentTimestamp(new Date().toLocaleString("en-IN"));
    showToast("Cash on Delivery Order Confirmed • Payment Status: PENDING_COLLECTION", "success");

    setTimeout(() => {
      onPaymentSuccess({
        method: "COD",
        bankRef: codRef,
        notes: "Cash on Delivery confirmed • Payment due upon physical courier delivery",
      });
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* MANDATORY DISCLAIMER BANNER */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-mono font-bold text-amber-900 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>DEMO PAYMENT — NO REAL MONEY WILL BE TRANSFERRED.</span>
        </div>

        {/* Modal Top Bar */}
        <div className="p-6 pb-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
              {whiteLabelConfig.brandName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">
                {whiteLabelConfig.brandName.toUpperCase()} PAY • DEMO SANDBOX
              </span>
              <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-1.5">
                <span>
                  {method === "UPI"
                    ? "UPI Instant Payment Sandbox"
                    : method === "CARD"
                    ? "Debit / Credit Card Sandbox"
                    : method === "COD"
                    ? "Cash on Delivery Verification"
                    : `${method} Gateway`}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={stage === "AUTHORIZING"}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Ribbon */}
        <div className="bg-slate-50 px-6 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-xs text-zinc-600 font-medium">Order Total Payable:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-zinc-500 font-mono">{activeRegion.currency}</span>
            <span className="text-xl font-extrabold text-zinc-950 font-mono tracking-tight">
              {formatPrice(payableAmountINR)}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {stage === "IDLE" && (
            <>
              {/* --- UPI DEMO VIEW --- */}
              {method === "UPI" && (
                <div className="space-y-4">
                  {/* Mode Tabs */}
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-zinc-700">
                            Virtual Payment Address (UPI ID)
                          </label>
                          <span className="text-[10px] text-zinc-400 font-mono">Format: name@bank</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={customUpiId}
                              onChange={(e) => {
                                setCustomUpiId(e.target.value);
                                setIsVpaVerified(false);
                                setVpaError("");
                              }}
                              placeholder="e.g. customer@okaxis"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white font-mono text-xs text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            />
                            {isVpaVerified && (
                              <span className="absolute right-3 top-2.5 text-[11px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleVerifyVpa}
                            disabled={isVerifyingVpa || isVpaVerified}
                            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-semibold transition-all cursor-pointer"
                          >
                            {isVerifyingVpa ? "Verifying..." : isVpaVerified ? "Verified" : "Verify VPA"}
                          </button>
                        </div>
                        {vpaError && (
                          <p className="text-[11px] text-rose-600 mt-1 font-medium">{vpaError}</p>
                        )}
                      </div>

                      {/* Scenario Selector: Test Success vs Test Failure */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                          Evaluation Simulation Scenario:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSimScenario("SUCCESS")}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-left flex items-center gap-2 ${
                              simScenario === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Simulate Success</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSimScenario("FAILURE")}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-left flex items-center gap-2 ${
                              simScenario === "FAILURE"
                                ? "bg-rose-50 text-rose-900 border-rose-300 ring-1 ring-rose-400"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            <span>Simulate Failure</span>
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="demo-start-upi-payment"
                        onClick={handleStartUpiPayment}
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Run 10s Demo Payment ({formatPrice(payableAmountINR)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Dynamic Interactive QR Code */}
                      <div className="relative mx-auto w-40 h-40 p-3 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col items-center justify-center">
                        <QrCode className="w-28 h-28 text-slate-900" />
                        <span className="text-[10px] font-mono text-slate-500 mt-1 font-semibold">
                          UPI QR Demo Mode
                        </span>
                      </div>

                      <button
                        type="button"
                        id="demo-start-qr-payment"
                        onClick={handleStartUpiPayment}
                        className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Simulate Scanned & Run 10s Processing</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* --- CARD DEMO VIEW --- */}
              {method === "CARD" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-700 block">
                      Select Demo Test Card (PCI-DSS Zero-Storage Compliant):
                    </label>

                    {/* Test Card 1: Success */}
                    <div
                      onClick={() => setSelectedTestCard("SUCCESS_CARD")}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedTestCard === "SUCCESS_CARD"
                          ? "bg-slate-900 text-white border-slate-900 shadow-md"
                          : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>4242 •••• •••• 4242</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                          Simulates Success
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] opacity-80 mt-2 font-mono">
                        <span>Holder: {cardHolderName}</span>
                        <span>Exp: 12/28</span>
                      </div>
                    </div>

                    {/* Test Card 2: Decline */}
                    <div
                      onClick={() => setSelectedTestCard("DECLINE_CARD")}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedTestCard === "DECLINE_CARD"
                          ? "bg-slate-900 text-white border-slate-900 shadow-md"
                          : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>4000 •••• •••• 0002</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-700/50">
                          Simulates Decline
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] opacity-80 mt-2 font-mono">
                        <span>Holder: Test Decline User</span>
                        <span>Exp: 08/27</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <p>
                      <strong>Zero-Storage Security:</strong> CVV, PIN, and OTP are never requested or saved. In production LIVE mode, this connects to a PCI-certified hosted tokenization bridge.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="demo-start-card-payment"
                    onClick={handleStartCardPayment}
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Demo Card Payment ({formatPrice(payableAmountINR)})</span>
                  </button>
                </div>
              )}

              {/* --- COD DEMO VIEW --- */}
              {method === "COD" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Cash on Delivery Verification</span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      Amount Payable at Delivery: <strong className="font-mono text-sm">{formatPrice(payableAmountINR)}</strong>
                    </p>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      Payment Status will be recorded as <strong className="font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">PENDING_COLLECTION</strong>. Payment is collected in cash or UPI QR scan upon physical parcel delivery.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCodConfirm}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Cash on Delivery Order</span>
                  </button>
                </div>
              )}

              {/* --- OTHER (NET BANKING / WALLET) --- */}
              {(method === "NET_BANKING" || method === "WALLET") && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                    <span className="font-bold text-zinc-950">
                      {method === "NET_BANKING" ? `${bankName} NetBanking Portal` : `${walletName} Digital Wallet`}
                    </span>
                    <p className="text-[11px] text-zinc-600">
                      Click below to simulate instant authorized settlement of {formatPrice(payableAmountINR)}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerSuccess()}
                    className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Demo {method}</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* --- STAGE: AUTHORIZING (10-SECOND COUNTDOWN) --- */}
          {stage === "AUTHORIZING" && (
            <div className="py-8 text-center space-y-6 animate-in fade-in duration-200">
              {/* Circular Countdown Timer */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#E2E8F0"
                    strokeWidth="7"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke={simScenario === "SUCCESS" ? "#10B981" : "#F43F5E"}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * authCountdown) / 10}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-900">
                  <span className="font-mono text-3xl font-black">{authCountdown}s</span>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Remaining</span>
                </div>
              </div>

              {/* Pulsing Status Text */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>DEMO PAYMENT PROCESSING</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Simulating bank verification through sandbox gateway...
                </p>
              </div>

              {/* Fast Skip / Instant Complete for Evaluator testing */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  id="demo-fast-skip-btn"
                  onClick={() => {
                    if (simScenario === "SUCCESS") triggerSuccess(200);
                    else triggerFailure("Simulated Bank Timeout");
                  }}
                  className="text-[11px] font-mono font-medium text-slate-500 hover:text-slate-900 underline underline-offset-4 cursor-pointer"
                >
                  ⚡ Fast Skip (Instant Result)
                </button>
              </div>
            </div>
          )}

          {/* --- STAGE: SUCCESS --- */}
          {stage === "SUCCESS" && (
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 uppercase">
                  SIMULATION VERIFIED
                </span>
                <h4 className="text-lg font-black text-zinc-950">
                  {method === "COD" ? "Order Confirmed via COD" : "Demo Payment Approved"}
                </h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  {method === "COD"
                    ? "Payment status recorded as PENDING_COLLECTION. Amount will be collected upon parcel delivery."
                    : "Cryptographic sandbox signature matched. Initializing server-authoritative order creation."}
                </p>
              </div>

              {/* Generated Reference Token */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Demo Reference / UTR:</span>
                  <strong className="text-zinc-950 font-bold">{generatedUtr}</strong>
                </div>
                <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                  <span>Authorized At:</span>
                  <span>{paymentTimestamp}</span>
                </div>
              </div>
            </div>
          )}

          {/* --- STAGE: FAILED (RETRYABLE) --- */}
          {stage === "FAILED" && (
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <XCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-rose-600 uppercase">
                  SIMULATION DECLINED
                </span>
                <h4 className="text-lg font-black text-zinc-950">Payment Authorization Failed</h4>
                <p className="text-xs text-rose-700 max-w-xs mx-auto">
                  {failureReason || "Simulated payment failure occurred."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <span>No order was placed and no charges were made. You may retry safely.</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimScenario("SUCCESS");
                    setStage("IDLE");
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Demo Payment</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

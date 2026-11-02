"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  X,
  Minimize2,
  Maximize2,
  CheckCircle2,
  ShieldCheck,
  Bell,
  Lock,
  ArrowRight,
  Sparkles,
  Wifi,
  Battery,
  Signal,
  CreditCard,
  Building,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";

export function FloatingPhoneSimulator() {
  const {
    isPhoneSimulatorOpen,
    phoneSimulatorData,
    closePhoneSimulator,
    whiteLabelConfig,
    showToast,
  } = useStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [pin, setPin] = useState<string>("");
  const [phoneStage, setPhoneStage] = useState<"NOTIFICATION" | "ENTER_PIN" | "SUCCESS">("NOTIFICATION");
  const [generatedUtr, setGeneratedUtr] = useState("");
  const [currentTime, setCurrentTime] = useState("09:41");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // When opened with new data, reset to notification view
  useEffect(() => {
    if (isPhoneSimulatorOpen && phoneSimulatorData) {
      setIsMinimized(false);
      setPin("");
      setPhoneStage("NOTIFICATION");
      const utr = phoneSimulatorData.utrNumber || `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedUtr(utr);
    }
  }, [isPhoneSimulatorOpen, phoneSimulatorData]);

  if (!isPhoneSimulatorOpen || !phoneSimulatorData) return null;

  const brandName = phoneSimulatorData.brandName || whiteLabelConfig.brandName;
  const merchantUpiId = phoneSimulatorData.merchantUpiId || whiteLabelConfig.merchantUpiId;
  const amount = phoneSimulatorData.amount || 0;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Auto submit on 4th digit
        setTimeout(() => {
          submitPayment();
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const submitPayment = () => {
    setPhoneStage("SUCCESS");
    showToast(`📱 Phone Simulator: ₹${amount.toLocaleString("en-IN")} Approved via UPI PIN`, "success");

    // Trigger parent callback
    if (phoneSimulatorData.onApprove) {
      setTimeout(() => {
        phoneSimulatorData.onApprove?.();
      }, 800);
    }
  };

  const handleQuickAutoPay = () => {
    setPin("4921");
    setTimeout(() => {
      submitPayment();
    }, 400);
  };

  // Minimized Floating Pill View
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-950/90 text-white backdrop-blur-2xl border border-slate-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.3)] hover:scale-105 transition-all text-xs font-semibold"
        >
          <div className="relative">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <span>📱 iPhone Simulator Active</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
            ₹{amount.toLocaleString("en-IN")}
          </span>
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-6 duration-300 select-none">
      {/* Smartphone Outer Hardware Shell */}
      <div className="w-[300px] sm:w-[325px] h-[610px] rounded-[48px] bg-slate-950 p-2.5 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] border-[5px] border-slate-700/80 ring-1 ring-white/20 flex flex-col relative overflow-hidden text-slate-100">
        
        {/* Dynamic Island & Top Sensor Bezel */}
        <div className="absolute top-3 inset-x-0 flex items-center justify-between px-7 pt-1 z-30 pointer-events-none">
          {/* iOS Clock */}
          <span className="text-[12px] font-semibold text-white tracking-tight">
            {currentTime}
          </span>

          {/* Dynamic Island Pill */}
          <div className="w-24 h-5 rounded-full bg-black flex items-center justify-between px-2.5 py-0.5 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
          </div>

          {/* Signal, WiFi, Battery Icons */}
          <div className="flex items-center gap-1.5 text-white/90">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Floating Controls (Minimize / Close) */}
        <div className="absolute top-10 right-4 z-40 flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize Phone Simulator"
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={closePhoneSimulator}
            title="Close Phone Simulator"
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Screen Content Surface */}
        <div className="flex-1 rounded-[38px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 pt-14 pb-4 px-3 flex flex-col justify-between relative overflow-y-auto">
          
          {/* STAGE 1: INCOMING PUSH NOTIFICATION BANNER */}
          {phoneStage === "NOTIFICATION" && (
            <div className="flex-1 flex flex-col justify-between pt-2">
              <div className="space-y-3">
                {/* iOS Lock Screen Notification Card */}
                <div
                  onClick={() => setPhoneStage("ENTER_PIN")}
                  className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-xl cursor-pointer hover:bg-white/15 transition-all group active:scale-98"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                        G
                      </div>
                      <span className="font-semibold text-slate-200">Google Pay • UPI</span>
                    </div>
                    <span>now</span>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Collect Request from {brandName}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    <strong className="text-emerald-400 font-mono">₹{amount.toLocaleString("en-IN")}</strong> requested by{" "}
                    <span className="font-mono text-[10px] text-slate-400">{merchantUpiId}</span>. Tap to enter UPI PIN.
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                    <span>Tap to Authorize & Pay</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Sub-notification: SMS Preview */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] text-slate-400 flex items-start gap-2.5">
                  <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200 block">Bank Security Advisory</span>
                    Never share your 4-digit UPI PIN with anyone. Ensure merchant is {brandName}.
                  </div>
                </div>
              </div>

              {/* Bottom Quick Trigger */}
              <div className="space-y-2 pt-4">
                <button
                  onClick={() => setPhoneStage("ENTER_PIN")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Open UPI PIN Entry Screen</span>
                </button>
                <button
                  onClick={handleQuickAutoPay}
                  className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>⚡ 1-Click Instant Auto-Approve</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: UPI 4-DIGIT PIN KEYPAD SCREEN */}
          {phoneStage === "ENTER_PIN" && (
            <div className="flex-1 flex flex-col justify-between pt-1">
              <div>
                {/* Header */}
                <div className="text-center pb-2 border-b border-white/10">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                    ENTER 4-DIGIT UPI PIN
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{brandName}</h3>
                  <p className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
                    ₹{amount.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Paying to: {merchantUpiId}
                  </span>
                </div>

                {/* 4-Digit PIN Indicators */}
                <div className="flex items-center justify-center gap-3.5 my-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        pin.length > idx
                          ? "bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                          : "border-slate-600 bg-slate-900"
                      }`}
                    />
                  ))}
                </div>

                {/* 1-Click Auto PIN Shortcut */}
                <button
                  onClick={handleQuickAutoPay}
                  className="w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold transition-colors flex items-center justify-center gap-1 mb-2"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Tap to Auto-Enter PIN (4921)</span>
                </button>
              </div>

              {/* Numeric Keypad Grid */}
              <div className="grid grid-cols-3 gap-2 px-2 pb-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleKeyPress(n)}
                    className="h-10 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-base transition-colors flex items-center justify-center shadow-xs"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={handleDelete}
                  className="h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-semibold transition-colors flex items-center justify-center"
                >
                  DEL
                </button>
                <button
                  onClick={() => handleKeyPress("0")}
                  className="h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-base transition-colors flex items-center justify-center shadow-xs"
                >
                  0
                </button>
                <button
                  onClick={submitPayment}
                  disabled={pin.length < 4}
                  className={`h-10 rounded-2xl font-bold text-sm transition-all flex items-center justify-center ${
                    pin.length === 4
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40"
                      : "bg-white/5 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  ✓
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: PAYMENT CONFIRMED & BANK SMS BANNER */}
          {phoneStage === "SUCCESS" && (
            <div className="flex-1 flex flex-col justify-between pt-2">
              <div className="space-y-3">
                {/* Success Badge */}
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2 shadow-inner">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Payment Successful!</h4>
                  <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
                    ₹{amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-300 font-mono mt-1">
                    Paid to {brandName}
                  </p>
                  <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[10px] font-mono text-emerald-300/80">
                    UTR: {generatedUtr}
                  </div>
                </div>

                {/* Instant Bank SMS Alert Banner */}
                <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Bell className="w-3 h-3 text-emerald-400" />
                      <span>HDFC Bank SMS Alert</span>
                    </span>
                    <span>Just Now</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                    "Acct XX4921 debited for <strong className="text-white">Rs.{amount.toLocaleString("en-IN")}</strong> on{" "}
                    {new Date().toLocaleDateString("en-IN")} via UPI Ref No <strong className="text-emerald-400">{generatedUtr}</strong>. Order Confirmed at {brandName}."
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-3">
                <button
                  onClick={closePhoneSimulator}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Done • View Official Invoice</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom iOS Home Indicator Bar */}
          <div className="w-28 h-1 rounded-full bg-slate-600 mx-auto mt-2" />
        </div>
      </div>
    </div>
  );
}

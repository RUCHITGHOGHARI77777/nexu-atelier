"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  QrCode,
  Building,
  Wallet,
  Truck,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Smartphone,
  Info,
} from "lucide-react";
import {
  PaymentMethodType,
  PaymentSelectionState,
  CodEligibilityResult,
  FraudRiskResult,
} from "@/types/payment-fraud";
import { formatCurrency } from "@/lib/formatters";

interface PaymentMethodSelectorProps {
  grandTotalPaise: number;
  shippingAddress: any;
  items: any[];
  onPaymentStateChange: (state: PaymentSelectionState & { isReadyToPay: boolean }) => void;
  onPlaceholderPayClick: () => void;
}

const POPULAR_BANKS = [
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICICI", name: "ICICI Bank" },
  { code: "SBI", name: "State Bank of India" },
  { code: "AXIS", name: "Axis Bank" },
  { code: "KOTAK", name: "Kotak Mahindra Bank" },
  { code: "PNB", name: "Punjab National Bank" },
];

const POPULAR_WALLETS = [
  { id: "paytm", name: "Paytm Wallet" },
  { id: "phonepe", name: "PhonePe Wallet" },
  { id: "amazonpay", name: "Amazon Pay" },
  { id: "mobikwik", name: "MobiKwik" },
];

export function PaymentMethodSelector({
  grandTotalPaise,
  shippingAddress,
  items,
  onPaymentStateChange,
  onPlaceholderPayClick,
}: PaymentMethodSelectorProps) {
  const [method, setMethod] = useState<PaymentMethodType>("UPI");
  const [upiApp, setUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "bhim" | "custom">("gpay");
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [selectedWallet, setSelectedWallet] = useState("paytm");

  // COD state
  const [codLoading, setCodLoading] = useState(false);
  const [codEligibility, setCodEligibility] = useState<CodEligibilityResult | null>(null);
  const [codOtpSent, setCodOtpSent] = useState(false);
  const [codOtpInput, setCodOtpInput] = useState("");
  const [codOtpVerified, setCodOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Fraud pre-assessment
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskResult, setRiskResult] = useState<FraudRiskResult | null>(null);

  // 1. Evaluate Risk and COD eligibility on mount / change
  useEffect(() => {
    let isMounted = true;

    async function evaluatePrePayment() {
      if (!shippingAddress?.pincode || items.length === 0) return;

      // Evaluate COD eligibility
      setCodLoading(true);
      try {
        const res = await fetch("/api/checkout/cod-eligibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shippingAddress,
            items: items.map((i) => ({
              productId: i.productId,
              selectedSku: i.selectedSku,
              unitPricePaise: Math.round(i.unitPrice * 100),
              quantity: i.quantity,
              vendorId: i.product?.vendor?.id,
              vendorName: i.product?.vendor?.name,
              categoryId: i.product?.category?.id,
            })),
            totalPaise: grandTotalPaise,
          }),
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setCodEligibility(data.eligibility);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setCodLoading(false);
      }

      // Evaluate Fraud Risk
      setRiskLoading(true);
      try {
        const res = await fetch("/api/checkout/fraud-eval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shippingAddress,
            items: items.map((i) => ({
              productId: i.productId,
              selectedSku: i.selectedSku,
              unitPricePaise: Math.round(i.unitPrice * 100),
              quantity: i.quantity,
              vendorId: i.product?.vendor?.id,
            })),
            totalPaise: grandTotalPaise,
            paymentMethod: method,
          }),
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setRiskResult(data.risk);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setRiskLoading(false);
      }
    }

    evaluatePrePayment();

    return () => {
      isMounted = false;
    };
  }, [grandTotalPaise, shippingAddress, items, method]);

  // Handle OTP verification for medium-risk COD
  const handleVerifyOtp = async () => {
    setOtpError("");
    try {
      const res = await fetch("/api/checkout/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: shippingAddress.phone || "9876543210",
          code: codOtpInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "OTP verification failed.");
      } else {
        setCodOtpVerified(true);
      }
    } catch {
      setOtpError("Network error validating verification code.");
    }
  };

  // Determine readiness
  let isReadyToPay = false;
  if (method === "UPI") {
    isReadyToPay = upiApp !== "custom" || (upiId.trim().length > 3 && upiId.includes("@"));
  } else if (method === "CARD") {
    isReadyToPay = true; // Hosted gateway mode ready
  } else if (method === "NET_BANKING") {
    isReadyToPay = Boolean(selectedBank);
  } else if (method === "WALLET") {
    isReadyToPay = Boolean(selectedWallet);
  } else if (method === "COD") {
    isReadyToPay = Boolean((codEligibility ? codEligibility.isEligible : true) && (!codEligibility?.requiresOtp || codOtpVerified));
  }

  // Notify parent component of state change
  useEffect(() => {
    onPaymentStateChange({
      method,
      upiId: method === "UPI" ? (upiApp === "custom" ? upiId : `${upiApp}@upi`) : undefined,
      selectedUpiApp: upiApp,
      cardMaskedPreview: method === "CARD" ? "•••• •••• •••• 4242 (Visa)" : undefined,
      cardBrand: "visa",
      selectedBankCode: method === "NET_BANKING" ? selectedBank : undefined,
      selectedWalletId: method === "WALLET" ? selectedWallet : undefined,
      codConfirmed: method === "COD",
      codOtpVerified,
      codOtpCode: codOtpInput,
      isReadyToPay,
    });
  }, [
    method,
    upiApp,
    upiId,
    selectedBank,
    selectedWallet,
    codOtpVerified,
    codOtpInput,
    isReadyToPay,
    onPaymentStateChange,
  ]);

  // Compute displayed payable total (including COD fee if selected)
  const payablePaise = method === "COD" && codEligibility?.isEligible
    ? grandTotalPaise + codEligibility.codFeePaise
    : grandTotalPaise;

  return (
    <div className="space-y-6">
      {/* Risk signal banner if elevated */}
      {riskResult && riskResult.riskLevel !== "LOW" && (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Marketplace Trust & Safety Verification Active</span>
          </div>
          <p className="text-[11px] text-amber-800">
            For security, high-value checkouts undergo automated multi-signal risk evaluation.
            {riskResult.recommendedAction === "REQUIRE_OTP" && " Mobile OTP confirmation is enabled."}
          </p>
        </div>
      )}

      {/* Payment Method Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => setMethod("UPI")}
          className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
            method === "UPI"
              ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
              : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span className="text-xs font-bold leading-tight">Instant UPI</span>
          <span className={`text-[10px] ${method === "UPI" ? "text-zinc-300" : "text-zinc-500"}`}>
            GPay / PhonePe
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMethod("CARD")}
          className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
            method === "CARD"
              ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
              : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-xs font-bold leading-tight">Cards</span>
          <span className={`text-[10px] ${method === "CARD" ? "text-zinc-300" : "text-zinc-500"}`}>
            Credit / Debit
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMethod("NET_BANKING")}
          className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
            method === "NET_BANKING"
              ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
              : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"
          }`}
        >
          <Building className="w-4 h-4" />
          <span className="text-xs font-bold leading-tight">Net Banking</span>
          <span className={`text-[10px] ${method === "NET_BANKING" ? "text-zinc-300" : "text-zinc-500"}`}>
            50+ Indian Banks
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMethod("WALLET")}
          className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
            method === "WALLET"
              ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
              : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-xs font-bold leading-tight">Wallets</span>
          <span className={`text-[10px] ${method === "WALLET" ? "text-zinc-300" : "text-zinc-500"}`}>
            Paytm & More
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMethod("COD")}
          className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
            method === "COD"
              ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
              : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span className="text-xs font-bold leading-tight">Pay on Delivery</span>
          <span className={`text-[10px] ${method === "COD" ? "text-zinc-300" : "text-zinc-500"}`}>
            {codEligibility?.isEligible ? "Available" : "Restricted"}
          </span>
        </button>
      </div>

      {/* Content panel for selected method */}
      <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/60 space-y-4">
        {/* --- METHOD: UPI --- */}
        {method === "UPI" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Select UPI Application
              </h4>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zero Convenience Fee
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "gpay", label: "Google Pay" },
                { id: "phonepe", label: "PhonePe" },
                { id: "paytm", label: "Paytm UPI" },
                { id: "custom", label: "Other UPI ID" },
              ].map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setUpiApp(app.id as any)}
                  className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                    upiApp === app.id
                      ? "border-zinc-900 bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {app.label}
                </button>
              ))}
            </div>

            {upiApp === "custom" && (
              <div className="pt-2 space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Virtual Payment Address (VPA / UPI ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. mobile@okhdfcbank or user@ybl"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono"
                />
              </div>
            )}

            <div className="p-3 rounded-xl bg-white border border-zinc-200 flex items-start gap-2.5 text-[11px] text-zinc-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Sensitive Storage:</strong> You will authorize the payment request inside your UPI application. Nexu Atelier never requests, collects, or stores your UPI PIN.
              </span>
            </div>
          </div>
        )}

        {/* --- METHOD: CARDS --- */}
        {method === "CARD" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Credit & Debit Cards (RBI 3D-Secure Hosted Gateway)
              </h4>
              <span className="text-[11px] text-zinc-500 font-medium">Visa • MC • RuPay • Amex</span>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700">Hosted Payment Switch</span>
                <span className="text-[10px] font-mono uppercase bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                  PCI-DSS Level 1 Switch
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700 flex items-center justify-between">
                <span>•••• •••• •••• 4242</span>
                <span className="text-[10px] text-zinc-400">EXP 12/28</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                To comply with Reserve Bank of India tokenization regulations, card credentials and one-time passwords (OTP) are captured exclusively on the bank switch. Nexu servers never handle raw card numbers or CVVs.
              </p>
            </div>
          </div>
        )}

        {/* --- METHOD: NET BANKING --- */}
        {method === "NET_BANKING" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Select Your Bank
              </h4>
              <span className="text-[11px] text-zinc-500">Direct Net Banking</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {POPULAR_BANKS.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  onClick={() => setSelectedBank(bank.code)}
                  className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                    selectedBank === bank.code
                      ? "border-zinc-900 bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {bank.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- METHOD: WALLETS --- */}
        {method === "WALLET" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Supported Digital Wallets
              </h4>
              <span className="text-[11px] text-zinc-500">Instant Checkout</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {POPULAR_WALLETS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWallet(w.id)}
                  className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                    selectedWallet === w.id
                      ? "border-zinc-900 bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- METHOD: CASH ON DELIVERY --- */}
        {method === "COD" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Cash on Delivery (Pay on Arrival)
              </h4>
              {codEligibility?.isEligible ? (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Eligible for Dispatch
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Ineligible
                </span>
              )}
            </div>

            {codEligibility && !codEligibility.isEligible ? (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Cash on Delivery is unavailable for this order</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                  {codEligibility.ineligibilityReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-zinc-600 pt-1">
                  Please choose an online payment method (UPI, Cards, or Net Banking) to complete your order.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-600">
                    <span>COD Courier Convenience Fee:</span>
                    <span className="font-mono font-semibold text-zinc-950">
                      {formatCurrency((codEligibility?.codFeePaise || 5000) / 100)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    You can pay in cash or via UPI QR to the delivery courier agent upon package receipt.
                  </p>
                </div>

                {/* OTP confirmation requirement if medium risk or unverified */}
                {codEligibility?.requiresOtp && (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-amber-900">
                      <Smartphone className="w-4 h-4 text-amber-700" />
                      <span>Mobile OTP Confirmation Required</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      A 6-digit confirmation code must be verified to prevent uncollected COD dispatches.
                    </p>

                    {codOtpVerified ? (
                      <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Mobile number verified for COD delivery</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP (e.g. 123456)"
                          value={codOtpInput}
                          onChange={(e) => setCodOtpInput(e.target.value)}
                          className="px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-950 font-mono tracking-widest w-48 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={codOtpInput.trim().length !== 6}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-950 text-white disabled:opacity-40 hover:bg-zinc-800 transition-colors"
                        >
                          Verify OTP
                        </button>
                      </div>
                    )}
                    {otpError && <p className="text-xs text-rose-600 font-medium">{otpError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- IMPORTANT STOP POINT: FINAL PAY BUTTON --- */}
      <div className="pt-2 space-y-3">
        <button
          type="button"
          onClick={onPlaceholderPayClick}
          disabled={!isReadyToPay}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-3 ${
            isReadyToPay
              ? "bg-zinc-950 text-white hover:bg-zinc-800 shadow-md cursor-pointer"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-200"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>
            {method === "COD"
              ? `Confirm Cash on Delivery (${formatCurrency(payablePaise / 100)})`
              : `Authorize & Pay ${formatCurrency(payablePaise / 100)} via ${
                  method === "UPI"
                    ? `UPI (${upiApp === "custom" ? "VPA" : upiApp.toUpperCase()})`
                    : method === "CARD"
                    ? "Card"
                    : method === "NET_BANKING"
                    ? `Net Banking (${selectedBank})`
                    : "Wallet"
                }`}
          </span>
        </button>

        <p className="text-[11px] text-center text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>256-Bit SSL Encrypted • RBI-Compliant Escrow Protection • 100% Buyer Guarantee</span>
        </p>
      </div>
    </div>
  );
}

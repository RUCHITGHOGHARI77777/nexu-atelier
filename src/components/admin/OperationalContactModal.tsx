"use client";

import React, { useState } from "react";
import {
  Phone,
  Mail,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export interface OperationalContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "CUSTOMER" | "SUPPLIER";
  targetId: string;
  targetName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  onLogged?: (log: any) => void;
}

const PURPOSES = [
  { value: "DELIVERY_ISSUE", label: "Delivery / Courier Issue (Address clarification, delayed dispatch)" },
  { value: "PAYMENT_DISPUTE", label: "Payment / Financial Dispute (Chargeback, refund verification)" },
  { value: "ACCOUNT_VERIFICATION", label: "Account / KYC Verification (Document resubmission, identity)" },
  { value: "FRAUD_INVESTIGATION", label: "Fraud Investigation (Velocity alert, suspicious activity)" },
  { value: "EMERGENCY_SUPPORT", label: "Emergency Support (Critical customer or vendor escalation)" },
  { value: "SERVICE_REQUEST", label: "Service Request (Patron-initiated support ticket)" },
];

export function OperationalContactModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  recipientPhone,
  recipientEmail,
  onLogged,
}: OperationalContactModalProps) {
  const [purpose, setPurpose] = useState<string>("DELIVERY_ISSUE");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    logId: string;
    dialerUrl: string;
    timestamp: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || note.trim().length < 10) {
      setErrorMessage("Please provide a meaningful operational justification (minimum 10 characters).");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch("/api/admin/contact-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          purpose,
          note: note.trim(),
          recipientPhone,
          recipientEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log contact action.");

      setSuccessResult({
        logId: data.logId,
        dialerUrl: data.dialerUrl,
        timestamp: data.timestamp,
      });

      if (onLogged) {
        onLogged(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessResult(null);
    setNote("");
    setPurpose("DELIVERY_ISSUE");
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-5">
        <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950">Authorized Operational Contact</h3>
              <p className="text-xs text-zinc-500">
                Mandatory DPDP Act & Privacy Audit Logging
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
              Contacting {targetType}
            </span>
            <span className="font-bold text-zinc-900">{targetName}</span>
          </div>
          <div className="text-right font-mono text-zinc-600">
            {recipientPhone ? `+91 ${recipientPhone}` : recipientEmail || "Contact on File"}
          </div>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Validation Error">
            {errorMessage}
          </Alert>
        )}

        {!successResult ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Legitimate Business Purpose (Mandatory)
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full text-xs font-medium rounded-lg border border-zinc-300 bg-white py-2 px-3 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                {PURPOSES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Operational Notes / Audit Justification (Mandatory)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Explain the specific operational necessity for initiating this contact..."
                className="w-full text-xs p-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                This note will be permanently sealed in the compliance audit register with your Administrator ID.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Logging Action...
                  </>
                ) : (
                  "Log Action & Reveal Contact"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Action Successfully Logged</span>
              </div>
              <p>Audit Log Reference: <span className="font-mono">{successResult.logId}</span></p>
              <p className="text-[11px] text-emerald-700">
                Timestamp: {new Date(successResult.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
              <span className="text-xs font-semibold text-zinc-900 block">Device Action Initiator</span>
              <p className="text-xs text-zinc-600">
                In compliance with telecom regulations, calls are not automated or recorded without consent. Click below to launch your authorized operating system dialer.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {successResult.dialerUrl && (
                  <a
                    href={successResult.dialerUrl}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-900 text-white font-medium text-xs hover:bg-zinc-800 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Open Phone Dialer ({recipientPhone || "Contact"})</span>
                  </a>
                )}
                {recipientEmail && (
                  <a
                    href={`mailto:${recipientEmail}?subject=NEXU%20ATELIER%20Order%20Assistance`}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-zinc-300 text-zinc-800 font-medium text-xs hover:bg-zinc-100 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send Official Email</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <Button size="sm" variant="outline" onClick={handleResetAndClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

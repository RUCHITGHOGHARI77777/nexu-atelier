"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process recovery request.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 mx-auto">
            <KeyRound className="w-5 h-5 stroke-1" />
          </div>
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block font-medium">
            PATRON ACCESS RECOVERY
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Reset Your Access Key
          </h1>
          <p className="text-xs text-slate-600">
            Enter your registered email address to receive secure access recovery instructions.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          {error && (
            <Alert variant="error" title="Recovery Request Failed">
              {error}
            </Alert>
          )}

          {submitted ? (
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-1.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-950">
                  Instructions Dispatched
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  If an account exists for <span className="text-slate-900 font-mono font-medium">{email}</span>, a secure recovery link has been queued to your inbox.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Security Safeguard</span>
                </div>
                <p>
                  For security, access reset tokens expire after 30 minutes. If you do not see the message, verify your spam folder or contact our concierge.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patron@domain.com"
                disabled={isSubmitting}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full flex items-center justify-center gap-2 font-semibold"
              >
                <span>Send Recovery Instructions</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>Remembered your password? </span>
                <Link
                  href="/login"
                  className="text-slate-900 hover:text-slate-950 font-semibold underline underline-offset-4"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-[11px] text-slate-400 text-center max-w-xs mx-auto font-mono">
          Security Boundary: Password recovery tokens are single-use and cryptographically verified.
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ArrowRight, CheckCircle2, ShieldCheck, Lock } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Password reset token is missing from the URL.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-8 rounded-2xl border border-zinc-200 bg-white shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-950">Password Successfully Updated</h2>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">
            Your security credentials have been updated and previous sessions have been invalidated.
          </p>
        </div>
        <div className="pt-2">
          <Button variant="primary" size="md" href="/login" className="w-full">
            Proceed to Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {!token && (
        <Alert variant="warning">
          No reset token was found in the link. Please check your recovery email and click the complete link.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting || !token}
          className="w-full flex items-center justify-center gap-2 font-bold"
        >
          <span>Update Password & Invalidate Sessions</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-zinc-500">
        <Link href="/login" className="font-semibold text-zinc-950 hover:underline">
          Return to Patron Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mx-auto">
            <Lock className="w-5 h-5 stroke-1" />
          </div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
            PATRON CREDENTIAL UPDATE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Set New Password
          </h1>
          <p className="text-xs text-zinc-600">
            Choose a new, secure password for your Nexu Atelier patron account.
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-xs text-zinc-400 font-mono">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, allow redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/account");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const result = await login(email, password, honeypot);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Authentication failed. Please verify credentials.");
    } else {
      router.push("/account");
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail("patron@nexu.studio");
    setPassword("Password123!");
    setError("");
    setIsSubmitting(true);
    const result = await login("patron@nexu.studio", "Password123!");
    setIsSubmitting(false);
    if (result.success) {
      router.push("/account");
    } else {
      setError(result.error || "Quick login failed.");
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 mx-auto">
            <Lock className="w-5 h-5 stroke-1" />
          </div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
            PATRON ACCESS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sign In to Nexu Atelier
          </h1>
          <p className="text-xs text-zinc-400">
            Access your order history, saved addresses, and studio tracking.
          </p>
        </div>

        {/* Demo Fast-Login Strip */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Reviewer Fast Login</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Demo Account</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Authenticate instantly using the seeded demo patron profile:
          </p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium flex items-center justify-between border border-zinc-700/80 transition-colors"
          >
            <span>patron@nexu.studio</span>
            <span className="text-[11px] text-emerald-400 font-sans font-semibold">
              1-Click Sign In →
            </span>
          </button>
        </div>

        {/* Form Card */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4">
          {error && (
            <Alert variant="error" title="Sign In Error">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Defensive honeypot field to trap automated credential stuffers */}
            <div style={{ display: "none" }} aria-hidden="true">
              <input
                type="text"
                name="_hp_company_website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patron@domain.com"
            />

            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-end -mt-1">
              <Link
                href="/forgot-password"
                className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Forgot your access key?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full flex items-center justify-center gap-2 font-semibold"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-zinc-500">
            <span>New patron? </span>
            <Link
              href="/register"
              className="text-zinc-200 hover:text-white font-semibold underline underline-offset-4"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Boundary Notice */}
        <p className="text-[11px] text-zinc-500 text-center max-w-xs mx-auto font-mono">
          Security Boundary: Sessions are verified via HTTP-only cookies. No passwords or tokens are stored in browser localStorage.
        </p>
      </div>
    </div>
  );
}

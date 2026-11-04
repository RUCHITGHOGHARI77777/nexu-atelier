"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/account");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const result = await register(name, email, password, phone, honeypot);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Registration failed.");
    } else {
      router.push("/account");
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 mx-auto">
            <UserPlus className="w-5 h-5 stroke-1" />
          </div>
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block font-medium">
            PATRON REGISTRATION
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Create Patron Account
          </h1>
          <p className="text-xs text-slate-600">
            Join Nexu Atelier to commission artisan pieces and access direct studio tracking.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          {error && (
            <Alert variant="error" title="Registration Error">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Defensive honeypot field to trap automated bot registrations */}
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
              label="Full Name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Mehta"
            />

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              helperText="Used for courier delivery alerts and OTP updates."
            />

            <Input
              label="Password (min. 8 characters)"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full flex items-center justify-center gap-2 font-semibold"
            >
              <span>Register Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            <span>Already registered? </span>
            <Link
              href="/login"
              className="text-slate-900 hover:text-slate-950 font-semibold underline underline-offset-4"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ArrowLeft, Lock, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/context/AuthContext";

export default function SellerApplicationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [password, setPassword] = useState("");
  const [originHub, setOriginHub] = useState("");
  const [story, setStory] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [taxIdentifier, setTaxIdentifier] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("2");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (!ownerName && user.name) setOwnerName(user.name);
      if (!businessEmail && user.email) setBusinessEmail(user.email);
      if (!businessPhone && user.phone) setBusinessPhone(user.phone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        name,
        originHub,
        story,
        businessEmail,
        businessPhone,
        taxIdentifier: taxIdentifier.trim() || undefined,
        leadTimeDays: parseInt(leadTimeDays, 10) || 3,
      };

      if (!user) {
        payload.ownerName = ownerName || name;
        payload.password = password;
      }

      const res = await fetch("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit application.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/seller");
      }, 1500);
    } catch {
      setErrorMsg("Network error submitting studio application.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#666666] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>

        <div className="space-y-2 border-b border-[#E7E7E7] pb-6">
          <span className="text-xs uppercase tracking-widest text-[#888888] font-semibold block">
            SUPPLIER ONBOARDING
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">
            Apply to Sell on NEXU ATELIER
          </h1>
          <p className="text-sm text-[#666666] max-w-xl leading-relaxed">
            Partner with NEXU ATELIER to reach patrons across India and worldwide. Complete the details below to begin the verification process.
          </p>
        </div>

        {errorMsg && (
          <Alert variant="error" className="mb-6">
            {errorMsg}
          </Alert>
        )}

        {success ? (
          <div className="p-8 border border-[#E7E7E7] bg-[#F7F7F7] rounded-xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-2">
              Status: Pending Review
            </div>
            <h2 className="text-lg font-semibold text-[#111111]">
              Application Submitted Successfully
            </h2>
            <p className="text-xs text-[#666666] max-w-md mx-auto">
              Your details have been received by our curation team. Redirecting you to your seller status overview...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {!user && (
              <div className="border border-[#E7E7E7] rounded-xl bg-white p-6 sm:p-8 space-y-5 shadow-xs">
                <div className="border-b border-[#E7E7E7] pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                    1. Account Credentials
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Your credentials for logging into the Seller Hub.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                      Owner / Legal Representative Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Rajesh Solanki"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                      className="h-11 rounded-lg border-[#E7E7E7] text-sm text-[#111111] focus:border-[#111111] focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                      Account Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-11 rounded-lg border-[#E7E7E7] text-sm text-[#111111] focus:border-[#111111] focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="border border-[#E7E7E7] rounded-xl bg-white p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="border-b border-[#E7E7E7] pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                  {user ? "1. Brand & Workshop Identity" : "2. Brand & Workshop Identity"}
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  Information about your studio, brand, and craft lineage.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Studio or Brand Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Solstice Loom Studio, Moradabad Brass Atelier"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 rounded-lg border-[#E7E7E7] text-sm text-[#111111] focus:border-[#111111] focus:ring-0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Origin Craft Hub / City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Surat, Gujarat | Jaipur, Rajasthan | Moradabad, UP"
                    value={originHub}
                    onChange={(e) => setOriginHub(e.target.value)}
                    required
                    className="h-11 rounded-lg border-[#E7E7E7] text-sm text-[#111111] focus:border-[#111111] focus:ring-0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Craft Story & Sourcing <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-white border border-[#E7E7E7] rounded-lg p-3 text-sm text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#111111] transition-colors"
                    placeholder="Describe your techniques, material sourcing, artisan lineage, and production philosophy..."
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border border-[#E7E7E7] rounded-xl bg-white p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="border-b border-[#E7E7E7] pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                  {user ? "2. Contact & Commercial Details" : "3. Contact & Commercial Details"}
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  Business communication, tax identification, and dispatch timelines.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                      Business Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="contact@studio.in"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      required
                      className="h-11 rounded-lg border-[#E7E7E7] text-sm text-[#111111] focus:border-[#111111] focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                      Contact Mobile <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      required
                      className="h-11 rounded-lg border-[#E7E7E7] text-sm text-[#111111] focus:border-[#111111] focus:ring-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                      Tax Identifier (GSTIN / PAN)
                    </label>
                    <Input
                      placeholder="e.g. 24AAACS1234A1Z5"
                      value={taxIdentifier}
                      onChange={(e) => setTaxIdentifier(e.target.value)}
                      className="h-11 rounded-lg border-[#E7E7E7] text-sm text-[#111111] focus:border-[#111111] focus:ring-0"
                    />
                    <span className="text-[11px] text-[#888888] mt-1 block">
                      Required for statutory GST invoicing and commercial payouts.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                      Dispatch Lead Time (Days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="14"
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(e.target.value)}
                      className="h-11 rounded-lg border-[#E7E7E7] text-sm text-[#111111] focus:border-[#111111] focus:ring-0"
                    />
                    <span className="text-[11px] text-[#888888] mt-1 block">
                      Average business days required to prepare and dispatch an order.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 h-12 bg-[#111111] hover:bg-[#222222] text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
              isLoading={isSubmitting}
            >
              <span>Submit Studio Application</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

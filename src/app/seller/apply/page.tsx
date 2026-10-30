"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export default function SellerApplicationPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [originHub, setOriginHub] = useState("");
  const [story, setStory] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [taxIdentifier, setTaxIdentifier] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("2");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          originHub,
          story,
          businessEmail,
          businessPhone,
          taxIdentifier: taxIdentifier.trim() || undefined,
          leadTimeDays: parseInt(leadTimeDays, 10) || 3,
        }),
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
    <div className="max-w-2xl mx-auto py-12 px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Storefront
      </Link>

      <div className="mb-8">
        <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
          Artisan Partnership Onboarding
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
          Apply to Sell on Nexu Atelier
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Connect your heritage textile loom, ceramic studio, or design workshop directly with patrons across India and worldwide.
        </p>
      </div>

      {errorMsg && (
        <Alert variant="error" className="mb-6">
          {errorMsg}
        </Alert>
      )}

      {success ? (
        <div className="p-8 border border-emerald-900/60 bg-emerald-950/20 rounded text-center">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-lg font-medium text-emerald-200">
            Application Submitted Successfully
          </h2>
          <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
            Your workshop details have been transmitted to our curation board. Redirecting you to your studio dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 border border-zinc-800 bg-[#09090b] rounded space-y-4">
            <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider text-[11px] font-mono border-b border-zinc-800 pb-2">
              1. Workshop & Craft Identity
            </h2>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Studio / Workshop Name *
              </label>
              <Input
                placeholder="e.g. Solstice Loom Studio, Moradabad Brass Atelier"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Origin Craft Hub / Region *
              </label>
              <Input
                placeholder="e.g. Surat, Gujarat | Jaipur, Rajasthan | Moradabad, UP"
                value={originHub}
                onChange={(e) => setOriginHub(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Craft Heritage & Story *
              </label>
              <textarea
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                placeholder="Describe your techniques, material sourcing, artisan lineage, and production philosophy..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="p-6 border border-zinc-800 bg-[#09090b] rounded space-y-4">
            <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider text-[11px] font-mono border-b border-zinc-800 pb-2">
              2. Commercial & Operational Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Business Email *
                </label>
                <Input
                  type="email"
                  placeholder="contact@studio.in"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Contact Mobile Number *
                </label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Tax Identifier (GSTIN / PAN)
                </label>
                <Input
                  placeholder="e.g. 24AAACS1234A1Z5"
                  value={taxIdentifier}
                  onChange={(e) => setTaxIdentifier(e.target.value)}
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Mandatory for commercial B2B invoicing above threshold.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Dispatch Lead Time (Days)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Average days required to package and dispatch piece.
                </span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3"
            isLoading={isSubmitting}
          >
            <span>Submit Studio Application</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

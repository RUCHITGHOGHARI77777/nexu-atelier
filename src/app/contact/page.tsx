"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Clock, MapPin, Send, CheckCircle2, AlertCircle, ArrowLeft, MessageSquare, Phone, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Order Inquiry");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessTicket(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject,
          orderId: orderId.trim() || undefined,
          message: message.trim(),
          _hp_company_website: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to deliver message.");
      }

      setSuccessTicket(data.ticketId);
      setName("");
      setEmail("");
      setOrderId("");
      setMessage("");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] py-12 sm:py-20 text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Browse Knowledge Base (FAQ)</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Direct Info & Concierge Channels */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-[11px] font-mono text-amber-700 uppercase tracking-widest font-bold block">
                PATRON PRIVATE CONCIERGE
              </span>
              <h1 className="text-3xl sm:text-5xl font-serif text-zinc-950 tracking-tight leading-tight">
                Client Services & Studio Inquiries
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Have questions regarding custom loom sizing, bespoke commissions, shipment schedules, or payment escrow protection? Our dedicated atelier desk responds within hours.
              </p>
            </div>

            {/* Direct Contact Cards */}
            <div className="space-y-4 pt-2">
              <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                    Electronic Mail
                  </span>
                  <a
                    href="mailto:concierge@nexu.studio"
                    className="text-sm font-semibold text-zinc-950 hover:text-amber-700 transition-colors block"
                  >
                    concierge@nexu.studio
                  </a>
                  <p className="text-[11px] text-zinc-500">Average response time: &lt; 2 business hours</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                    Desk Operating Hours
                  </span>
                  <p className="text-sm font-semibold text-zinc-950">
                    Monday – Saturday: 9:00 AM – 8:00 PM IST
                  </p>
                  <p className="text-[11px] text-zinc-500">Sunday priority triage for parcels in transit</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-700 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                    Atelier Headquarters
                  </span>
                  <p className="text-sm font-semibold text-zinc-950">
                    NEXU Commerce Atelier, BKC Avenue
                  </p>
                  <p className="text-[11px] text-zinc-500">Bandra Kurla Complex, Mumbai, MH 400051</p>
                </div>
              </div>
            </div>

            {/* Escrow Guarantee Pill */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 leading-relaxed space-y-1">
              <span className="font-semibold block font-mono text-[10px] uppercase tracking-wider">
                Patron Security Notice
              </span>
              <p>
                All purchases are covered under the NEXU Escrow Protocol. Payment is only disbursed to the independent studio 14 days after courier confirmation of delivery.
              </p>
            </div>
          </div>

          {/* Right Column: Inquiry Submission Form */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-950">
                  Transmit an Inquiry
                </h2>
                <p className="text-xs text-zinc-600 mt-1">
                  Fill in your details below and our concierge desk will route your inquiry to the appropriate artisan studio or logistics coordinator.
                </p>
              </div>

              {successTicket && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Inquiry Registered Successfully</span>
                  </div>
                  <p className="text-xs">
                    Your concierge ticket reference is{" "}
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                      {successTicket}
                    </span>
                    . We have emailed you a confirmation receipt and will respond shortly.
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot anti-spam field */}
                <input
                  type="text"
                  name="_hp_company_website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-800 uppercase tracking-wider mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-800 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. priya@example.com"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-800 uppercase tracking-wider mb-1.5">
                      Inquiry Nature
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium cursor-pointer"
                    >
                      <option value="Order Inquiry">Order Inquiry & Logistics</option>
                      <option value="Bespoke Sizing">Custom Loom Sizing / Bespoke</option>
                      <option value="Return / Exchange">Return or Exchange Request</option>
                      <option value="Artisan Studio Onboarding">Artisan Collective Registration</option>
                      <option value="General Question">General Patron Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-800 uppercase tracking-wider mb-1.5">
                      Order Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. ORD-2026-51277"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-800 uppercase tracking-wider mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details regarding your inquiry, specific piece title, or custom dimensions required..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all leading-relaxed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Transmitting...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Transmit Message to Concierge</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

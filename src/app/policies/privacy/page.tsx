import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, FileText, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Data Protection Policy — Nexu Atelier",
  description: "How Nexu Atelier safeguards patron privacy, enforces reviewer anonymity, and protects personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] py-12 sm:py-20 text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>

        <div className="border-b border-zinc-200 pb-8 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-semibold block">
            SECURITY & PATRON SOVEREIGNTY
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif text-zinc-950 tracking-tight font-bold">
            Privacy Policy & Data Ethics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Last Revised: October 30, 2026 • Compliant with Digital Personal Data Protection (DPDP) principles
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Reviewer Masking
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Public reviews automatically mask names (e.g. &quot;Aarav M.&quot;). Surnames, emails, and addresses are strictly concealed.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Zero Storage of Secrets
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Passwords, payment tokens, and session secrets are never stored in browser localStorage or sessionStorage.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              No Invasive Trackers
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              We operate zero third-party advertising tracking pixels or data-broker syndication beacons.
            </p>
          </div>
        </div>

        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-zinc-700 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">1. Information We Collect & Why</h2>
            <p>
              When you register, place an order, or converse with our concierge, NEXU ATELIER processes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
              <li><strong>Account Identity:</strong> Email address and salted, PBKDF2-hashed password for authentication.</li>
              <li><strong>Shipping Coordinates:</strong> Recipient name, street address, state, city, and 6-digit postal PIN code for parcel fulfillment.</li>
              <li><strong>Transaction Telemetry:</strong> Order items, currency, minor-unit amount (paise), and payment gateway reference ID. We never touch or store raw credit/debit card numbers or UPI MPINs.</li>
              <li><strong>Community Contributions:</strong> Product reviews, ratings, and customer service feedback authored by you.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">2. Server-Authoritative Session Security</h2>
            <p>
              Customer sessions rely exclusively on cryptographic server-validated session tokens transmitted over TLS 1.3 encrypted connections. User roles and privileges are evaluated solely on the server against authoritative PostgreSQL records; client-manipulated roles or URL parameters are rejected.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">3. Third-Party Service Providers</h2>
            <p>
              We share only the minimum necessary information with contracted operational partners:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
              <li><strong>Payment Gateways (Razorpay):</strong> Transaction tokens and monetary totals for processing payments.</li>
              <li><strong>Logistics Couriers (Bluedart, Delhivery):</strong> Destination address, contact telephone, and package dimensions for delivery.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-serif text-zinc-950 font-bold">4. Your Data Rights & Deletion</h2>
            <p>
              You retain sovereign ownership of your data. You may update your profile and addresses at any time in your <Link href="/account" className="text-amber-700 font-semibold underline underline-offset-4">Patron Account</Link>. To request an export of your order history or complete deletion of your profile, contact <a href="mailto:privacy@nexu.studio" className="text-amber-700 font-semibold underline underline-offset-4">privacy@nexu.studio</a>.
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-zinc-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

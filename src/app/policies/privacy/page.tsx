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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-300">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Atelier
      </Link>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-8 mb-10">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold block mb-2">
          Security & Patron Sovereignty
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
          Privacy Policy & Data Ethics
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Last Revised: October 30, 2026 • Compliant with Digital Personal Data Protection (DPDP) principles
        </p>
      </div>

      {/* Core Privacy Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <EyeOff className="w-5 h-5 text-amber-400 mb-2" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
            Reviewer Masking
          </h3>
          <p className="text-xs text-zinc-400">
            Public reviews automatically mask names (e.g. &quot;Aarav M.&quot;). Surnames, emails, and addresses are strictly concealed.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <Lock className="w-5 h-5 text-emerald-400 mb-2" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
            Zero Client Credential Storage
          </h3>
          <p className="text-xs text-zinc-400">
            Passwords, payment tokens, and session secrets are never stored in browser localStorage or sessionStorage.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <ShieldCheck className="w-5 h-5 text-blue-400 mb-2" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
            No Invasive Trackers
          </h3>
          <p className="text-xs text-zinc-400">
            We operate zero third-party advertising tracking pixels or data-broker syndication beacons.
          </p>
        </div>
      </div>

      {/* Policy Details */}
      <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">1. Information We Collect & Why</h2>
          <p>
            When you register, place an order, or converse with our concierge, Nexu Atelier processes:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li><strong>Account Identity:</strong> Email address and salted, PBKDF2-hashed password for authentication.</li>
            <li><strong>Shipping Coordinates:</strong> Recipient name, street address, state, city, and 6-digit postal PIN code for parcel fulfillment.</li>
            <li><strong>Transaction Telemetry:</strong> Order items, currency, minor-unit amount (paise), and payment gateway reference ID. We never touch or store raw credit/debit card numbers or UPI MPINs.</li>
            <li><strong>Community Contributions:</strong> Product reviews, ratings, and customer service feedback authored by you.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">2. Server-Authoritative Session Security</h2>
          <p>
            Customer sessions rely exclusively on cryptographic server-validated session tokens transmitted over TLS 1.3 encrypted connections. User roles and privileges are evaluated solely on the server against authoritative PostgreSQL records; client-manipulated roles or URL parameters are rejected.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">3. Third-Party Service Providers</h2>
          <p>
            We share only the minimum necessary information with contracted operational partners:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li><strong>Payment Gateways (Razorpay):</strong> Transaction tokens and monetary totals for processing payments.</li>
            <li><strong>Logistics Couriers (Bluedart, Delhivery):</strong> Destination address, contact telephone, and package dimensions for delivery.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif text-white">4. Your Data Rights & Deletion</h2>
          <p>
            You retain sovereign ownership of your data. You may update your profile and addresses at any time in your <Link href="/account" className="text-amber-400 underline underline-offset-4">Patron Account</Link>. To request an export of your order history or complete deletion of your profile, contact <a href="mailto:privacy@nexu.studio" className="text-amber-400 underline underline-offset-4">privacy@nexu.studio</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

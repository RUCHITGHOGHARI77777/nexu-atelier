"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, ArrowLeft, Search } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
  category: "Ordering & Payment" | "Shipping & Logistics" | "Craft & Authenticity" | "Returns & Refunds";
}

const FAQS: FAQItem[] = [
  {
    category: "Ordering & Payment",
    q: "How does the payment escrow protocol protect my funds?",
    a: "When you place an order, your payment is held securely in a state-monitored escrow account. Funds are only scheduled for disbursement to the independent studio after the courier marks your parcel as delivered and your 14-day inspection window begins.",
  },
  {
    category: "Ordering & Payment",
    q: "Which payment instruments are supported?",
    a: "We support all major domestic and international payment instruments via our secure Razorpay gateway integration, including Instant UPI (Google Pay, PhonePe, Paytm, CRED), Visa, Mastercard, RuPay, American Express, and Netbanking across 50+ Indian banks.",
  },
  {
    category: "Shipping & Logistics",
    q: "Why did my order arrive in multiple separate packages?",
    a: "Nexu Atelier connects you directly with independent master studios across India. If your order includes a handloom silk shawl from Varanasi and a cast bronze vessel from Moradabad, each workshop packages and dispatches their piece directly to ensure optimal archival care. You will receive separate AWB tracking numbers at no additional shipping fee.",
  },
  {
    category: "Shipping & Logistics",
    q: "What is the threshold for complimentary shipping?",
    a: "All orders with a subtotal of ₹2,500 or higher automatically qualify for complimentary standard courier delivery across India. For orders below ₹2,500, a flat nominal rate of ₹150 applies.",
  },
  {
    category: "Craft & Authenticity",
    q: "How can I verify that a piece is genuinely hand-crafted?",
    a: "Every piece delivered through Nexu Atelier includes a signed Studio Provenance Card detailing the master artisan's name, workshop location, exact date of finishing, and material assay specifications. Our verification team conducts physical inspections of artisan studios before onboarding.",
  },
  {
    category: "Craft & Authenticity",
    q: "Can I request custom dimensions or bespoke monograms?",
    a: "Many of our independent studios welcome custom commissions. Contact our concierge desk at concierge@nexu.studio or through the Contact page with the product reference and desired measurements for a bespoke quote.",
  },
  {
    category: "Returns & Refunds",
    q: "What is the policy for returning a piece?",
    a: "You have 14 calendar days from the date of confirmed carrier delivery to request a return. Pieces must remain unworn, unwashed, and in original archival presentation boxes with all tags intact. Once received and inspected by the studio, a full refund is processed back to your original payment method.",
  },
  {
    category: "Returns & Refunds",
    q: "Can I cancel an order before it has been dispatched?",
    a: "Yes. You can cancel any unfulfilled order with a single click from your Patron Orders page. The reserved stock is returned to the studio catalog instantly, and a 100% refund is initiated immediately.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Ordering & Payment", "Shipping & Logistics", "Craft & Authenticity", "Returns & Refunds"];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
      <div className="border-b border-zinc-800 pb-8 mb-10 text-center sm:text-left">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold block mb-2">
          Knowledge Base & Resolution
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Everything you need to know about our artisan patronage model, escrow payments, parcel logistics, and returns.
        </p>

        {/* Search Input */}
        <div className="mt-6 relative max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3.5 py-1.5 rounded-lg border transition-all ${
              selectedCategory === cat
                ? "bg-amber-500/10 border-amber-500/50 text-amber-400 font-medium"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion */}
      {filteredFaqs.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
          <HelpCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No matching answers found for &quot;{searchQuery}&quot;.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="text-xs text-amber-400 underline underline-offset-4 mt-2"
          >
            Clear search filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-colors hover:border-zinc-700/80"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-white tracking-tight">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-amber-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 bg-zinc-950/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Still Have Questions CTA */}
      <div className="mt-14 p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h3 className="text-sm font-semibold text-white">Can&apos;t find what you&apos;re looking for?</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Our concierge team is available to assist with bespoke requests.</p>
        </div>
        <Link
          href="/contact"
          className="text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          Contact Concierge
        </Link>
      </div>
    </div>
  );
}

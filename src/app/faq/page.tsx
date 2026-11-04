"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, ArrowLeft, Search, MessageSquare, ShieldCheck, Truck, RotateCcw, Sparkles } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
  category: "Ordering & Payment" | "Shipping & Logistics" | "Craft & Authenticity" | "Returns & Refunds";
}

const FAQS: FAQItem[] = [
  {
    category: "Ordering & Payment",
    q: "How does the patron protection protocol safeguard my purchase?",
    a: "When you place an order, your payment is protected under NEXU's Patron Protection Protocol. Funds are only disbursed to the independent studio after verified delivery by the carrier and after your inspection window begins.",
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
    <div className="min-h-screen bg-[#FBFBFA] py-12 sm:py-20 text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>

        {/* Header */}
        <div className="border-b border-zinc-200 pb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-mono text-zinc-700 shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold uppercase tracking-wider">KNOWLEDGE BASE & RESOLUTION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif text-zinc-950 font-bold tracking-tight">
            Frequently Asked Questions
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
            Everything you need to know about our artisan patronage model, escrow funds security, parcel logistics, and 14-day returns.
          </p>

          {/* Search Input */}
          <div className="mt-4 relative max-w-lg">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions by keyword (e.g. escrow, shipping, returns)..."
              className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 shadow-xs font-medium"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer font-medium ${
                selectedCategory === cat
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                  : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-zinc-200 text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-900">No questions found matching your query.</p>
              <p className="text-xs text-zinc-500">Try broadening your search term or clearing category filters.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-semibold block">
                        {faq.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-950 font-serif">
                        {faq.q}
                      </h3>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180 bg-zinc-900 text-white" : ""
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 bg-[#FAF9F5]/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Concierge Help Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-950 font-serif">
              Still have questions about a piece or custom order?
            </h3>
            <p className="text-xs text-zinc-600">
              Our patron concierge desk is available Monday through Saturday to provide personalized guidance.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shrink-0 shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contact Concierge Desk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

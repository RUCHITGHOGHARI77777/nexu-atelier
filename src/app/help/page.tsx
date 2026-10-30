import React from "react";
import Link from "next/link";
import {
  HelpCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  User,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center & Patron Concierge — Nexu Atelier",
  description: "Step-by-step resolution guides, order tracking assistance, return processing, and account management.",
};

export default function HelpCenterPage() {
  const guides = [
    {
      icon: Truck,
      title: "Tracking Your Parcels",
      desc: "Locate your Air Waybill (AWB) numbers, decipher multi-vendor tracking stages, and view expected delivery windows.",
      link: "/account/orders",
      linkLabel: "View My Orders",
    },
    {
      icon: RotateCcw,
      title: "Initiating a Return or Dispute",
      desc: "Step-by-step instructions for opening a dispute on damaged crates or requesting a 14-day post-delivery exchange.",
      link: "/policies/refunds",
      linkLabel: "Read Return Policy",
    },
    {
      icon: CreditCard,
      title: "Escrow Protocol & Payments",
      desc: "Understand how your funds remain protected in escrow until your delivered parcel is inspected.",
      link: "/policies/terms",
      linkLabel: "View Terms of Service",
    },
    {
      icon: ShieldCheck,
      title: "Authenticity & Weaver Provenance",
      desc: "Learn about our physical inspection audits, signed studio cards, and material hallmarks.",
      link: "/about",
      linkLabel: "Discover Provenance Standards",
    },
    {
      icon: User,
      title: "Account & Address Book",
      desc: "Update your delivery coordinates, manage saved addresses, or export personal transaction logs.",
      link: "/account",
      linkLabel: "Manage Patron Profile",
    },
    {
      icon: MessageCircle,
      title: "Speak with Concierge",
      desc: "Direct access to our senior concierge desk for bespoke commissions or time-sensitive assistance.",
      link: "/contact",
      linkLabel: "Submit Inquiry Ticket",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-300">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Atelier
      </Link>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-8 mb-12">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold block mb-2">
          Concierge & Self-Service
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
          Help Center & Resolution Guides
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
          Clear, documented assistance for every step of your patronage journey, from artisan commissions to doorstep delivery.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {guides.map((g, idx) => {
          const Icon = g.icon;
          return (
            <div
              key={idx}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif text-white mb-2">{g.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">{g.desc}</p>
              </div>

              <Link
                href={g.link}
                className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors pt-2 border-t border-zinc-800/80"
              >
                {g.linkLabel} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Direct Assistance CTA Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block mb-1">
            Human Assistance Guaranteed
          </span>
          <h2 className="text-xl sm:text-2xl font-serif text-white">
            Need urgent assistance with an in-transit order?
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            Our concierge desk is staffed by real luxury specialists based in Mumbai and Bangalore.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/faq"
            className="text-xs px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Browse FAQ
          </Link>
          <Link
            href="/contact"
            className="text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Contact Desk
          </Link>
        </div>
      </div>
    </div>
  );
}

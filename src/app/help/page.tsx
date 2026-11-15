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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-[#171717]">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#767676] hover:text-[#171717] mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Atelier
      </Link>

      <div className="border-b border-[#E8E8E4] pb-8 mb-12">
        <span className="text-xs uppercase tracking-widest text-[#B78B45] font-semibold block mb-2">
          Concierge & Self-Service
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#171717] tracking-tight">
          Help Center & Resolution Guides
        </h1>
        <p className="text-sm text-[#626262] mt-2 max-w-2xl">
          Clear, documented assistance for every step of your patronage journey, from artisan commissions to doorstep delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {guides.map((g, idx) => {
          const Icon = g.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-[#E8E8E4] rounded-2xl p-6 flex flex-col justify-between hover:border-[#171717]/30 hover:shadow-md transition-all shadow-xs"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] flex items-center justify-center text-[#B78B45] mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif text-[#171717] mb-2">{g.title}</h3>
                <p className="text-xs text-[#626262] leading-relaxed mb-6">{g.desc}</p>
              </div>

              <Link
                href={g.link}
                className="inline-flex items-center text-xs font-semibold text-[#171717] hover:text-[#B78B45] transition-colors pt-3 border-t border-[#E8E8E4]"
              >
                {g.linkLabel} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="bg-[#FAFAF8] border border-[#E8E8E4] rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#B78B45] block mb-1 font-semibold">
            Human Assistance Guaranteed
          </span>
          <h2 className="text-xl sm:text-2xl font-serif text-[#171717]">
            Need urgent assistance with an in-transit order?
          </h2>
          <p className="text-xs text-[#626262] mt-1 max-w-lg">
            Our concierge desk is staffed by real luxury specialists based in Mumbai and Bangalore.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/faq"
            className="text-xs px-4 py-2.5 rounded-lg border border-[#E8E8E4] bg-white text-[#171717] hover:bg-[#FAFAF8] transition-colors font-medium shadow-xs"
          >
            Browse FAQ
          </Link>
          <Link
            href="/contact"
            className="text-xs bg-white text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] hover:bg-[#FAFAF8] font-bold px-5 py-2.5 rounded-lg transition-colors shadow-xs"
          >
            Contact Desk
          </Link>
        </div>
      </div>
    </div>
  );
}

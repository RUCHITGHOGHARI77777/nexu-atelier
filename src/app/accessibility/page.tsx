import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Eye, CheckCircle2, ChevronRight, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Accessibility Statement | NEXU ATELIER",
  description:
    "Nexu Atelier is dedicated to providing an accessible, inclusive digital storefront experience for all patrons conforming to WCAG 2.1 AA guidelines.",
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-zinc-50/50 py-10 sm:py-16 text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <Link href="/" className="hover:text-zinc-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-900 font-bold">Accessibility Statement</span>
        </nav>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          <div className="space-y-3 pb-6 border-b border-zinc-200">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700">
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>WCAG 2.1 AA COMMITMENT</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              Digital Accessibility Statement
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Last updated: October 2026. NEXU ATELIER believes fine craftsmanship belongs to everyone.
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-zinc-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-950">
                1. Our Commitment to Equal Access
              </h2>
              <p>
                At NEXU ATELIER, we are committed to ensuring digital accessibility for people of all abilities. We continually improve the user experience for everyone and apply relevant accessibility standards as codified by the World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-zinc-950">
                2. Technical Measures Implemented
              </h2>
              <p>
                Our Next.js 14 architecture incorporates accessibility best practices into every release:
              </p>
              <ul className="space-y-2 list-none pl-0">
                {[
                  "Semantic HTML structure (header, main, nav, section, article, footer) for screen reader clarity.",
                  "Comprehensive ARIA labels, roles, and live regions on dynamic components (e.g. cart drawer, search suggestions).",
                  "Full keyboard navigation support with prominent visible focus indicators and Ctrl+K search shortcut.",
                  "High text contrast ratios exceeding 4.5:1 for standard text and 3:1 for large display elements.",
                  "Descriptive alternative text (alt tags) for all craft and artisan photography.",
                  "Responsive text scaling up to 200% without loss of content or functionality.",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-950">
                3. Assistive Technology Compatibility
              </h2>
              <p>
                The NEXU ATELIER website is engineered to be compatible with modern assistive technologies, including NVDA, JAWS, VoiceOver (macOS/iOS), TalkBack (Android), and browser zoom extensions.
              </p>
            </section>

            <section className="space-y-3 p-6 rounded-2xl bg-zinc-50 border border-zinc-200">
              <h2 className="text-base font-bold text-zinc-950">
                4. Feedback & Concierge Assistance
              </h2>
              <p className="text-xs text-zinc-600">
                If you encounter any accessibility barrier or require assistance browsing, placing an order, or reviewing craft provenance, please connect directly with our accessibility coordinator:
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                <Mail className="w-4 h-4 text-amber-600" />
                <span>Email: accessibility@nexu.studio</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

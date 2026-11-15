"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Building,
  Coins,
  ShieldCheck,
  Truck,
  Palette,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  AlertCircle,
  ExternalLink,
  Store,
  Compass,
} from "lucide-react";
import { MarketplaceSetupConfig } from "@/app/api/admin/setup/route";

const THEME_OPTIONS = [
  {
    id: "editorial_luxury",
    name: "Editorial Luxury",
    desc: "Warm minimalist, bespoke typography, serif accents, quiet luxury aesthetic.",
    accent: "bg-[#2A2624] text-white border-[#C5A880]",
  },
  {
    id: "minimal_modern",
    name: "Minimal Modern",
    desc: "Crisp architectural lines, high-contrast monochrome, ultra-clean layout.",
    accent: "bg-[#18181B] text-white border-zinc-500",
  },
  {
    id: "warm_atelier",
    name: "Warm Atelier",
    desc: "Earth tones, terracotta highlights, artisanal workshop ambiance.",
    accent: "bg-[#3D2C24] text-white border-[#D4A373]",
  },
];

export default function MarketplaceSetupWizardPage() {
  const [step, setStep] = useState<number>(1);
  const [config, setConfig] = useState<MarketplaceSetupConfig | null>(null);
  const [stats, setStats] = useState<{ categoriesCount: number; sellersCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/setup");
        if (res.ok) {
          const data = await res.json();
          setConfig(data.config);
          setStats(data.stats);
        } else {
          setError("Failed to load initial marketplace setup.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load setup.");
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleChange = (field: keyof MarketplaceSetupConfig, val: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: val });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setStep(6);
      } else {
        setError(data.error || "Failed to save marketplace setup.");
      }
    } catch (err: any) {
      setError(err.message || "Error saving setup.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-[#5A534E]">
          <div className="w-5 h-5 border-2 border-[#8C6D46] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm tracking-wide">Loading Marketplace Setup Wizard...</span>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
        <div className="max-w-md bg-white border border-[#E6E0D6] p-8 rounded shadow-sm text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-serif text-[#2A2624] mb-2">Setup Wizard Unavailable</h2>
          <p className="text-sm text-[#7D756D] mb-6">{error || "Admin authentication required."}</p>
          <Link
            href="/admin"
            className="inline-block px-5 py-2.5 bg-[#2A2624] text-white text-xs uppercase tracking-widest font-medium hover:bg-[#3D3734] transition-colors"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const stepsList = [
    { num: 1, title: "Identity", icon: Building },
    { num: 2, title: "Regional", icon: Coins },
    { num: 3, title: "Policies", icon: ShieldCheck },
    { num: 4, title: "Logistics", icon: Truck },
    { num: 5, title: "Storefront", icon: Palette },
    { num: 6, title: "Launch", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2A2624] pb-24">
      <header className="border-b border-[#E6E0D6] bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs uppercase tracking-[0.2em] font-serif text-[#8C6D46] font-semibold">
              NEXU ATELIER
            </span>
            <span className="text-xs text-[#C5BCB3]">/</span>
            <span className="text-xs tracking-wider text-[#5A534E] uppercase">Marketplace Setup Wizard</span>
          </div>
          <Link
            href="/admin"
            className="text-xs uppercase tracking-wider text-[#7D756D] hover:text-[#2A2624] transition-colors"
          >
            Exit to Admin &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        <div className="bg-[#FAF7F2] border border-[#E6E0D6] p-6 mb-8 rounded">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-serif text-[#2A2624] mb-1">
                Marketplace Self-Setup & Configuration
              </h1>
              <p className="text-xs text-[#7D756D] leading-relaxed max-w-2xl">
                Configure your multi-vendor marketplace brand, commission structure, payment policies, and operational defaults.
                All parameters take immediate effect across customer storefronts, seller dashboards, and backend services.
              </p>
            </div>
            {stats && (
              <div className="hidden sm:flex items-center space-x-4 text-xs text-[#7D756D] border-l border-[#E6E0D6] pl-6">
                <div>
                  <div className="font-semibold text-sm text-[#2A2624]">{stats.categoriesCount}</div>
                  <div className="text-[10px] uppercase tracking-wider">Categories</div>
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#2A2624]">{stats.sellersCount}</div>
                  <div className="text-[10px] uppercase tracking-wider">Suppliers</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav aria-label="Progress" className="mb-10">
          <ol className="flex items-center justify-between">
            {stepsList.map((s, idx) => {
              const Icon = s.icon;
              const isCurrent = step === s.num;
              const isDone = step > s.num;
              return (
                <li key={s.num} className="flex-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => step < 6 && setStep(s.num)}
                    className="flex flex-col items-center group w-full focus:outline-none"
                    disabled={step === 6}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-colors ${
                        isCurrent
                          ? "bg-[#2A2624] text-white ring-4 ring-[#EAE4DC]"
                          : isDone
                          ? "bg-[#8C6D46] text-white"
                          : "bg-white border border-[#D5CFC5] text-[#7D756D]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`mt-2 text-[10px] uppercase tracking-wider text-center font-medium ${
                        isCurrent ? "text-[#2A2624] font-semibold" : "text-[#7D756D]"
                      }`}
                    >
                      {s.title}
                    </span>
                  </button>
                  {idx < stepsList.length - 1 && (
                    <div
                      className={`h-[1px] flex-1 mx-2 ${
                        step > s.num ? "bg-[#8C6D46]" : "bg-[#E6E0D6]"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-[#E6E0D6] rounded p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-serif text-[#2A2624]">Step 1: Marketplace Brand & Contact</h2>
                <p className="text-xs text-[#7D756D]">Set your public marketplace title, identity, and customer concierge contact details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Marketplace Name
                  </label>
                  <input
                    type="text"
                    value={config.marketplaceName}
                    onChange={(e) => handleChange("marketplaceName", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    placeholder="e.g. NEXU ATELIER"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Concierge Support Email
                  </label>
                  <input
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => handleChange("supportEmail", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    placeholder="concierge@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Storefront Web Title (SEO)
                  </label>
                  <input
                    type="text"
                    value={config.websiteTitle}
                    onChange={(e) => handleChange("websiteTitle", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    placeholder="e.g. NEXU ATELIER — Artisanal Marketplace"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Storefront Description
                  </label>
                  <textarea
                    rows={3}
                    value={config.websiteDescription}
                    onChange={(e) => handleChange("websiteDescription", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    placeholder="Brief description for search engines and social previews..."
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Logo Image URL / Path
                  </label>
                  <input
                    type="text"
                    value={config.logoUrl || ""}
                    onChange={(e) => handleChange("logoUrl", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    placeholder="/images/brand/logo.svg"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Helpline / Phone Number
                  </label>
                  <input
                    type="text"
                    value={config.supportPhone || ""}
                    onChange={(e) => handleChange("supportPhone", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-serif text-[#2A2624]">Step 2: Regional & Monetary Defaults</h2>
                <p className="text-xs text-[#7D756D]">Define the primary legal jurisdiction, currency code, and operating timezone.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Country
                  </label>
                  <select
                    value={config.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                  >
                    <option value="India">India (IN)</option>
                    <option value="United States">United States (US)</option>
                    <option value="United Kingdom">United Kingdom (UK)</option>
                    <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                    <option value="Singapore">Singapore (SG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Timezone
                  </label>
                  <select
                    value={config.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                    <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
                    <option value="Europe/London">Europe/London (GMT - UTC+00:00)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    value={config.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    placeholder="INR"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={config.currencySymbol}
                    onChange={(e) => handleChange("currencySymbol", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    placeholder="₹"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-serif text-[#2A2624]">Step 3: Marketplace Policies & Commission</h2>
                <p className="text-xs text-[#7D756D]">Set marketplace take rate, escrow settlement hold, return windows, and vendor approval.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Platform Commission Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={config.commissionPercent}
                      onChange={(e) => handleChange("commissionPercent", parseFloat(e.target.value) || 0)}
                      className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7D756D]">%</span>
                  </div>
                  <span className="text-[10px] text-[#7D756D] mt-1 block">
                    Calculated automatically per order line item across all marketplace vendors.
                  </span>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Escrow Clearance Hold (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={config.escrowHoldDays}
                    onChange={(e) => handleChange("escrowHoldDays", parseInt(e.target.value, 10) || 7)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                  />
                  <span className="text-[10px] text-[#7D756D] mt-1 block">
                    Days held in escrow following order delivery before eligible for vendor payout.
                  </span>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Customer Return Window (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={config.returnWindowDays}
                    onChange={(e) => handleChange("returnWindowDays", parseInt(e.target.value, 10) || 14)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                  />
                  <span className="text-[10px] text-[#7D756D] mt-1 block">
                    Period in which patrons can initiate a return or replacement ticket.
                  </span>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Seller Onboarding Approval
                  </label>
                  <div className="flex items-center space-x-3 mt-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.sellerAutoApproval}
                        onChange={(e) => handleChange("sellerAutoApproval", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8C6D46]"></div>
                      <span className="ml-3 text-xs text-[#5A534E]">
                        {config.sellerAutoApproval ? "Automatic Approval" : "Manual Admin Review (Recommended)"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-serif text-[#2A2624]">Step 4: Delivery, Shipping & Payments</h2>
                <p className="text-xs text-[#7D756D]">Configure delivery rules, threshold for complimentary dispatch, and COD ceilings.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Free Shipping Threshold (INR)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={config.freeShippingThresholdInr}
                      onChange={(e) => handleChange("freeShippingThresholdInr", parseInt(e.target.value, 10) || 0)}
                      className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#7D756D]">INR</span>
                  </div>
                  <span className="text-[10px] text-[#7D756D] mt-1 block">
                    Orders at or above this cart total receive free standard shipping.
                  </span>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Cash on Delivery (COD)
                  </label>
                  <div className="flex items-center space-x-3 mt-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.codEnabled}
                        onChange={(e) => handleChange("codEnabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8C6D46]"></div>
                      <span className="ml-3 text-xs text-[#5A534E]">
                        {config.codEnabled ? "Enabled" : "Disabled (Online Pre-paid Only)"}
                      </span>
                    </label>
                  </div>
                </div>

                {config.codEnabled && (
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                      Maximum Allowed COD Order Value (INR)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min="1000"
                      value={config.codMaxLimitInr}
                      onChange={(e) => handleChange("codMaxLimitInr", parseInt(e.target.value, 10) || 15000)}
                      className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    />
                    <span className="text-[10px] text-[#7D756D] mt-1 block">
                      Protects marketplace against high-value COD delivery failures and RTO logistics loss.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-serif text-[#2A2624]">Step 5: Storefront Theme & Presentation</h2>
                <p className="text-xs text-[#7D756D]">Select a luxury aesthetic theme preset and tailor the homepage masthead.</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-3 font-medium">
                  Active Visual Theme Preset
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {THEME_OPTIONS.map((theme) => {
                    const isSelected = config.themePreset === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleChange("themePreset", theme.id)}
                        className={`border rounded p-4 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#8C6D46] bg-[#FAF7F2] ring-2 ring-[#8C6D46]/20"
                            : "border-[#E6E0D6] hover:border-[#C5BCB3] bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-serif font-medium text-sm text-[#2A2624]">{theme.name}</span>
                          {isSelected && <CheckCircle className="w-4 h-4 text-[#8C6D46]" />}
                        </div>
                        <p className="text-xs text-[#7D756D] leading-relaxed mb-3">{theme.desc}</p>
                        <div className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded inline-block border ${theme.accent}`}>
                          Preview Palette
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E6E0D6]">
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Homepage Hero Headline
                  </label>
                  <input
                    type="text"
                    value={config.heroHeadline}
                    onChange={(e) => handleChange("heroHeadline", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Homepage Hero Subtitle
                  </label>
                  <input
                    type="text"
                    value={config.heroSubtitle}
                    onChange={(e) => handleChange("heroSubtitle", e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-[#5A534E] mb-2 font-medium">
                    Storefront Announcement Banner
                  </label>
                  <div className="flex items-center space-x-3 mb-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.bannerEnabled}
                        onChange={(e) => handleChange("bannerEnabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8C6D46]"></div>
                      <span className="ml-3 text-xs text-[#5A534E]">
                        {config.bannerEnabled ? "Banner Display Enabled" : "Hidden"}
                      </span>
                    </label>
                  </div>
                  {config.bannerEnabled && (
                    <input
                      type="text"
                      value={config.bannerText}
                      onChange={(e) => handleChange("bannerText", e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 border border-[#D5CFC5] rounded bg-white text-[#2A2624] focus:outline-none focus:border-[#8C6D46]"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-serif text-[#2A2624] mb-2">Marketplace Setup Complete!</h2>
                <p className="text-xs text-[#7D756D] max-w-lg mx-auto leading-relaxed">
                  Your configuration has been committed to PostgreSQL and signed in the tamper-evident audit ledger.
                  The public storefront, seller portals, and checkout engine are active and synchronized.
                </p>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E6E0D6] rounded p-6 max-w-xl mx-auto text-left grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#7D756D] block">Marketplace Name</span>
                  <span className="font-semibold text-[#2A2624]">{config.marketplaceName}</span>
                </div>
                <div>
                  <span className="text-[#7D756D] block">Commission Rate</span>
                  <span className="font-semibold text-[#2A2624]">{config.commissionPercent}%</span>
                </div>
                <div>
                  <span className="text-[#7D756D] block">Jurisdiction & Currency</span>
                  <span className="font-semibold text-[#2A2624]">{config.country} ({config.currency})</span>
                </div>
                <div>
                  <span className="text-[#7D756D] block">Theme Preset</span>
                  <span className="font-semibold text-[#2A2624] uppercase">{config.themePreset}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href="/"
                  target="_blank"
                  className="px-6 py-3 bg-[#2A2624] text-white text-xs uppercase tracking-widest font-medium hover:bg-[#3D3734] transition-colors flex items-center space-x-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Open Public Storefront</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>

                <Link
                  href="/seller"
                  target="_blank"
                  className="px-6 py-3 border border-[#2A2624] text-[#2A2624] text-xs uppercase tracking-widest font-medium hover:bg-[#FAF7F2] transition-colors flex items-center space-x-2"
                >
                  <Store className="w-4 h-4" />
                  <span>Open Seller Portal</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>

                <Link
                  href="/admin"
                  className="px-6 py-3 border border-[#D5CFC5] text-[#7D756D] text-xs uppercase tracking-widest font-medium hover:text-[#2A2624] transition-colors"
                >
                  Return to Admin Dashboard
                </Link>
              </div>
            </div>
          )}

          {step < 6 && (
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-[#E6E0D6]">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 border border-[#D5CFC5] text-[#5A534E] text-xs uppercase tracking-wider font-medium hover:bg-[#FAF7F2] transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2.5 bg-[#2A2624] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#3D3734] transition-colors flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-2.5 bg-[#8C6D46] text-white text-xs uppercase tracking-widest font-medium hover:bg-[#725735] transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Setup..." : "Save & Activate Marketplace"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


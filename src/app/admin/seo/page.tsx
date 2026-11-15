"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  Save,
  RefreshCw,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  Sliders,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { GlobalSeoSettings, MerchantFeedStatusSummary } from "@/types/seo-discovery";

export default function AdminSeoControlCenter() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "settings" | "verification" | "merchant" | "sitemaps"
  >("overview");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [settings, setSettings] = useState<GlobalSeoSettings>({
    siteName: "NEXU ATELIER",
    defaultMetaTitle: "NEXU ATELIER — Handcrafted Artisan Heritage & Modern Luxury",
    defaultMetaDescription:
      "Explore certified handcrafted luxury, bespoke artisan textiles, heritage jewellery, and master craft decor on NEXU ATELIER.",
    defaultOgImage:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    canonicalBaseUrl: "https://nexu.studio",
    googleVerificationCode: "",
    bingVerificationCode: "",
    merchantCenterAccountId: "",
    targetCountry: "IN",
    feedCurrency: "INR",
    outOfStockPolicy: "INDEX_AS_OUT_OF_STOCK",
  });

  const [feedSummary, setFeedSummary] = useState<MerchantFeedStatusSummary | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchSeoData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [overviewRes, settingsRes, feedRes] = await Promise.all([
        fetch("/api/admin/seo/overview"),
        fetch("/api/admin/seo/settings"),
        fetch("/api/admin/seo/feed-status"),
      ]);

      if (overviewRes.ok) {
        const oData = await overviewRes.json();
        setOverview(oData.overview);
      }
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.settings) setSettings(sData.settings);
      }
      if (feedRes.ok) {
        const fData = await feedRes.json();
        if (fData.summary) setFeedSummary(fData.summary);
      }
    } catch (err: any) {
      setErrorMessage("Failed to load SEO administration data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/seo/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await fetchSeoData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to save SEO settings.");
      }
    } catch {
      setErrorMessage("Network error saving SEO configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  return (
    <div className="space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-zinc-950" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              SEO & Multi-Channel Discovery Engine
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Authoritative search engine optimization, Google Merchant Center feed governance, and indexing controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSeoData}
            disabled={isLoading}
            className="flex items-center gap-2 border-zinc-200 hover:bg-zinc-50 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Metrics</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save SEO Settings"}</span>
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>SEO platform configuration saved successfully and audit log updated.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Indexable Products</span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-950">
              {overview?.publishedApprovedCount ?? 0}
            </span>
            <span className="text-[11px] text-zinc-400">
              / {overview?.totalProducts ?? 0} total
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Approved & published catalog</p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>SEO Ready (≥80)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {overview?.seoReadyCount ?? 0}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">
              ({overview?.seoReadinessPercent ?? 0}%)
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Optimal organic discovery</p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Needs Attention (&lt;50)</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-amber-700">
              {overview?.seoActionNeededCount ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Missing meta or titles</p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Image ALT Coverage</span>
            <Globe className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-950">
              {overview?.imageAltCoverage?.coveragePercent ?? 100}%
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {overview?.imageAltCoverage?.missingOrGenericAlt ?? 0} missing descriptions
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Merchant Feed Ready</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-700">
              {feedSummary?.readyCount ?? 0}
            </span>
            <span className="text-[11px] text-zinc-400">
              / {feedSummary?.totalPublishedProducts ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Google Shopping eligible</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-zinc-200 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Catalog Health & Issues
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "settings"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Global Metadata & Brand
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("verification")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "verification"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Search Engine Verification
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("merchant")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "merchant"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Google Merchant Center Feed
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sitemaps")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "sitemaps"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Sitemaps & Technical SEO
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
            <div className="p-4 bg-zinc-50/70 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                  Product Catalog SEO Readiness Breakdown
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Inspection of all approved products, SEO scores, and direct editor navigation.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {feedSummary?.items?.length ?? 0} inspected
              </span>
            </div>

            <div className="divide-y divide-zinc-100">
              {feedSummary?.items?.map((item) => (
                <div
                  key={item.productId}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-900">
                        {item.productTitle}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md border font-mono ${
                          item.status === "READY"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "WARNING"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono block">
                      /product/{item.slug}
                    </span>
                    {item.issues.length > 0 && (
                      <ul className="text-[11px] text-zinc-500 space-y-0.5 pt-1">
                        {item.issues.map((iss, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-amber-500">•</span>
                            <span>{iss}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/product/${item.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center gap-1.5"
                    >
                      <span>Public Page</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Global Site Metadata & Social Card Defaults
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-900">
                  Site Name (Organization)
                </label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="text-xs bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-900">
                  Authoritative Base URL (Canonical Domain)
                </label>
                <Input
                  value={settings.canonicalBaseUrl}
                  onChange={(e) => setSettings({ ...settings, canonicalBaseUrl: e.target.value })}
                  className="text-xs bg-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-900">
                Default Global Meta Title
              </label>
              <Input
                value={settings.defaultMetaTitle}
                onChange={(e) => setSettings({ ...settings, defaultMetaTitle: e.target.value })}
                className="text-xs bg-white"
              />
              <p className="text-[11px] text-zinc-500">
                Fallback title used when individual category or static pages do not supply a specific title tag.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-900">
                Default Meta Description
              </label>
              <textarea
                rows={3}
                value={settings.defaultMetaDescription}
                onChange={(e) =>
                  setSettings({ ...settings, defaultMetaDescription: e.target.value })
                }
                className="w-full rounded-xl border border-zinc-200 p-3 text-xs text-zinc-900 bg-white focus:outline-hidden focus:border-zinc-950"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-900">
                Default Open Graph Share Image URL
              </label>
              <Input
                value={settings.defaultOgImage}
                onChange={(e) => setSettings({ ...settings, defaultOgImage: e.target.value })}
                className="text-xs bg-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-900">
                Out-of-Stock Indexing Policy
              </label>
              <select
                value={settings.outOfStockPolicy}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    outOfStockPolicy: e.target.value as any,
                  })
                }
                className="w-full rounded-xl border border-zinc-200 p-2.5 text-xs text-zinc-900 bg-white font-medium"
              >
                <option value="INDEX_AS_OUT_OF_STOCK">
                  Preserve URL in Search & Sitemaps with schema.org/OutOfStock (Recommended)
                </option>
                <option value="NOINDEX">
                  Emit &apos;noindex, follow&apos; when product stock hits zero
                </option>
              </select>
              <p className="text-[11px] text-zinc-500">
                Major marketplaces retain out-of-stock URLs to preserve organic authority and backlinks.
              </p>
            </div>
          </div>
        </form>
      )}

      {activeTab === "verification" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Search Console & Webmaster Tools Verification
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Verify platform ownership with search engines. Once saved, these codes are dynamically inserted into the root HTML &lt;head&gt; across the entire storefront.
            </p>

            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-700" />
                    <span className="text-xs font-bold text-zinc-900">
                      Google Search Console
                    </span>
                  </div>
                  <Badge
                    variant={settings.googleVerificationCode ? "accent" : "outline"}
                    className="text-[10px] font-mono"
                  >
                    {settings.googleVerificationCode ? "CONFIGURED" : "PENDING SETUP"}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Enter your Google site verification HTML meta tag token (content attribute).
                </p>
                <Input
                  value={settings.googleVerificationCode}
                  onChange={(e) =>
                    setSettings({ ...settings, googleVerificationCode: e.target.value })
                  }
                  placeholder="e.g. google1234567890abcdef.html or meta tag code"
                  className="text-xs bg-white font-mono"
                />
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-700" />
                    <span className="text-xs font-bold text-zinc-900">
                      Microsoft Bing Webmaster Tools
                    </span>
                  </div>
                  <Badge
                    variant={settings.bingVerificationCode ? "accent" : "outline"}
                    className="text-[10px] font-mono"
                  >
                    {settings.bingVerificationCode ? "CONFIGURED" : "PENDING SETUP"}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Enter your Bing Webmaster msvalidate.01 meta verification string.
                </p>
                <Input
                  value={settings.bingVerificationCode}
                  onChange={(e) =>
                    setSettings({ ...settings, bingVerificationCode: e.target.value })
                  }
                  placeholder="e.g. 78E9D012B34C56789A123BCDEF"
                  className="text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "merchant" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                  Google Merchant Center & Shopping Feed Architecture
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Standard RSS 2.0 XML with Google Merchant namespace (xmlns:g) derived strictly from approved database products.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `${settings.canonicalBaseUrl}/api/feeds/google-merchant`,
                      "feed"
                    )
                  }
                  className="text-xs flex items-center gap-1.5"
                >
                  {copiedUrl === "feed" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedUrl === "feed" ? "Copied URL!" : "Copy Feed URL"}</span>
                </Button>

                <Link
                  href="/api/feeds/google-merchant"
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open Live XML Feed</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50/70 border border-zinc-200">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                  Feed Status
                </span>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Available & Validating</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                  Eligible Products
                </span>
                <span className="text-sm font-bold font-mono text-zinc-900 mt-0.5 block">
                  {feedSummary?.readyCount ?? 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                  Target Country
                </span>
                <span className="text-sm font-bold font-mono text-zinc-900 mt-0.5 block">
                  {settings.targetCountry} ({settings.feedCurrency})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                  Last Generated
                </span>
                <span className="text-xs font-mono text-zinc-600 mt-0.5 block truncate">
                  {feedSummary?.lastGeneratedAt
                    ? new Date(feedSummary.lastGeneratedAt).toLocaleTimeString()
                    : "Live"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-900">
                  Merchant Center Account ID
                </label>
                <Input
                  value={settings.merchantCenterAccountId}
                  onChange={(e) =>
                    setSettings({ ...settings, merchantCenterAccountId: e.target.value })
                  }
                  placeholder="e.g. 123456789"
                  className="text-xs bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-900">
                  Target Country (ISO)
                </label>
                <Input
                  value={settings.targetCountry}
                  onChange={(e) => setSettings({ ...settings, targetCountry: e.target.value })}
                  placeholder="IN"
                  className="text-xs bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-900">
                  Feed Currency
                </label>
                <Input
                  value={settings.feedCurrency}
                  onChange={(e) => setSettings({ ...settings, feedCurrency: e.target.value })}
                  placeholder="INR"
                  className="text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sitemaps" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-6 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              Partitioned XML Sitemaps & Crawler Guidance
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Standard sitemap index and domain-partitioned feeds for search crawler efficiency.
            </p>

            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-zinc-50/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-900">
                    Sitemap Index (/sitemap.xml)
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Root index file referenced in robots.txt linking to sub-sitemaps.
                  </p>
                </div>
                <Link
                  href="/sitemap.xml"
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center gap-1.5"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </Link>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-900">
                    Products Sitemap (/sitemaps/products.xml)
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Live feed of all approved, published products with daily change frequency.
                  </p>
                </div>
                <Link
                  href="/sitemaps/products.xml"
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center gap-1.5"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </Link>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-900">
                    Categories Sitemap (/sitemaps/categories.xml)
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Taxonomy sitemap for high-level catalog landing pages.
                  </p>
                </div>
                <Link
                  href="/sitemaps/categories.xml"
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center gap-1.5"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </Link>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-900">
                    Google Image Sitemap (/sitemaps/images.xml)
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Google Image extension with descriptive captions, titles, and high-res URLs.
                  </p>
                </div>
                <Link
                  href="/sitemaps/images.xml"
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center gap-1.5"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </Link>
              </div>

              <div className="p-4 flex items-center justify-between bg-zinc-50/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-900">
                    Robots.txt (/robots.txt)
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Disallows private buyer/supplier/admin routes; directs search crawlers to sitemap.
                  </p>
                </div>
                <Link
                  href="/robots.txt"
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center gap-1.5"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

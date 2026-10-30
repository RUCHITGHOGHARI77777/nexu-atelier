"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Globe,
  Tag,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import {
  SeoQualityResult,
  ProductCondition,
  TargetGender,
  TargetAgeGroup,
} from "@/types/seo-discovery";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SeoLivePreview } from "./SeoLivePreview";

export interface ProductSeoEditorState {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  canonicalUrl?: string;
  seoKeywords?: string;
  googleProductCategory?: string;
  condition: ProductCondition;
  targetGender: TargetGender;
  targetAgeGroup: TargetAgeGroup;
  mpn?: string;
  gtin?: string;
  ogImage?: string;
}

export interface ProductSeoEditorSectionProps {
  productTitle: string;
  productDescription: string;
  basePrice: number;
  stock: number;
  brand: string;
  categoryName: string;
  material: string;
  images: Array<{ url: string; alt?: string }>;
  highlights?: string[];
  seoState: ProductSeoEditorState;
  onChange: (updated: Partial<ProductSeoEditorState>) => void;
  onNavigateToField?: (fieldKey: string) => void;
  readOnly?: boolean;
}

export const ProductSeoEditorSection: React.FC<ProductSeoEditorSectionProps> = ({
  productTitle,
  productDescription,
  basePrice,
  stock,
  brand,
  categoryName,
  material,
  images,
  highlights = [],
  seoState,
  onChange,
  onNavigateToField,
  readOnly = false,
}) => {
  const [evaluation, setEvaluation] = useState<SeoQualityResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Debounced evaluation
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsEvaluating(true);
      try {
        const payload = {
          title: productTitle,
          description: productDescription,
          slug: seoState.slug,
          metaTitle: seoState.metaTitle,
          metaDescription: seoState.metaDescription,
          canonicalUrl: seoState.canonicalUrl,
          brand,
          mpn: seoState.mpn,
          gtin: seoState.gtin,
          material,
          basePrice,
          stock,
          googleProductCategory: seoState.googleProductCategory,
          condition: seoState.condition,
          targetGender: seoState.targetGender,
          targetAgeGroup: seoState.targetAgeGroup,
          highlights,
          images,
        };

        const res = await fetch("/api/seo/quality-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: payload }),
        });

        if (res.ok) {
          const data = await res.json();
          if (active && data.evaluation) {
            setEvaluation(data.evaluation);
          }
        }
      } catch (err) {
        // quiet error
      } finally {
        if (active) setIsEvaluating(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    productTitle,
    productDescription,
    seoState,
    basePrice,
    stock,
    brand,
    material,
    images,
    highlights,
  ]);

  // Handle Generate Suggestions
  const handleGenerateSuggestions = async () => {
    if (!productTitle || !productTitle.trim()) {
      setSuggestionMessage("Please enter a basic product title first.");
      return;
    }

    setIsGenerating(true);
    setSuggestionMessage(null);
    try {
      const res = await fetch("/api/seo/generate-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: productTitle,
          description: productDescription,
          categoryName,
          brand,
          material,
          highlights,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestions) {
          onChange({
            metaTitle: data.suggestions.suggestedTitle,
            metaDescription: data.suggestions.suggestedMetaDescription,
            slug: seoState.slug || data.suggestions.suggestedSlug,
            seoKeywords: data.suggestions.suggestedKeywords,
            googleProductCategory:
              seoState.googleProductCategory ||
              data.suggestions.suggestedGoogleCategory,
          });
          setSuggestionMessage(
            "Synthesized SEO titles, meta descriptions, and Google Shopping taxonomies from catalog attributes."
          );
        }
      }
    } catch {
      setSuggestionMessage("Failed to generate suggestions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const score = evaluation?.score || 0;
  let scoreBadgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  let ringColor = "stroke-emerald-600";
  if (score < 50) {
    scoreBadgeColor = "text-rose-700 bg-rose-50 border-rose-200";
    ringColor = "stroke-rose-600";
  } else if (score < 80) {
    scoreBadgeColor = "text-amber-700 bg-amber-50 border-amber-200";
    ringColor = "stroke-amber-600";
  }

  const primaryImage = images[0]?.url;
  const primaryAlt = images[0]?.alt;

  return (
    <div className="space-y-6 pt-6 border-t border-zinc-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-zinc-900" />
            <h3 className="text-base font-bold text-zinc-950 uppercase tracking-wider">
              Search Engine Optimization & Multi-Channel Discovery
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Configure organic search metadata, Google Shopping feed attributes, and social previews. Derived strictly from legitimate catalog data.
          </p>
        </div>

        {/* Generate Smart Suggestions Button */}
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateSuggestions}
            disabled={isGenerating || !productTitle.trim()}
            className="flex items-center gap-2 shrink-0 border-zinc-300 hover:border-zinc-950 hover:bg-zinc-50 text-xs font-semibold"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Analyzing..." : "Generate SEO Suggestions"}</span>
          </Button>
        )}
      </div>

      {suggestionMessage && (
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 flex items-center justify-between">
          <span>{suggestionMessage}</span>
          <button
            type="button"
            onClick={() => setSuggestionMessage(null)}
            className="text-zinc-400 hover:text-zinc-700 text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* SEO Score & Breakdown Gauge Card */}
      {evaluation && (
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-zinc-100"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={ringColor}
                    strokeDasharray={`${score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono font-bold text-xs text-zinc-900">
                  {score}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    SEO Completeness Score
                  </h4>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${scoreBadgeColor}`}
                  >
                    {score >= 80 ? "Search Ready" : score >= 50 ? "Needs Review" : "Blocker Detected"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">{evaluation.summary}</p>
              </div>
            </div>

            {/* Quick Readiness Pills */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 ${
                  evaluation.isIndexable
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {evaluation.isIndexable ? "✓ Indexable" : "✗ Noindex Risk"}
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 ${
                  evaluation.isMerchantEligible
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {evaluation.isMerchantEligible
                  ? "✓ Merchant Eligible"
                  : "! Merchant Warning"}
              </span>
            </div>
          </div>

          {/* Sub-Score Breakdown Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-left">
            <div className="p-2.5 bg-zinc-50/60 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                Title & Meta
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono mt-0.5 block">
                {evaluation.breakdown.titleAndMeta} / 25
              </span>
            </div>
            <div className="p-2.5 bg-zinc-50/60 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                Image Alt
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono mt-0.5 block">
                {evaluation.breakdown.imageOptimization} / 20
              </span>
            </div>
            <div className="p-2.5 bg-zinc-50/60 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                Product Details
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono mt-0.5 block">
                {evaluation.breakdown.productInformation} / 20
              </span>
            </div>
            <div className="p-2.5 bg-zinc-50/60 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                Schema / SKU
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono mt-0.5 block">
                {evaluation.breakdown.schemaAndIdentifiers} / 15
              </span>
            </div>
            <div className="p-2.5 bg-zinc-50/60 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                Google Shopping
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono mt-0.5 block">
                {evaluation.breakdown.merchantCenterCompliance} / 20
              </span>
            </div>
          </div>

          {/* Actionable Issues List */}
          {(evaluation.errors.length > 0 || evaluation.warnings.length > 0) && (
            <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
              {evaluation.errors.map((err, idx) => (
                <div
                  key={`err-${idx}`}
                  className="flex items-start justify-between gap-2 p-2.5 bg-rose-50/60 border border-rose-200/80 rounded-xl text-xs text-rose-900"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">{err.message}</span>
                      <p className="text-[11px] text-rose-700/80 mt-0.5">{err.tip}</p>
                    </div>
                  </div>
                  {onNavigateToField && (
                    <button
                      type="button"
                      onClick={() => onNavigateToField(err.field)}
                      className="text-[11px] font-semibold text-rose-800 hover:underline shrink-0"
                    >
                      Fix Field →
                    </button>
                  )}
                </div>
              ))}

              {evaluation.warnings.map((warn, idx) => (
                <div
                  key={`warn-${idx}`}
                  className="flex items-start justify-between gap-2 p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">{warn.message}</span>
                      <p className="text-[11px] text-amber-700/80 mt-0.5">{warn.tip}</p>
                    </div>
                  </div>
                  {onNavigateToField && (
                    <button
                      type="button"
                      onClick={() => onNavigateToField(warn.field)}
                      className="text-[11px] font-semibold text-amber-800 hover:underline shrink-0"
                    >
                      Inspect →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Primary SEO Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SEO Title */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <span>SEO Page Title</span>
              <span className="text-[10px] text-zinc-400 font-normal">
                (Google, Bing SERP Title)
              </span>
            </label>
            <span
              className={`font-mono text-[11px] ${
                (seoState.metaTitle || "").length > 60
                  ? "text-amber-600 font-bold"
                  : "text-zinc-400"
              }`}
            >
              {(seoState.metaTitle || "").length}/60 chars
            </span>
          </div>
          <Input
            value={seoState.metaTitle}
            onChange={(e) => onChange({ metaTitle: e.target.value })}
            placeholder={productTitle || "Title tag override..."}
            disabled={readOnly}
            className="text-xs bg-white border-zinc-200 focus:border-zinc-950 font-medium"
          />
          <p className="text-[11px] text-zinc-500">
            Keep under 60 characters to prevent snippet truncation on desktop and mobile SERPs.
          </p>
        </div>

        {/* URL Slug */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <span>URL Slug</span>
              <span className="text-[10px] text-zinc-400 font-normal">
                (/product/[slug])
              </span>
            </label>
            <span className="text-[10px] font-mono text-zinc-400">Lowercase & hyphens</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-mono select-none">
              /product/
            </span>
            <Input
              value={seoState.slug}
              onChange={(e) =>
                onChange({
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .replace(/\s+/g, "-"),
                })
              }
              placeholder="kashmiri-pashmina-shawl"
              disabled={readOnly}
              className="pl-20 text-xs bg-white border-zinc-200 focus:border-zinc-950 font-mono"
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            Changing an existing slug will automatically establish an HTTP 301 permanent redirect.
          </p>
        </div>
      </div>

      {/* Meta Description */}
      <div className="space-y-1.5 text-left">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-zinc-900 flex items-center gap-1.5">
            <span>SEO Meta Description</span>
            <span className="text-[10px] text-zinc-400 font-normal">
              (Search snippet summary)
            </span>
          </label>
          <span
            className={`font-mono text-[11px] ${
              (seoState.metaDescription || "").length > 160
                ? "text-amber-600 font-bold"
                : "text-zinc-400"
            }`}
          >
            {(seoState.metaDescription || "").length}/160 chars
          </span>
        </div>
        <textarea
          rows={3}
          value={seoState.metaDescription}
          onChange={(e) => onChange({ metaDescription: e.target.value })}
          placeholder="Authentic description highlighting craftsmanship, materials, and origin..."
          disabled={readOnly}
          className="w-full rounded-xl border border-zinc-200 p-3 text-xs text-zinc-900 bg-white focus:outline-hidden focus:border-zinc-950 transition-colors leading-relaxed"
        />
        <p className="text-[11px] text-zinc-500">
          Target between 120 and 155 characters. Avoid keyword repetition; write for human buyers.
        </p>
      </div>

      {/* Google Shopping & Product Classification */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-900">
            Google Shopping Category
          </label>
          <Input
            value={seoState.googleProductCategory || ""}
            onChange={(e) => onChange({ googleProductCategory: e.target.value })}
            placeholder="e.g. Home & Garden > Decor"
            disabled={readOnly}
            className="text-xs bg-white border-zinc-200 font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-900">
            Product Condition
          </label>
          <select
            value={seoState.condition}
            onChange={(e) => onChange({ condition: e.target.value as ProductCondition })}
            disabled={readOnly}
            className="w-full rounded-xl border border-zinc-200 p-2.5 text-xs text-zinc-900 bg-white focus:outline-hidden focus:border-zinc-950 font-medium"
          >
            <option value="NEW">New (Brand New Atelier Piece)</option>
            <option value="REFURBISHED">Restored / Refurbished</option>
            <option value="USED">Vintage / Pre-owned</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-900">
            Target Demographic
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={seoState.targetGender}
              onChange={(e) => onChange({ targetGender: e.target.value as TargetGender })}
              disabled={readOnly}
              className="rounded-xl border border-zinc-200 p-2.5 text-xs text-zinc-900 bg-white"
            >
              <option value="unisex">Unisex</option>
              <option value="female">Women</option>
              <option value="male">Men</option>
            </select>
            <select
              value={seoState.targetAgeGroup}
              onChange={(e) => onChange({ targetAgeGroup: e.target.value as TargetAgeGroup })}
              disabled={readOnly}
              className="rounded-xl border border-zinc-200 p-2.5 text-xs text-zinc-900 bg-white"
            >
              <option value="adult">Adult</option>
              <option value="all_ages">All Ages</option>
              <option value="teen">Teens</option>
              <option value="kids">Kids</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Structured Identifiers Accordion */}
      <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white text-left">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full p-4 flex items-center justify-between text-xs font-bold text-zinc-900 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-zinc-500" />
            <span>Advanced Identifiers & Canonical Tags (MPN, GTIN, Canonical URL)</span>
          </div>
          {isAdvancedOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </button>

        {isAdvancedOpen && (
          <div className="p-5 border-t border-zinc-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-900">
                  Manufacturer Part Number (MPN)
                </label>
                <Input
                  value={seoState.mpn || ""}
                  onChange={(e) => onChange({ mpn: e.target.value })}
                  placeholder="e.g. NXU-URL-01"
                  disabled={readOnly}
                  className="text-xs bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-900">
                  Global Trade Item Number (GTIN / EAN / UPC)
                </label>
                <Input
                  value={seoState.gtin || ""}
                  onChange={(e) => onChange({ gtin: e.target.value })}
                  placeholder="e.g. 8901234567890 (if officially registered)"
                  disabled={readOnly}
                  className="text-xs bg-white font-mono"
                />
                <p className="text-[10px] text-zinc-400">
                  Leave blank for bespoke handcrafted pieces without commercial barcodes.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-900">
                Canonical URL Override (Optional)
              </label>
              <Input
                value={seoState.canonicalUrl || ""}
                onChange={(e) => onChange({ canonicalUrl: e.target.value })}
                placeholder="https://nexu.studio/product/authoritative-slug"
                disabled={readOnly}
                className="text-xs bg-white font-mono"
              />
              <p className="text-[10px] text-zinc-400">
                Only define if this product is a syndicated copy or variant of another authoritative master URL.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-900">
                Internal Search Keywords (Guidance only)
              </label>
              <Input
                value={seoState.seoKeywords || ""}
                onChange={(e) => onChange({ seoKeywords: e.target.value })}
                placeholder="handwoven, chanderi, mulberry, pure zari"
                disabled={readOnly}
                className="text-xs bg-white"
              />
              <p className="text-[10px] text-zinc-400">
                Used strictly by the internal catalog search engine for synonym resolution. Not used for public keyword stuffing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live SERP & Social Previews */}
      <SeoLivePreview
        title={productTitle}
        metaTitle={seoState.metaTitle}
        metaDescription={seoState.metaDescription}
        slug={seoState.slug}
        imageUrl={primaryImage}
        altText={primaryAlt}
        brand={brand}
        basePrice={basePrice}
        inStock={stock > 0}
        category={categoryName}
        canonicalUrl={seoState.canonicalUrl}
      />
    </div>
  );
};

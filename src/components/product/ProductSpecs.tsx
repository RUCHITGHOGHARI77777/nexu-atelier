import React from "react";
import { Product } from "@/types/marketplace";
import { Check, ShieldCheck, Box, RefreshCw, Award, Info } from "lucide-react";

export interface ProductSpecsProps {
  product: Product;
}

export const ProductSpecs: React.FC<ProductSpecsProps> = ({ product }) => {
  // Extract custom or extended specifications
  const specs = product.specifications || [];

  return (
    <div className="space-y-10 pt-10 border-t border-zinc-200 text-xs text-left">
      {/* 1. Amazon-Style "About this item" Highlights */}
      {product.highlights && product.highlights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-zinc-900" />
            <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
              About This Item · Key Product Highlights
            </h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {product.highlights.map((highlight, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 bg-white shadow-2xs hover:border-zinc-300 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-zinc-700 leading-relaxed text-xs font-medium">
                  {highlight}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. Studio Narrative & Editorial Overview */}
      <div className="space-y-3 bg-zinc-50/60 p-5 rounded-2xl border border-zinc-200">
        <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
          Studio Narrative & Craftsmanship
        </h3>
        <p className="text-zinc-700 leading-relaxed text-xs sm:text-sm">
          {product.description}
        </p>
      </div>

      {/* 3. Comprehensive Amazon-Style Technical Specifications Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-zinc-900" />
            <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
              Product Information & Specifications
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Category: {product.category}
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
            {/* Left Column: Dimensions, Materials, Identification */}
            <div className="divide-y divide-zinc-100">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Brand</span>
                <span className="text-zinc-900 font-semibold text-right">
                  {product.vendor.name}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Material & Composition</span>
                <span className="text-zinc-900 text-right font-medium">
                  {product.materials || "Natural composition"}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Country of Origin</span>
                <span className="text-zinc-900 text-right font-medium">
                  {product.origin || "India"}
                </span>
              </div>
              {specs
                .slice(0, Math.ceil(specs.length / 2))
                .map((spec, idx) => (
                  <div
                    key={`spec-left-${idx}`}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <span className="text-zinc-500 font-medium">{spec.label}</span>
                    <span className="text-zinc-900 text-right font-mono font-medium max-w-xs truncate">
                      {spec.value}
                    </span>
                  </div>
                ))}
            </div>

            {/* Right Column: Logistics, Included Items & Policies */}
            <div className="divide-y divide-zinc-100">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Return & Replacement</span>
                <span className="text-emerald-700 font-semibold text-right flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>7-Day Atelier Replacement</span>
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Warranty</span>
                <span className="text-zinc-900 text-right font-medium">
                  Studio Craft Authenticity Guaranteed
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Included in Box</span>
                <span className="text-zinc-900 text-right font-medium">
                  1 × Authentic Crafted Piece, Certificate of Origin
                </span>
              </div>
              {specs
                .slice(Math.ceil(specs.length / 2))
                .map((spec, idx) => (
                  <div
                    key={`spec-right-${idx}`}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <span className="text-zinc-500 font-medium">{spec.label}</span>
                    <span className="text-zinc-900 text-right font-mono font-medium max-w-xs truncate">
                      {spec.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

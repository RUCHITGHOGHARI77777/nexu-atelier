import React from "react";
import { Product } from "@/types/marketplace";
import { Check } from "lucide-react";

export interface ProductSpecsProps {
  product: Product;
}

export const ProductSpecs: React.FC<ProductSpecsProps> = ({ product }) => {
  return (
    <div className="space-y-8 pt-8 border-t border-zinc-200 text-xs">
      {/* Editorial Overview & Description */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
          Studio Overview & Narrative
        </h3>
        <p className="text-zinc-700 leading-relaxed max-w-3xl text-xs sm:text-sm">
          {product.description}
        </p>
      </div>

      {/* Highlights */}
      {product.highlights && product.highlights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
            Material & Craft Highlights
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {product.highlights.map((highlight, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-zinc-700 bg-white p-2.5 rounded-lg border border-zinc-200 shadow-xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Technical Specifications Matrix */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
          Technical Specifications
        </h4>
        <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-xs">
          <div className="divide-y divide-zinc-100">
            {product.specifications.map((spec, idx) => (
              <div
                key={idx}
                className="px-4 py-3 flex items-center justify-between text-xs"
              >
                <span className="text-zinc-500 font-medium">{spec.label}</span>
                <span className="text-zinc-900 font-mono text-right max-w-xs font-medium">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

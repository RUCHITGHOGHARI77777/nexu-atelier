import React from "react";
import { Product } from "@/types/marketplace";
import { ProductCard } from "@/components/storefront/ProductCard";

export interface RelatedProductsProps {
  currentProductId: string;
  category: Product["category"];
  relatedProducts?: Product[];
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProductId,
  relatedProducts,
}) => {
  const source = relatedProducts && relatedProducts.length > 0 ? relatedProducts : [];
  const related = source.filter((p) => p.id !== currentProductId).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <div className="pt-16 border-t border-zinc-200 space-y-6">
      <div className="flex items-baseline justify-between pb-2 border-b border-zinc-200">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1 font-medium">
            EXPLORE COMPLEMENTARY CRAFT
          </span>
          <h3 className="text-xl font-bold text-zinc-950">
            Related Studio Pieces
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {related.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </div>
  );
};

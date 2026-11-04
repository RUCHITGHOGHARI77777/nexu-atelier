"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Check, ShoppingBag, Sparkles } from "lucide-react";
import { Product } from "@/types/marketplace";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Button } from "@/components/ui/Button";

export interface FrequentlyBoughtTogetherProps {
  mainProduct: Product;
  companionProducts?: Product[];
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  mainProduct,
  companionProducts = [],
}) => {
  const { addToCart, openCartDrawer } = useCart();
  const { formatPrice } = useCurrency();

  // Take up to 2 companions
  const companions = companionProducts.filter((p) => p.id !== mainProduct.id).slice(0, 2);

  const allItems = [mainProduct, ...companions];
  const [selectedIds, setSelectedIds] = useState<string[]>(allItems.map((p) => p.id));
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (companions.length === 0) return null;

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((i) => i !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedItems = allItems.filter((p) => selectedIds.includes(p.id));
  const rawTotal = selectedItems.reduce((acc, p) => acc + p.basePrice, 0);

  // 5% bundle discount when 3 items selected; 3% when 2 items selected
  const discountRate = selectedItems.length >= 3 ? 0.05 : selectedItems.length === 2 ? 0.03 : 0;
  const bundleDiscount = Math.round(rawTotal * discountRate);
  const finalTotal = rawTotal - bundleDiscount;

  const handleAddBundleToBag = () => {
    setIsAdding(true);
    for (const item of selectedItems) {
      addToCart(item, {
        quantity: 1,
        color: item.availableColors?.[0],
        size: item.availableSizes?.[0],
      });
    }
    setIsAdding(false);
    setJustAdded(true);
    openCartDrawer();
    setTimeout(() => setJustAdded(false), 3000);
  };

  return (
    <section className="pt-12 pb-6 border-t border-zinc-200">
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Curated Ensemble</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 font-serif">
            Frequently Paired Together
          </h3>
          <p className="text-xs text-zinc-600">
            Artisanal pairings selected by studio masters. Enjoy an instant bundle discount when acquired together.
          </p>
        </div>

        <div className="bg-zinc-50/70 border border-zinc-200/90 rounded-2xl p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Product Thumbnails and Plus connectors */}
            <div className="lg:col-span-8 flex flex-wrap items-center gap-3 sm:gap-4">
              {allItems.map((item, index) => {
                const isSelected = selectedIds.includes(item.id);
                const isMain = item.id === mainProduct.id;

                return (
                  <React.Fragment key={item.id}>
                    {index > 0 && (
                      <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-white border-zinc-300 shadow-sm"
                          : "bg-zinc-100/60 border-zinc-200 opacity-60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-zinc-900 border-zinc-900 text-white"
                            : "border-zinc-300 bg-white"
                        }`}
                        aria-label={`Select ${item.title}`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>

                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                        <ImageWithFallback
                          src={item.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      <div className="max-w-[150px] sm:max-w-[180px] space-y-0.5">
                        {isMain && (
                          <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">
                            This Item
                          </span>
                        )}
                        <Link
                          href={`/product/${item.slug}`}
                          className="text-xs font-semibold text-zinc-900 hover:text-amber-700 line-clamp-1 transition-colors block"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[11px] font-mono text-zinc-500">
                          {formatPrice(item.basePrice)}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Right: Bundle Price & CTA */}
            <div className="lg:col-span-4 lg:border-l lg:border-zinc-200 lg:pl-8 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
                  Bundle Price ({selectedItems.length} pieces):
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl font-extrabold text-zinc-950 font-mono">
                    {formatPrice(finalTotal)}
                  </span>
                  {bundleDiscount > 0 && (
                    <span className="text-sm font-mono text-zinc-400 line-through">
                      {formatPrice(rawTotal)}
                    </span>
                  )}
                </div>
                {bundleDiscount > 0 && (
                  <p className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md inline-block">
                    Save {formatPrice(bundleDiscount)} ({Math.round(discountRate * 100)}% Ensemble Discount)
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleAddBundleToBag}
                disabled={isAdding || selectedItems.length === 0}
                className="w-full justify-center text-xs"
              >
                {justAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ensemble Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add {selectedItems.length} Selected to Bag</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


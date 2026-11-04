"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  Building2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Button } from "@/components/ui/Button";

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    closeCartDrawer,
    items,
    totals,
    vendorGroups,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { formatPrice } = useCurrency();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartDrawerOpen) {
        closeCartDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartDrawerOpen, closeCartDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartDrawerOpen]);

  if (!isCartDrawerOpen) return null;

  const freeShippingProgress = Math.min(
    100,
    Math.round((totals.subtotal / totals.freeShippingThreshold) * 100)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag Drawer"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={closeCartDrawer}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E8E8E4] shadow-2xl flex flex-col justify-between text-[#171717]">
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-[#E8E8E4] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-[#171717]" />
              <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
                Shopping Bag ({totals.itemCount})
              </h2>
            </div>
            <button
              onClick={closeCartDrawer}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {items.length > 0 && (
            <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200">
              <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                <span className="flex items-center gap-1.5 text-zinc-700">
                  <Truck className="w-3.5 h-3.5 text-zinc-500" />
                  {totals.amountNeededForFreeShipping === 0 ? (
                    <span className="text-emerald-700 font-bold">
                      Complimentary express courier unlocked
                    </span>
                  ) : (
                    <span>
                      Add{" "}
                      <strong className="text-zinc-950">
                        {formatPrice(totals.amountNeededForFreeShipping)}
                      </strong>{" "}
                      for free delivery
                    </span>
                  )}
                </span>
                <span className="font-mono text-[10px] text-zinc-500 font-bold">
                  {freeShippingProgress}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Drawer Items Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 mx-auto">
                  <ShoppingBag className="w-6 h-6 stroke-1" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-950">
                    Your shopping bag is empty
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    Explore our curated catalog of master-woven textiles, precision audio, and studio living objects.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  href="/catalog"
                  onClick={closeCartDrawer}
                  className="mt-2 border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                >
                  Explore Catalog
                </Button>
              </div>
            ) : (
              // Multi-Vendor Grouping
              vendorGroups.map((group) => (
                <div
                  key={group.vendor.id}
                  className="rounded-xl bg-white border border-zinc-200 shadow-xs overflow-hidden"
                >
                  {/* Vendor Heading */}
                  <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-800 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{group.vendor.name}</span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-950 font-bold">
                      {formatPrice(group.subtotal)}
                    </span>
                  </div>

                  {/* Items in this vendor group */}
                  <div className="p-3 space-y-3 divide-y divide-zinc-100">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="pt-3 first:pt-0 flex items-start gap-3"
                      >
                        <div className="relative w-16 h-20 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                          <ImageWithFallback
                            src={
                              item.selectedColor?.image ||
                              item.product.images[0]
                            }
                            alt={item.product.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-semibold text-zinc-900 truncate">
                              <Link
                                href={`/product/${item.product.slug}`}
                                onClick={closeCartDrawer}
                                className="hover:text-amber-700 transition-colors"
                              >
                                {item.product.title}
                              </Link>
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-zinc-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            {item.selectedColor && (
                              <span>{item.selectedColor.name}</span>
                            )}
                            {item.selectedSize && (
                              <>
                                <span>•</span>
                                <span>Size: {item.selectedSize}</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1.5">
                            <span className="font-mono text-xs font-bold text-zinc-950">
                              {formatPrice(item.unitPrice * item.quantity)}
                            </span>

                            {/* Stepper */}
                            <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-md">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-950 cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono text-xs text-zinc-950 font-bold">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-950 cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-mono text-zinc-950 font-bold">
                    {formatPrice(totals.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Estimated Courier:</span>
                  <span className="font-mono text-zinc-950 font-bold">
                    {totals.shippingFee === 0 ? "Complimentary" : formatPrice(totals.shippingFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between font-bold text-sm text-zinc-950">
                  <span>Total Payable:</span>
                  <span className="font-mono text-base font-black text-zinc-950">
                    {formatPrice(totals.total)}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  href="/checkout"
                  onClick={closeCartDrawer}
                  className="w-full py-3 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all duration-200 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/cart"
                  onClick={closeCartDrawer}
                  className="w-full py-2.5 rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] hover:bg-white text-[#171717] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                >
                  <span>View Full Bag Breakdown</span>
                </Link>

                <button
                  onClick={clearCart}
                  className="w-full text-center text-[11px] text-[#767676] hover:text-[#A63232] transition-colors pt-1 cursor-pointer font-medium"
                >
                  Clear Bag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

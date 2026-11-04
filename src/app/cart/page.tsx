"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Building2,
  Truck,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Bookmark,
  Tag,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/formatters";

export default function CartPage() {
  const {
    items,
    savedForLater,
    totals,
    vendorGroups,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCart,
    removeFromSaved,
    clearCart,
  } = useCart();

  const [simulatedReady, setSimulatedReady] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountINR: number;
    description?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nexu_active_coupon");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.code) {
          const discount = parsed.code === "DEMO20" ? Math.round(totals.subtotal * 0.2) : parsed.discount;
          setAppliedCoupon({
            code: parsed.code,
            discountINR: discount,
            description: parsed.description || "Studio Voucher Applied",
          });
        }
      }
    } catch {}
  }, [totals.subtotal]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === "DEMO20") {
      const discount = Math.round(totals.subtotal * 0.2);
      const couponObj = {
        code: "DEMO20",
        discountINR: discount,
        description: "20% Studio Showcase Discount",
      };
      setAppliedCoupon(couponObj);
      setCouponError("");
      try {
        localStorage.setItem("nexu_active_coupon", JSON.stringify({ code: "DEMO20", discount, description: couponObj.description }));
      } catch {}
      return;
    }

    if (code === "ATELIER10" || code === "FIRST10") {
      const discount = Math.round(totals.subtotal * 0.1);
      const couponObj = {
        code,
        discountINR: discount,
        description: "10% Artisan Welcome Discount",
      };
      setAppliedCoupon(couponObj);
      setCouponError("");
      try {
        localStorage.setItem("nexu_active_coupon", JSON.stringify({ code, discount, description: couponObj.description }));
      } catch {}
      return;
    }

    if (code === "FLAT500") {
      if (totals.subtotal < 2500) {
        setCouponError("FLAT500 requires minimum cart subtotal of ₹2,500.");
        return;
      }
      const couponObj = {
        code: "FLAT500",
        discountINR: 500,
        description: "₹500 Flat Studio Acquisition Voucher",
      };
      setAppliedCoupon(couponObj);
      setCouponError("");
      try {
        localStorage.setItem("nexu_active_coupon", JSON.stringify({ code: "FLAT500", discount: 500, description: couponObj.description }));
      } catch {}
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: totals.subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Invalid or ineligible studio voucher.");
        setAppliedCoupon(null);
      } else {
        const couponObj = {
          code,
          discountINR: data.discountINR,
          description: data.coupon?.description || "Verified Studio Voucher",
        };
        setAppliedCoupon(couponObj);
        setCouponError("");
        try {
          localStorage.setItem("nexu_active_coupon", JSON.stringify({ code, discount: data.discountINR, description: couponObj.description }));
        } catch {}
      }
    } catch {
      setCouponError("Failed to validate voucher against studio ledger.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    try {
      localStorage.removeItem("nexu_active_coupon");
    } catch {}
  };

  const couponDiscountINR = appliedCoupon ? appliedCoupon.discountINR : 0;
  const finalCalculatedTotal = Math.max(0, totals.total - couponDiscountINR);

  const handleSimulatePayload = () => {
    setSimulatedReady(true);
  };

  if (items.length === 0 && savedForLater.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mx-auto">
          <ShoppingBag className="w-8 h-8 stroke-1" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">
            Your shopping bag is empty
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-sm mx-auto">
            Discover pieces from verified artisan studios and industrial tech labs across India.
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            size="md"
            href="/catalog"
            className="flex items-center gap-2"
          >
            <span>Explore Curated Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="space-y-1 pb-4 border-b border-zinc-200">
        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block font-medium">
          BAG REVIEW
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
          Shopping Bag ({totals.itemCount} items)
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Multi-Vendor Grouped Items */}
        <div className="lg:col-span-8 space-y-6">
          {items.length === 0 && (
            <div className="p-8 rounded-2xl border border-dashed border-zinc-300 bg-white text-center space-y-3 shadow-xs">
              <ShoppingBag className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm text-zinc-900 font-semibold">Your active bag is currently empty.</p>
              <p className="text-xs text-zinc-600">You have pieces saved for later below. Move them to your bag to proceed to checkout.</p>
            </div>
          )}
          {vendorGroups.map((group) => (
            <div
              key={group.vendor.id}
              className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden"
            >
              {/* Vendor Header */}
              <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-zinc-200 text-zinc-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-950">
                      Shipped from {group.vendor.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Hub: {group.vendor.location} • {group.vendor.dispatchTime}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-zinc-950">
                    {formatCurrency(group.subtotal)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {group.items.length} piece{group.items.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-6 space-y-6 divide-y divide-zinc-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="pt-6 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                        <ImageWithFallback
                          src={
                            item.selectedColor?.image ||
                            item.product.images[0]
                          }
                          alt={item.product.title}
                          fill
                          sizes="100px"
                          className="object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 hover:text-amber-700 transition-colors">
                          <Link href={`/product/${item.product.slug}`}>
                            {item.product.title}
                          </Link>
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          {item.selectedColor && (
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block border border-zinc-300"
                                style={{
                                  backgroundColor: item.selectedColor.hex,
                                }}
                              />
                              <span>{item.selectedColor.name}</span>
                            </span>
                          )}
                          {item.selectedSize && (
                            <>
                              <span>•</span>
                              <span>Size: {item.selectedSize}</span>
                            </>
                          )}
                        </div>
                        <p className="font-mono text-xs text-zinc-700 pt-0.5">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                      </div>
                    </div>

                    {/* Quantity Stepper & Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                      <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-950 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-xs font-semibold text-zinc-950">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-950 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-mono text-sm font-bold text-zinc-950 w-20 text-right">
                        {formatCurrency(item.lineTotal)}
                      </span>

                      <button
                        onClick={() => saveForLater(item.id)}
                        className="text-zinc-400 hover:text-amber-600 transition-colors p-1"
                        title="Save for later"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Clear Shopping Bag</span>
            </Button>

            <Link
              href="/catalog"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
            >
              ← Continue browsing catalog
            </Link>
          </div>

          {/* Saved for Later Shelf */}
          {savedForLater.length > 0 && (
            <div className="pt-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
                    Saved for Later ({savedForLater.length} {savedForLater.length === 1 ? "piece" : "pieces"})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  Preserved in your patron browser session
                </span>
              </div>

              <div className="space-y-4">
                {savedForLater.map((savedItem) => (
                  <div
                    key={savedItem.id}
                    className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                        <ImageWithFallback
                          src={
                            savedItem.selectedColor?.image ||
                            savedItem.product.images[0]
                          }
                          alt={savedItem.product.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 hover:text-amber-700 transition-colors">
                          <Link href={`/product/${savedItem.product.slug}`}>
                            {savedItem.product.title}
                          </Link>
                        </h4>
                        <p className="text-[11px] font-mono text-zinc-500">
                          Studio: {savedItem.product.vendor.name}
                        </p>
                        <p className="font-mono text-xs text-amber-700 font-bold pt-0.5">
                          {formatCurrency(savedItem.unitPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => moveToCart(savedItem.id)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 font-semibold"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Move to Bag
                      </button>
                      <button
                        onClick={() => removeFromSaved(savedItem.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors"
                        title="Remove permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs divide-y divide-zinc-100">
              <div className="flex items-center justify-between text-zinc-600 pt-2">
                <span>Items Subtotal:</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>

              {totals.savingsTotal > 0 && (
                <div className="flex items-center justify-between text-emerald-700 pt-2">
                  <span>Studio Direct Savings:</span>
                  <span className="font-mono font-semibold">
                    -{formatCurrency(totals.savingsTotal)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-zinc-600 pt-2">
                <span>Express Courier:</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {totals.shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[10px]">
                      Complimentary
                    </span>
                  ) : (
                    formatCurrency(totals.shippingFee)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-600 pt-2">
                <span>Estimated GST Included (12%):</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {formatCurrency(totals.estimatedTax)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-emerald-700 pt-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Voucher ({appliedCoupon.code}):</span>
                  </span>
                  <span className="font-mono font-bold">
                    -{formatCurrency(appliedCoupon.discountINR)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-bold text-zinc-950 pt-3">
                <span>Net Total:</span>
                <span className="font-mono text-lg font-black text-zinc-950">
                  {formatCurrency(finalCalculatedTotal)}
                </span>
              </div>
            </div>

            {/* Studio Voucher / Coupon Code Form */}
            <div className="pt-2 border-t border-zinc-100">
              {appliedCoupon ? (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                      %
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900 font-mono tracking-wider">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-[10px] text-emerald-700">
                        {appliedCoupon.description || "Discount activated"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 rounded-lg text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 transition-colors"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <label htmlFor="cart-coupon-input" className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">
                    Studio Privilege Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="cart-coupon-input"
                      type="text"
                      placeholder="e.g. DEMO20, ATELIER10"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white text-zinc-900"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                  )}
                  <p className="text-[10px] text-zinc-400">
                    Try <span className="font-mono font-semibold text-zinc-600">DEMO20</span> for 20% off or <span className="font-mono font-semibold text-zinc-600">ATELIER10</span>.
                  </p>
                </form>
              )}
            </div>

            {/* Checkout Action */}
            <div className="pt-2 space-y-3">
              {items.length > 0 ? (
                <Button
                  variant="accent"
                  size="lg"
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 font-bold"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  disabled
                  className="w-full opacity-50 cursor-not-allowed font-bold"
                >
                  <span>Your Bag is Empty</span>
                </Button>
              )}

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct Studio Escrow Hold • Verified against studio stock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

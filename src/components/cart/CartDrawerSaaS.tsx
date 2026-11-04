"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  ShieldCheck,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";

export function CartDrawerSaaS() {
  const router = useRouter();
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    removeFromCart,
    updateCartQuantity,
    cartTotalCount,
    cartSubtotal,
    clearCart,
    showToast,
    formatPrice,
    activeRegion,
  } = useStore();

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponName, setAppliedCouponName] = useState("");
  const [couponError, setCouponError] = useState("");

  if (!isCartDrawerOpen) return null;

  const freeShippingThreshold = activeRegion.shippingThresholdINR;
  const shippingFee = cartSubtotal >= freeShippingThreshold || cartSubtotal === 0 ? 0 : activeRegion.standardShippingFeeINR;
  const freeShippingProgress = Math.min(
    100,
    Math.round((cartSubtotal / freeShippingThreshold) * 100)
  );

  const grandTotal = Math.max(0, cartSubtotal + shippingFee - couponDiscount);
  const taxAmount = Math.round(cartSubtotal * activeRegion.taxRate);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    applyCode(couponCode);
  };

  const applyCode = (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    if (code === "DEMO20") {
      const discount = Math.round(cartSubtotal * 0.2);
      setCouponDiscount(discount);
      setCouponApplied(true);
      setAppliedCouponName("DEMO20 (20% OFF)");
      setCouponError("");
      showToast("Promo Code DEMO20 Applied! 20% Discount Activated 🏷️", "success");
      try {
        localStorage.setItem("nexu_active_coupon", JSON.stringify({ code: "DEMO20", discount }));
      } catch {}
    } else if (code === "ATELIER10" || code === "FIRST10") {
      const discount = Math.round(cartSubtotal * 0.1);
      setCouponDiscount(discount);
      setCouponApplied(true);
      setAppliedCouponName("ATELIER10 (10% OFF)");
      setCouponError("");
      showToast("Promo Code ATELIER10 Applied (10% OFF) 🏷️", "success");
      try {
        localStorage.setItem("nexu_active_coupon", JSON.stringify({ code: "ATELIER10", discount }));
      } catch {}
    } else if (code === "FLAT500" && cartSubtotal >= 3000) {
      const discount = 500;
      setCouponDiscount(discount);
      setCouponApplied(true);
      setAppliedCouponName("FLAT500 (₹500 OFF)");
      setCouponError("");
      showToast("Voucher FLAT500 Applied (₹500 OFF) 🏷️", "success");
      try {
        localStorage.setItem("nexu_active_coupon", JSON.stringify({ code: "FLAT500", discount: 500 }));
      } catch {}
    } else {
      setCouponError("Invalid or expired coupon code. Try 'DEMO20' for 20% off!");
      showToast("Invalid or expired promo code. Try DEMO20", "warning");
    }
  };

  const handleCheckout = () => {
    setIsCartDrawerOpen(false);
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        {/* Drawer Window */}
        <div className="w-screen max-w-md bg-white/90 backdrop-blur-2xl border-l border-white/95 ring-1 ring-slate-900/10 shadow-[0_20px_60px_rgba(15,23,42,0.18)] flex flex-col justify-between text-slate-900 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-slate-950" />
              <h2 className="text-base font-extrabold text-slate-950">
                Shopping Bag ({cartTotalCount})
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {freeShippingProgress >= 100
                    ? "🎉 You qualified for Free Express Air Courier!"
                    : `Add ${formatCurrency(freeShippingThreshold - cartSubtotal)} more for Free Air Express`}
                </span>
              </span>
              <span className="font-mono font-bold text-slate-900">{freeShippingProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-950">Your bag is currently empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore our curated architectural drops and add pieces to your collection.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Start Exploring
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="pt-4 first:pt-0 flex gap-3 text-xs">
                    <div className="relative w-18 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-950 line-clamp-2 leading-snug">
                          {item.product.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.selectedSize ? `Size: ${item.selectedSize}` : ""}
                        {item.selectedColor ? ` • ${item.selectedColor.name}` : ""}
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        {/* Stepper */}
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 font-mono font-bold text-slate-950">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono font-bold text-slate-950 text-sm">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 space-y-4">
              {/* Voucher Code Form */}
              <div className="space-y-2">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code (e.g. DEMO20)"
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-mono uppercase w-full focus:outline-none focus:ring-1 focus:ring-slate-950"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    Apply
                  </button>
                </form>

                {/* Quick Apply Voucher Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Apply:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponCode("DEMO20");
                      applyCode("DEMO20");
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                  >
                    DEMO20 (20% OFF)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponCode("ATELIER10");
                      applyCode("ATELIER10");
                    }}
                    className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                  >
                    ATELIER10 (10% OFF)
                  </button>
                </div>
              </div>

              {couponApplied && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{appliedCouponName} Applied</span>
                  </div>
                  <span className="font-mono font-bold">-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-rose-600 font-medium">{couponError}</p>
              )}

              {/* Totals Breakdown */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Bag Subtotal:</span>
                  <span>{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>{activeRegion.taxShort} ({Math.round(activeRegion.taxRate * 100)}% included):</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Priority Express Delivery:</span>
                  <span className={shippingFee === 0 ? "text-emerald-600 font-bold" : ""}>
                    {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Voucher Discount:</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-950 font-extrabold text-sm pt-2 border-t border-slate-200">
                  <span>Payable Total:</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#21866F]" />
                <span>Proceed to Checkout ({formatPrice(grandTotal)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
                <span>🔒 256-Bit Escrow Security • Authentic Guaranteed</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


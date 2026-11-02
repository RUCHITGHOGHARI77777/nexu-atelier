"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  ShoppingBag,
  Smartphone,
  Truck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useStore, PRELOADED_PRODUCTS, StoreOrder } from "@/context/StoreContext";

export function EvaluatorDemoControlBar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    addToCart,
    addOrder,
    markOrderDispatched,
    setActiveRole,
    resetDemoData,
    showToast,
    orders,
    whiteLabelConfig,
    updateWhiteLabelConfig,
    openPhoneSimulator,
  } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);

  // ACTION 1: Auto-Fill Cart & Open UPI Gateway
  const handleAction1_FillCartAndCheckout = () => {
    // Add 2 flagship pieces
    addToCart(PRELOADED_PRODUCTS[0], { quantity: 1 });
    addToCart(PRELOADED_PRODUCTS[1], { quantity: 1 });
    showToast("Demo: Added 2 Bestseller Items to Cart & Opening Checkout 🛍️", "success");
    if (pathname !== "/checkout") {
      router.push("/checkout");
    }
  };

  // ACTION 2: Simulate Instant Mobile UPI Payment & Branded Invoice
  const handleAction2_SimulateUPIPayment = () => {
    const utr = `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrderId = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const demoOrder: StoreOrder = {
      id: newOrderId,
      items: [
        {
          id: `item_${Date.now()}_1`,
          productId: PRELOADED_PRODUCTS[0].id,
          product: PRELOADED_PRODUCTS[0],
          quantity: 1,
          selectedSize: "Standard",
          selectedColor: { name: "Silver Alabaster", hex: "#E2E8F0" },
        },
        {
          id: `item_${Date.now()}_2`,
          productId: PRELOADED_PRODUCTS[1].id,
          product: PRELOADED_PRODUCTS[1],
          quantity: 1,
          selectedSize: "15-Inch",
          selectedColor: { name: "Midnight", hex: "#0F172A" },
        },
      ],
      subtotal: 151890,
      taxAmount: 27340,
      discount: 30378,
      shippingFee: 0,
      total: 148852,
      customerName: "Aarav Mehta (Demo Reviewer)",
      customerEmail: "evaluator@tech-interview.com",
      customerPhone: "+91 98765 43210",
      shippingAddress: {
        fullName: "Aarav Mehta",
        phone: "+91 98765 43210",
        street: "Flat 402, Highline Horizon",
        apartment: "Tower B, Bandra Kurla Complex",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400051",
      },
      paymentMethod: "UPI",
      paymentDetails: {
        method: "UPI (Instant Scan & Pay)",
        upiId: "reviewer@okaxis",
        bankRef: "HDFC-UPI-982341",
        utrNumber: utr,
        paidAt: new Date().toLocaleString("en-IN"),
        status: "SUCCESS_VERIFIED",
      },
      deliveryStage: 1,
      deliveryStageName: "Order Confirmed & Invoice Generated",
      awbNumber: `BD-${Math.floor(10000000 + Math.random() * 90000000)}`,
      courierPartner: "Blue Dart Air Express",
      estimatedDelivery: "Within 2 business days",
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    addOrder(demoOrder);
    openPhoneSimulator({
      amount: demoOrder.total,
      brandName: whiteLabelConfig.brandName,
      merchantUpiId: whiteLabelConfig.merchantUpiId,
      utrNumber: utr,
    });
    showToast("Demo: Mobile UPI Payment Approved! UTR Generated & Invoice Securing Escrow ✅", "success");
    router.push(`/checkout/confirmation?orderId=${newOrderId}`);
  };

  // ACTION 3: Switch to Supplier & Dispatch Order
  const handleAction3_SwitchSupplierDispatch = () => {
    setActiveRole("supplier");
    if (pathname !== "/") {
      router.push("/");
    }

    setTimeout(() => {
      // Find latest pending order or dispatch first order
      const targetOrder = orders[0];
      if (targetOrder) {
        markOrderDispatched(targetOrder.id);
      }
      showToast("Demo: Switched to Supplier Hub & Consigned Order via Blue Dart Air ✈️", "success");
    }, 400);
  };

  // ACTION 4: Switch to Admin & Verify Commission
  const handleAction4_SwitchAdminVerify = () => {
    setActiveRole("admin");
    if (pathname !== "/") {
      router.push("/");
    }
    showToast("Demo: Switched to Admin Command Center — Platform Fee Captured 🛡️", "success");
  };

  // ACTION 5: Launch On-Screen Smartphone Notification Simulator
  const handleAction5_LaunchPhoneSimulator = () => {
    openPhoneSimulator({
      amount: 26990,
      brandName: whiteLabelConfig.brandName,
      merchantUpiId: whiteLabelConfig.merchantUpiId,
      utrNumber: `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`,
    });
    showToast("📱 On-Screen iPhone 16 Pro Simulator Launched!", "info");
  };

  // ACTION 6: Switch to Admin White-Label Brand Engine
  const handleAction6_SwitchWhiteLabelEngine = () => {
    setActiveRole("admin");
    if (pathname !== "/") {
      router.push("/");
    }
    showToast("Switched to Admin Command Center • White-Label Brand Engine ⚙️", "info");
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9990] flex flex-col items-start font-sans">
      {/* Collapsed Glass Pill Trigger */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-2xl border border-white/95 ring-1 ring-slate-900/10 shadow-[0_15px_40px_rgba(15,23,42,0.12)] hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)] hover:scale-102 transition-all duration-300 cursor-pointer text-slate-900"
          title="Open Evaluator Quick-Test Bar"
        >
          {/* Glowing pulse indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>

          <span className="text-xs font-black tracking-tight text-slate-950 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            <span>🎯 Evaluator Quick-Test</span>
          </span>

          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors ml-0.5" />
        </button>
      ) : (
        /* Expanded Floating Glass Action Drawer */
        <div className="w-80 sm:w-96 rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/95 ring-1 ring-slate-900/10 shadow-[0_25px_70px_rgba(15,23,42,0.18)] p-5 space-y-4 animate-in slide-in-from-bottom-5 duration-300 text-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 fill-blue-600" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-950">
                  🎯 Evaluator Quick-Test
                </h4>
                <p className="text-[10px] text-slate-500">
                  1-Click workflows for rapid technical review
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Instant 1-Click Simulation Actions */}
          <div className="space-y-2">
            {/* Action 1 */}
            <button
              type="button"
              onClick={handleAction1_FillCartAndCheckout}
              className="w-full text-left p-3 rounded-2xl bg-white/70 hover:bg-white border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-blue-600 transition-colors">
                    1. Auto-Fill Cart & Checkout
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Adds 2 bestseller SKUs & launches checkout
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Action 2 */}
            <button
              type="button"
              onClick={handleAction2_SimulateUPIPayment}
              className="w-full text-left p-3 rounded-2xl bg-white/70 hover:bg-white border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-emerald-700 transition-colors">
                    2. Instant UPI Payment & Invoice
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Approves VPA, generates UTR & tax receipt
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Action 3 */}
            <button
              type="button"
              onClick={handleAction3_SwitchSupplierDispatch}
              className="w-full text-left p-3 rounded-2xl bg-white/70 hover:bg-white border border-slate-200/80 hover:border-sky-300 shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-sky-700 transition-colors">
                    3. Supplier Portal & Dispatch Order
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Generates AWB cargo manifest & ships
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Action 4 */}
            <button
              type="button"
              onClick={handleAction4_SwitchAdminVerify}
              className="w-full text-left p-3 rounded-2xl bg-white/70 hover:bg-white border border-slate-200/80 hover:border-purple-300 shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-purple-700 transition-colors">
                    4. Admin Console & Platform Fee
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Inspects GMV, {whiteLabelConfig.platformCommissionRate}% fee & UTR ledger
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Action 5: Smartphone Simulator */}
            <button
              type="button"
              onClick={handleAction5_LaunchPhoneSimulator}
              className="w-full text-left p-3 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 hover:from-emerald-50 hover:to-teal-50 border border-emerald-200/90 shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-emerald-950 block truncate group-hover:text-emerald-700 transition-colors">
                    5. 📱 Floating iPhone Simulator
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    Dynamic island, push collect & UPI PIN keypad
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Action 6: White-Label Reseller Brand Engine */}
            <button
              type="button"
              onClick={handleAction6_SwitchWhiteLabelEngine}
              className="w-full text-left p-3 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 hover:from-blue-50 hover:to-indigo-50 border border-blue-200/90 shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-blue-950 block truncate group-hover:text-blue-700 transition-colors">
                    6. ⚙️ White-Label Reseller Engine
                  </span>
                  <span className="text-[10px] text-blue-700 block">
                    Rebrand Store, VPA, GSTIN & theme color
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          </div>

          {/* Reset Demo Data Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono">Nexu Atelier v2.4</span>
            <button
              type="button"
              onClick={resetDemoData}
              className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset State</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

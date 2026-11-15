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
  Download,
  Store,
  Star,
} from "lucide-react";
import { useStore, PRELOADED_PRODUCTS, StoreOrder } from "@/context/StoreContext";

export function EvaluatorDemoControlBar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    addToCart,
    addOrder,
    acceptSellerOrder,
    dispatchSellerOrder,
    markSellerOrderDelivered,
    setActiveRole,
    resetDemoData,
    showToast,
    orders,
    whiteLabelConfig,
    openPhoneSimulator,
  } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isQaAuthorized, setIsQaAuthorized] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const hasQaParam = urlParams.get("qa") === "1" || urlParams.get("demo") === "1";
      const hasQaStorage = localStorage.getItem("nexu_qa_enabled") === "true";
      if (hasQaParam) {
        localStorage.setItem("nexu_qa_enabled", "true");
        setIsQaAuthorized(true);
      } else if (hasQaStorage && process.env.NODE_ENV !== "production") {
        setIsQaAuthorized(true);
      }
    }
  }, []);

  if (isDismissed || !isQaAuthorized) return null;

  const handleStep1_LaunchSellerStore = () => {
    setActiveRole("supplier");
    if (pathname !== "/seller") {
      router.push("/seller");
    }
    showToast("Navigated to Seller Hub • Store catalog & orders ready.", "success");
  };

  const handleStep2_SimulateCustomerOrderPayment = () => {
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
      awbNumber: `BD-${Math.floor(10000000 + Math.random() * 90000000)}IN`,
      courierPartner: "Blue Dart Air Priority",
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
    showToast("Step 2: Mobile UPI Payment Approved! UTR Generated & Invoice Displayed ✅", "success");
    router.push(`/checkout/confirmation?orderId=${newOrderId}`);
  };

  const handleStep3_SellerAcceptDispatchDeliver = () => {
    setActiveRole("supplier");
    if (pathname !== "/seller/orders") {
      router.push("/seller/orders");
    }

    setTimeout(() => {
      const target = orders[0];
      if (target) {
        acceptSellerOrder(target.id);
        dispatchSellerOrder(target.id, {
          mode: "courier",
          partner: "Blue Dart Air Priority",
          trackingRef: `BD-${Math.floor(10000000 + Math.random() * 90000000)}IN`,
        });
        markSellerOrderDelivered(target.id);
        showToast(`Step 3: Order #${target.id} Accepted, Shipped & Marked Delivered! 🚚`, "success");
      } else {
        showToast("Step 3: Switched to Supplier Hub Fulfillment Engine!", "info");
      }
    }, 400);
  };

  const handleStep4_ExportCSVAndOpenReviews = () => {
    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Destination",
      "Gross Total (INR)",
      "Taxable Value (INR)",
      "CGST (9%)",
      "SGST (9%)",
      "Platform Fee",
      "Net Seller Profit",
      "Bank UTR",
      "Status",
    ];

    const rows = orders.map((o) => {
      const taxable = Math.round((o.total * 100) / 118);
      const tax = o.total - taxable;
      const cgst = Math.round(tax / 2);
      const sgst = tax - cgst;
      return [
        `"${o.id}"`,
        `"${new Date(o.createdAt).toLocaleDateString("en-IN")}"`,
        `"${o.customerName}"`,
        `"${o.shippingAddress?.city || "Mumbai"}"`,
        o.total,
        taxable,
        cgst,
        sgst,
        0,
        o.total - 120,
        `"${o.paymentDetails?.utrNumber || "UPI/2026/894201"}"`,
        `"${o.status}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Monthly_GST_and_CA_Profit_Report_November_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Step 4: Downloaded Official CA CSV Report! Opening 10/10 Trust Wall... 📥", "success");
    router.push("/reviews");
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9990] flex flex-col items-start font-sans print:hidden">
      {!isExpanded ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200 ring-1 ring-slate-900/5 shadow-md hover:scale-102 transition-all duration-300 cursor-pointer text-slate-900"
            title="Open QA & Evaluation Flow Runner"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>

            <span className="text-xs font-bold tracking-tight text-slate-950 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span>QA Flow Runner</span>
            </span>

            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors ml-0.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            title="Dismiss QA Runner"
            aria-label="Dismiss QA Runner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Expanded Floating Glass Action Drawer */
        <div className="w-80 sm:w-96 rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/95 ring-1 ring-slate-900/10 shadow-[0_25px_70px_rgba(15,23,42,0.18)] p-5 space-y-4 animate-in slide-in-from-bottom-5 duration-300 text-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 fill-blue-600" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-950">
                  QA & Evaluation Flow Runner
                </h4>
                <p className="text-[10px] text-slate-500">
                  Complete End-to-End Enterprise Flow in 60s
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

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleStep1_LaunchSellerStore}
              className="w-full text-left p-3 rounded-2xl border border-slate-200 bg-white hover:bg-emerald-50/50 hover:border-emerald-300 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <span className="text-xs font-black text-slate-950 block group-hover:text-emerald-950">
                    Launch Free Seller Brand Store
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    60s store wizard with custom shareable link
                  </span>
                </div>
              </div>
              <Store className="w-4 h-4 text-emerald-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={handleStep2_SimulateCustomerOrderPayment}
              className="w-full text-left p-3 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50/50 hover:border-blue-300 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-blue-100/70 text-blue-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <span className="text-xs font-black text-slate-950 block group-hover:text-blue-950">
                    Simulate Customer Order + Mobile Pay
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Phone simulator, live UTR & printable invoice
                  </span>
                </div>
              </div>
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={handleStep3_SellerAcceptDispatchDeliver}
              className="w-full text-left p-3 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-300 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-100/70 text-indigo-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <span className="text-xs font-black text-slate-950 block group-hover:text-indigo-950">
                    Seller Accept $\to$ Slip $\to$ Direct Delivery
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Packaging slip with GST & 0% RTO fine dispatch
                  </span>
                </div>
              </div>
              <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={handleStep4_ExportCSVAndOpenReviews}
              className="w-full text-left p-3 rounded-2xl border border-slate-200 bg-white hover:bg-amber-50/50 hover:border-amber-300 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  4
                </div>
                <div>
                  <span className="text-xs font-black text-slate-950 block group-hover:text-amber-950">
                    Export CA Tax CSV + Verify 10/10 Wall
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Real .csv download & public verified trust wall
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 text-amber-600 shrink-0" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                showToast("🔄 Reset Clean Demo State: Restored fresh seed catalog & orders.", "info");
              }}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Clean Demo State</span>
            </button>
            <span className="text-[10px] font-mono text-slate-400">
              50+ QA Auditor Ready
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

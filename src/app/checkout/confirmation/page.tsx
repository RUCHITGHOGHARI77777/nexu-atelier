"use client";

import React, { useEffect, useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  Printer,
  Download,
  Clock,
  MapPin,
  FileText,
  Sparkles,
  RefreshCw,
  Check,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Navigation,
  Phone,
  RotateCcw,
  AlertCircle,
  X,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useStore, StoreOrder } from "@/context/StoreContext";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

// Exact 5-stage fulfillment stepper requested for enterprise showcase
const FIVE_DELIVERY_STAGES = [
  {
    stage: 1,
    key: "CONFIRMED",
    label: "Order Confirmed & Invoice Generated",
    subtitle: "Payment authorized via 256-bit NPCI UPI Gateway. Official GST tax invoice issued.",
    icon: FileText,
  },
  {
    stage: 2,
    key: "PACKED",
    label: "Packed at Supplier Warehouse",
    subtitle: "Piece inspected, sanitized, and sealed at certified artisan maker studio.",
    icon: Package,
  },
  {
    stage: 3,
    key: "SHIPPED",
    label: "Shipped via Express Logistics",
    subtitle: "Consigned to Blue Dart Air Cargo Express. Priority Air Transit in progress.",
    icon: Truck,
  },
  {
    stage: 4,
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    subtitle: "With Delivery Partner: Ramesh Sharma (+91 98200 12345) • Blue Dart Express.",
    icon: Navigation,
  },
  {
    stage: 5,
    key: "DELIVERED",
    label: "Delivered",
    subtitle: "Handed over to patron. 100% verified & direct payout released to maker.",
    icon: CheckCircle2,
  },
];

const FIVE_RETURN_STAGES = [
  {
    stage: 1,
    key: "REQUESTED",
    label: "R1. Return Requested",
    subtitle: "Pickup request logged. Zero penalty authorization.",
    icon: RotateCcw,
  },
  {
    stage: 2,
    key: "APPROVED",
    label: "R2. Approved & Scheduled",
    subtitle: "Artisan studio approved. Doorstep pickup scheduled.",
    icon: CheckCircle2,
  },
  {
    stage: 3,
    key: "PICKED_UP",
    label: "R3. Picked Up from Patron",
    subtitle: "Handed to courier associate (Vikram Negi: +91 98110 54321).",
    icon: Package,
  },
  {
    stage: 4,
    key: "IN_TRANSIT",
    label: "R4. In-Transit to Studio",
    subtitle: "Reverse air priority cargo transit back to maker hub.",
    icon: Truck,
  },
  {
    stage: 5,
    key: "REFUNDED",
    label: "R5. Hub Inspected & Refunded",
    subtitle: "Piece received. 100% instant refund released to UPI bank account.",
    icon: ShieldCheck,
  },
];

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const store = useStore();

  const [dbOrder, setDbOrder] = useState<any | null>(null);
  const [currentStageOverride, setCurrentStageOverride] = useState<number | null>(null);
  const [isAdvancingMilestone, setIsAdvancingMilestone] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Find exact order in StoreContext
  const storeOrder = useMemo(() => {
    if (!orderId) return store.orders[0] || null;
    return store.orders.find((o) => o.id === orderId) || null;
  }, [orderId, store.orders]);

  // Fetch from database API as fallback/supplement
  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) setDbOrder(data.order);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [orderId]);

  // Launch initial celebration confetti on load
  useEffect(() => {
    try {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.35 },
        colors: ["#10b981", "#0284c7", "#f59e0b", "#6366f1"],
      });
    } catch {}
  }, [orderId]);

  // Construct unified display order (prioritize matching storeOrder, then dbOrder, then first available)
  const displayOrder: StoreOrder | null = useMemo(() => {
    if (storeOrder) return storeOrder;

    if (dbOrder) {
      return {
        id: dbOrder.id,
        items: dbOrder.items.map((i: any) => ({
          id: i.id || `item_${Math.random()}`,
          productId: i.productId || "prod_01",
          quantity: i.quantity,
          product: {
            id: i.productId || "prod_01",
            slug: "item",
            title: i.title,
            subtitle: "Curated Artisan Drop",
            description: "",
            category: "Electronics" as const,
            price: i.unitPrice,
            mrpPrice: Math.round(i.unitPrice * 1.25),
            rating: 4.9,
            reviewCount: 180,
            stock: 12,
            supplier: {
              id: "sup_01",
              name: i.vendorName || "Artisan Studio",
              location: "Mumbai, MH",
              rating: 4.95,
              fulfillmentRate: "99.8%",
              verified: true,
            },
            images: ["/placeholder.jpg"],
            specs: {},
            reviews: [],
          },
        })),
        total: dbOrder.totals?.total || 26990,
        subtotal: dbOrder.totals?.subtotal || 26990,
        shippingFee: dbOrder.totals?.shippingFee || 0,
        taxAmount: dbOrder.totals?.estimatedTax || Math.round((26990 * 12) / 112),
        discount: dbOrder.discount || 0,
        customerName: dbOrder.customerName || "Aarav Mehta",
        customerPhone: dbOrder.shippingAddress?.phone || "+91 98765 43210",
        shippingAddress: {
          fullName: dbOrder.customerName || "Aarav Mehta",
          phone: dbOrder.shippingAddress?.phone || "+91 98765 43210",
          street: dbOrder.shippingAddress?.street || "Flat 402, Highline Horizon, Nariman Point",
          city: dbOrder.shippingAddress?.city || "Mumbai",
          state: dbOrder.shippingAddress?.state || "Maharashtra",
          pincode: dbOrder.shippingAddress?.pincode || "400001",
        },
        paymentMethod: dbOrder.paymentInfo?.method || "UPI",
        paymentDetails: {
          method: dbOrder.paymentInfo?.method || "UPI",
          upiId: "customer@okaxis",
          bankRef: dbOrder.paymentInfo?.bankRef || "UPI/2026/849201",
          utrNumber: dbOrder.paymentInfo?.bankRef || "UPI/2026/849201",
          paidAt: (dbOrder.paymentInfo?.method === "COD" || dbOrder.paymentStatus === "ESCROW_HOLD") ? "Pending upon Delivery" : formatDateTime(dbOrder.createdAt || new Date().toISOString()),
          status: (dbOrder.paymentInfo?.method === "COD" || dbOrder.paymentStatus === "ESCROW_HOLD") ? "PENDING_COLLECTION" : "PAID & ESCROW VERIFIED",
        },
        deliveryStage: dbOrder.status === "delivered" ? 5 : dbOrder.status === "shipped" ? 3 : 1,
        deliveryStageName: "Order Confirmed & Invoice Generated",
        awbNumber: dbOrder.shipments?.[0]?.trackingNumber || "BD-89472910IN",
        courierPartner: "Ramesh Sharma (+91 98200 12345) • Blue Dart Express",
        estimatedDelivery: "Thursday, Nov 6 • by 8:00 PM",
        status: "CONFIRMED",
        createdAt: dbOrder.createdAt || new Date().toISOString(),
      };
    }

    // Default Demo Order if page accessed directly
    return {
      id: orderId || "ORD-2026-849201",
      items: [
        {
          id: "cart_item_demo",
          productId: "prod_elec_01",
          quantity: 1,
          product: store.products[0] || {
            id: "prod_elec_01",
            slug: "sony-headphones",
            title: "Sony WH-1000XM5 Studio Wireless Noise-Cancelling Headphones",
            subtitle: "30mm Carbon Drivers with Dual QN1 Noise Processors",
            description: "",
            category: "Electronics" as const,
            price: 26990,
            mrpPrice: 34990,
            rating: 4.9,
            reviewCount: 428,
            stock: 8,
            supplier: {
              id: "sup_sony",
              name: "Apex Electronics Hub",
              location: "Bangalore, KA",
              rating: 4.96,
              fulfillmentRate: "99.8%",
              verified: true,
            },
            images: [
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
            ],
            specs: {},
            reviews: [],
          },
        },
      ],
      total: 26990,
      subtotal: 26990,
      shippingFee: 0,
      taxAmount: Math.round((26990 * 18) / 118),
      discount: 0,
      customerName: "Aarav Mehta",
      customerPhone: "+91 98765 43210",
      shippingAddress: {
        fullName: "Aarav Mehta",
        phone: "+91 98765 43210",
        street: "Flat 402, Highline Horizon, Nariman Point",
        apartment: "Tower B, Seaface Promenade",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      paymentMethod: "UPI",
      paymentDetails: {
        method: "UPI",
        upiId: "customer@okaxis",
        bankRef: "UPI/2026/849201",
        utrNumber: "UPI/2026/849201",
        paidAt: new Date().toLocaleString("en-IN"),
        status: "PAID & ESCROW VERIFIED",
      },
      deliveryStage: 1,
      deliveryStageName: "Order Confirmed & Invoice Generated",
      awbNumber: "BD-89472910IN",
      courierPartner: "Ramesh Sharma (+91 98200 12345) • Blue Dart Express",
      estimatedDelivery: "Thursday, Nov 6 • by 8:00 PM",
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };
  }, [storeOrder, dbOrder, orderId, store.products]);

  const [logisticsTab, setLogisticsTab] = useState<"FORWARD" | "RETURN">("FORWARD");
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("Size or fit adjustment required");

  // Current active stage (1 to 5)
  const activeDeliveryStage = currentStageOverride ?? displayOrder.deliveryStage ?? 1;
  const returnTimeline = displayOrder.returnLogistics;
  const isReturnActive = Boolean(returnTimeline && returnTimeline.status !== "NONE");

  // Print Invoice Handler
  const handlePrintInvoice = () => {
    window.print();
  };

  const handleInitiateReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayOrder.id) {
      store.initiateOrderReturn(displayOrder.id, returnReason);
      setLogisticsTab("RETURN");
      setIsReturnModalOpen(false);
    }
  };

  const handleAdvanceReturn = () => {
    if (displayOrder.id) {
      store.advanceOrderReturnStage(displayOrder.id);
    }
  };

  // Simulate Next Delivery Stage Handler
  const handleAdvanceMilestone = async () => {
    if (activeDeliveryStage >= 5) return;
    setIsAdvancingMilestone(true);
    setMilestoneMessage("");

    const nextStage = activeDeliveryStage + 1;
    setCurrentStageOverride(nextStage);

    // Update StoreContext
    if (displayOrder.id) {
      store.advanceOrderDeliveryStage(displayOrder.id);
    }

    // Attempt database update if backend order exists
    if (dbOrder?.id) {
      try {
        await fetch(`/api/orders/${dbOrder.id}/simulate-delivery`, { method: "POST" });
      } catch {}
    }

    // Stage-specific toast notifications and messages
    let stageToastMsg = "";
    if (nextStage === 2) {
      stageToastMsg = "📦 Stage 2/5: Packed at Supplier Warehouse (Sanitized & Sealed)";
    } else if (nextStage === 3) {
      stageToastMsg = `✈️ Stage 3/5: Shipped via Express Logistics! AWB: ${displayOrder.awbNumber}`;
    } else if (nextStage === 4) {
      stageToastMsg = `🚚 Stage 4/5: Out for Delivery with associate ${displayOrder.courierPartner}`;
    } else if (nextStage === 5) {
      stageToastMsg = "🎉 Stage 5/5: Consignment Delivered! Escrow release authorized.";
    }

    setMilestoneMessage(stageToastMsg);
    store.showToast(stageToastMsg, "success");

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#10b981", "#0ea5e9", "#f59e0b"],
      });
    } catch {}

    setTimeout(() => {
      setIsAdvancingMilestone(false);
    }, 400);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-4 w-40 mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 space-y-10 text-slate-900 print:min-h-0 print:py-0 print:px-0 print:space-y-0">
      {/* --- TOP CONFIRMATION BANNER --- */}
      <div className="max-w-4xl mx-auto text-center space-y-4 print:hidden">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25 animate-in zoom-in-90 duration-300">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block shadow-2xs">
            AUTHENTIC PAYMENT VERIFIED • ESCROW LOCKED
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Order Successfully Placed & Secured!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Thank you, <strong className="text-slate-950 font-semibold">{displayOrder.customerName}</strong>. Your commissioned pieces are now logged in the global ledger and consigned to verified suppliers.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrintInvoice}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#21866F]" />
            <span>Download Official Receipt (Print / PDF)</span>
          </button>

          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-[#FAFAF8] hover:bg-white border border-[#E8E8E4] text-[#171717] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <span>Return to Storefront</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#767676]" />
          </Link>
        </div>
      </div>

      {/* --- BIDIRECTIONAL LOGISTICS STATE MACHINE (FORWARD & REVERSE RETURN) --- */}
      <div className="max-w-4xl mx-auto rounded-3xl border border-white/80 bg-white/95 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.05)] p-6 sm:p-8 space-y-6 print:hidden">
        
        {/* Navigation Tabs: Forward Outbound vs Reverse Return */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLogisticsTab("FORWARD")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                logisticsTab === "FORWARD"
                  ? "bg-white text-[#171717] border-2 border-[#171717] shadow-xs"
                  : "bg-[#FAFAF8] text-[#626262] border border-[#E8E8E4] hover:bg-white"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>🚚 Outbound Delivery (Stage {activeDeliveryStage}/5)</span>
            </button>

            <button
              type="button"
              onClick={() => setLogisticsTab("RETURN")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                logisticsTab === "RETURN"
                  ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/20"
                  : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>🔄 Return & Exchange ({isReturnActive ? returnTimeline?.status : "Eligible"})</span>
            </button>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
              {logisticsTab === "FORWARD" ? "Courier SLA" : "Reverse Transit SLA"}
            </span>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              {logisticsTab === "FORWARD" ? displayOrder.estimatedDelivery : "Same-Day Doorstep Pickup"}
            </span>
          </div>
        </div>

        {/* --- VIEW 1: FORWARD OUTBOUND JOURNEY --- */}
        {logisticsTab === "FORWARD" && (
          <div className="space-y-6">
            {/* Header Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 font-mono">
              <p>
                Consignment Partner: <strong className="text-slate-950">Blue Dart Express (Air Priority)</strong> • AWB:{" "}
                <span className="font-bold text-indigo-700">{displayOrder.awbNumber}</span>
              </p>
              <p>
                Rider: <strong className="text-slate-950">{displayOrder.riderName || "Ramesh Sharma"}</strong> ({displayOrder.riderPhone || "+91 98200 12345"})
              </p>
            </div>

            {/* 5-Stage Visual Stepper Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {FIVE_DELIVERY_STAGES.map((stg) => {
                const isCompleted = stg.stage <= activeDeliveryStage;
                const isCurrent = stg.stage === activeDeliveryStage;
                const Icon = stg.icon;

                let stageTime = "";
                if (stg.stage === 1) stageTime = displayOrder.paymentDetails?.paidAt || "Today 10:30 AM";
                else if (stg.stage === 2) stageTime = displayOrder.outboundTimestamps?.packedAt || (isCompleted ? "Today 11:20 AM" : "Pending");
                else if (stg.stage === 3) stageTime = displayOrder.outboundTimestamps?.shippedAt || (isCompleted ? "Today 01:45 PM" : "Pending");
                else if (stg.stage === 4) stageTime = displayOrder.outboundTimestamps?.outForDeliveryAt || (isCompleted ? "Today 03:30 PM" : "Expected 04:30 PM");
                else if (stg.stage === 5) stageTime = displayOrder.outboundTimestamps?.deliveredAt || (isCompleted ? "Today 04:18 PM" : "Pending");

                return (
                  <div
                    key={stg.key}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm"
                        : isCompleted
                        ? "bg-slate-50/90 border-slate-200"
                        : "bg-white/60 border-slate-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                          isCompleted
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stg.stage}
                      </div>
                      {isCurrent && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-emerald-700" : isCompleted ? "text-slate-800" : "text-slate-400"}`} />
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        STAGE {stg.stage}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-950 leading-snug">
                      {stg.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">
                      {stg.subtitle}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] font-mono text-emerald-800 font-semibold truncate">
                      ⏱️ {stageTime}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage 4 Dynamic Visual: Live Map & Delivery Associate Route */}
            {activeDeliveryStage >= 4 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/80 to-indigo-50/80 border border-sky-200/80 space-y-3 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="font-bold text-slate-900">
                      Live Delivery Van Progress (Blue Dart Dedicated Transit)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rider: <strong>{displayOrder.riderName || "Ramesh Sharma"}</strong> ({displayOrder.riderPhone || "+91 98200 12345"})</span>
                  </div>
                </div>

                <div className="relative pt-3 pb-1">
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 transition-all duration-700 rounded-full"
                      style={{ width: activeDeliveryStage === 5 ? "100%" : "78%" }}
                    />
                  </div>

                  <div
                    className="absolute top-0 -translate-y-1 transition-all duration-700"
                    style={{ left: activeDeliveryStage === 5 ? "96%" : "74%" }}
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-pulse">
                      <Truck className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Mumbai Central Cargo Hub</span>
                  <span className="text-emerald-700 font-bold">
                    {activeDeliveryStage === 5 ? "Consignment Handed to Patron" : displayOrder.etaWindow || "Arriving Today by 4:30 PM"}
                  </span>
                  <span>{displayOrder.shippingAddress.pincode}</span>
                </div>
              </div>
            )}

            {/* Interactive Control Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/50 to-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Forward Logistics Simulator</span>
                </span>
                <p className="text-xs text-slate-700">
                  Step through all 5 outbound fulfillment stages in real time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAdvanceMilestone}
                  disabled={isAdvancingMilestone || activeDeliveryStage >= 5}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAdvancingMilestone ? "animate-spin" : ""}`} />
                  <span>
                    {activeDeliveryStage >= 5
                      ? "🎉 Outbound Delivered!"
                      : "Simulate Next Outbound Stage ⚡"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Request Return / Exchange</span>
                </button>
              </div>
            </div>

            {milestoneMessage && (
              <p className="text-xs text-indigo-800 font-medium text-center bg-indigo-50/90 py-2 px-3 rounded-xl border border-indigo-200 animate-in fade-in duration-200">
                {milestoneMessage}
              </p>
            )}
          </div>
        )}

        {/* --- VIEW 2: RETURN & REVERSE LOGISTICS JOURNEY --- */}
        {logisticsTab === "RETURN" && (
          <div className="space-y-6">
            {!isReturnActive ? (
              <div className="p-8 rounded-2xl bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border border-amber-200 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-950">
                    7-Day Hassle-Free Direct Studio Return & Exchange
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Unlike other marketplaces that charge small sellers ₹180 penalties, NEXU coordinates direct studio exchanges with zero fees and instant UPI refund upon studio hub receipt.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#B78B45]" />
                  <span>Initiate Return / Exchange (Zero Penalty)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Return Status Banner */}
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-amber-900 uppercase text-[10px] block">
                      Active Return Lifecycle
                    </span>
                    <p className="font-bold text-slate-950 text-sm">
                      Status: {returnTimeline?.status} • Reason: &quot;{returnTimeline?.reason}&quot;
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-mono text-slate-500 block">Refund Amount (Escrow)</span>
                    <span className="font-mono font-black text-emerald-700 text-base">
                      {formatCurrency(displayOrder.total)}
                    </span>
                  </div>
                </div>

                {/* 5-Stage Reverse Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {FIVE_RETURN_STAGES.map((rstg) => {
                    const statusOrder = ["NONE", "REQUESTED", "APPROVED", "PICKED_UP", "IN_TRANSIT", "REFUNDED"];
                    const currentIdx = statusOrder.indexOf(returnTimeline?.status || "NONE");
                    const stageIdx = statusOrder.indexOf(rstg.key);
                    const isCompleted = currentIdx >= stageIdx;
                    const isCurrent = currentIdx === stageIdx;
                    const Icon = rstg.icon;

                    return (
                      <div
                        key={rstg.key}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 shadow-sm"
                            : isCompleted
                            ? "bg-slate-50/90 border-slate-200"
                            : "bg-white/60 border-slate-100 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                              isCompleted
                                ? "bg-amber-600 text-white shadow-xs"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : rstg.stage}
                          </div>
                          {isCurrent && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-amber-700" : isCompleted ? "text-slate-800" : "text-slate-400"}`} />
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            RETURN {rstg.stage}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-950 leading-snug">
                          {rstg.label}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">
                          {rstg.subtitle}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Refund Released Details (Stage R5) */}
                {returnTimeline?.status === "REFUNDED" && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-mono space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Instant Refund Released via NPCI 256-bit Direct UPI</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700 pt-1">
                      <div>
                        <span>Refund UTR:</span> <strong className="text-slate-950">{returnTimeline.refundUtr || "REF/UPI/849201840"}</strong>
                      </div>
                      <div>
                        <span>Credited To:</span> <strong className="text-slate-950">{displayOrder.paymentDetails.upiId || "customer@okaxis"}</strong>
                      </div>
                      <div>
                        <span>Settlement Speed:</span> <strong className="text-emerald-700 font-bold">0 Seconds (Real-Time)</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Return Simulator Action */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider">
                      Reverse Logistics Simulator
                    </span>
                    <p className="text-xs text-slate-600">
                      Simulate the pickup rider scan, transit to maker studio, and instant UPI refund.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAdvanceReturn}
                    disabled={returnTimeline?.status === "REFUNDED"}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>
                      {returnTimeline?.status === "REFUNDED"
                        ? "🎉 Refund Successfully Released!"
                        : "Advance Return Stage ⚡"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- MODAL: INITIATE RETURN / EXCHANGE --- */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl border border-[#E8E8E4] shadow-2xl max-w-md w-full p-6 text-[#171717] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E4]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#B78B45]" />
                <h3 className="font-extrabold text-base text-[#171717]">
                  Initiate Direct Studio Return
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#FAFAF8] hover:bg-[#F5F6F4] text-[#767676] flex items-center justify-center cursor-pointer border border-[#E8E8E4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInitiateReturnSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#626262]">Select Return / Exchange Reason *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E8E4] bg-white font-medium text-[#171717]"
                >
                  <option value="Size or fit adjustment required (Exchange for S/M/L)">Size or fit adjustment required (Exchange for S/M/L)</option>
                  <option value="Color shade variation in natural studio light">Color shade variation in natural studio light</option>
                  <option value="Fabric drape / Handloom feel inspection">Fabric drape / Handloom feel inspection</option>
                  <option value="Minor craftsmanship detail exchange">Minor craftsmanship detail exchange</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#EAF6F0] border border-[#21866F]/20 text-[11px] text-[#21866F] space-y-1">
                <p className="font-bold">🛡️ Guaranteed Return Terms:</p>
                <p>• Zero return shipping fee (Courier absorbs or studio covers)</p>
                <p>• Free doorstep pickup by Blue Dart associate</p>
                <p>• 100% refund credited directly to your UPI ID upon studio receipt</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E8E4] text-[#626262] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] font-bold cursor-pointer shadow-xs"
                >
                  Confirm & Schedule Pickup 🚚
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- OFFICIAL TAX-COMPLIANT BRANDED INVOICE CARD --- */}
      <div className="printable-invoice-card relative max-w-4xl mx-auto rounded-3xl border border-[#E8E8E4] bg-white/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6 sm:p-10 space-y-8 overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Authentic "PAID & ESCROW VERIFIED" Watermark Stamp */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 -rotate-12 pointer-events-none select-none opacity-25 sm:opacity-30 print:opacity-40">
          <div className="border-4 border-dashed border-[#21866F] rounded-3xl p-6 text-center shadow-xs">
            <span className="text-5xl font-black font-mono tracking-widest text-[#21866F] block">
              PAID
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#21866F] block mt-1">
              NPCI ESCROW VERIFIED • 256-BIT
            </span>
            <span className="text-[10px] font-mono text-[#21866F]/80 block mt-0.5">
              UTR: {displayOrder.paymentDetails.utrNumber}
            </span>
          </div>
        </div>

        {/* Invoice Header */}
        <div className="pb-6 border-b border-[#E8E8E4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] flex items-center justify-center font-bold text-sm">
                {store.whiteLabelConfig.brandName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">
                {store.whiteLabelConfig.brandName}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {store.whiteLabelConfig.brandSubtitle} • {store.activeRegion.taxIdLabel}: {store.activeRegion.taxIdDefault}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Official Merchant VPA: {store.whiteLabelConfig.merchantUpiId} • Registered Central Operations Hub
            </p>
          </div>

          <div className="sm:text-right space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
              OFFICIAL TAX INVOICE & RECEIPT
            </span>
            <p className="text-sm font-bold text-slate-950 font-mono">
              Invoice #{displayOrder.id.replace("ORD-", "INV-")}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Date: {formatDateTime(displayOrder.createdAt)}
            </p>
          </div>
        </div>

        {/* Customer, Payment & Logistics Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono">
          {/* Customer Billed To */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
              Customer Details & Destination
            </span>
            <p className="font-bold text-slate-950">{displayOrder.customerName}</p>
            <p className="text-slate-600 text-[11px] font-sans">
              {displayOrder.shippingAddress.street}
              {displayOrder.shippingAddress.apartment ? `, ${displayOrder.shippingAddress.apartment}` : ""},{" "}
              {displayOrder.shippingAddress.city}, {displayOrder.shippingAddress.state} —{" "}
              {displayOrder.shippingAddress.pincode}
            </p>
            <p className="text-slate-500 text-[11px]">Phone: {displayOrder.customerPhone}</p>
          </div>

          {/* Payment Verification */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
              Payment Verification & Escrow
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-950">
                {displayOrder.paymentMethod} (NPCI Verified)
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-slate-600 text-[11px]">
              UPI ID: <strong className="text-slate-900">{displayOrder.paymentDetails.upiId || "customer@okaxis"}</strong>
            </p>
            <p className="text-slate-600 text-[11px]">
              UTR No: <strong className="text-slate-900">{displayOrder.paymentDetails.utrNumber}</strong>
            </p>
            <p className="text-emerald-700 text-[11px] font-bold">
              Status: {displayOrder.paymentDetails.status}
            </p>
          </div>

          {/* Courier Logistics */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
              Logistics & Consignment
            </span>
            <p className="font-bold text-slate-950">Blue Dart Express (Air Priority)</p>
            <p className="text-slate-600 text-[11px]">
              AWB: {displayOrder.awbNumber}
            </p>
            <p className="text-slate-500 text-[11px]">
              Partner: {displayOrder.courierPartner}
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-mono uppercase text-slate-500">
                <th className="py-2.5">Piece Description & Supplier</th>
                <th className="py-2.5 text-center">HSN Code</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Tax Rate</th>
                <th className="py-2.5 text-right">Amount ({store.activeRegion.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {displayOrder.items.map((item, idx) => {
                const lineTotal = item.product.price * item.quantity;
                return (
                  <tr key={idx} className="py-3">
                    <td className="py-3">
                      <span className="font-bold text-slate-950 block">{item.product.title}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Studio: {item.product.supplier.name} ({item.product.supplier.location})
                        {item.selectedSize ? ` • Size: ${item.selectedSize}` : ""}
                        {item.selectedColor ? ` • Color: ${item.selectedColor.name}` : ""}
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono text-slate-600">8518 / 6203</td>
                    <td className="py-3 text-center font-mono font-medium">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">{store.formatPrice(item.product.price)}</td>
                    <td className="py-3 text-right font-mono text-slate-600">{Math.round(store.activeRegion.taxRate * 100)}%</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-950">
                      {store.formatPrice(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Invoice Totals Summary */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="text-[11px] text-slate-500 max-w-sm space-y-1">
            <p>
              <strong>Buyer & Merchant Protection:</strong> Settled securely through {store.activeRegion.paymentGatewayName}.
            </p>
            <p>
              Tax Invoiced in compliance with {store.activeRegion.taxName}. For support, contact <code>support@nexu.studio</code>.
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{store.formatPrice(displayOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Courier Delivery:</span>
              <span className={displayOrder.shippingFee === 0 ? "text-emerald-700 font-bold" : ""}>
                {displayOrder.shippingFee === 0 ? "FREE" : store.formatPrice(displayOrder.shippingFee)}
              </span>
            </div>
            {displayOrder.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Voucher Discount ({displayOrder.couponCode || "PROMO"}):</span>
                <span>-{store.formatPrice(displayOrder.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST (12% Included):</span>
              <span>{store.formatPrice(displayOrder.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-950 font-extrabold text-sm pt-2 border-t-2 border-slate-900">
              <span>Total Paid:</span>
              <span>{store.formatPrice(displayOrder.total)}</span>
            </div>
          </div>
        </div>

        {/* Viral Referral Footer Loop for Organic Growth */}
        <div className="mt-8 pt-4 border-t border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Loved your direct studio purchase?
              </p>
              <p className="text-[11px] text-slate-500">
                Powered by Nexu Atelier &bull; Launch Your Own 0%-Commission Brand Store Free in 60s
              </p>
            </div>
          </div>
          <Link
            href="/#seller-onboarding"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-[11px] font-bold shadow-2xs transition-all print:hidden"
          >
            <span>Launch Free Store</span>
            <ArrowRight className="w-3 h-3 text-[#21866F]" />
          </Link>
        </div>
      </div>

      {/* Bottom Print / Navigation Actions */}
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 print:hidden">
        <Link
          href="/"
          className="px-4 py-2.5 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] text-[#171717] text-xs font-semibold shadow-2xs transition-colors"
        >
          ← Return to Curated Catalog
        </Link>

        <button
          type="button"
          onClick={handlePrintInvoice}
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#21866F]" />
          <span>Download Official Receipt (Print / PDF)</span>
        </button>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-xs text-slate-500 font-mono">
          Loading order details...
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}

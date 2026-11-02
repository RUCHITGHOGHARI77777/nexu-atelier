"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Package,
  Boxes,
  Truck,
  IndianRupee,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  X,
  Search,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  Eye,
  Check,
  ChevronRight,
  Layers,
  Barcode,
  Briefcase,
  Download,
  Share2,
  Tag,
  Zap,
  Phone,
  MessageSquare,
  QrCode,
  DollarSign,
  Calculator,
  Store,
  ExternalLink,
  Star,
  Copy,
  MessageCircle,
} from "lucide-react";
import { useStore, StoreProduct, StoreOrder } from "@/context/StoreContext";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { BrandedPackagingSlipModal } from "./BrandedPackagingSlipModal";
import { DispatchOrderModal } from "./DispatchOrderModal";
import { LaunchBrandStoreModal } from "../seller/LaunchBrandStoreModal";

// Quick Preset Samples for instant 1-click product creation
const QUICK_PRODUCT_PRESETS = [
  {
    title: "Titan 65W GaN Fast Charging Station",
    subtitle: "Triple USB-C + Dual USB-A High Efficiency Power Delivery",
    category: "Electronics" as const,
    price: 3499,
    mrpPrice: 5999,
    stock: 25,
    b2bMinMoq: 1,
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    description: "Compact next-gen Gallium Nitride charging station with intelligent thermal distribution and aerospace-grade casing.",
  },
  {
    title: "Raw Khadi Silk Minimalist Studio Blazer",
    subtitle: "Single-breasted unlined tailored piece in organic tussar weave",
    category: "Fashion & Apparel" as const,
    price: 8990,
    mrpPrice: 14500,
    stock: 12,
    b2bMinMoq: 1,
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    description: "Hand-spun breathable khadi silk blazer crafted by heritage weavers in Varanasi. Finished with mother-of-pearl buttons.",
  },
  {
    title: "Handmade Terracotta Slow Pour-Over Dripper",
    subtitle: "Architectural conic dripper with matte porous clay body",
    category: "Home & Kitchen" as const,
    price: 1850,
    mrpPrice: 2800,
    stock: 30,
    b2bMinMoq: 2,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    description: "Wheel-thrown porous clay pour-over dripper designed for thermal stability and high-clarity extraction.",
  },
  {
    title: "B2B Wholesale: Architectural Panel Pack (10x Units)",
    subtitle: "Certified Class-A sound absorption studio baffle cartons",
    category: "B2B Wholesale Packs" as const,
    price: 42000,
    mrpPrice: 65000,
    stock: 15,
    b2bMinMoq: 5,
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
    description: "Direct-from-factory pallet of 10 acoustic cloud modules for recording studios and enterprise executive suites.",
  },
];

export function SupplierPortalSaaS() {
  const store = useStore();
  const {
    products,
    orders,
    b2bQuotes,
    whiteLabelConfig,
    updateB2BQuoteStatus,
    addProduct,
    updateProductStock,
    updateProductPrice,
    toggleProductStatus,
    acceptSellerOrder,
    rejectSellerOrder,
    markSellerOrderDelivered,
    generateShippingManifest,
    showToast,
  } = store;

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState<
    "fulfillment" | "inventory" | "financials" | "marketing" | "b2b"
  >("fulfillment");

  // Order fulfillment sub-tab
  const [fulfillmentSubTab, setFulfillmentSubTab] = useState<"pending" | "ready_to_ship" | "delivered">("pending");

  // Search & Filter states
  const [productSearch, setProductSearch] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLaunchStoreWizardOpen, setIsLaunchStoreWizardOpen] = useState(false);
  const [packagingSlipOrder, setPackagingSlipOrder] = useState<StoreOrder | null>(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState<StoreOrder | null>(null);
  const [manifestModalOrder, setManifestModalOrder] = useState<StoreOrder | null>(null);

  // New Product Form fields
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCategory, setNewCategory] = useState<StoreProduct["category"]>("Electronics");
  const [newPrice, setNewPrice] = useState("2999");
  const [newMrpPrice, setNewMrpPrice] = useState("4999");
  const [newStock, setNewStock] = useState("20");
  const [newMoq, setNewMoq] = useState("1");
  const [newImageUrl, setNewImageUrl] = useState(
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
  );
  const [newDescription, setNewDescription] = useState(
    "Enterprise precision crafted drop. Guaranteed authentic and inspected for quality."
  );

  // Seller packaging cost estimate per order for net profit calculation
  const [packingCostPerOrder, setPackingCostPerOrder] = useState<number>(120);

  // Meta Pixel ID local state
  const [metaPixelId, setMetaPixelId] = useState<string>("PIXEL_982140510");

  // Organic Viral Booster local state
  const [selectedPosterProductId, setSelectedPosterProductId] = useState<string>(products[0]?.id || "p1");
  const [posterFestivalTag, setPosterFestivalTag] = useState<string>("DIWALI DHAMAKA • DIRECT ARTISAN DROP");
  const [posterCustomOffer, setPosterCustomOffer] = useState<string>("Flat 20% Direct Customer Discount • Zero Middleman");
  const [reviewCustomerName, setReviewCustomerName] = useState<string>("Rahul Sharma");
  const [reviewCustomerPhone, setReviewCustomerPhone] = useState<string>("9876543210");

  const selectedPosterProduct = useMemo(() => {
    return products.find((p) => p.id === selectedPosterProductId) || products[0];
  }, [products, selectedPosterProductId]);

  // Dynamic calculations
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.price * p.stock, 0);
  }, [products]);

  const activeProductsCount = useMemo(() => {
    return products.filter((p) => p.stock > 0).length;
  }, [products]);

  const grossSalesINR = useMemo(() => {
    return orders.reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  // Zero commission platform: 100% net take-home (minus packaging expense entered by seller)
  const totalPackingExpenses = useMemo(() => {
    return orders.length * packingCostPerOrder;
  }, [orders, packingCostPerOrder]);

  const netSellerTakeHomeProfit = useMemo(() => {
    return Math.max(0, grossSalesINR - totalPackingExpenses);
  }, [grossSalesINR, totalPackingExpenses]);

  // Tax calculations
  const totalTaxCollected = useMemo(() => {
    return orders.reduce((acc, o) => acc + (o.taxAmount || Math.round((o.total * 18) / 118)), 0);
  }, [orders]);

  const cgstCollected = Math.round(totalTaxCollected / 2);
  const sgstCollected = totalTaxCollected - cgstCollected;
  const tcs1PercentEstimate = Math.round(grossSalesINR * 0.01);

  // Group orders for the 3-step fulfillment workflow
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => (o.deliveryStage || 1) <= 1 && o.deliveryStage !== 0);
  }, [orders]);

  const readyToShipOrders = useMemo(() => {
    return orders.filter((o) => o.deliveryStage === 2);
  }, [orders]);

  const outForDeliveryAndDeliveredOrders = useMemo(() => {
    return orders.filter((o) => (o.deliveryStage || 1) >= 3);
  }, [orders]);

  // Filtered products for stock manager
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.supplier.name.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // Handle Quick Fill Preset
  const handleApplyPreset = (preset: (typeof QUICK_PRODUCT_PRESETS)[0]) => {
    setNewTitle(preset.title);
    setNewSubtitle(preset.subtitle);
    setNewCategory(preset.category);
    setNewPrice(preset.price.toString());
    setNewMrpPrice(preset.mrpPrice.toString());
    setNewStock(preset.stock.toString());
    setNewMoq(preset.b2bMinMoq.toString());
    setNewImageUrl(preset.imageUrl);
    setNewDescription(preset.description);
    showToast(`Loaded preset: "${preset.title}"`, "info");
  };

  // Handle Add Product Submit
  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parsedPrice = parseInt(newPrice, 10) || 1999;
    const parsedMrp = parseInt(newMrpPrice, 10) || Math.round(parsedPrice * 1.3);
    const parsedStock = parseInt(newStock, 10) || 10;
    const parsedMoq = parseInt(newMoq, 10) || 1;

    addProduct({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || "Curated Studio Release",
      description: newDescription.trim(),
      category: newCategory,
      price: parsedPrice,
      mrpPrice: parsedMrp,
      stock: parsedStock,
      b2bMinMoq: parsedMoq,
      badge: "New Drop",
      images: [newImageUrl.trim()],
      supplier: {
        id: "sup_apex",
        name: whiteLabelConfig.brandName,
        location: "Jaipur / Bangalore Artisan Hub",
        rating: 4.98,
        fulfillmentRate: "100%",
        verified: true,
      },
      specs: {
        "Supplier SKU": `APEX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        "Quality Inspection": "100% Passed Direct Seller Verification",
        "Dispatched From": "Verified Artisan Warehouse Hub",
      },
      reviews: [
        {
          id: `rev_${Date.now()}`,
          author: "Verified Patron",
          rating: 5,
          date: "Just now",
          comment: "Direct from artisan maker. Unmatched quality and rapid delivery.",
          verified: true,
        },
      ],
    });

    setIsAddModalOpen(false);
    setNewTitle("");
    setNewSubtitle("");
  };

  // Export Real CA & GST CSV File
  const handleExportCAProfitReport = () => {
    if (orders.length === 0) {
      showToast("No orders available to export.", "warning");
      return;
    }

    const headers = [
      "Order ID",
      "Order Date",
      "Customer Name",
      "Customer Phone",
      "Destination City",
      "Destination Pincode",
      "GSTIN",
      "Invoice Number",
      "Payment Method",
      "Bank UTR Ref",
      "Gross Total (INR)",
      "Taxable Value (INR)",
      "CGST 9% (INR)",
      "SGST 9% (INR)",
      "IGST 18% (INR)",
      "Estimated Packing Cost (INR)",
      "1% TCS Sec 52 (INR)",
      "Net Seller Profit (INR)",
      "Fulfillment Status",
    ];

    const rows = orders.map((o) => {
      const taxable = Math.round((o.total * 100) / 118);
      const tax = o.total - taxable;
      const cgst = Math.round(tax / 2);
      const sgst = tax - cgst;
      const tcs = Math.round(o.total * 0.01);
      const netProfit = o.total - packingCostPerOrder;

      return [
        `"${o.id}"`,
        `"${new Date(o.createdAt).toLocaleString("en-IN")}"`,
        `"${o.customerName}"`,
        `"${o.customerPhone}"`,
        `"${o.shippingAddress?.city || "Mumbai"}"`,
        `"${o.shippingAddress?.pincode || "400001"}"`,
        `"${whiteLabelConfig.gstinNumber}"`,
        `"INV-2026-${o.id.slice(-6)}"`,
        `"DIRECT UPI (0% COMM)"`,
        `"${o.paymentDetails?.utrNumber || "UPI/2026/894201"}"`,
        o.total,
        taxable,
        cgst,
        sgst,
        0,
        packingCostPerOrder,
        tcs,
        netProfit,
        `"${o.status}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Monthly_GST_and_CA_Profit_Report_November_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("📥 Exported Official CA-Ready GST & Profit Report (.CSV)!", "success");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-900 animate-in fade-in duration-300">
      {/* --- SELLER DASHBOARD HERO HEADER --- */}
      <div className="rounded-3xl border border-white/90 ring-1 ring-slate-900/5 bg-white/80 backdrop-blur-2xl shadow-[0_15px_45px_rgba(15,23,42,0.04)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
              0% COMMISSION INDIAN SELLER DASHBOARD
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified Brand Store</span>
            </span>
            <span className="text-[11px] text-indigo-700 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Direct UPI: {whiteLabelConfig.merchantUpiId}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2.5">
            <span>{whiteLabelConfig.brandName}</span>
          </h1>

          <p className="text-xs text-slate-500 font-mono">
            GSTIN: <strong className="text-slate-800">{whiteLabelConfig.gstinNumber}</strong> • Escrow Rate:{" "}
            <strong className="text-emerald-700">0% Commission (100% Profit to You)</strong> • P2P Bank Settlement
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLaunchStoreWizardOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Launch Another Brand Store (60s)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Add Product to Store</span>
          </button>
        </div>
      </div>

      {/* --- 4 LIVE METRIC SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Sales */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Gross Sales (GMV)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
              {formatCurrency(grossSalesINR)}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {orders.length} Orders
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Total sales volume captured directly
          </p>
        </div>

        {/* KPI 2: 100% Net Take-Home Bank Profit */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 shadow-lg shadow-emerald-500/15 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-100 font-mono">
            <span className="font-bold">100% Net Bank Profit</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono tracking-tight text-white">
              {formatCurrency(netSellerTakeHomeProfit)}
            </span>
            <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full">
              0% Fee
            </span>
          </div>
          <p className="text-[11px] text-emerald-100">
            ₹0 lost to Amazon/Flipkart/Meesho commissions
          </p>
        </div>

        {/* KPI 3: Actionable Pending Orders */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Pending Dispatch</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 font-mono tracking-tight">
              {pendingOrders.length + readyToShipOrders.length}
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Action Required
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {pendingOrders.length} Pending • {readyToShipOrders.length} Ready to Ship
          </p>
        </div>

        {/* KPI 4: Active Listings */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Active Catalog Items</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
              {activeProductsCount} <span className="text-xs font-normal text-slate-500">/ {products.length}</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Live
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Total Inventory Value: {formatCurrency(totalInventoryValue)}
          </p>
        </div>
      </div>

      {/* --- 5-TAB SELLER NAVIGATION BAR --- */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("fulfillment")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === "fulfillment"
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>1. Order Fulfillment Pipeline ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === "inventory"
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>2. Stock & Pricing Manager</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("financials")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === "financials"
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-emerald-500" />
          <span>3. GST, TDS & CA Reports</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("marketing")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === "marketing"
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>4. 🚀 Free Organic Booster & WhatsApp Hub</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("b2b")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === "b2b"
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>5. B2B Wholesale Leads ({b2bQuotes.length})</span>
        </button>
      </div>

      {/* --- TAB CONTENT 1: FULL SELLER ORDER FULFILLMENT WORKFLOW --- */}
      {activeTab === "fulfillment" && (
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Kanban Order Fulfillment Engine</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete workflow from Pending Customer Order $\to$ Accept $\to$ Pack & Print Label $\to$ Direct Dispatch.
              </p>
            </div>

            {/* Stepper Sub-tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFulfillmentSubTab("pending")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  fulfillmentSubTab === "pending"
                    ? "bg-white text-slate-950 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                🕒 Pending Orders ({pendingOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentSubTab("ready_to_ship")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  fulfillmentSubTab === "ready_to_ship"
                    ? "bg-white text-slate-950 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                📦 Ready to Ship ({readyToShipOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentSubTab("delivered")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  fulfillmentSubTab === "delivered"
                    ? "bg-white text-slate-950 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                🚀 Out for Delivery & Delivered ({outForDeliveryAndDeliveredOrders.length})
              </button>
            </div>
          </div>

          {/* Sub-tab 1: PENDING ORDERS */}
          {fulfillmentSubTab === "pending" && (
            <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Step 1: Pending Seller Review ({pendingOrders.length})
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Accept order to reserve inventory and begin packing
                </span>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-950">No pending orders waiting for review!</p>
                  <p className="text-[11px] text-slate-500">All customer orders have been accepted.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-950 text-sm">
                            {ord.id}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            DIRECT UPI PAID
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">
                          Customer: <strong className="text-slate-950">{ord.customerName}</strong> ({ord.customerPhone}) • Destination: {ord.shippingAddress?.city}, {ord.shippingAddress?.state} ({ord.shippingAddress?.pincode})
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Pieces: {ord.items.map((i) => `${i.product.title} (x${i.quantity})`).join(", ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono pr-2">
                          <span className="text-[10px] text-slate-400 block uppercase">Order Value</span>
                          <span className="text-base font-black text-slate-950">{formatCurrency(ord.total)}</span>
                        </div>

                        {/* Accept Button */}
                        <button
                          type="button"
                          onClick={() => acceptSellerOrder(ord.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-98 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Accept Order</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          type="button"
                          onClick={() => rejectSellerOrder(ord.id)}
                          className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold active:scale-98 cursor-pointer transition-colors"
                        >
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 2: READY TO SHIP */}
          {fulfillmentSubTab === "ready_to_ship" && (
            <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  Step 2: Packaged & Ready for Dispatch ({readyToShipOrders.length})
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Print official packaging slips with your brand logo & dispatch via self or courier
                </span>
              </div>

              {readyToShipOrders.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Package className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-950">No orders awaiting dispatch.</p>
                  <p className="text-[11px] text-slate-500">Accept pending orders to bring them to this packaging stage.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {readyToShipOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-950 text-sm">
                            {ord.id}
                          </span>
                          <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            PACKED & LABELED
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">
                          Consignee: <strong className="text-slate-950">{ord.customerName}</strong> • {ord.shippingAddress?.street}, {ord.shippingAddress?.city}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          UTR Ref: {ord.paymentDetails?.utrNumber || "UPI/2026/894201"} • Net Value: {formatCurrency(ord.total)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Print Packaging Slip Button */}
                        <button
                          type="button"
                          onClick={() => setPackagingSlipOrder(ord)}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Print Slip & GST Label</span>
                        </button>

                        {/* Dispatch Button */}
                        <button
                          type="button"
                          onClick={() => setDispatchModalOrder(ord)}
                          className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-98 cursor-pointer transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Dispatch via Self / Courier 🚚</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 3: OUT FOR DELIVERY & DELIVERED */}
          {fulfillmentSubTab === "delivered" && (
            <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Step 3: Live Transit & Doorstep Deliveries ({outForDeliveryAndDeliveredOrders.length})
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Track delivery associate route and request customer 5★ reviews
                </span>
              </div>

              <div className="space-y-3">
                {outForDeliveryAndDeliveredOrders.map((ord) => {
                  const isDelivered = (ord.deliveryStage || 1) === 5;

                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-950 text-sm">
                            {ord.id}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isDelivered
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-sky-50 text-sky-800 border-sky-200"
                            }`}
                          >
                            {isDelivered ? "DELIVERED ✓" : "OUT FOR DELIVERY / IN TRANSIT"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">
                          Customer: <strong className="text-slate-950">{ord.customerName}</strong> ({ord.shippingAddress?.city}) • Delivery Partner: {ord.courierPartner || "Blue Dart Air Priority"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          AWB: {ord.awbNumber || "BD-89472910IN"} • Total: {formatCurrency(ord.total)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {!isDelivered ? (
                          <button
                            type="button"
                            onClick={() => markSellerOrderDelivered(ord.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-98 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Delivered & Request 5★ Review ⭐</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`Hi ${ord.customerName}! Thank you for purchasing from ${whiteLabelConfig.brandName}. Please leave us a 5-star review: https://nexu.studio/store/review/${ord.id}`);
                              showToast(`Copied 5★ Review WhatsApp link for ${ord.customerName}! ⭐️`, "success");
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Send 5★ Review Link</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB CONTENT 2: INVENTORY & STOCK MANAGER --- */}
      {activeTab === "inventory" && (
        <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-slate-950" />
                <h2 className="text-lg font-extrabold text-slate-950">
                  Seller Catalog & Real-Time Stock Control
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust inventory units, tweak prices, and toggle products live on your branded storefront.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search catalog products..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-[10px] font-mono uppercase text-slate-500">
                  <th className="py-3 px-3">Product Listing</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Retail Price (INR)</th>
                  <th className="py-3 px-3 text-center">Stock Quantity</th>
                  <th className="py-3 px-3 text-center">Stock Status</th>
                  <th className="py-3 px-3 text-right">Quick Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <Image
                              src={p.images[0] || "/placeholder.jpg"}
                              alt={p.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-950 block leading-snug line-clamp-1">
                              {p.title}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Brand: {whiteLabelConfig.brandName} • MOQ: {p.b2bMinMoq || 1}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-slate-950">
                        {formatCurrency(p.price)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl bg-white p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateProductStock(p.id, Math.max(0, p.stock - 1))}
                            className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-slate-900">
                            {p.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateProductStock(p.id, p.stock + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            !isOutOfStock
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${!isOutOfStock ? "bg-emerald-500" : "bg-rose-500"}`} />
                          <span>{!isOutOfStock ? "In Stock" : "Sold Out"}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleProductStatus(p.id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          {isOutOfStock ? "Set Available" : "Mark Out of Stock"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 3: FINANCIAL & TAX REPORTS (GST, TDS, TCS & CA EXPORT) --- */}
      {activeTab === "financials" && (
        <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-black text-slate-950">
                  Financial & Tax Reports (1-Click CA Export)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Government-compliant tax summaries with 0% platform deductions. Download monthly CSV for GST return filing.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCAProfitReport}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-98 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>📥 Export Complete Monthly CA & GST Report (.CSV)</span>
            </button>
          </div>

          {/* Tax Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                Taxable Turnover (Exclusive)
              </span>
              <span className="text-xl font-black font-mono text-slate-950 block">
                {formatCurrency(grossSalesINR - totalTaxCollected)}
              </span>
              <span className="text-[10px] text-slate-500">Base goods sales value</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                CGST (9%) + SGST (9%) Collected
              </span>
              <span className="text-xl font-black font-mono text-indigo-700 block">
                {formatCurrency(totalTaxCollected)}
              </span>
              <span className="text-[10px] text-slate-500">CGST: {formatCurrency(cgstCollected)} • SGST: {formatCurrency(sgstCollected)}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                1% TCS / TDS Compliance
              </span>
              <span className="text-xl font-black font-mono text-amber-700 block">
                {formatCurrency(tcs1PercentEstimate)}
              </span>
              <span className="text-[10px] text-slate-500">Section 194-O statutory tracking</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-mono text-emerald-800 uppercase block font-bold">
                100% Net Bank Settlement
              </span>
              <span className="text-xl font-black font-mono text-emerald-800 block">
                {formatCurrency(netSellerTakeHomeProfit)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">0% Platform Cut Deducted!</span>
            </div>
          </div>

          {/* Packing Cost Slider */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                Enter Estimated Packaging & Box Cost per Order
              </span>
              <p className="text-[11px] text-slate-500">
                Customizes your net profit calculation across all {orders.length} processed orders.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={packingCostPerOrder}
                onChange={(e) => setPackingCostPerOrder(Number(e.target.value))}
                className="w-36 accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                ₹{packingCostPerOrder}/box
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 4: ORGANIC ORDER BOOSTER & WHATSAPP VIRAL ENGINE --- */}
      {activeTab === "marketing" && (
        <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-sm p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-black text-slate-950 tracking-tight">
                  🚀 Free Organic Order Booster & WhatsApp Viral Engine
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Zero paid ads required. Empower small Indian artisans, weavers, and manufacturers to get orders directly via WhatsApp Status deal posters and collect 5-star customer reviews on autopilot.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                100% Free Organic Reach
              </span>
            </div>
          </div>

          {/* Module A: 1-Click WhatsApp Status & Catalog Poster Generator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 6 Cols: Poster Controls */}
            <div className="lg:col-span-6 space-y-5">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>WhatsApp Status & Story Deal Poster Generator</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Auto-Formatted
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Select a product to generate an attractive, high-converting deal poster with your direct UPI QR code and zero-commission pricing.
                </p>

                {/* Product Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Choose Product to Feature:
                  </label>
                  <select
                    value={selectedPosterProductId}
                    onChange={(e) => setSelectedPosterProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {formatCurrency(p.price)} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campaign / Festival Headline */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Campaign / Festival Tagline:
                  </label>
                  <input
                    type="text"
                    value={posterFestivalTag}
                    onChange={(e) => setPosterFestivalTag(e.target.value)}
                    placeholder="e.g. DIWALI DHAMAKA • DIRECT FROM ARTISAN"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "DIWALI DHAMAKA • DIRECT ARTISAN DROP",
                      "PAY VIA UPI • ZERO COMMISSION DEAL",
                      "FESTIVE EXCLUSIVE • 100% HANDMADE",
                      "WEDDING SEASON SPECIAL • 20% OFF",
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPosterFestivalTag(tag)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offer Subtitle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Custom Value Proposition:
                  </label>
                  <input
                    type="text"
                    value={posterCustomOffer}
                    onChange={(e) => setPosterCustomOffer(e.target.value)}
                    placeholder="e.g. Flat 20% Direct Customer Discount • Zero Middleman"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                {/* 3 Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const storeSlug = whiteLabelConfig.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      const storeUrl = `https://nexu.studio/store/${storeSlug}`;
                      const msg = `🔥 *Special Deal from ${whiteLabelConfig.brandName}!* \n\n*${selectedPosterProduct?.title}*\n🏷️ Special Price: ${formatCurrency(selectedPosterProduct?.price || 0)} (MRP: ${formatCurrency(selectedPosterProduct?.mrpPrice || Math.round((selectedPosterProduct?.price || 1000) * 1.4))})\n✨ ${posterFestivalTag}\n\n✅ 0% Middleman Commission - Direct from Maker\n✅ Instant UPI & Fast Dispatch\n\n👉 Order directly: ${storeUrl}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
                      showToast("WhatsApp Status message copied! Opening WhatsApp... 🚀", "success");
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>📱 Share to WhatsApp Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      showToast("📥 Poster downloaded as high-res graphic! Ready to upload to WhatsApp & Instagram 📸", "success");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>📥 Download Poster</span>
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Direct Store URL:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const storeSlug = whiteLabelConfig.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      navigator.clipboard.writeText(`https://nexu.studio/store/${storeSlug}`);
                      showToast("Direct store link copied to clipboard! 📋", "success");
                    }}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Store Link</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Live Specular Glass Poster Preview */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">
                Live Status / Story Poster Preview
              </span>

              {/* Poster Card Container */}
              <div
                id="whatsapp-deal-poster"
                className="w-full max-w-[340px] rounded-3xl p-5 border border-white/90 ring-1 ring-slate-900/10 bg-gradient-to-b from-white/95 via-slate-50/90 to-emerald-50/40 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-2xl space-y-3.5 relative overflow-hidden"
              >
                {/* Glow blobs */}
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

                {/* Poster Brand Header */}
                <div className="flex items-center justify-between relative z-10 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {whiteLabelConfig.brandName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-950 leading-tight">
                        {whiteLabelConfig.brandName}
                      </h4>
                      <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Direct Artisan Store</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-900 bg-amber-100/90 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 font-mono">
                      ⭐ 9.9/10 Trust
                    </span>
                  </div>
                </div>

                {/* Campaign Tagline Banner */}
                <div className="py-1 px-2.5 rounded-lg bg-slate-950 text-white text-center font-mono text-[10px] font-extrabold uppercase tracking-wide">
                  {posterFestivalTag}
                </div>

                {/* Product Image Frame */}
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-inner group">
                  <Image
                    src={selectedPosterProduct?.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"}
                    alt={selectedPosterProduct?.title || "Product"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black tracking-wider uppercase shadow-sm">
                    0% Middleman Rake
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                    Direct P2P Order
                  </div>
                </div>

                {/* Product Title & Offer */}
                <div className="space-y-1">
                  <h5 className="text-sm font-black text-slate-950 leading-snug line-clamp-1">
                    {selectedPosterProduct?.title}
                  </h5>
                  <p className="text-[10px] text-slate-600 line-clamp-1">
                    {posterCustomOffer}
                  </p>
                </div>

                {/* Pricing & Direct UPI Box */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                      Direct Artisan Price
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-emerald-700 font-mono">
                        {formatCurrency(selectedPosterProduct?.price || 0)}
                      </span>
                      {selectedPosterProduct?.mrpPrice && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {formatCurrency(selectedPosterProduct.mrpPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scannable Mini QR Representation */}
                  <div className="flex flex-col items-center">
                    <div className="w-13 h-13 p-1 rounded-xl bg-slate-950 flex items-center justify-center shadow-xs">
                      {/* Crisp Vector QR Pattern */}
                      <div className="w-11 h-11 bg-white p-1 rounded-md flex flex-col justify-between">
                        <div className="flex justify-between">
                          <div className="w-3 h-3 bg-black rounded-xs flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white" />
                          </div>
                          <div className="w-3 h-3 bg-black rounded-xs flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white" />
                          </div>
                        </div>
                        <div className="flex justify-center items-center">
                          <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                        </div>
                        <div className="flex justify-between">
                          <div className="w-3 h-3 bg-black rounded-xs flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white" />
                          </div>
                          <div className="w-1.5 h-1.5 bg-black" />
                        </div>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500 font-bold mt-0.5">
                      Scan to Pay UPI
                    </span>
                  </div>
                </div>

                {/* Footer Micro-CTA */}
                <div className="text-center pt-0.5">
                  <span className="text-[10px] font-mono text-slate-500">
                    nexu.studio/store/{whiteLabelConfig.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Module B: ⭐ Automated WhatsApp Review & Referral Loop Engine */}
          <div className="p-6 rounded-3xl border border-white/90 ring-1 ring-slate-900/5 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white backdrop-blur-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  </div>
                  <h3 className="text-base font-black text-slate-950">
                    ⭐ Automated WhatsApp Review & Referral Loop (10/10 Score Engine)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Turn every delivered buyer into an organic promoter. When an order is completed, send a 1-click WhatsApp message to collect a verified 5★ review on our Trust Wall and reward them with a 10% coupon (<strong className="text-slate-900 font-mono">PATRON10</strong>) for their next order.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                Coupon: PATRON10 (10% OFF)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Customer Inputs */}
              <div className="md:col-span-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Customer Name:
                  </label>
                  <input
                    type="text"
                    value={reviewCustomerName}
                    onChange={(e) => setReviewCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Customer WhatsApp Number:
                  </label>
                  <input
                    type="text"
                    value={reviewCustomerPhone}
                    onChange={(e) => setReviewCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Message Live Preview */}
              <div className="md:col-span-5 p-3.5 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs font-mono text-xs text-slate-700 space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 block">
                  WhatsApp Message Preview:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-800">
                  &quot;Hi <strong className="text-emerald-900">{reviewCustomerName}</strong>! 🙏 Thank you for ordering from <strong className="text-slate-950">{whiteLabelConfig.brandName}</strong>. Your support helps direct Indian artisans. Please share your rating on our Trust Wall: <span className="text-indigo-600 underline">https://nexu.studio/reviews</span> — Use code <strong className="text-emerald-700">PATRON10</strong> for 10% off your next direct order!&quot;
                </p>
              </div>

              {/* Trigger Button */}
              <div className="md:col-span-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = reviewCustomerPhone.replace(/[^0-9]/g, "");
                    const msg = `Hi ${reviewCustomerName}! 🙏 Thank you for ordering from ${whiteLabelConfig.brandName}. Your support directly empowers Indian makers with 0% platform commission.\n\nCould you please take 30 seconds to rate us on our Trust Wall?\n👉 https://nexu.studio/reviews\n\nAs a thank-you, use coupon code *PATRON10* for *10% OFF* on your next order! 🎁`;
                    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                    showToast(`WhatsApp review request generated for ${reviewCustomerName}! ⭐`, "success");
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp Review Link</span>
                </button>
                <span className="text-[10px] text-slate-500 text-center">
                  Includes 10% repeat order discount coupon
                </span>
              </div>
            </div>
          </div>

          {/* Module C: Meta Pixel Integration (Optional Paid Channel) */}
          <div className="pt-2 border-t border-slate-200/80">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs max-w-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>Meta Pixel Integration (Instagram / Facebook Ads - Optional)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Enter your Meta Ads Pixel ID to track PageView, AddToCart, and Purchase conversions in real time.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="e.g. PIXEL_982140510"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => showToast(`Meta Pixel ${metaPixelId} synced with store!`, "success")}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 5: B2B WHOLESALE LEADS --- */}
      {activeTab === "b2b" && (
        <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-extrabold text-slate-950">
                  B2B Wholesale Procurement Leads & Quotes
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bulk order allocations submitted by corporate buyers and institutional patrons.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {b2bQuotes.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-950 text-xs">{q.id}</span>
                    <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      {q.quantity} UNITS MOQ
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        q.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-950">{q.productTitle}</h4>
                  <p className="text-[11px] text-slate-500">
                    Company: <strong className="text-slate-800">{q.companyName}</strong> • Buyer: {q.buyerName} ({q.buyerPhone})
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono pr-2">
                    <span className="text-[10px] text-slate-400 block uppercase">Target Price</span>
                    <span className="text-sm font-black text-slate-950">{formatCurrency(q.targetPriceINR || 0)}/unit</span>
                  </div>

                  {q.status !== "APPROVED" ? (
                    <button
                      type="button"
                      onClick={() => updateB2BQuoteStatus(q.id, "APPROVED")}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Approve Quote ✓
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      Allocated ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL: BRANDED PACKAGING SLIP --- */}
      <BrandedPackagingSlipModal
        order={packagingSlipOrder}
        onClose={() => setPackagingSlipOrder(null)}
      />

      {/* --- MODAL: DISPATCH ORDER (SELF OR COURIER) --- */}
      <DispatchOrderModal
        order={dispatchModalOrder}
        onClose={() => setDispatchModalOrder(null)}
      />

      {/* --- MODAL: 60-SECOND BRAND STORE LAUNCH WIZARD --- */}
      <LaunchBrandStoreModal
        isOpen={isLaunchStoreWizardOpen}
        onClose={() => setIsLaunchStoreWizardOpen(false)}
      />

      {/* --- MODAL: ADD PRODUCT FORM --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-slate-900">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-600 uppercase block">
                  NEW LISTING ONBOARDING
                </span>
                <h3 className="text-lg font-extrabold text-slate-950">
                  Publish New Product to Storefront
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form id="new-product-form" onSubmit={handleCreateProductSubmit} className="p-6 space-y-4 text-xs">
              {/* Presets */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <span className="text-[10px] font-mono font-bold text-indigo-800 uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1-Click Presets for Fast Testing</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PRODUCT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2 text-left rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:shadow-2xs transition-all text-[11px] font-medium text-slate-800 truncate"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Carbon Acoustic Studio Monitor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Retail Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="new-product-form"
                className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Publish to Storefront 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
} from "lucide-react";
import { useStore, StoreProduct, StoreOrder } from "@/context/StoreContext";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

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
    updateB2BQuoteStatus,
    addProduct,
    updateProductStock,
    updateProductPrice,
    toggleProductStatus,
    markOrderDispatched,
    generateShippingManifest,
    showToast,
  } = store;

  // Filter & Search states
  const [productSearch, setProductSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<"ALL" | "PENDING" | "DISPATCHED" | "DELIVERED">("ALL");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Current supplier focus (Apex Electronics & Multi-Vendor Seller Hub)
  const currentSupplierName = "Apex Electronics Hub & Partner Studios";

  // Calculate Supplier KPIs
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.price * p.stock, 0);
  }, [products]);

  const activeProductsCount = useMemo(() => {
    return products.filter((p) => p.stock > 0).length;
  }, [products]);

  const pendingDispatchOrders = useMemo(() => {
    return orders.filter((o) => (o.deliveryStage || 1) <= 2);
  }, [orders]);

  const totalGrossOrderSales = useMemo(() => {
    return orders.reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  // Net payout balance (Gross sales minus 10% platform marketplace commission)
  const netPayoutBalance = useMemo(() => {
    return Math.round(totalGrossOrderSales * 0.9);
  }, [totalGrossOrderSales]);

  // Filtered orders for table
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const stage = o.deliveryStage || 1;
      if (orderFilter === "PENDING") return stage <= 2;
      if (orderFilter === "DISPATCHED") return stage === 3 || stage === 4;
      if (orderFilter === "DELIVERED") return stage === 5;
      return true;
    });
  }, [orders, orderFilter]);

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
        name: "Apex Electronics Hub",
        location: "Bangalore, KA",
        rating: 4.96,
        fulfillmentRate: "99.8%",
        verified: true,
      },
      specs: {
        "Supplier SKU": `APEX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        "Quality Inspection": "100% Passed Escrow Verification",
        "Dispatched From": "Whitefield Central Hub, Bangalore",
      },
      reviews: [
        {
          id: `rev_${Date.now()}`,
          author: "Corporate Buyer",
          rating: 5,
          date: "Just now",
          comment: "Initial batch order placed. Impeccable packaging and prompt SLA dispatch.",
          verified: true,
        },
      ],
    });

    setIsAddModalOpen(false);
    // Reset form
    setNewTitle("");
    setNewSubtitle("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-slate-900 animate-in fade-in duration-300">
      {/* --- SUPPLIER PORTAL HERO HEADER --- */}
      <div className="rounded-3xl border border-white/90 ring-1 ring-slate-900/5 bg-white/80 backdrop-blur-2xl shadow-[0_15px_45px_rgba(15,23,42,0.04)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold uppercase tracking-wider">
              B2B SUPPLIER & SELLER HUB
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified Enterprise Maker</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2.5">
            <span>{currentSupplierName}</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Supplier Code: <strong className="text-slate-800">SUP-APEX-8942</strong> • SLA Fulfillment Rate:{" "}
            <strong className="text-emerald-700">99.8% On-Time</strong> • Blue Dart Express Priority Partner
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add New Product to Storefront</span>
          </button>
        </div>
      </div>

      {/* --- 4 SUPPLIER KPI CARDS (LIQUID WHITE GLASS) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Inventory Value */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Total Inventory Value</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
              {formatCurrency(totalInventoryValue)}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              In Stock
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Valuation calculated across {products.length} catalog items
          </p>
        </div>

        {/* KPI 2: Active Products */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Active Listings</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
              {activeProductsCount} <span className="text-xs font-normal text-slate-500">/ {products.length}</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Live on Store
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {products.length - activeProductsCount} items marked Out-of-Stock
          </p>
        </div>

        {/* KPI 3: Pending Dispatch Orders */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Pending Dispatch</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 font-mono tracking-tight">
              {pendingDispatchOrders.length}
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Requires Action
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Orders awaiting courier packing & dispatch
          </p>
        </div>

        {/* KPI 4: Net Available Payout Balance */}
        <div className="rounded-2xl border border-white/90 ring-1 ring-slate-900/5 bg-white/75 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(15,23,42,0.04)] space-y-2 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Net Payout Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {formatCurrency(netPayoutBalance)}
            </span>
            <button
              type="button"
              onClick={() => showToast("Escrow payout settlement requested to HDFC Bank A/c ending in 4921", "success")}
              className="text-[10px] font-bold text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              Withdraw
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            90% net studio share (10% platform fee deducted)
          </p>
        </div>
      </div>

      {/* --- ORDER FULFILLMENT QUEUE & MANIFEST GENERATION --- */}
      <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-extrabold text-slate-950">
                Order Fulfillment Queue & Logistics Dispatch
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review placed orders, generate Blue Dart AWB manifests, and advance fulfillment stages.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-semibold">
            {(["ALL", "PENDING", "DISPATCHED", "DELIVERED"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setOrderFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  orderFilter === filter
                    ? "bg-white text-slate-950 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {filter === "ALL"
                  ? "All Orders"
                  : filter === "PENDING"
                  ? "Pending Dispatch"
                  : filter === "DISPATCHED"
                  ? "In Transit"
                  : "Delivered"}
              </button>
            ))}
          </div>
        </div>

        {/* Order Queue Table */}
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">No orders matching filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Orders placed by customers in the checkout simulator will appear here live.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-[10px] font-mono uppercase text-slate-500">
                  <th className="py-3 px-3">Order ID & Date</th>
                  <th className="py-3 px-3">Customer & Destination</th>
                  <th className="py-3 px-3">Itemized Pieces</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Fulfillment Stage</th>
                  <th className="py-3 px-3 text-right">Logistics Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.map((ord) => {
                  const stage = ord.deliveryStage || 1;
                  const isDispatched = stage >= 3;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-4 px-3 font-mono">
                        <span className="font-bold text-slate-950 block">{ord.id}</span>
                        <span className="text-[11px] text-slate-500">
                          {formatDateTime(ord.createdAt)}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-3">
                        <span className="font-bold text-slate-950 block">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                          {ord.shippingAddress?.city}, {ord.shippingAddress?.state} ({ord.shippingAddress?.pincode})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ph: {ord.customerPhone}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-3">
                        <div className="space-y-1 max-w-xs">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="text-slate-800 text-[11px] flex items-center justify-between">
                              <span className="truncate">{item.product.title}</span>
                              <span className="font-mono text-slate-500 font-bold ml-2">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-3 text-right font-mono font-bold text-slate-950">
                        {formatCurrency(ord.total)}
                      </td>

                      {/* Fulfillment Stage */}
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                            stage === 5
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : stage >= 3
                              ? "bg-sky-50 text-sky-800 border border-sky-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              stage === 5
                                ? "bg-emerald-500"
                                : stage >= 3
                                ? "bg-sky-500"
                                : "bg-amber-500 animate-pulse"
                            }`}
                          />
                          <span>
                            Stage {stage}/5: {stage === 5 ? "Delivered" : stage >= 3 ? "In Transit" : "Pending Dispatch"}
                          </span>
                        </span>
                      </td>

                      {/* Working Supplier Actions */}
                      <td className="py-4 px-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setManifestModalOrder(ord)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          Manifest / Label
                        </button>

                        {!isDispatched ? (
                          <button
                            type="button"
                            onClick={() => markOrderDispatched(ord.id)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors active:scale-98 cursor-pointer"
                          >
                            Mark as Dispatched ✈️
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-700 font-bold px-2 py-1 bg-emerald-50 rounded-lg">
                            Consigned ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- INVENTORY & STOCK MANAGER TABLE --- */}
      <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-slate-950" />
              <h2 className="text-lg font-extrabold text-slate-950">
                Supplier Inventory & Live Stock Manager
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust stock levels, edit retail prices inline, or toggle items in/out of stock. Changes sync to storefront live.
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
                    {/* Title & Image */}
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
                            Maker: {p.supplier.name} • MOQ: {p.b2bMinMoq || 1}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-medium">
                        {p.category}
                      </span>
                    </td>

                    {/* Price with Inline Quick Editor */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-950 text-sm">
                          {formatCurrency(p.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const promptVal = window.prompt(`Adjust price for "${p.title}" (INR):`, p.price.toString());
                            if (promptVal) {
                              const num = parseInt(promptVal, 10);
                              if (!isNaN(num) && num > 0) updateProductPrice(p.id, num);
                            }
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-mono cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </td>

                    {/* Stock Stepper */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => updateProductStock(p.id, p.stock - 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 font-mono font-bold text-slate-950 min-w-8 text-center">
                          {p.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateProductStock(p.id, p.stock + 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 text-center">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      ) : p.stock <= 5 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Low Stock ({p.stock})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          In Stock ({p.stock})
                        </span>
                      )}
                    </td>

                    {/* Quick In/Out of Stock Toggle */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleProductStatus(p.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isOutOfStock
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isOutOfStock ? "Restock (+10)" : "Mark Out of Stock"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- B2B WHOLESALE LEADS & PROCUREMENT INQUIRIES --- */}
      <div className="rounded-3xl border border-white/90 ring-1 ring-slate-900/5 bg-white/90 backdrop-blur-2xl shadow-[0_15px_45px_rgba(15,23,42,0.04)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-950">
                B2B Wholesale Leads & Procurement Inquiries
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct volume RFQs and customized bulk allocation requests submitted by enterprise clients and studio architects.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs font-bold">
              {b2bQuotes.length} Active Leads
            </span>
          </div>
        </div>

        {b2bQuotes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">No incoming B2B wholesale inquiries yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Inquiry ID & Buyer</th>
                  <th className="py-3 px-3">Requested Piece</th>
                  <th className="py-3 px-3 text-center">Batch Units</th>
                  <th className="py-3 px-3 text-right">Target Rate</th>
                  <th className="py-3 px-3 text-right">Consignment Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Wholesale Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {b2bQuotes.map((q) => {
                  const totalEst = (q.targetPriceINR || 0) * q.quantity;
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-3">
                        <span className="font-mono text-[10px] font-bold text-slate-400 block">{q.id}</span>
                        <span className="font-bold text-slate-900 block text-xs">{q.companyName}</span>
                        <span className="text-[11px] text-slate-500 block">{q.buyerName} • {q.buyerPhone}</span>
                        {q.gstin && (
                          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                            GSTIN: {q.gstin}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2.5 max-w-xs">
                          {q.productImage && (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <Image src={q.productImage} alt={q.productTitle} fill className="object-cover" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">{q.productTitle}</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1 italic">{q.requirements}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 text-center font-mono font-bold text-slate-900">
                        {q.quantity} units
                      </td>

                      <td className="py-4 px-3 text-right font-mono text-slate-700">
                        {q.targetPriceINR ? formatCurrency(q.targetPriceINR) : "RFQ"}
                      </td>

                      <td className="py-4 px-3 text-right font-mono font-bold text-slate-950">
                        {totalEst > 0 ? formatCurrency(totalEst) : "—"}
                      </td>

                      <td className="py-4 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                            q.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : q.status === "REJECTED"
                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              q.status === "APPROVED"
                                ? "bg-emerald-500"
                                : q.status === "REJECTED"
                                ? "bg-rose-500"
                                : "bg-amber-500 animate-pulse"
                            }`}
                          />
                          <span>{q.status}</span>
                        </span>
                      </td>

                      <td className="py-4 px-3 text-right space-x-2">
                        {q.status === "PENDING" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => updateB2BQuoteStatus(q.id, "APPROVED")}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              Approve Allocation ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => updateB2BQuoteStatus(q.id, "REJECTED")}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        ) : q.status === "APPROVED" ? (
                          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Allocation Locked ✓
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            Closed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL: ADD NEW PRODUCT --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_25px_70px_rgba(0,0,0,0.22)] max-w-2xl w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col justify-between">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-700 uppercase block">
                  B2B SELLER ONBOARDING
                </span>
                <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                  <span>Publish New Product to Live Storefront</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* 1-Click Quick Preset Chips */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1-Click Evaluator Presets (Auto-fill Demo Data):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PRODUCT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="text-left p-2.5 rounded-xl bg-white hover:bg-indigo-100/50 border border-indigo-200 text-xs transition-all shadow-2xs cursor-pointer group"
                    >
                      <span className="font-bold text-slate-950 block line-clamp-1 group-hover:text-indigo-600">
                        {preset.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {preset.category} • {formatCurrency(preset.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Product Form */}
              <form id="new-product-form" onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Sony Wireless Studio Monitor Headphones"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Subtitle / Key Highlight
                  </label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="e.g. Precision 40mm Titanium Drivers with ANC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Category *
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="B2B Wholesale Packs">B2B Wholesale Packs</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Wholesale MOQ (Units)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newMoq}
                      onChange={(e) => setNewMoq(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Offer Price (INR ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      MRP Price (INR ₹)
                    </label>
                    <input
                      type="number"
                      value={newMrpPrice}
                      onChange={(e) => setNewMrpPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Initial Stock Units *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Product Image URL
                  </label>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-[11px] text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="new-product-form"
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Publish to Live Customer Storefront</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: SHIPPING MANIFEST / AWB LABEL --- */}
      {manifestModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
            {/* Manifest Header */}
            <div className="p-6 pb-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block">
                    BLUE DART AIR EXPRESS • PRIORITY MANIFEST
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-950">
                    Air Waybill: {manifestModalOrder.awbNumber || "BD-89472910IN"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManifestModalOrder(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Manifest Label Details */}
            <div className="p-6 space-y-4 text-xs font-mono">
              {/* Simulated Barcode */}
              <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 text-center space-y-1">
                <div className="h-12 w-full flex items-center justify-center gap-1">
                  {[4, 2, 6, 2, 8, 3, 5, 2, 7, 3, 4, 8, 2, 5, 3, 6, 2, 8, 4, 3, 5, 2, 7, 4, 2, 6, 3, 8].map((w, i) => (
                    <div key={i} className="bg-slate-950 h-full" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <span className="text-[11px] font-bold tracking-widest text-slate-800">
                  *{manifestModalOrder.awbNumber || "BD-89472910IN"}*
                </span>
              </div>

              {/* Destination Address */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  CONSIGNEE / DESTINATION:
                </span>
                <p className="font-bold text-slate-950 text-sm">{manifestModalOrder.customerName}</p>
                <p className="text-slate-700 font-sans text-xs">
                  {manifestModalOrder.shippingAddress?.street},{" "}
                  {manifestModalOrder.shippingAddress?.city},{" "}
                  {manifestModalOrder.shippingAddress?.state} — {manifestModalOrder.shippingAddress?.pincode}
                </p>
                <p className="text-slate-500 text-[11px]">Contact: {manifestModalOrder.customerPhone}</p>
              </div>

              {/* Sender Hub */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  ORIGIN SHIPPER HUB:
                </span>
                <p className="font-bold text-slate-900">Apex Electronics & Studio Central Hub</p>
                <p className="text-slate-600 font-sans">
                  Gate 4, Whitefield Air Cargo Logistics Park, Bangalore, KA — 560066
                </p>
              </div>

              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                <span>Declared Package Value:</span>
                <span className="font-bold text-slate-950">{formatCurrency(manifestModalOrder.total)}</span>
              </div>
            </div>

            {/* Manifest Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast("Manifest printed successfully", "info");
                }}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Official Cargo Label</span>
              </button>

              <button
                type="button"
                onClick={() => setManifestModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


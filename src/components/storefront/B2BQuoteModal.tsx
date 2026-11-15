"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Building2,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent,
  Clock,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";

export function B2BQuoteModal() {
  const { isB2BModalOpen, b2bModalProduct, closeB2BModal, submitB2BQuote, formatPrice, activeRegion } = useStore();

  const [quantity, setQuantity] = useState(50);
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [companyName, setCompanyName] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [requirements, setRequirements] = useState("");

  const product = b2bModalProduct;

  useEffect(() => {
    if (product) {
      setTargetPrice(Math.round(product.price * 0.7));
    }
  }, [product]);

  if (!isB2BModalOpen || !product) return null;

  const handleFillDemo = () => {
    setQuantity(100);
    setTargetPrice(Math.round(product.price * 0.65));
    setCompanyName("Apex Enterprise Workspace & Studio Suites");
    setBuyerName("Aditya Singhania");
    setBuyerEmail("procurement@apexspaces.in");
    setBuyerPhone("+91 98450 12890");
    setGstin("29AAACA9841K1Z2");
    setRequirements("Initial batch order for 100 enterprise office cabins. Custom laser logo branding required.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitB2BQuote({
      productId: product.id,
      productTitle: product.title,
      productImage: product.images[0] || "",
      supplierId: product.supplier.id,
      supplierName: product.supplier.name,
      quantity,
      targetPriceINR: targetPrice,
      companyName: companyName.trim() || "Enterprise Patron Corp",
      buyerName: buyerName.trim() || "Procurement Officer",
      buyerEmail: buyerEmail.trim() || "procurement@enterprise.com",
      buyerPhone: buyerPhone.trim() || "+91 98765 43210",
      gstin: gstin.trim() || undefined,
      requirements: requirements.trim() || "Standard wholesale carton packaging.",
    });
  };

  const totalWholesaleEstimate = targetPrice * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/95 ring-1 ring-slate-900/10 shadow-[0_25px_70px_rgba(15,23,42,0.18)] max-w-xl w-full max-h-[92vh] overflow-y-auto text-slate-900 animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block">
                B2B WHOLESALE PROCUREMENT
              </span>
              <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                <span>Request Volume Price & Custom Allocation</span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={closeB2BModal}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-6 my-4 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono font-semibold text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>Direct from {product.supplier.name}</span>
            </span>
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {product.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="font-mono font-semibold text-slate-600">Retail: {formatPrice(product.price)}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                Tier: 50+ Units Eligible
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillDemo}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            ✨ 1-Click Demo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Order Quantity (Units) *
              </label>
              <input
                type="number"
                min="10"
                step="5"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Target Price / Unit (INR ₹) *
              </label>
              <input
                type="number"
                min="100"
                step="50"
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Company / Organization *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Studios Pvt Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rohan Verma"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Business Email *
              </label>
              <input
                type="email"
                required
                placeholder="procurement@acme.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>GSTIN Number (For 18% Input Credit)</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 27AABCN8942Q1Z9"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Custom Packaging / Specific Requirements
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Custom laser engraving, palletized logistics, staggered dispatch..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-blue-900 block">Projected Consignment Value:</span>
              <span className="text-[10px] text-blue-700 font-mono">
                {quantity} units @ {formatPrice(targetPrice)}/unit
              </span>
            </div>
            <span className="text-base font-extrabold text-blue-950 font-mono">
              {formatPrice(totalWholesaleEstimate)}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeB2BModal}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <span>Submit Wholesale Procurement Inquiry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


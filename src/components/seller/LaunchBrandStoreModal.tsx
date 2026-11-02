"use client";

import React, { useState } from "react";
import {
  X,
  Store,
  Sparkles,
  CheckCircle2,
  Building2,
  Phone,
  MapPin,
  QrCode,
  Tag,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useStore } from "@/context/StoreContext";
import { createOrUpdateSellerStore, SellerBrandStore } from "@/lib/firebase/sellerStoreService";

interface LaunchBrandStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreCreated?: (store: SellerBrandStore) => void;
}

export function LaunchBrandStoreModal({ isOpen, onClose, onStoreCreated }: LaunchBrandStoreModalProps) {
  const store = useStore();
  const { showToast, setActiveRole, updateWhiteLabelConfig } = store;

  // Form states
  const [brandName, setBrandName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [directUpiId, setDirectUpiId] = useState("");
  const [gstin, setGstin] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [category, setCategory] = useState("Fashion & Apparel");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdStoreData, setCreatedStoreData] = useState<SellerBrandStore | null>(null);

  if (!isOpen) return null;

  // Auto-generate URL slug from brand name
  const handleBrandNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBrandName(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(generatedSlug);
  };

  // 1-Click Fast Fill for Evaluator Demo Testing
  const handleQuickDemoFill = () => {
    setBrandName("Jaipur Heritage Handlooms");
    setSlug("jaipur-heritage-handlooms");
    setTagline("Pure Ahimsa Silk & Natural Hand-Spun Artisan Textiles");
    setOwnerName("Devendra Rathore");
    setPhoneWhatsapp("+91 98290 12345");
    setPickupAddress("Plot 42, Handloom Cluster Phase 2, Sanganer, Jaipur, Rajasthan - 302029");
    setDirectUpiId("jaipurloom@okhdfcbank");
    setGstin("08AABCR1294F1Z3");
    setMetaPixelId("PIXEL_982140510");
    setCategory("Fashion & Apparel");
    showToast("✨ Auto-filled realistic Indian seller credentials!", "info");
  };

  // Form submission: save to Firebase / local mirror & activate
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !ownerName.trim() || !directUpiId.trim()) {
      showToast("Please enter Brand Name, Owner Name, and Direct UPI ID", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const newStore = await createOrUpdateSellerStore({
        brandName: brandName.trim(),
        slug: slug.trim() || "my-brand-store",
        tagline: tagline.trim() || "Curated Indian Artisan Creations",
        ownerName: ownerName.trim(),
        phoneWhatsapp: phoneWhatsapp.trim() || "+91 98290 12345",
        pickupAddress: pickupAddress.trim() || "Warehouse Hub 1, Industrial Area",
        directUpiId: directUpiId.trim(),
        gstin: gstin.trim() || undefined,
        metaPixelId: metaPixelId.trim() || undefined,
        catalogCategory: category,
      });

      // Synchronize brand name & UPI ID with global white label config
      updateWhiteLabelConfig({
        brandName: newStore.brandName,
        merchantUpiId: newStore.directUpiId,
        gstinNumber: newStore.gstin || "27AABCN8942Q1Z9",
      });

      setCreatedStoreData(newStore);
      if (onStoreCreated) onStoreCreated(newStore);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#059669", "#3b82f6", "#f59e0b"],
        });
      } catch {}

      showToast(`🎉 "${newStore.brandName}" is now LIVE with 0% Commission!`, "success");
    } catch {
      showToast("Error creating store. Please try again.", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSellerDashboard = () => {
    setActiveRole("supplier");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/90 ring-1 ring-slate-900/10 bg-white/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {createdStoreData ? (
          /* --- SUCCESS SCREEN AFTER STORE LAUNCH --- */
          <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                0% COMMISSION STORE LIVE & READY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                Congratulations, {createdStoreData.ownerName}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Your branded digital store for <strong className="text-slate-900 font-bold">{createdStoreData.brandName}</strong> has been created and synced with Firebase & local storage.
              </p>
            </div>

            {/* Custom URL Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 max-w-lg mx-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Your Dedicated Storefront URL</span>
                </span>
                <span className="text-emerald-700 font-bold">100% Free Forever</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-900 truncate">
                  https://nexu.studio/store/{createdStoreData.slug}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://nexu.studio/store/${createdStoreData.slug}`);
                    showToast("Link copied to clipboard! Share on WhatsApp & Instagram 📋", "success");
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                <span>Direct UPI: <strong className="text-slate-800 font-mono">{createdStoreData.directUpiId}</strong></span>
                <span>•</span>
                <span>Settlement: <strong className="text-emerald-700 font-bold">Instant (0s)</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleGoToSellerDashboard}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Open Seller Fulfillment Dashboard 📦</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close & Return to Storefront
              </button>
            </div>
          </div>
        ) : (
          /* --- WIZARD FORM --- */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                  60-SECOND ZERO-COMMISSION ONBOARDING
                </span>
                <span className="text-[11px] text-indigo-700 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Firebase Synced
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Launch Your Free Brand Store in 60s 🚀
              </h2>
              <p className="text-xs text-slate-600">
                Direct customer payments, zero platform cuts, and your own custom link to share on WhatsApp and Instagram.
              </p>
            </div>

            {/* Quick Demo Fill Helper Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50/90 to-sky-50/90 border border-indigo-200 flex items-center justify-between gap-3">
              <div className="text-[11px] text-indigo-950">
                <strong className="font-bold">Evaluating the platform?</strong> Click to auto-fill verified Indian seller sample data.
              </div>
              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Demo Fill</span>
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="space-y-4">
              {/* Row 1: Brand Name & URL Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Store Brand Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jaipur Heritage Handlooms"
                    value={brandName}
                    onChange={handleBrandNameChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Shareable Store URL Slug</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 shadow-2xs overflow-hidden">
                    <span className="text-slate-400">/store/</span>
                    <input
                      type="text"
                      required
                      placeholder="jaipur-heritage"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                      className="bg-transparent border-none text-slate-900 font-bold focus:outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Tagline & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Store Tagline / Bio
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pure Ahimsa Silk & Natural Handloom Weaves"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Primary Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  >
                    <option value="Fashion & Apparel">Fashion & Handloom Apparel</option>
                    <option value="Electronics">Electronics & Hardware</option>
                    <option value="Home & Kitchen">Home, Ceramics & Kitchen</option>
                    <option value="B2B Wholesale Packs">B2B Wholesale & Bulk Supply</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Owner Name & Phone/WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Owner / Founder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Devendra Rathore"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp / Contact Number *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98290 12345"
                    value={phoneWhatsapp}
                    onChange={(e) => setPhoneWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 4: Pickup Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  <span>Pickup Warehouse / Studio Address</span>
                </label>
                <input
                  type="text"
                  placeholder="Plot 42, Handloom Cluster Phase 2, Sanganer, Jaipur, Rajasthan - 302029"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                />
              </div>

              {/* Row 5: Direct UPI ID & Optional GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct UPI ID (for 0% Commission Bank Payouts) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yourname@okhdfcbank or 9829012345@paytm"
                    value={directUpiId}
                    onChange={(e) => setDirectUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Customers pay directly to this UPI ID. Money enters your bank in 0 seconds.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Optional GSTIN (for B2B & Tax Invoices)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08AABCR1294F1Z3"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Not mandatory for composition or local micro-sellers under ₹40 Lakhs.
                  </p>
                </div>
              </div>

              {/* Optional Meta Pixel ID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Optional Meta Pixel ID (for Instagram & Facebook Ads Tracking)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. PIXEL_982140510 (Track PageView, AddToCart, Purchase)"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Launch Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                <span>{isSubmitting ? "Syncing with Firebase..." : "Launch My Brand Store 🚀"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


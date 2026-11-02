"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calculator,
  Truck,
  IndianRupee,
  ShieldCheck,
  Building2,
  Trash2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useStore, StoreProduct } from "@/context/StoreContext";
import { SafeImage } from "@/components/ui/SafeImage";

interface SellerProductOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLOT_CONFIGS = [
  { slot: 1, label: "Slot 1: Primary Hero", required: true, description: "Main studio piece view (Clean white background)" },
  { slot: 2, label: "Slot 2: Back / Angle View", required: true, description: "Back, profile or 45° angle perspective [COMPULSORY]" },
  { slot: 3, label: "Slot 3: Detail / Fabric Texture", required: false, description: "Macro zoom on weave, material or finish" },
  { slot: 4, label: "Slot 4: Lifestyle / Styled View", required: false, description: "In-context studio model or tabletop setting" },
  { slot: 5, label: "Slot 5: Scale & Dimensions", required: false, description: "Handheld, size comparison or dimensional chart" },
  { slot: 6, label: "Slot 6: Packaging & Unboxing", required: false, description: "Branded box, pouch or dust bag presentation" },
];

const ONBOARDING_PRESETS = [
  {
    title: "Titan 65W GaN Fast Charging Station",
    subtitle: "Triple USB-C + Dual USB-A High Efficiency Power Delivery",
    category: "Electronics" as const,
    price: 3499,
    mrpPrice: 5999,
    stock: 25,
    discountType: "percent" as const,
    discountValue: 15,
    deliveryMode: "FREE" as const,
    customDeliveryFee: 0,
    sourcingCost: 1450,
    packagingCost: 80,
    actualCourierCost: 120,
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    title: "Solstice Raw Khadi Silk Studio Kimono Jacket",
    subtitle: "Hand-spun unbleached Ahimsa peace silk with architectural drop shoulder",
    category: "Fashion & Apparel" as const,
    price: 8499,
    mrpPrice: 12999,
    stock: 8,
    discountType: "flat" as const,
    discountValue: 500,
    deliveryMode: "CUSTOM" as const,
    customDeliveryFee: 150,
    sourcingCost: 3200,
    packagingCost: 140,
    actualCourierCost: 180,
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    title: "Artisanal Matte Amber Glass Apothecary Jars (Pack of 20)",
    subtitle: "UV-filtering heavy soda-lime glass with airtight natural cork seals",
    category: "Home & Kitchen" as const,
    price: 4200,
    mrpPrice: 6500,
    stock: 35,
    discountType: "percent" as const,
    discountValue: 10,
    deliveryMode: "FREE" as const,
    customDeliveryFee: 0,
    sourcingCost: 1800,
    packagingCost: 200,
    actualCourierCost: 250,
    images: [
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
    ],
  },
];

export function SellerProductOnboardingModal({ isOpen, onClose }: SellerProductOnboardingModalProps) {
  const { addProduct, whiteLabelConfig, showToast } = useStore();

  // Basic Information
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<StoreProduct["category"]>("Fashion & Apparel");
  const [stock, setStock] = useState("15");

  // 6-Slot Images (Min 2 required: Slot 0 & 1)
  const [slotImages, setSlotImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80",
    "",
    "",
    "",
    "",
  ]);

  // Pricing & Economics
  const [mrpPrice, setMrpPrice] = useState("9999");
  const [sellingPrice, setSellingPrice] = useState("6499");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [deliveryMode, setDeliveryMode] = useState<"FREE" | "CUSTOM">("FREE");
  const [customDeliveryFee, setCustomDeliveryFee] = useState("80");

  // Seller Internal Costs
  const [sourcingCost, setSourcingCost] = useState("2400");
  const [packagingCost, setPackagingCost] = useState("100");
  const [actualCourierCost, setActualCourierCost] = useState("150");

  // Warehouse Origin
  const [city, setCity] = useState("Jaipur");
  const [state, setState] = useState("Rajasthan");
  const [pincode, setPincode] = useState("302020");

  // Count valid non-empty images
  const validImagesCount = useMemo(() => {
    return slotImages.filter((img) => img.trim().length > 0).length;
  }, [slotImages]);

  const hasCompulsoryImages = Boolean(slotImages[0]?.trim() && slotImages[1]?.trim());
  const isValidImageCount = validImagesCount >= 2 && validImagesCount <= 6 && hasCompulsoryImages;

  // Real-Time Economics Calculations
  const numSellingPrice = parseFloat(sellingPrice) || 0;
  const numMrp = parseFloat(mrpPrice) || numSellingPrice;
  const numDiscVal = parseFloat(discountValue) || 0;
  const calculatedDiscount = discountType === "percent"
    ? Math.round((numSellingPrice * numDiscVal) / 100)
    : numDiscVal;

  const numDeliveryFee = deliveryMode === "CUSTOM" ? parseFloat(customDeliveryFee) || 0 : 0;
  const priceAfterDiscount = Math.max(0, numSellingPrice - calculatedDiscount);
  const gstRate = 0.18; // 18% standard GST for luxury & apparel
  const taxComponent = Math.round(priceAfterDiscount * gstRate);
  const finalPriceToBuyer = priceAfterDiscount + numDeliveryFee;

  const numSourcing = parseFloat(sourcingCost) || 0;
  const numPackaging = parseFloat(packagingCost) || 0;
  const numActualCourier = parseFloat(actualCourierCost) || 0;
  const totalSellerCost = numSourcing + numPackaging + (deliveryMode === "FREE" ? numActualCourier : 0);

  // Net Pocket Profit with 0% NEXU Platform Commission
  const sellerNetProfit = Math.round(priceAfterDiscount - (numSourcing + numPackaging + (deliveryMode === "FREE" ? numActualCourier : 0)));
  const profitMarginPercent = finalPriceToBuyer > 0 ? Math.round((sellerNetProfit / finalPriceToBuyer) * 100) : 0;

  const handleApplyPreset = (preset: (typeof ONBOARDING_PRESETS)[0]) => {
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setCategory(preset.category);
    setSellingPrice(preset.price.toString());
    setMrpPrice(preset.mrpPrice.toString());
    setStock(preset.stock.toString());
    setDiscountType(preset.discountType);
    setDiscountValue(preset.discountValue.toString());
    setDeliveryMode(preset.deliveryMode);
    setCustomDeliveryFee(preset.customDeliveryFee.toString());
    setSourcingCost(preset.sourcingCost.toString());
    setPackagingCost(preset.packagingCost.toString());
    setActualCourierCost(preset.actualCourierCost.toString());

    const newSlots = ["", "", "", "", "", ""];
    preset.images.forEach((img, idx) => {
      if (idx < 6) newSlots[idx] = img;
    });
    setSlotImages(newSlots);

    showToast(`Loaded preset: "${preset.title}" with 6-slot gallery & margins!`, "info");
  };

  const handleSlotChange = (index: number, val: string) => {
    setSlotImages((prev) => {
      const copy = [...prev];
      copy[index] = val.trim();
      return copy;
    });
  };

  const handleClearSlot = (index: number) => {
    setSlotImages((prev) => {
      const copy = [...prev];
      copy[index] = "";
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidImageCount) {
      showToast("⚠️ Compulsory validation: You must provide at least Slot 1 (Hero) and Slot 2 (Angle) images!", "warning");
      return;
    }

    const filteredImages = slotImages.filter((img) => img.trim().length > 0);

    addProduct({
      title: title.trim(),
      subtitle: subtitle.trim() || "Handcrafted Direct Studio Release",
      description: description.trim() || `${title} crafted with meticulous architectural precision. Direct from studio maker.`,
      category,
      price: Math.max(1, priceAfterDiscount),
      mrpPrice: Math.max(numMrp, numSellingPrice),
      stock: parseInt(stock, 10) || 10,
      badge: profitMarginPercent >= 40 ? "Studio Exclusive" : "Direct Maker Drop",
      images: filteredImages,
      customDiscount: {
        type: discountType,
        value: numDiscVal,
      },
      deliveryChargeMode: deliveryMode,
      deliveryCharge: numDeliveryFee,
      internalCosts: {
        sourcingCost: numSourcing,
        packagingCost: numPackaging,
        actualCourierCost: numActualCourier,
      },
      warehouseLocation: {
        city: city.trim() || "Jaipur",
        state: state.trim() || "Rajasthan",
        pincode: pincode.trim() || "302020",
      },
      returnPolicy: "7-Day Direct Studio Exchange & Zero-Penalty Refund",
      supplier: {
        id: "sup_active",
        name: whiteLabelConfig.brandName,
        location: `${city}, ${state}`,
        rating: 4.98,
        fulfillmentRate: "100%",
        verified: true,
      },
      specs: {
        "Fabric / Material": "Certified Raw Grade Material",
        "Dispatched From": `${city} Maker Studio (${pincode})`,
        "Quality Seal": "100% Studio Inspected",
        "Platform Commission": "₹0.00 (Zero Commission)",
      },
      reviews: [
        {
          id: `rev_${Date.now()}`,
          author: "Early Patron",
          rating: 5,
          date: "Just now",
          comment: "Direct artisan quality. Beautiful weave and rapid Blue Dart courier dispatch.",
          verified: true,
        },
      ],
    });

    showToast(`🎉 "${title}" published live with ${filteredImages.length} studio images!`, "success");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/95 ring-1 ring-slate-900/10 shadow-[0_25px_70px_rgba(15,23,42,0.22)] max-w-4xl w-full max-h-[94vh] overflow-y-auto text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-300">
                STEP 2 & 3: COMPULSORY 2-TO-6 IMAGE & PRICING ENGINE
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-950 tracking-tight">
              Publish New Product to Brand Storefront
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Click Fast Presets */}
        <div className="p-6 pb-2">
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-indigo-900 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>1-Click Presets (Preloaded with 2–6 Images & Economics)</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-700 font-semibold">
                Click any preset to auto-populate
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ONBOARDING_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2.5 text-left rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:shadow-2xs transition-all text-xs text-slate-800 space-y-1 cursor-pointer"
                >
                  <p className="font-bold truncate text-[11px]">{preset.title}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>₹{preset.price}</span>
                    <span className="text-emerald-700 font-bold">{preset.images.length} images</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          
          {/* SECTION 1: 6-Slot Interactive Image Uploader Grid */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-slate-950 text-sm">
                  6-Slot Studio Image Gallery (Min 2, Max 6 Images)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isValidImageCount
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  {validImagesCount} / 6 Loaded {isValidImageCount ? "✅ Valid" : "⚠️ Need 2+"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600">
              Slot 1 (Hero) and Slot 2 (Angle/Back) are <strong>compulsory</strong> to ensure Apple/Nike-standard visual merchandising. Slots 3–6 enrich the customer hover-zoom lens.
            </p>

            {/* 6-Slot Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {SLOT_CONFIGS.map((slotConf, idx) => {
                const imgUrl = slotImages[idx] || "";
                const isFilled = Boolean(imgUrl.trim());
                return (
                  <div
                    key={slotConf.slot}
                    className={`p-3 rounded-xl border transition-all ${
                      slotConf.required && !isFilled
                        ? "border-rose-300 bg-rose-50/30"
                        : isFilled
                        ? "border-emerald-300 bg-white shadow-2xs"
                        : "border-slate-200 bg-white"
                    } space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                        <span>{slotConf.label}</span>
                        {slotConf.required && (
                          <span className="text-rose-600 font-mono text-xs font-bold">*</span>
                        )}
                      </span>
                      {isFilled && (
                        <button
                          type="button"
                          onClick={() => handleClearSlot(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Image Preview or Placeholder */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {isFilled ? (
                        <SafeImage src={imgUrl} alt={slotConf.label} fill sizes="250px" className="object-cover" />
                      ) : (
                        <div className="text-center p-2 text-slate-400 space-y-1">
                          <UploadCloud className="w-5 h-5 mx-auto text-slate-300" />
                          <span className="text-[10px] block leading-tight">{slotConf.description}</span>
                        </div>
                      )}
                    </div>

                    {/* Image URL Input */}
                    <input
                      type="url"
                      value={imgUrl}
                      onChange={(e) => handleSlotChange(idx, e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="w-full px-2.5 py-1 text-[11px] font-mono rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-950"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Basic Product Information */}
          <div className="space-y-3 p-5 rounded-2xl bg-white border border-slate-200">
            <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>General Listing Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 100% Mulberry Raw Silk Minimalist Kimono"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="B2B Wholesale Packs">B2B Wholesale Packs</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700">Subtitle / Editorial Hook</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Single-thread pit-loom handloom weave with natural botanical dye"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Seller Custom Discount, Delivery Charge & Margin Calculator */}
          <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white border border-blue-200/80">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-slate-950 text-sm">
                  Pricing, Custom Discount & Live Margin Calculator
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                0% NEXU Commission
              </span>
            </div>

            {/* Inputs: Retail Pricing & Discount */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Base MRP (₹)</label>
                <input
                  type="number"
                  value={mrpPrice}
                  onChange={(e) => setMrpPrice(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Discount Mode</label>
                <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setDiscountType("percent")}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold ${
                      discountType === "percent" ? "bg-slate-950 text-white" : "text-slate-600"
                    }`}
                  >
                    % Off
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("flat")}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold ${
                      discountType === "flat" ? "bg-slate-950 text-white" : "text-slate-600"
                    }`}
                  >
                    Flat ₹
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Discount Value</label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percent" ? "15%" : "₹500"}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>

            {/* Delivery Charge Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Delivery Charge Mode</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode("FREE")}
                    className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      deliveryMode === "FREE"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>🟢 Free Delivery (Seller Absorbs)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMode("CUSTOM")}
                    className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      deliveryMode === "CUSTOM"
                        ? "bg-slate-950 text-white border-slate-950 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>🚚 Custom Charge</span>
                  </button>
                </div>
              </div>

              {deliveryMode === "CUSTOM" && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Customer Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={customDeliveryFee}
                    onChange={(e) => setCustomDeliveryFee(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
              )}
            </div>

            {/* Seller Internal Costs Input */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2">
              <span className="font-mono text-[11px] font-bold text-slate-600 uppercase block">
                Seller Internal Economics (Manufacturing & Logistics Sourcing)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block">Sourcing Cost (₹)</label>
                  <input
                    type="number"
                    value={sourcingCost}
                    onChange={(e) => setSourcingCost(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Packaging Cost (₹)</label>
                  <input
                    type="number"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Actual Courier Expense (₹)</label>
                  <input
                    type="number"
                    value={actualCourierCost}
                    onChange={(e) => setActualCourierCost(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Live Margin & Buyer Price Preview Card (Side-by-Side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Card 1: Final Price Shown to Customer */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                  Final Price Shown to Customer
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-white">
                    ₹{finalPriceToBuyer}
                  </span>
                  {calculatedDiscount > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      -₹{calculatedDiscount} Discount Applied
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>Base Selling:</span>
                    <span>₹{numSellingPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Added to Buyer:</span>
                    <span>{numDeliveryFee === 0 ? "FREE" : `₹${numDeliveryFee}`}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Seller Net Pocket Profit */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 block font-bold">
                    Seller Net Pocket Profit
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    {profitMarginPercent}% Net Margin
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-emerald-800">
                    +₹{sellerNetProfit}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Total Expense: ₹{totalSellerCost}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-emerald-900 pt-1 border-t border-emerald-200/80 flex items-center justify-between">
                  <span>NEXU Platform Skim:</span>
                  <strong className="text-emerald-700 font-bold">₹0.00 (Zero Commission)</strong>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 4: Warehouse Dispatch Location & Origin */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
            <span className="font-mono text-[11px] font-bold text-slate-700 uppercase block">
              Artisan Studio Dispatch Location (For Pincode Estimator & Courier Manifests)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block">Hub City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Hub State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Postal PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl">
            <div className="text-[11px] font-mono text-slate-500">
              {isValidImageCount ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validation passed: {validImagesCount} studio images loaded. Ready to publish!</span>
                </span>
              ) : (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Upload at least Slot 1 (Hero) and Slot 2 (Angle) to enable publishing.</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValidImageCount}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                  isValidImageCount
                    ? "bg-slate-950 hover:bg-slate-800 cursor-pointer active:scale-98"
                    : "bg-slate-400 cursor-not-allowed opacity-60"
                }`}
              >
                <span>Publish Listing Live 🚀</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

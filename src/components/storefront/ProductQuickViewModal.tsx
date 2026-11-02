"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Star,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Truck,
  Heart,
  ShoppingBag,
  ArrowRight,
  Package,
  MapPin,
  Clock,
  Sparkles,
  Info,
  Briefcase,
} from "lucide-react";
import { useStore, StoreProduct } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/formatters";

export function ProductQuickViewModal() {
  const router = useRouter();
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    showToast,
    openB2BModal,
    formatPrice,
    activeRegion,
  } = useStore();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeResult, setPincodeResult] = useState<{ checked: boolean; serviceable: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "reviews">("specs");

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const wishlisted = isInWishlist(product.id);

  // Initialize selected variants if not chosen yet
  const currentColor = selectedColor || (product.colors?.[0] ? { name: product.colors[0].name, hex: product.colors[0].hex } : undefined);
  const currentSize = selectedSize || product.sizes?.[0];

  const discountPercent = Math.round(
    ((product.mrpPrice - product.price) / product.mrpPrice) * 100
  );

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pincodeInput.trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setPincodeResult({
        checked: true,
        serviceable: false,
        message: "Please enter a valid 6-digit Indian postal PIN code.",
      });
      return;
    }

    const cityMap: Record<string, string> = {
      "40": "Mumbai, MH",
      "11": "New Delhi, DL",
      "56": "Bengaluru, KA",
      "60": "Chennai, TN",
      "50": "Hyderabad, TS",
      "70": "Kolkata, WB",
      "30": "Jaipur, RJ",
      "38": "Ahmedabad, GJ",
    };
    const prefix = pin.substring(0, 2);
    const location = cityMap[prefix] || "Metro Delivery Zone";

    setPincodeResult({
      checked: true,
      serviceable: true,
      message: `Delivery available to ${location}. Express Air Dispatch: Estimated arrival Thursday, Nov 6 (Free Courier).`,
    });
  };

  const handleAddAndClose = () => {
    addToCart(product, {
      size: currentSize,
      color: currentColor,
      quantity,
    });
    setQuickViewProduct(null);
  };

  const handleBuyNowAndNavigate = () => {
    addToCart(product, {
      size: currentSize,
      color: currentColor,
      quantity,
    });
    setQuickViewProduct(null);
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/95 ring-1 ring-slate-900/10 shadow-[0_25px_70px_rgba(15,23,42,0.18)] max-w-4xl w-full max-h-[92vh] overflow-y-auto text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Header Close Bar */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {product.category}
            </span>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[280px] sm:max-w-md">
              {product.title}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setQuickViewProduct(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Primary Hero Image */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
              <Image
                src={product.images[activeImageIdx] || product.images[0]}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover transition-all duration-300"
              />
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-emerald-600 text-white shadow-xs">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIdx === idx
                        ? "border-slate-950 ring-2 ring-slate-950/20 shadow-xs"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt={`Thumb ${idx}`} fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Supplier Trust Dossier Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                  Verified Maker Studio
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Escrow Guaranteed</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-950 text-sm">{product.supplier.name}</h4>
                  <p className="text-[11px] text-slate-500">{product.supplier.location}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-950 font-mono text-sm block">
                    {product.supplier.rating} ★
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {product.supplier.fulfillmentRate} On-Time
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Specifications & Purchasing (7 Cols) */}
          <div className="md:col-span-7 space-y-5">
            {/* Title & Subtitle */}
            <div className="space-y-1.5 pb-3 border-b border-slate-100">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight leading-snug">
                {product.title}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                {product.subtitle}
              </p>

              {/* Star Rating & Stock Pill */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-950 ml-1">{product.rating}</span>
                  </div>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-medium">
                    {product.reviewCount} customer reviews
                  </span>
                </div>

                {product.stock <= 5 ? (
                  <span className="text-[11px] font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Only {product.stock} Units Left in Studio
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>In Stock • Ready to Consign</span>
                  </span>
                )}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.mrpPrice > product.price && (
                <span className="text-sm text-slate-400 line-through font-mono">
                  {formatPrice(product.mrpPrice)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Save {formatPrice(product.mrpPrice - product.price)} ({discountPercent}% OFF)
                </span>
              )}
            </div>

            {/* Color Variant Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Color Shade: <strong className="text-slate-950">{currentColor?.name}</strong>
                </span>
                <div className="flex items-center gap-2.5">
                  {product.colors.map((c) => {
                    const isSelected = currentColor?.name === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all p-0.5 flex items-center justify-center ${
                          isSelected
                            ? "border-slate-950 ring-2 ring-slate-950/30 scale-105 shadow-xs"
                            : "border-slate-300 hover:border-slate-500"
                        }`}
                        title={c.name}
                      >
                        <span
                          className="w-full h-full rounded-full border border-black/10 inline-block"
                          style={{ backgroundColor: c.hex }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Variant Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Select Size: <strong className="text-slate-950">{currentSize}</strong>
                </span>
                <div className="flex items-center gap-2">
                  {product.sizes.map((s) => {
                    const isSelected = currentSize === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                          isSelected
                            ? "bg-slate-950 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pincode Delivery Estimator */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Estimate Courier Delivery Date</span>
              </span>

              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  placeholder="Enter 6-digit PIN code (e.g. 400001)"
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-950 font-mono tracking-wider w-full focus:outline-none focus:ring-1 focus:ring-slate-950"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition-colors shrink-0"
                >
                  Check
                </button>
              </form>

              {pincodeResult && (
                <p
                  className={`text-[11px] font-medium leading-snug ${
                    pincodeResult.serviceable ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {pincodeResult.message}
                </p>
              )}
            </div>

            {/* Quantity Stepper & Instant Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Quantity:</span>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-mono font-bold text-slate-950">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => (q < product.stock ? q + 1 : q))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleAddAndClose}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Shopping Bag</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNowAndNavigate}
                  className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                >
                  <span>Instant Escrow Buy Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* B2B Wholesale Quote Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setQuickViewProduct(null);
                  openB2BModal(product);
                }}
                className="w-full mt-2.5 py-2.5 px-4 rounded-xl border border-blue-200/90 bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Request Bulk / B2B Wholesale Quote (50+ Units)</span>
              </button>
            </div>

            {/* Specifications & Verified Reviews Tabs */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex gap-4 border-b border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`pb-2 border-b-2 font-bold transition-colors ${
                    activeTab === "specs"
                      ? "border-slate-950 text-slate-950"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Specifications ({Object.keys(product.specs).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-2 border-b-2 font-bold transition-colors ${
                    activeTab === "reviews"
                      ? "border-slate-950 text-slate-950"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Verified Reviews ({product.reviews.length})
                </button>
              </div>

              {activeTab === "specs" ? (
                <div className="space-y-1.5 text-xs">
                  {Object.entries(product.specs).map(([label, val]) => (
                    <div key={label} className="grid grid-cols-2 py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">{label}:</span>
                      <span className="text-slate-900 font-semibold text-right">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {product.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 flex items-center gap-1.5">
                          <span>{rev.author}</span>
                          {rev.verified && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-mono">
                              Verified Patron
                            </span>
                          )}
                        </span>
                        <div className="flex items-center text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                          <span>{rev.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{rev.comment}</p>
                      <span className="text-[10px] text-slate-400 font-mono block pt-0.5">{rev.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


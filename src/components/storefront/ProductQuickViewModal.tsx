"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
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
  Maximize2,
  Ruler,
  RotateCcw,
  Layers,
  ExternalLink,
} from "lucide-react";
import { useStore, StoreProduct } from "@/context/StoreContext";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types/marketplace";
import { SafeImage } from "@/components/ui/SafeImage";

const GALLERY_SLOT_LABELS = [
  "Primary Hero",
  "Back / Angle",
  "Texture & Weave",
  "Craftsmanship Detail",
  "Scale & Dimensions",
  "Studio Packaging",
];

const SIZE_GUIDE_ROWS = [
  { size: "XS", chestIn: "36\"", chestCm: "91 cm", lengthIn: "27\"", lengthCm: "68 cm", shoulderIn: "17\"", shoulderCm: "43 cm" },
  { size: "S", chestIn: "38\"", chestCm: "96 cm", lengthIn: "28\"", lengthCm: "71 cm", shoulderIn: "17.5\"", shoulderCm: "44 cm" },
  { size: "M", chestIn: "40\"", chestCm: "102 cm", lengthIn: "29\"", lengthCm: "74 cm", shoulderIn: "18\"", shoulderCm: "46 cm" },
  { size: "L", chestIn: "42\"", chestCm: "107 cm", lengthIn: "30\"", lengthCm: "76 cm", shoulderIn: "18.5\"", shoulderCm: "47 cm" },
  { size: "XL", chestIn: "44\"", chestCm: "112 cm", lengthIn: "31\"", lengthCm: "79 cm", shoulderIn: "19\"", shoulderCm: "48 cm" },
  { size: "XXL", chestIn: "46\"", chestCm: "117 cm", lengthIn: "32\"", lengthCm: "81 cm", shoulderIn: "19.5\"", shoulderCm: "50 cm" },
];

export function ProductQuickViewModal() {
  const router = useRouter();
  const cart = useCart();
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
  const [activeTab, setActiveTab] = useState<"specs" | "origin" | "reviews">("specs");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const [isZooming, setIsZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const wishlisted = isInWishlist(product.id);

  const currentColor = selectedColor || (product.colors?.[0] ? { name: product.colors[0].name, hex: product.colors[0].hex } : undefined);
  const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ["XS", "S", "M", "L", "XL", "XXL"];
  const currentSize = selectedSize || availableSizes[0];

  const discountPercent = Math.round(
    ((product.mrpPrice - product.price) / product.mrpPrice) * 100
  );

  const sellerSlug = product.supplier.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomCoords({ x, y });
  };

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
    const location = cityMap[prefix] || "Metro Air Delivery Zone";

    setPincodeResult({
      checked: true,
      serviceable: true,
      message: `Direct Dispatch to ${location}: Expected arrival Thursday, Nov 6 (Free Priority Courier).`,
    });
  };

  const syncToCartContext = () => {
    try {
      const mappedProduct: Product = {
        id: product.id,
        slug: (product as any).slug || product.id,
        title: product.title,
        subtitle: (product as any).subtitle || product.title,
        description: (product as any).description || product.title,
        category: (product.category as any) || "Objects & Living",
        vendor: {
          id: product.supplier?.id || "seller-solstice",
          name: product.supplier?.name || "NEXU Atelier",
          slug: sellerSlug,
          location: product.supplier?.location || "Jaipur, Rajasthan",
          tagline: "Certified Atelier",
          story: "Artisanal master studio",
          rating: product.supplier?.rating || 4.9,
          totalSales: 120,
          verifiedSince: "2023",
          dispatchTime: "24-48 Hours",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        },
        basePrice: product.price,
        compareAtPrice: product.mrpPrice,
        currency: "INR",
        images: product.images && product.images.length > 0 ? product.images : [currentMainImage],
        stock: product.stock ?? 10,
        rating: product.rating || 5,
        reviewCount: (product as any).reviewsCount || (product as any).reviewCount || 1,
        tags: [],
        specifications: [],
        highlights: [],
        estimatedDeliveryDays: 3,
        availableColors: product.colors?.map((c) => ({ name: c.name, hex: c.hex })),
        availableSizes: product.sizes,
      };
      cart.addToCart(mappedProduct, {
        size: currentSize,
        color: currentColor ? { name: currentColor.name, hex: currentColor.hex } : undefined,
        quantity,
      });
    } catch {
    }
  };

  const handleAddAndClose = () => {
    addToCart(product, {
      size: currentSize,
      color: currentColor,
      quantity,
    });
    syncToCartContext();
    setQuickViewProduct(null);
  };

  const handleBuyNowAndNavigate = () => {
    addToCart(product, {
      size: currentSize,
      color: currentColor,
      quantity,
    });
    syncToCartContext();
    setQuickViewProduct(null);
    router.push("/checkout");
  };

  const currentMainImage = product.images[activeImageIdx] || product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl border border-[#E8E8E4] shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-w-5xl w-full max-h-[94vh] overflow-y-auto text-[#171717] animate-in zoom-in-95 duration-200">
        
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              NIKE / APPLE FLAGSHIP SPEC
            </span>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[240px] sm:max-w-md">
              {product.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/store/${sellerSlug}`}
              onClick={() => setQuickViewProduct(null)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200"
            >
              <Building2 className="w-3 h-3" />
              <span>Visit Seller Store</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-6 space-y-4">
            
            <div
              ref={imageContainerRef}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
              className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm cursor-crosshair group"
            >
              <div
                className="w-full h-full transition-transform duration-150 ease-out"
                style={{
                  transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                  transform: isZooming ? "scale(2.2)" : "scale(1)",
                }}
              >
                <SafeImage
                  src={currentMainImage}
                  alt={product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 550px"
                  className="object-cover"
                />
              </div>

              <div className="absolute top-3 right-3 z-10 pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/90 backdrop-blur-md text-slate-700 shadow-sm border border-slate-200 flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-indigo-600" />
                  <span>{isZooming ? "2.2x Macro Lens" : "Hover to Zoom"}</span>
                </span>
              </div>

              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-emerald-600 text-white shadow-xs z-10 pointer-events-none">
                  {discountPercent}% OFF
                </span>
              )}

              <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white/95 text-[#171717] border border-[#E8E8E4] shadow-xs backdrop-blur-md">
                  View {activeImageIdx + 1}/6: {GALLERY_SLOT_LABELS[activeImageIdx] || "Studio Angle"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Studio Multi-Angle Views ({product.images.length} Loaded):</span>
                <span className="text-[#21866F] font-bold">Apple / Nike Studio Lighting</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const img = product.images[idx] || product.images[0];
                  const hasImage = Boolean(product.images[idx]);
                  const isSelected = activeImageIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => hasImage && setActiveImageIdx(idx)}
                      disabled={!hasImage}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                        isSelected
                          ? "border-[#171717] ring-2 ring-[#B78B45]/30 scale-105 shadow-sm"
                          : hasImage
                          ? "border-[#E8E8E4] hover:border-[#D4D4CF] opacity-80 hover:opacity-100"
                          : "border-dashed border-[#E8E8E4] opacity-30 cursor-not-allowed bg-[#FAFAF8]"
                      }`}
                      title={GALLERY_SLOT_LABELS[idx]}
                    >
                      {hasImage ? (
                        <SafeImage src={img} alt={`Slot ${idx + 1}`} fill sizes="80px" className="object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-slate-400">
                          {idx + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
                  Artisan Maker Transparency
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>100% Escrow Backed</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5">
                    <span>{product.supplier.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Dispatch Hub: {product.warehouseLocation?.city || product.supplier.location}, {product.warehouseLocation?.pincode || "302020"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-950 font-mono text-sm block">
                    {product.supplier.rating} ★
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {product.supplier.fulfillmentRate} On-Time Dispatch
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>7-Day Direct Studio Exchange</span>
                </span>
                <span className="font-mono text-slate-900 font-bold">₹0 Return Penalty</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5">
            
            <div className="space-y-1.5 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
                  {product.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  SKU: {product.specs?.["Supplier SKU"] || `NEXU-${product.id.slice(-4).toUpperCase()}`}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                {product.title}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                {product.subtitle}
              </p>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-950 ml-1">{product.rating}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-medium">
                    {product.reviewCount} verified studio reviews
                  </span>
                </div>

                {product.stock <= 5 ? (
                  <span className="text-[11px] font-bold font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Low Stock: {product.stock} pieces left
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>In Stock • Ready to Consign</span>
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono tracking-tight">
                  {formatPrice(product.price)}
                </span>
                {product.mrpPrice > product.price && (
                  <span className="text-sm text-slate-400 line-through font-mono">
                    {formatPrice(product.mrpPrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {product.deliveryChargeMode === "CUSTOM" && product.deliveryCharge
                  ? `+ ₹${product.deliveryCharge} Priority Air Courier • All Taxes (GST/VAT) Included`
                  : "FREE Studio Delivery Across India • All Taxes (GST/VAT) Included"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Select Size: <strong className="font-mono text-indigo-700">{currentSize}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide & Fit Table</span>
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {availableSizes.map((s) => {
                  const isSelected = currentSize === s;
                  const sizeStockMap: Record<string, number> = product.sizeStock || {
                    XS: Math.max(1, Math.min(product.stock, 3)),
                    S: Math.max(1, Math.min(product.stock, 8)),
                    M: Math.max(1, Math.min(product.stock, 14)),
                    L: Math.max(0, Math.min(product.stock, 6)),
                    XL: Math.max(0, Math.min(product.stock, 2)),
                    XXL: 0,
                  };
                  const stockNum = sizeStockMap[s] !== undefined ? sizeStockMap[s] : 5;
                  const isOutOfStock = stockNum === 0;

                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(s)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-mono transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-white border-2 border-[#171717] text-[#171717] shadow-xs font-bold"
                          : isOutOfStock
                          ? "bg-[#FAFAF8] text-[#929292] border border-[#E8E8E4] cursor-not-allowed opacity-60"
                          : "bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] hover:border-[#D4D4CF] cursor-pointer"
                      }`}
                    >
                      <span className="font-bold">{s}</span>
                      <span className={`text-[9px] ${
                        isSelected
                          ? "text-emerald-300 font-semibold"
                          : isOutOfStock
                          ? "text-slate-400"
                          : stockNum <= 3
                          ? "text-amber-700 font-bold"
                          : "text-emerald-700 font-medium"
                      }`}>
                        {isOutOfStock ? "Out" : `${stockNum} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 block">
                  Studio Color: <strong className="text-slate-700">{currentColor?.name}</strong>
                </span>
                <div className="flex items-center gap-2.5">
                  {product.colors.map((c) => {
                    const isSelected = currentColor?.name === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all p-0.5 flex items-center justify-center cursor-pointer ${
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

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Check Delivery Date to Your Pincode</span>
                </span>
                <span className="font-mono text-emerald-700 text-[10px] font-bold">Blue Dart Priority</span>
              </div>

              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  placeholder="Enter 6-digit PIN (e.g. 400001, 110001)"
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-950 font-mono tracking-wider w-full focus:outline-none focus:ring-2 focus:ring-slate-950"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  Verify PIN
                </button>
              </form>

              {pincodeResult && (
                <p
                  className={`text-[11px] font-medium leading-snug ${
                    pincodeResult.serviceable ? "text-emerald-700 font-semibold" : "text-rose-600"
                  }`}
                >
                  {pincodeResult.message}
                </p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Quantity:</span>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-mono font-bold text-slate-950">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => (q < product.stock ? q + 1 : q))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleAddAndClose}
                  className="py-3 px-4 rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] hover:bg-[#F5F6F4] text-[#171717] text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-98 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#171717]" />
                  <span>Add to Bag</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNowAndNavigate}
                  className="py-3 px-4 rounded-xl bg-white hover:bg-[#FAFAF8] border-1.5 border-[#171717] hover:border-[#B78B45] text-[#171717] hover:text-[#B78B45] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                >
                  <span>Direct UPI / Card Checkout</span>
                  <ArrowRight className="w-4 h-4 text-[#B78B45]" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className="text-xs font-medium text-slate-600 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-600 text-rose-600" : ""}`} />
                  <span>{wishlisted ? "Saved in Wishlist" : "Save to Wishlist"}</span>
                </button>

                {product.b2bMinMoq && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickViewProduct(null);
                      openB2BModal(product);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Request B2B Bulk Price (MOQ {product.b2bMinMoq})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex gap-4 border-b border-slate-200 text-xs font-semibold mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                    activeTab === "specs"
                      ? "border-slate-950 text-slate-950 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Materials & Specs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("origin")}
                  className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                    activeTab === "origin"
                      ? "border-slate-950 text-slate-950 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Studio Origin & Care
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                    activeTab === "reviews"
                      ? "border-slate-950 text-slate-950 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Patron Reviews ({product.reviewCount})
                </button>
              </div>

              {activeTab === "specs" && (
                <div className="space-y-1.5 text-xs">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-slate-100 font-mono">
                      <span className="text-slate-500">{key}:</span>
                      <span className="font-semibold text-slate-900 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "origin" && (
                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                        Verified Brand Boutique
                      </span>
                      <Link
                        href={`/store/${product.storeSlug || sellerSlug}`}
                        className="text-sm font-extrabold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 transition-colors group"
                      >
                        <span>{product.supplier.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {product.supplier.location} • ★ {product.supplier.rating} ({product.supplier.fulfillmentRate} Fulfillment SLA)
                      </span>
                    </div>

                    <Link
                      href={`/store/${product.storeSlug || sellerSlug}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold border border-indigo-200 transition-colors shrink-0"
                    >
                      Visit Storefront 🛍️
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        Pickup & Dispatch Hub
                      </span>
                      <p className="text-[11px] text-slate-800 font-medium">
                        {product.supplier.pickupAddress || `${product.supplier.location} (PIN: 302029)`}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3 text-indigo-600" />
                        Verified Return Warehouse
                      </span>
                      <p className="text-[11px] text-slate-800 font-medium">
                        {product.supplier.returnWarehouse || `Central QC Vault, ${product.supplier.location}`}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 font-mono text-[11px]">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Itemized Transparent Price Breakdown
                    </span>
                    <div className="flex justify-between text-slate-700">
                      <span>Artisan Studio Price:</span>
                      <span className="font-bold text-slate-900">{formatPrice(product.price)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Logistics Delivery Fee:</span>
                      <span className="font-bold text-emerald-700">
                        {product.deliveryChargeMode === "CUSTOM" && product.deliveryCharge
                          ? `+ ₹${product.deliveryCharge}`
                          : "Free Pan-India Delivery"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Escrow Platform Handling:</span>
                      <span className="font-semibold text-slate-700">Studio Direct Verified</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Taxes (CGST/SGST/IGST):</span>
                      <span className="text-slate-600">Included in product price</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-950 text-xs">
                      <span>Customer Payable Total:</span>
                      <span className="text-indigo-700">
                        {formatPrice(product.price + (product.deliveryChargeMode === "CUSTOM" && product.deliveryCharge ? product.deliveryCharge : 0))}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono">
                    🛡️ Protected by 7-Day Hassle-Free Exchange • 100% Direct UTR Refund Guarantee.
                  </p>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-3 text-xs">
                  {product.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rev.author}</span>
                        <div className="flex items-center text-amber-500 font-bold text-[11px]">
                          {"★".repeat(rev.rating)}
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px]">{rev.comment}</p>
                      <span className="text-[10px] text-emerald-700 font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Direct Buyer</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative bg-white rounded-3xl border border-[#E8E8E4] shadow-2xl max-w-lg w-full p-6 text-[#171717] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E4]">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-[#B78B45]" />
                  <h3 className="font-black text-base text-[#171717]">
                    Architectural Size & Fit Guide
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#FAFAF8] hover:bg-[#F5F6F4] text-[#767676] flex items-center justify-center cursor-pointer border border-[#E8E8E4]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#626262]">
                All garments are cut with precision tailored ease. Measurements taken flat in inches and centimeters.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#171717] text-[10px] uppercase text-[#767676]">
                      <th className="py-2">Size</th>
                      <th className="py-2">Chest</th>
                      <th className="py-2">Length</th>
                      <th className="py-2">Shoulder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8E4]">
                    {SIZE_GUIDE_ROWS.map((row) => (
                      <tr key={row.size} className="hover:bg-[#FAFAF8]">
                        <td className="py-2 font-bold text-[#B78B45]">{row.size}</td>
                        <td className="py-2">{row.chestIn} ({row.chestCm})</td>
                        <td className="py-2">{row.lengthIn} ({row.lengthCm})</td>
                        <td className="py-2">{row.shoulderIn} ({row.shoulderCm})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] text-[11px] text-[#626262] space-y-1">
                <p className="font-bold text-[#171717]">💡 Fit Recommendation:</p>
                <p>
                  Regular relaxed drop-shoulder cut. If you prefer a tailored slim silhouette, we recommend sizing down one size.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Close Fit Table
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

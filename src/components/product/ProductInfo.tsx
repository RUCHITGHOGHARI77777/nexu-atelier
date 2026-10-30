"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Star,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Building2,
  Check,
  Plus,
  Minus,
  Sparkles,
  Scale,
  Zap,
  Ruler,
  X,
} from "lucide-react";
import { ColorVariant, Product } from "@/types/marketplace";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, calculateDiscountPercentage } from "@/lib/formatters";
import { DeliveryEstimator } from "./DeliveryEstimator";

export interface ProductInfoProps {
  product: Product;
  onColorChange?: (color: ColorVariant) => void;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ product, onColorChange }) => {
  const router = useRouter();
  const { addToCart, openCartDrawer } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { recordView } = useRecentlyViewed();

  useEffect(() => {
    recordView({
      id: product.id,
      slug: product.slug,
      title: product.title,
      pricePaise: product.basePrice,
      image: product.images[0] || "",
      category: product.category,
      vendorName: product.vendor.name,
      rating: product.rating,
    });
  }, [product, recordView]);

  const [selectedColor, setSelectedColor] = useState<ColorVariant | undefined>(
    product.availableColors?.[0]
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.availableSizes?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  const discountPercentage = calculateDiscountPercentage(
    product.basePrice,
    product.compareAtPrice
  );

  const wishlisted = isWishlisted(product.id);
  const inCompare = isInCompare(product.id);

  const handleColorSelect = (color: ColorVariant) => {
    setSelectedColor(color);
    if (onColorChange) {
      onColorChange(color);
    }
  };

  const handleAddToCart = () => {
    if (isAdded) return;
    if (product.availableSizes && !selectedSize) {
      setValidationError("Please select a size before adding to bag");
      return;
    }
    setValidationError("");

    const success = addToCart(product, {
      color: selectedColor,
      size: selectedSize,
      quantity,
    });

    if (success) {
      setIsAdded(true);
      openCartDrawer();
      setTimeout(() => {
        setIsAdded(false);
      }, 1500);
    }
  };

  const handleBuyNow = () => {
    if (product.availableSizes && !selectedSize) {
      setValidationError("Please select a size before proceeding to checkout");
      return;
    }
    setValidationError("");

    const success = addToCart(product, {
      color: selectedColor,
      size: selectedSize,
      quantity,
    });

    if (success) {
      router.push("/checkout");
    }
  };

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  return (
    <div className="space-y-6 text-zinc-900 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm">
      {/* Studio Header */}
      <div className="space-y-2 pb-4 border-b border-zinc-100">
        <div className="flex items-center justify-between text-xs">
          <Link
            href={`/catalog?category=${encodeURIComponent(product.category)}`}
            className="text-zinc-500 hover:text-zinc-950 font-medium transition-colors"
          >
            {product.category}
          </Link>
          <div className="flex items-center gap-1.5 text-zinc-800 font-mono">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span className="font-bold">{product.rating}</span>
            <span className="text-zinc-400 text-[11px]">
              ({product.reviewCount} verified reviews)
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 leading-snug">
          {product.title}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          {product.subtitle}
        </p>

        {/* Vendor attribution badge */}
        <div className="pt-2 flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Crafted by:</span>
          <span className="text-zinc-900 font-semibold underline underline-offset-4">
            {product.vendor.name}
          </span>
          <span className="text-zinc-400">•</span>
          <span className="text-zinc-500 font-mono text-[11px]">
            {product.vendor.location}
          </span>
        </div>
      </div>

      {/* Pricing Row */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xl sm:text-3xl font-black text-zinc-950">
            {formatCurrency(product.basePrice)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <span className="font-mono text-sm text-zinc-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
          {discountPercentage > 0 && (
            <Badge variant="success" size="sm">
              {discountPercentage}% Studio Discount
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-zinc-500">
          Inclusive of all taxes & verified HSN studio invoice.
        </p>
      </div>

      {/* Color Variants (if available) */}
      {product.availableColors && product.availableColors.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px]">
              Color Finish:
            </span>
            <span className="text-zinc-600 font-medium">
              {selectedColor?.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {product.availableColors.map((color) => {
              const isSelected = selectedColor?.name === color.name;
              return (
                <button
                  key={color.name}
                  onClick={() => handleColorSelect(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-all p-0.5 cursor-pointer ${
                    isSelected
                      ? "border-amber-600 scale-110 shadow-md ring-2 ring-amber-500/30"
                      : "border-zinc-300 opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={`Select ${color.name}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Size Variants (if available) */}
      {product.availableSizes && product.availableSizes.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px]">
              Select Sizing:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 font-medium">{selectedSize}</span>
              {(product.category === "Apparel" || product.category === "Footwear") && (
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-amber-700 hover:text-amber-800 text-[11px] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <Ruler className="w-3 h-3" />
                  <span>Size Guide</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.availableSizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size);
                    setValidationError("");
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-sm font-bold"
                      : "bg-zinc-100 text-zinc-800 border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {validationError && (
            <p className="text-[11px] text-rose-600 font-semibold">
              {validationError}
            </p>
          )}
        </div>
      )}

      {/* Quantity & Stock Status */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px]">
            Quantity:
          </span>
          <span className="font-mono text-[11px]">
            {product.stock > 5 ? (
              <span className="text-emerald-700 font-semibold">Ready to Ship ({product.stock} available)</span>
            ) : product.stock > 0 ? (
              <span className="text-amber-700 font-semibold">Only {product.stock} units left in studio</span>
            ) : (
              <span className="text-rose-600 font-semibold">Temporarily out of stock</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-lg">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1 || product.stock === 0}
              className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-zinc-950 disabled:opacity-40 cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-mono text-sm font-bold text-zinc-950">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= product.stock || product.stock === 0}
              className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-zinc-950 disabled:opacity-40 cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                wishlisted
                  ? "bg-rose-50 text-rose-600 border-rose-200 shadow-sm"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-zinc-950 hover:bg-zinc-200"
              }`}
              aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart
                className={`w-4 h-4 ${wishlisted ? "fill-rose-600 text-rose-600" : ""}`}
              />
            </button>

            <button
              onClick={() => {
                if (inCompare) {
                  removeFromCompare(product.id);
                } else {
                  addToCompare(product);
                }
              }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                inCompare
                  ? "bg-amber-500 text-zinc-950 border-amber-500 shadow-sm font-bold"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-zinc-950 hover:bg-zinc-200"
              }`}
              aria-label={inCompare ? "Remove from comparison" : "Compare this piece"}
              title={inCompare ? "Remove from comparison" : "Compare this piece"}
            >
              <Scale className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Action Buttons: Add to Bag & Buy Now */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdded}
            className="w-full flex items-center justify-center gap-2 font-semibold bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 shadow-sm py-3 rounded-xl cursor-pointer"
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Added to Bag</span>
              </>
            ) : product.stock === 0 ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </>
            )}
          </Button>

          <Button
            variant="accent"
            size="lg"
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="w-full flex items-center justify-center gap-2 font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 py-3 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-zinc-950" />
            <span>Buy Now • {formatCurrency(product.basePrice * quantity)}</span>
          </Button>
        </div>
      </div>

      {/* Trust & Dispatch Assurance */}
      <div className="pt-4 border-t border-zinc-100 space-y-2 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Complimentary direct-from-studio insured express delivery across India.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Direct Artisan Escrow: Funds released to maker only upon verified doorstep acceptance.
          </span>
        </div>
      </div>

      {/* Pincode Delivery Estimator */}
      <div className="pt-4 border-t border-zinc-800/80">
        <DeliveryEstimator />
      </div>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-ochre" />
                <h3 className="font-bold text-sm text-white">
                  {product.category === "Footwear" ? "Footwear Sizing Chart" : "Apparel Measurement Guide"}
                </h3>
              </div>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
                aria-label="Close size guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {product.category === "Footwear" ? (
              <div className="text-xs space-y-3">
                <p className="text-zinc-400">
                  Our footwear is crafted on standard Goodyear-welted European lasts with a generous toe box.
                </p>
                <table className="w-full text-left font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="py-2">UK</th>
                      <th className="py-2">US</th>
                      <th className="py-2">EU</th>
                      <th className="py-2">Foot (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    <tr><td className="py-1.5">UK 7</td><td>8.0</td><td>41</td><td>25.5 cm</td></tr>
                    <tr><td className="py-1.5">UK 8</td><td>9.0</td><td>42</td><td>26.5 cm</td></tr>
                    <tr><td className="py-1.5">UK 9</td><td>10.0</td><td>43</td><td>27.5 cm</td></tr>
                    <tr><td className="py-1.5">UK 10</td><td>11.0</td><td>44</td><td>28.5 cm</td></tr>
                    <tr><td className="py-1.5">UK 11</td><td>12.0</td><td>45</td><td>29.5 cm</td></tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs space-y-3">
                <p className="text-zinc-400">
                  Garments are hand-cut by master tailors with standard ease for comfortable drape.
                </p>
                <table className="w-full text-left font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="py-2">Size</th>
                      <th className="py-2">Chest</th>
                      <th className="py-2">Waist</th>
                      <th className="py-2">Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    <tr><td className="py-1.5">XS</td><td>34&quot;</td><td>28&quot;</td><td>46&quot;</td></tr>
                    <tr><td className="py-1.5">S</td><td>36&quot;</td><td>30&quot;</td><td>47&quot;</td></tr>
                    <tr><td className="py-1.5">M</td><td>38&quot;</td><td>32&quot;</td><td>48&quot;</td></tr>
                    <tr><td className="py-1.5">L</td><td>41&quot;</td><td>35&quot;</td><td>49&quot;</td></tr>
                    <tr><td className="py-1.5">XL</td><td>44&quot;</td><td>38&quot;</td><td>50&quot;</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 text-[11px] text-zinc-500 border-t border-zinc-800">
              Complimentary 7-day studio exchanges if sizing requires adjustment.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

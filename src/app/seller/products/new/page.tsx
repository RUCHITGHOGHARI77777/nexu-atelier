"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
  Save,
} from "lucide-react";
import { SellerProductInput, SellerProductVariantInput } from "@/types/seller";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductImageUploader } from "@/components/seller/ProductImageUploader";
import { formatCurrency } from "@/lib/formatters";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [basePrice, setBasePrice] = useState<number>(4500);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(6000);
  const [stock, setStock] = useState<number>(20);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  // Specifications
  const [material, setMaterial] = useState("Handwoven Organic Mulmul Cotton");
  const [dimensions, setDimensions] = useState("180cm x 70cm");
  const [weight, setWeight] = useState("240g");
  const [careInstructions, setCareInstructions] = useState("Dry clean only or delicate cold hand wash");
  const [dispatchEstimate, setDispatchEstimate] = useState("Ships in 2-3 business days");

  // Imagery (default to empty or demo image)
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=80",
  ]);

  // Variants
  const [variants, setVariants] = useState<SellerProductVariantInput[]>([
    {
      sku: "SLS-INDIGO-S",
      variantType: "SIZE",
      name: "Small",
      value: "S",
      stock: 5,
      additionalPrice: 0,
    },
    {
      sku: "SLS-INDIGO-M",
      variantType: "SIZE",
      name: "Medium",
      value: "M",
      stock: 10,
      additionalPrice: 0,
    },
    {
      sku: "SLS-INDIGO-L",
      variantType: "SIZE",
      name: "Large",
      value: "L",
      stock: 5,
      additionalPrice: 0,
    },
  ]);

  // Load categories from database
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          const list: CategoryOption[] = data.categories || [];
          setCategories(list);
          if (list.length > 0 && !categoryId) {
            setCategoryId(list[0].id);
          }
        }
      } catch {
        // Fallback to static category IDs if network fails
        setCategories([
          { id: "cat_apparel", name: "Apparel & Heritage Textiles", slug: "apparel" },
          { id: "cat_audio", name: "Audio & High Fidelity Electronics", slug: "audio-tech" },
          { id: "cat_home", name: "Home Objects & Living", slug: "objects-living" },
          { id: "cat_footwear", name: "Footwear & Fine Leathercraft", slug: "footwear" },
          { id: "cat_essentials", name: "Modern Essentials & Accessories", slug: "accessories" },
        ]);
        setCategoryId("cat_apparel");
      }
    }
    loadCategories();
  }, []);

  // Compute discount percentage preview
  const discountPercent =
    compareAtPrice && compareAtPrice > basePrice
      ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
      : 0;

  const handleAddVariant = () => {
    const defaultSku = `${sku || "SKU"}-${Date.now().toString().slice(-4)}`;
    setVariants([
      ...variants,
      {
        sku: defaultSku,
        variantType: "COLOR",
        name: "Obsidian Black",
        value: "Obsidian",
        hexCode: "#09090b",
        stock: 5,
        additionalPrice: 0,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof SellerProductVariantInput,
    val: any
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleSave = async (action: "DRAFT" | "SUBMIT") => {
    setErrorMessage(null);

    // Validation
    if (!title.trim() || title.trim().length < 2) {
      setErrorMessage("Piece title must be at least 2 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Description must be at least 10 characters long.");
      return;
    }
    if (basePrice <= 0) {
      setErrorMessage("Selling base price must be greater than zero.");
      return;
    }
    if (stock < 0) {
      setErrorMessage("Stock cannot be negative.");
      return;
    }
    if (images.length === 0) {
      setErrorMessage("Please upload or add at least one product showcase photograph.");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Please select a valid marketplace category.");
      return;
    }

    // SKU uniqueness validation
    const skuSet = new Set<string>();
    for (const v of variants) {
      if (!v.sku || !v.sku.trim()) {
        setErrorMessage("All configured variants must have a defined SKU.");
        return;
      }
      if (skuSet.has(v.sku.trim().toUpperCase())) {
        setErrorMessage(`Duplicate variant SKU detected: ${v.sku}`);
        return;
      }
      skuSet.add(v.sku.trim().toUpperCase());
    }

    const payload: SellerProductInput = {
      title: title.trim(),
      subtitle: subtitle.trim() || (brand ? `Crafted by ${brand}` : "Handcrafted studio piece"),
      description: description.trim(),
      categoryId,
      basePrice: Number(basePrice),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      action,
      brand: brand.trim() || undefined,
      dispatchEstimate: dispatchEstimate.trim() || undefined,
      material: material.trim(),
      dimensions: dimensions.trim(),
      weight: weight.trim(),
      careInstructions: careInstructions.trim(),
      images,
      variants: variants.length > 0 ? variants : undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/seller/products");
      } else {
        setErrorMessage(data.error || "Failed to create piece in studio catalog.");
      }
    } catch {
      setErrorMessage("Network error while submitting product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/seller/products"
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              New Creation
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              Publish Atelier Creation
            </h1>
          </div>
        </div>

        <Button href="/seller/products" variant="outline" size="sm">
          Cancel
        </Button>
      </div>

      {/* Moderation Workflow Notice */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-start gap-3 text-xs text-zinc-400">
        <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-200 block font-mono text-[11px] uppercase">
            Platform Quality & Moderation Governance
          </span>
          <p className="mt-0.5 leading-relaxed">
            All submitted products enter <strong className="text-zinc-300">Pending Review</strong> and remain completely hidden from the public storefront until verified by the platform Admin. You can save your work as a <strong className="text-zinc-300">Draft</strong> at any point before submitting.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
          <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Package className="w-4 h-4 text-zinc-400" />
            1. Essential Narrative & Identification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Piece Title <span className="text-rose-400">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Indigo Dyed Handloom Stole"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Subtitle / Maker Tagline
              </label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Master-woven botanical dyed organic wool"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Marketplace Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Brand / Maker Workshop
              </label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Solstice Loom Studio"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Primary Master SKU
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. SLS-IND-01"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              Curatorial Narrative & Details <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the craft heritage, fiber provenance, weaving technique, and tactile feel..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              required
            />
          </div>
        </div>

        {/* Section 2: Direct Device Imagery Upload */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
          <ProductImageUploader images={images} onChange={setImages} maxImages={8} />
        </div>

        {/* Section 3: Commercial Valuation & Stock */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
          <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            3. Commercial Valuation & Inventory Balance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Selling Price (INR) <span className="text-rose-400">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Maximum Retail Price / MRP (INR)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={compareAtPrice || ""}
                onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional benchmark MRP"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Total Units Ready to Ship <span className="text-rose-400">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Low Stock Threshold
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Real-time Discount Percentage Preview */}
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 font-mono">Storefront Pricing Display:</span>
              <span className="font-bold text-zinc-100 font-mono text-sm">
                {formatCurrency(basePrice)}
              </span>
              {compareAtPrice && compareAtPrice > basePrice && (
                <span className="text-zinc-500 font-mono line-through text-xs">
                  {formatCurrency(compareAtPrice)}
                </span>
              )}
            </div>

            {discountPercent > 0 ? (
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {discountPercent}% Patron Savings
              </span>
            ) : (
              <span className="text-[11px] font-mono text-zinc-500">
                Standard Valuation
              </span>
            )}
          </div>
        </div>

        {/* Section 4: Specifications & Dispatch */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
          <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-400" />
            4. Material Provenance & Dispatch Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Fiber Composition & Material
              </label>
              <Input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 100% Handspun Mulberry Silk"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Dimensions / Form Factor
              </label>
              <Input
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 200cm x 110cm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Weight (g / kg)
              </label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 350g"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Dispatch / Delivery Estimate
              </label>
              <Input
                value={dispatchEstimate}
                onChange={(e) => setDispatchEstimate(e.target.value)}
                placeholder="e.g. Ships in 2-3 business days"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Care Instructions
              </label>
              <Input
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="e.g. Dry clean only"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Configurable Product Variants */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              5. Sizes, Colors & Variant Matrix
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariant}
              className="text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Variant Line
            </Button>
          </div>

          {variants.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono py-2">
              No variant lines configured. The product will be sold as a single standard unit.
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                      Variant SKU *
                    </label>
                    <Input
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(idx, "sku", e.target.value.toUpperCase())}
                      placeholder="SKU-XXXX"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                      Type
                    </label>
                    <select
                      value={v.variantType}
                      onChange={(e) => handleUpdateVariant(idx, "variantType", e.target.value as "COLOR" | "SIZE")}
                      className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="SIZE">Size</option>
                      <option value="COLOR">Color</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                      Label / Value *
                    </label>
                    <Input
                      value={v.value}
                      onChange={(e) => {
                        handleUpdateVariant(idx, "value", e.target.value);
                        if (!v.name || v.name === v.value) {
                          handleUpdateVariant(idx, "name", e.target.value);
                        }
                      }}
                      placeholder="e.g. M or Indigo"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                      Stock Units
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => handleUpdateVariant(idx, "stock", Number(e.target.value))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                      Price Delta (INR)
                    </label>
                    <Input
                      type="number"
                      step="1"
                      value={v.additionalPrice || 0}
                      onChange={(e) => handleUpdateVariant(idx, "additionalPrice", Number(e.target.value))}
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-2 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dual Actions: Save as Draft vs Submit for Review */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-800">
          <Button
            type="button"
            href="/seller/products"
            variant="outline"
            size="sm"
          >
            Discard
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isSubmitting}
              onClick={() => handleSave("DRAFT")}
              className="flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save as Draft"}</span>
            </Button>

            <Button
              type="button"
              size="md"
              disabled={isSubmitting}
              onClick={() => handleSave("SUBMIT")}
              className="bg-zinc-100 text-zinc-900 hover:bg-white flex items-center gap-1.5 font-semibold"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isSubmitting ? "Submitting..." : "Submit for Admin Review"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

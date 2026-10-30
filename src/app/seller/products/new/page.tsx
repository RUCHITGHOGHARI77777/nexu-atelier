"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { SellerProductInput, SellerProductVariantInput } from "@/types/seller";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const CATEGORY_OPTIONS = [
  { id: "cat_apparel", name: "Apparel & Heritage Textiles" },
  { id: "cat_audio", name: "Audio & High Fidelity Electronics" },
  { id: "cat_home", name: "Home Objects & Living" },
  { id: "cat_footwear", name: "Footwear & Fine Leathercraft" },
  { id: "cat_essentials", name: "Modern Essentials & Accessories" },
];

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("cat_apparel");
  const [basePrice, setBasePrice] = useState<number>(4500);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(6000);
  const [stock, setStock] = useState<number>(20);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  // Specifications
  const [material, setMaterial] = useState("Handwoven Organic Mulmul Cotton");
  const [dimensions, setDimensions] = useState("180cm x 70cm");
  const [weight, setWeight] = useState("240g");
  const [careInstructions, setCareInstructions] = useState("Dry clean only or delicate cold hand wash");

  // Imagery
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80",
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");

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

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    try {
      new URL(newImageUrl.trim());
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl("");
    } catch {
      setErrorMessage("Please enter a valid HTTP/HTTPS image URL.");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    const defaultSku = `SKU-${Date.now().toString().slice(-4)}`;
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

  const handleUpdateVariant = (index: number, field: keyof SellerProductVariantInput, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!title.trim() || title.trim().length < 2) {
      setErrorMessage("Piece title must be at least 2 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Description must be at least 10 characters.");
      return;
    }
    if (basePrice <= 0) {
      setErrorMessage("Base price must be greater than zero.");
      return;
    }
    if (stock < 0) {
      setErrorMessage("Stock cannot be negative.");
      return;
    }
    if (images.length === 0) {
      setErrorMessage("Please provide at least one product imagery URL.");
      return;
    }

    // SKU uniqueness validation
    const skuSet = new Set<string>();
    for (const v of variants) {
      if (!v.sku || !v.sku.trim()) {
        setErrorMessage("All variants must have a defined SKU.");
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
      subtitle: subtitle.trim(),
      description: description.trim(),
      categoryId,
      basePrice: Number(basePrice),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
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
              Publish Atelier Piece
            </h1>
          </div>
        </div>

        <Link href="/seller/products">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
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
                placeholder="e.g. Hand-Spun Eri Silk Kimono Jacket"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Subtitle / Collection Tag
              </label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Autumn Equinox 2026 Archive"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Curated Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-sans"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              Craft Story & Editorial Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the provenance, weave technique, artisan mastery, and tactile experience..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-sans resize-y"
              required
            />
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
          <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider font-mono">
            2. Valuation & Inventory Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Base Price (₹) <span className="text-rose-400">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                required
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Patron retail value</span>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Compare-at MRP (₹)
              </label>
              <Input
                type="number"
                min={1}
                value={compareAtPrice || ""}
                onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Strike-through benchmark</span>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Total Stock <span className="text-rose-400">*</span>
              </label>
              <Input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Available ready units</span>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Low Stock Threshold
              </label>
              <Input
                type="number"
                min={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Alert trigger point</span>
            </div>
          </div>
        </div>

        {/* Section 3: Material Specifications */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
          <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider font-mono">
            3. Materiality & Provenance Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Material Composition</label>
              <Input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 100% Ahimsa Silk, Hand-Dyed Indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Dimensions / Fit</label>
              <Input
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 110cm Length x 58cm Chest"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Weight</label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 380 grams"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Care & Longevity</label>
              <Input
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="e.g. Professional dry clean recommended"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Imagery */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-zinc-400" />
              4. Visual Gallery (High-Res Photographs)
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">
              {images.length} image{images.length !== 1 ? "s" : ""} added
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste HTTPS image URL (e.g. Unsplash or Cloudinary)..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-sans"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddImage}
              className="shrink-0"
            >
              Add Image
            </Button>
          </div>

          {/* Image Previews */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {images.map((url, idx) => (
              <div
                key={idx}
                className="group relative aspect-[3/4] bg-zinc-950 border border-zinc-800 rounded overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1 bg-zinc-950/80 hover:bg-rose-500/90 text-zinc-400 hover:text-white rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 bg-zinc-900/90 text-zinc-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-zinc-700">
                    Primary Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Variants */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider font-mono">
                5. Atelier Variants & SKUs
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configure color and size distinctions with discrete SKU tracking.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariant}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Variant
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="p-6 border border-dashed border-zinc-800 rounded text-center text-xs text-zinc-500">
              No variants defined. This product will be managed as a single unified SKU.
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded grid grid-cols-1 sm:grid-cols-6 gap-3 items-center"
                >
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-1">SKU</label>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(idx, "sku", e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-1">Type</label>
                    <select
                      value={v.variantType}
                      onChange={(e) => handleUpdateVariant(idx, "variantType", e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200"
                    >
                      <option value="COLOR">Color</option>
                      <option value="SIZE">Size</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleUpdateVariant(idx, "name", e.target.value)}
                      placeholder="e.g. Ochre"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-1">Value / Tag</label>
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => handleUpdateVariant(idx, "value", e.target.value)}
                      placeholder={v.variantType === "COLOR" ? "#b45309" : "XL"}
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-1">Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => handleUpdateVariant(idx, "stock", Number(e.target.value))}
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Link href="/seller/products">
            <Button type="button" variant="outline" size="sm">
              Discard Changes
            </Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="bg-zinc-100 text-zinc-900 hover:bg-white flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <span>Saving Creation...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-500" />
                Publish Piece
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

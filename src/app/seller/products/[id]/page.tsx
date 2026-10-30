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
  ShieldAlert,
  Save,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { SellerProductInput, SellerProductVariantInput, SellerProductDetailView } from "@/types/seller";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProductImageUploader } from "@/components/seller/ProductImageUploader";
import { formatCurrency } from "@/lib/formatters";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const productId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [initialProduct, setInitialProduct] = useState<SellerProductDetailView | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  // Specifications & Logistics
  const [material, setMaterial] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [weight, setWeight] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [productType, setProductType] = useState("Physical Craft");
  const [subcategory, setSubcategory] = useState("");
  const [searchKeywords, setSearchKeywords] = useState("");
  const [dispatchEstimate, setDispatchEstimate] = useState("Ships in 2-3 business days");
  const [packageDimensions, setPackageDimensions] = useState("");
  const [taxRatePercent, setTaxRatePercent] = useState<number>(12.0);

  // Imagery & Variants
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<SellerProductVariantInput[]>([]);

  // Fetch initial product data and categories
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/seller/products/${productId}`),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const p: SellerProductDetailView = prodData.product;
          setInitialProduct(p);

          // Populate form fields
          setTitle(p.title);
          setSubtitle(p.subtitle);
          setDescription(p.description);
          setCategoryId(p.categoryId);
          setBasePrice(p.basePrice);
          setCompareAtPrice(p.compareAtPrice || undefined);
          setStock(p.stock);
          setLowStockThreshold(p.lowStockThreshold);
          setMaterial(p.material || "");
          setDimensions(p.dimensions || "");
          setWeight(p.weight || "");
          setCareInstructions(p.careInstructions || "");
          setBrand(p.brand || "");
          setSku(p.sku || "");
          setProductType(p.productType || "Physical Craft");
          setSubcategory(p.subcategory || "");
          setSearchKeywords(p.searchKeywords || "");
          setDispatchEstimate(p.dispatchEstimate || "Ships in 2-3 business days");
          setPackageDimensions(p.packageDimensions || "");
          setTaxRatePercent(p.taxRatePercent || 12.0);
          setImages(p.images || []);
          setVariants(
            p.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              variantType: v.variantType,
              name: v.name,
              value: v.value,
              hexCode: v.hexCode || undefined,
              imageUrl: v.imageUrl || undefined,
              stock: v.stock,
              additionalPrice: v.additionalPrice,
            }))
          );
        } else {
          const err = await prodRes.json();
          setErrorMessage(err.error || "Piece not found or you lack permission to edit it.");
        }
      } catch {
        setErrorMessage("Network error connecting to atelier backend.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [productId]);

  const discountPercent =
    compareAtPrice && compareAtPrice > basePrice
      ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
      : 0;

  const handleAddVariant = () => {
    const defaultSku = `SKU-${Date.now().toString().slice(-4)}`;
    setVariants([
      ...variants,
      {
        sku: defaultSku,
        variantType: "SIZE",
        name: "Medium",
        value: "M",
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
    setSuccessMessage(null);

    if (!title.trim() || title.trim().length < 2) {
      setErrorMessage("Piece title must be at least 2 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Description must be at least 10 characters long.");
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
      setErrorMessage("Please upload or add at least one product photograph.");
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

    const payload: Partial<SellerProductInput> = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      categoryId,
      basePrice: Number(basePrice),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      action,
      brand: brand.trim() || undefined,
      sku: sku.trim() || undefined,
      productType: productType.trim() || undefined,
      subcategory: subcategory.trim() || undefined,
      searchKeywords: searchKeywords.trim() || undefined,
      dispatchEstimate: dispatchEstimate.trim() || undefined,
      packageDimensions: packageDimensions.trim() || undefined,
      taxRatePercent: Number(taxRatePercent) || 12.0,
      material: material.trim(),
      dimensions: dimensions.trim(),
      weight: weight.trim(),
      careInstructions: careInstructions.trim(),
      images,
      variants,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(
          action === "SUBMIT"
            ? "Piece submitted for Admin review. It will remain hidden until approved."
            : "Draft saved successfully."
        );
        router.push("/seller/products");
      } else {
        setErrorMessage(data.error || "Failed to update piece in studio catalog.");
      }
    } catch {
      setErrorMessage("Network error while updating product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-xs font-mono text-zinc-500">Loading piece specifications from PostgreSQL...</p>
      </div>
    );
  }

  if (!initialProduct) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-100">Piece Retrieval Error</h2>
        <p className="text-xs text-zinc-400">{errorMessage || "You do not have access to this creation."}</p>
        <Button href="/seller/products" variant="outline" size="sm">
          Return to Studio Catalog
        </Button>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                Catalog Editor
              </span>
              <Badge
                variant={
                  initialProduct.approvalStatus === "APPROVED"
                    ? "success"
                    : initialProduct.approvalStatus === "PENDING_REVIEW"
                    ? "warning"
                    : initialProduct.approvalStatus === "DRAFT"
                    ? "neutral"
                    : "outline"
                }
                size="sm"
                className="font-mono text-[9px]"
              >
                {initialProduct.approvalStatus}
              </Badge>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100 mt-0.5">
              Edit: {initialProduct.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {initialProduct.isPublished && (
            <Button
              href={`/product/${initialProduct.slug}`}
              target="_blank"
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Storefront View
            </Button>
          )}
          <Button href="/seller/products" variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>

      {/* Moderation Standing Alert / Feedback */}
      {initialProduct.moderationNotes && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs">
          <span className="font-semibold text-amber-300 font-mono text-[10px] uppercase block">
            Admin Feedback / Review Notes:
          </span>
          <p className="text-amber-200">{initialProduct.moderationNotes}</p>
        </div>
      )}

      {/* Material Edit Re-Review Warning */}
      {initialProduct.approvalStatus === "APPROVED" && (
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-start gap-3 text-xs text-zinc-400">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-200 block font-mono text-[11px] uppercase">
              Notice: Re-moderation Required on Edit
            </span>
            <p className="mt-0.5 leading-relaxed">
              This piece is currently live and approved. Modifying its details, pricing, images, or variants will automatically return it to <strong className="text-zinc-300">Pending Review</strong> and temporarily unpublish it until verified again by the platform Admin.
            </p>
          </div>
        </div>
      )}

      {/* Error / Success Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
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
                Brand / Studio Maker
              </label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Solstice Studio"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Product Type
              </label>
              <Input
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="e.g. Physical Craft"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Subcategory / Discipline
              </label>
              <Input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Handloom Textiles"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Search Keywords &amp; Tags
              </label>
              <Input
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="e.g. organic, indigo, linen"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
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
                MRP / Benchmark (INR)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={compareAtPrice || ""}
                onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Stock Available <span className="text-rose-400">*</span>
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

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                GST / Tax Rate (%)
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Pricing Row Preview */}
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

            {discountPercent > 0 && (
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {discountPercent}% Patron Savings
              </span>
            )}
          </div>
        </div>

        {/* Section 4: Specifications & Provenance */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
          <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-400" />
            4. Material Provenance & Architectural Specs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Material Formulation
              </label>
              <Input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Dimensions
              </label>
              <Input
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Item Weight (g / kg)
              </label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 350g"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Package Box Dimensions
              </label>
              <Input
                value={packageDimensions}
                onChange={(e) => setPackageDimensions(e.target.value)}
                placeholder="e.g. 30cm x 20cm x 5cm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Dispatch / Lead Time
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

        {/* Section 5: Variants Matrix */}
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
              No variant lines configured. The piece will be offered as a single standard unit.
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
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                      Stock
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

        {/* Dual Actions: Save as Draft vs Resubmit for Review */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-800">
          <Button
            type="button"
            href="/seller/products"
            variant="outline"
            size="sm"
          >
            Cancel
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

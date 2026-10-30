"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
  Save,
  RotateCcw,
} from "lucide-react";
import { SellerProductInput, SellerProductVariantInput } from "@/types/seller";
import { ProductAttributesMap, SmartListingQualityResult, SupplierDraftData } from "@/types/listing-engine";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductImageUploader } from "@/components/seller/ProductImageUploader";
import { AutoDraftStatusBadge } from "@/components/seller/AutoDraftStatusBadge";
import { AutoDraftManager, AutoDraftState } from "@/lib/client/auto-draft-manager";
import { CategoryAttributeFields } from "@/components/seller/CategoryAttributeFields";
import { SmartQualityChecker } from "@/components/seller/SmartQualityChecker";
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

  // Specifications & Shipping
  const [material, setMaterial] = useState("Handwoven Organic Mulmul Cotton");
  const [dimensions, setDimensions] = useState("180cm x 70cm");
  const [weight, setWeight] = useState("240g");
  const [careInstructions, setCareInstructions] = useState("Dry clean only or delicate cold hand wash");
  const [dispatchEstimate, setDispatchEstimate] = useState("Ships in 2-3 business days");
  const [packageDimensions, setPackageDimensions] = useState("30cm x 20cm x 5cm");
  const [productType, setProductType] = useState("Physical Craft");
  const [subcategory, setSubcategory] = useState("Handloom Textiles");
  const [searchKeywords, setSearchKeywords] = useState("handcrafted, artisan, organic, heritage");
  const [taxRatePercent, setTaxRatePercent] = useState<number>(12.0);

  // Dynamic Category Attributes
  const [attributes, setAttributes] = useState<ProductAttributesMap>({});

  // Imagery
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

  // Auto-Draft State
  const [draftManager, setDraftManager] = useState<AutoDraftManager | null>(null);
  const [autoDraftState, setAutoDraftState] = useState<AutoDraftState>({
    status: "IDLE",
    lastSavedAt: null,
    serverVersion: 1,
    clientVersion: 1,
    hasConflict: false,
  });
  const [hasPendingDraft, setHasPendingDraft] = useState(false);
  const [pendingDraftData, setPendingDraftData] = useState<SupplierDraftData | null>(null);

  // Quality Evaluation State
  const [qualityResult, setQualityResult] = useState<SmartListingQualityResult | null>(null);
  const qualityDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Field refs for direct navigation
  const fieldRefs = {
    title: useRef<HTMLInputElement>(null),
    description: useRef<HTMLTextAreaElement>(null),
    categoryId: useRef<HTMLSelectElement>(null),
    basePrice: useRef<HTMLInputElement>(null),
    compareAtPrice: useRef<HTMLInputElement>(null),
    images: useRef<HTMLDivElement>(null),
    variants: useRef<HTMLDivElement>(null),
    attributes: useRef<HTMLDivElement>(null),
  };

  // 1. Initialize Categories & Auto-Draft
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

    // Init AutoDraftManager
    const manager = new AutoDraftManager("seller_new_product", null, (st) => {
      setAutoDraftState(st);
    });
    setDraftManager(manager);

    // Check for existing draft in local or server storage
    const local = manager.loadLocal();
    if (local && local.data && (local.data.title || local.data.description)) {
      setHasPendingDraft(true);
      setPendingDraftData(local.data);
    } else {
      manager.loadServer().then((serverData) => {
        if (serverData && (serverData.title || serverData.description)) {
          setHasPendingDraft(true);
          setPendingDraftData(serverData);
        }
      });
    }
  }, []);

  // 2. Schedule Auto-Draft Sync and Quality Check on changes
  useEffect(() => {
    if (!draftManager) return;

    const payload: SupplierDraftData = {
      title,
      subtitle,
      description,
      categoryId,
      brand,
      sku,
      basePrice,
      compareAtPrice,
      stock,
      lowStockThreshold,
      material,
      dimensions,
      weight,
      careInstructions,
      dispatchEstimate,
      packageDimensions,
      productType,
      subcategory,
      searchKeywords,
      taxRatePercent,
      images,
      variants: variants.map((v) => ({ ...v, additionalPrice: v.additionalPrice || 0 })),
      attributes,
    };

    // Debounced autosave
    draftManager.scheduleServerSync(payload, 1200);

    // Debounced quality check via API
    if (qualityDebounceTimer.current) {
      clearTimeout(qualityDebounceTimer.current);
    }

    qualityDebounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/seller/quality-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: payload }),
        });
        if (res.ok) {
          const data = await res.json();
          setQualityResult(data.evaluation);
        }
      } catch {}
    }, 400);

    return () => {
      if (qualityDebounceTimer.current) clearTimeout(qualityDebounceTimer.current);
    };
  }, [
    title,
    subtitle,
    description,
    categoryId,
    brand,
    sku,
    basePrice,
    compareAtPrice,
    stock,
    lowStockThreshold,
    material,
    dimensions,
    weight,
    careInstructions,
    dispatchEstimate,
    packageDimensions,
    productType,
    subcategory,
    searchKeywords,
    taxRatePercent,
    images,
    variants,
    attributes,
    draftManager,
  ]);

  // Restore Draft Action
  const handleRestoreDraft = () => {
    if (!pendingDraftData) return;
    const d = pendingDraftData;
    if (d.title !== undefined) setTitle(d.title);
    if (d.subtitle !== undefined) setSubtitle(d.subtitle);
    if (d.description !== undefined) setDescription(d.description);
    if (d.categoryId) setCategoryId(d.categoryId);
    if (d.brand !== undefined) setBrand(d.brand);
    if (d.sku !== undefined) setSku(d.sku);
    if (d.basePrice !== undefined) setBasePrice(d.basePrice);
    if (d.compareAtPrice !== undefined) setCompareAtPrice(d.compareAtPrice || undefined);
    if (d.stock !== undefined) setStock(d.stock);
    if (d.lowStockThreshold !== undefined) setLowStockThreshold(d.lowStockThreshold);
    if (d.material !== undefined) setMaterial(d.material);
    if (d.dimensions !== undefined) setDimensions(d.dimensions);
    if (d.weight !== undefined) setWeight(d.weight);
    if (d.careInstructions !== undefined) setCareInstructions(d.careInstructions);
    if (d.dispatchEstimate !== undefined) setDispatchEstimate(d.dispatchEstimate);
    if (d.packageDimensions !== undefined) setPackageDimensions(d.packageDimensions);
    if (d.productType !== undefined) setProductType(d.productType);
    if (d.subcategory !== undefined) setSubcategory(d.subcategory);
    if (d.searchKeywords !== undefined) setSearchKeywords(d.searchKeywords);
    if (d.taxRatePercent !== undefined) setTaxRatePercent(d.taxRatePercent);
    if (Array.isArray(d.images) && d.images.length > 0) setImages(d.images);
    if (Array.isArray(d.variants) && d.variants.length > 0) setVariants(d.variants);
    if (d.attributes) setAttributes(d.attributes);

    setHasPendingDraft(false);
  };

  // Discard Draft Action
  const handleDiscardDraft = async () => {
    if (draftManager) {
      await draftManager.discard();
    }
    setHasPendingDraft(false);
    setPendingDraftData(null);
  };

  // Direct Field Navigation
  const handleNavigateToField = (fieldKey: string) => {
    if (fieldKey.startsWith("attributes")) {
      fieldRefs.attributes.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (fieldKey.startsWith("variants")) {
      fieldRefs.variants.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (fieldKey === "images") {
      fieldRefs.images.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (fieldKey === "title") {
      fieldRefs.title.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      fieldRefs.title.current?.focus();
    } else if (fieldKey === "description") {
      fieldRefs.description.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      fieldRefs.description.current?.focus();
    } else if (fieldKey === "basePrice" || fieldKey === "compareAtPrice") {
      fieldRefs.basePrice.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      fieldRefs.basePrice.current?.focus();
    }
  };

  // Variant Controls
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

  // Submission Handling
  const handleSave = async (action: "DRAFT" | "SUBMIT") => {
    setErrorMessage(null);

    // Hard blockers check before submission
    if (action === "SUBMIT" && qualityResult && !qualityResult.canSubmit) {
      setErrorMessage(`Please resolve the ${qualityResult.errors.length} hard blocker(s) identified in the Quality Checker.`);
      handleNavigateToField(qualityResult.errors[0].field);
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage("Piece title must be at least 3 characters.");
      handleNavigateToField("title");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Description must be at least 10 characters long.");
      handleNavigateToField("description");
      return;
    }
    if (basePrice <= 0) {
      setErrorMessage("Selling base price must be greater than zero.");
      handleNavigateToField("basePrice");
      return;
    }
    if (images.length === 0) {
      setErrorMessage("Please upload or add at least one product showcase photograph.");
      handleNavigateToField("images");
      return;
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
      variants: variants.length > 0 ? variants : undefined,
      attributes,
      draftKey: "seller_new_product",
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
        if (draftManager) {
          await draftManager.discard();
        }
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

  const discountPercent =
    compareAtPrice && compareAtPrice > basePrice
      ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
      : 0;

  const currentCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header & Autosave Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/seller/products"
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
              Studio Workshop
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">
              Create New Atelier Piece
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <AutoDraftStatusBadge
            status={autoDraftState.status}
            lastSavedAt={autoDraftState.lastSavedAt}
            onDiscard={handleDiscardDraft}
            onRetrySync={() => draftManager?.syncServer({
              title,
              description,
              categoryId,
              basePrice,
              stock,
              images,
              variants: variants.map((v) => ({ ...v, additionalPrice: v.additionalPrice || 0 })),
              attributes,
            })}
          />
          <Button href="/seller/products" variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>

      {/* Draft Recovery Notification Banner */}
      {hasPendingDraft && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-amber-950">
            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Unfinished draft discovered.</strong> Would you like to restore your previous progress or start fresh?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-900 text-white hover:bg-amber-800 transition-colors shadow-2xs"
            >
              Resume Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Smart Listing Quality Checker Widget */}
      <SmartQualityChecker
        evaluation={qualityResult}
        onNavigateToField={handleNavigateToField}
      />

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Creation Form */}
      <div className="space-y-6">
        {/* Section 1: Identification & Taxonomy */}
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider font-mono flex items-center gap-2">
            <Package className="w-4 h-4 text-zinc-600" />
            1. Piece Identity & Classification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Marketplace Category <span className="text-rose-500">*</span>
              </label>
              <select
                ref={fieldRefs.categoryId}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setAttributes({}); // Reset category-specific specs on category switch
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Craft Brand / Atelier Studio
              </label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Veda Handlooms"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Piece Title <span className="text-rose-500">*</span>
            </label>
            <input
              ref={fieldRefs.title}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Handwoven Chanderi Silk Saree with Pure Zari Border"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Narrative & Craft Heritage <span className="text-rose-500">*</span>
            </label>
            <textarea
              ref={fieldRefs.description}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the craft heritage, fiber provenance, weaving technique, and tactile feel..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
            />
          </div>
        </div>

        {/* Section 2: Direct Device Imagery Upload */}
        <div ref={fieldRefs.images} className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <ProductImageUploader images={images} onChange={setImages} maxImages={8} />
        </div>

        {/* Section 3: Commercial Valuation & Inventory */}
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-600" />
            3. Commercial Valuation & Inventory Balance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Selling Price (INR) <span className="text-rose-500">*</span>
              </label>
              <input
                ref={fieldRefs.basePrice}
                type="number"
                min="1"
                step="1"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                MRP Benchmark (INR)
              </label>
              <input
                ref={fieldRefs.compareAtPrice}
                type="number"
                min="0"
                step="1"
                value={compareAtPrice || ""}
                onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional MRP"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Ready Units <span className="text-rose-500">*</span>
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
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Low Stock Alert
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
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                GST Rate (%)
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

          {/* Discount Percentage Preview */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-zinc-600 font-medium">Automatic Discount Preview:</span>
            <div className="flex items-center gap-2">
              {discountPercent > 0 ? (
                <>
                  <span className="line-through text-zinc-400 font-mono">
                    {formatCurrency(compareAtPrice || 0)}
                  </span>
                  <span className="font-bold text-zinc-950 font-mono">
                    {formatCurrency(basePrice)}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px]">
                    {discountPercent}% OFF
                  </span>
                </>
              ) : (
                <span className="text-zinc-500 font-mono">No discount applied (Selling at benchmark)</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Category-Specific Dynamic Specifications */}
        <div ref={fieldRefs.attributes} className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <CategoryAttributeFields
            categoryId={categoryId}
            categoryName={currentCategory?.name}
            attributes={attributes}
            onChange={setAttributes}
          />
        </div>

        {/* Section 5: Sizes, Colors & Variant Matrix */}
        <div ref={fieldRefs.variants} className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider font-mono flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-600" />
                5. Sizes, Colors & Variant Matrix
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configure discrete SKUs for each size and colorway with isolated stock.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variant</span>
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3">
              No variant lines configured. The product will be sold as a single standard unit.
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-zinc-600 mb-1">
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
                    <label className="block text-[10px] font-semibold text-zinc-600 mb-1">
                      Type
                    </label>
                    <select
                      value={v.variantType}
                      onChange={(e) => handleUpdateVariant(idx, "variantType", e.target.value as "COLOR" | "SIZE")}
                      className="w-full px-2.5 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none"
                    >
                      <option value="SIZE">Size</option>
                      <option value="COLOR">Color</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-zinc-600 mb-1">
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
                    <label className="block text-[10px] font-semibold text-zinc-600 mb-1">
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
                    <label className="block text-[10px] font-semibold text-zinc-600 mb-1">
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
                      className="p-2 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors"
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

        {/* Section 6: Packaging & Logistics */}
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-600" />
            6. Packaging, Weight & Dispatch
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Dispatch Estimate
              </label>
              <Input
                value={dispatchEstimate}
                onChange={(e) => setDispatchEstimate(e.target.value)}
                placeholder="e.g. Ships in 2-3 business days"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Package Weight
              </label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 350g"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Package Dimensions
              </label>
              <Input
                value={packageDimensions}
                onChange={(e) => setPackageDimensions(e.target.value)}
                placeholder="e.g. 25cm x 15cm x 4cm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Master SKU
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. NX-APP-001"
              />
            </div>
          </div>
        </div>

        {/* Dual Actions: Save as Draft vs Submit for Review */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-200">
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
              className="bg-zinc-950 text-white hover:bg-zinc-800 flex items-center gap-1.5 font-semibold"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? "Submitting..." : "Submit for Admin Review"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

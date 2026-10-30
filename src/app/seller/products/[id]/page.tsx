"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { ProductAttributesMap, SmartListingQualityResult, SupplierDraftData } from "@/types/listing-engine";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProductImageUploader } from "@/components/seller/ProductImageUploader";
import { AutoDraftStatusBadge } from "@/components/seller/AutoDraftStatusBadge";
import { AutoDraftManager, AutoDraftState } from "@/lib/client/auto-draft-manager";
import { CategoryAttributeFields } from "@/components/seller/CategoryAttributeFields";
import { SmartQualityChecker } from "@/components/seller/SmartQualityChecker";
import { CorrectionAssistantBanner } from "@/components/seller/CorrectionAssistantBanner";
import { ProductSeoEditorSection, ProductSeoEditorState } from "@/components/seo/ProductSeoEditorSection";
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

  // Dynamic Category Attributes
  const [attributes, setAttributes] = useState<ProductAttributesMap>({});

  // Imagery & Variants
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<SellerProductVariantInput[]>([]);

  // Amazon-Style Highlights & Advanced Multi-Channel SEO State
  const [highlights, setHighlights] = useState<string[]>([
    "Master artisan craftsmanship with verifiable provenance",
    "Sustainably packaged in recycled, carbon-neutral parceling",
    "Studio authenticity certification included",
  ]);
  const [seoState, setSeoState] = useState<ProductSeoEditorState>({
    metaTitle: "",
    metaDescription: "",
    slug: "",
    canonicalUrl: "",
    seoKeywords: "",
    googleProductCategory: "Apparel & Accessories > Clothing > Traditional & Cultural Wear",
    condition: "NEW",
    targetGender: "unisex",
    targetAgeGroup: "adult",
    mpn: "",
    gtin: "",
  });

  // Auto-Draft & Quality Checker State
  const [draftManager, setDraftManager] = useState<AutoDraftManager | null>(null);
  const [autoDraftState, setAutoDraftState] = useState<AutoDraftState>({
    status: "IDLE",
    lastSavedAt: null,
    serverVersion: 1,
    clientVersion: 1,
    hasConflict: false,
  });
  const [qualityResult, setQualityResult] = useState<SmartListingQualityResult | null>(null);
  const qualityDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Field refs for navigation
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
          setAttributes(p.attributes || {});
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
          if (p.highlights && Array.isArray(p.highlights) && p.highlights.length > 0) {
            setHighlights(p.highlights);
          }
          setSeoState({
            metaTitle: p.metaTitle || "",
            metaDescription: p.metaDescription || "",
            slug: p.slug || "",
            canonicalUrl: p.canonicalUrl || "",
            seoKeywords: p.searchKeywords || "",
            googleProductCategory: p.googleProductCategory || "",
            condition: (p.condition as any) || "NEW",
            targetGender: (p.targetGender as any) || "unisex",
            targetAgeGroup: (p.targetAgeGroup as any) || "adult",
            mpn: p.mpn || "",
            gtin: p.gtin || "",
          });
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

    const manager = new AutoDraftManager(`seller_edit_${productId}`, productId, (st) => {
      setAutoDraftState(st);
    });
    setDraftManager(manager);
  }, [productId]);

  // Quality check and autosave sync
  useEffect(() => {
    if (isLoading || !initialProduct) return;

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

    if (draftManager) {
      draftManager.scheduleServerSync(payload, 1500);
    }

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
    isLoading,
    initialProduct,
    draftManager,
  ]);

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

    if (action === "SUBMIT" && qualityResult && !qualityResult.canSubmit) {
      setErrorMessage(`Please resolve the ${qualityResult.errors.length} hard blocker(s) identified in the Quality Checker.`);
      handleNavigateToField(qualityResult.errors[0].field);
      return;
    }

    if (!title.trim() || title.trim().length < 2) {
      setErrorMessage("Piece title must be at least 2 characters.");
      handleNavigateToField("title");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Description must be at least 10 characters long.");
      handleNavigateToField("description");
      return;
    }
    if (basePrice <= 0) {
      setErrorMessage("Base price must be greater than zero.");
      handleNavigateToField("basePrice");
      return;
    }
    if (stock < 0) {
      setErrorMessage("Stock cannot be negative.");
      return;
    }
    if (images.length === 0) {
      setErrorMessage("Please upload or add at least one product photograph.");
      handleNavigateToField("images");
      return;
    }

    const payload: Partial<SellerProductInput> = {
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
      variants,
      attributes,
      draftKey: `seller_edit_${productId}`,
      // SEO & Amazon-style fields
      highlights,
      metaTitle: seoState.metaTitle || undefined,
      metaDescription: seoState.metaDescription || undefined,
      slug: seoState.slug || undefined,
      canonicalUrl: seoState.canonicalUrl || undefined,
      googleProductCategory: seoState.googleProductCategory || undefined,
      condition: seoState.condition,
      targetGender: seoState.targetGender,
      targetAgeGroup: seoState.targetAgeGroup,
      mpn: seoState.mpn || undefined,
      gtin: seoState.gtin || undefined,
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
        if (draftManager) {
          await draftManager.discard();
        }
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
        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin mx-auto" />
        <p className="text-xs font-mono text-zinc-500">Loading piece specifications from PostgreSQL...</p>
      </div>
    );
  }

  if (!initialProduct) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-900">Piece Retrieval Error</h2>
        <p className="text-xs text-zinc-500">{errorMessage || "You do not have access to this creation."}</p>
        <Button href="/seller/products" variant="outline" size="sm">
          Return to Studio Catalog
        </Button>
      </div>
    );
  }

  const currentCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/seller/products"
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                Catalog Editor
              </span>
              <Badge
                variant={
                  initialProduct.approvalStatus === "APPROVED"
                    ? "success"
                    : initialProduct.approvalStatus === "PENDING_REVIEW"
                    ? "warning"
                    : initialProduct.approvalStatus === "CHANGES_REQUESTED"
                    ? "accent"
                    : "outline"
                }
                size="sm"
                className="font-mono text-[9px]"
              >
                {initialProduct.approvalStatus}
              </Badge>
              {initialProduct.isPublished && (
                <Badge variant="success" size="sm" className="text-[9px]">
                  Live on Storefront
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 mt-0.5">
              Edit &ldquo;{initialProduct.title}&rdquo;
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AutoDraftStatusBadge
            status={autoDraftState.status}
            lastSavedAt={autoDraftState.lastSavedAt}
            onDiscard={() => draftManager?.discard()}
          />
          <Button href="/seller/products" variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>

      {/* Editorial Correction Assistant Banner (when changes requested) */}
      {initialProduct.approvalStatus === "CHANGES_REQUESTED" && (
        <CorrectionAssistantBanner
          moderationNotes={initialProduct.moderationNotes}
          rejectedFields={initialProduct.rejectedFields}
          suggestedCorrections={initialProduct.suggestedCorrections}
          productId={productId}
          onNavigateToField={handleNavigateToField}
        />
      )}

      {/* Smart Listing Quality Checker */}
      <SmartQualityChecker
        evaluation={qualityResult}
        onNavigateToField={handleNavigateToField}
      />

      {/* Status & Error Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Editing Form */}
      <div className="space-y-6">
        {/* Section 1: Identification & Taxonomy */}
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider font-mono flex items-center gap-2">
            <Package className="w-4 h-4 text-zinc-600" />
            1. Classification & Brand
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
                  setAttributes({});
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Curatorial Narrative & Storytelling <span className="text-rose-500">*</span>
            </label>
            <textarea
              ref={fieldRefs.description}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
            />
          </div>
        </div>

        {/* Section 2: Direct Device Imagery */}
        <div ref={fieldRefs.images} className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <ProductImageUploader images={images} onChange={setImages} maxImages={8} />
        </div>

        {/* Section 3: Commercial Valuation & Stock */}
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-600" />
            3. Commercial Valuation & Inventory
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
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Available Stock <span className="text-rose-500">*</span>
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
                <span className="text-zinc-500 font-mono">No discount applied</span>
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
                Configure discrete SKUs for each size and colorway with isolated inventory.
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
              No variant lines configured. Product is sold as a standard unit.
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
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Package Weight
              </label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Package Dimensions
              </label>
              <Input
                value={packageDimensions}
                onChange={(e) => setPackageDimensions(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Master SKU
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>

        {/* Section 7: Search Engine Optimization & Multi-Channel Discovery */}
        <ProductSeoEditorSection
          productTitle={title}
          productDescription={description}
          basePrice={basePrice}
          stock={stock}
          brand={brand}
          categoryName={currentCategory?.name || "Craft"}
          material={material}
          images={images.map((url, i) => ({ url, alt: `${title} - View ${i + 1}` }))}
          highlights={highlights}
          seoState={seoState}
          onChange={(updated) => setSeoState((prev) => ({ ...prev, ...updated }))}
          onNavigateToField={handleNavigateToField}
        />

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-200">
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
              <span>{isSubmitting ? "Saving..." : "Save Draft Updates"}</span>
            </Button>

            <Button
              type="button"
              size="md"
              disabled={isSubmitting}
              onClick={() => handleSave("SUBMIT")}
              className="bg-zinc-950 text-white hover:bg-zinc-800 flex items-center gap-1.5 font-semibold"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                {initialProduct.approvalStatus === "CHANGES_REQUESTED"
                  ? isSubmitting
                    ? "Resubmitting..."
                    : "Resubmit for Curator Review"
                  : isSubmitting
                  ? "Submitting..."
                  : "Submit for Admin Review"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

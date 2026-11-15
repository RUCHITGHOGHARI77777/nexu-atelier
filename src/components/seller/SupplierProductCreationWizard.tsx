"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Layers,
  Sparkles,
  Truck,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  RotateCcw,
  Eye,
  Plus,
  Trash2,
  Image as ImageIcon,
  Tag,
  Calculator,
  ChevronDown,
  ChevronUp,
  Percent,
  TrendingUp,
  TrendingDown,
  FileCheck2,
  Info,
} from "lucide-react";
import {
  SupplierCostInputs,
  CostCalculationResult,
  calculateSupplierProfitAndLoss,
  CustomExpenseRow,
  GstPriceMode,
  GstSupplyType,
} from "@/lib/supplier-costing";
import {
  HSN_TAX_DIRECTORY,
  HsnTaxRecord,
  lookupHsn,
  suggestGstRateForHsn,
} from "@/lib/tax-hsn-directory";
import { ProductImageUploader } from "@/components/seller/ProductImageUploader";
import { AutoDraftManager, AutoDraftState } from "@/lib/client/auto-draft-manager";
import { AutoDraftStatusBadge } from "@/components/seller/AutoDraftStatusBadge";
import { formatCurrency } from "@/lib/formatters";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductVariantItem {
  sku: string;
  variantType: "SIZE" | "COLOR" | "MATERIAL" | "STYLE";
  name: string;
  value: string;
  hexCode?: string;
  stock: number;
  costINR: number;
  additionalPrice: number;
}

const WIZARD_STEPS = [
  { id: 1, label: "Identity & Specs", short: "1. Info" },
  { id: 2, label: "Showcase Imagery", short: "2. Images" },
  { id: 3, label: "Variants & Stock", short: "3. Variants" },
  { id: 4, label: "Cost & Economics", short: "4. Costing" },
  { id: 5, label: "GST & Logistics", short: "5. Tax & Ship" },
  { id: 6, label: "Review & Submit", short: "6. Publish" },
];

export function SupplierProductCreationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionModal, setSubmissionModal] = useState<{
    isOpen: boolean;
    action: "DRAFT" | "SUBMIT";
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("Handloom Textiles");
  const [brand, setBrand] = useState("Atelier Heritage");
  const [description, setDescription] = useState("");
  const [keyFeatures, setKeyFeatures] = useState<string[]>([
    "Master weaver certified authentic handloom craft",
    "Dyed with low-impact certified botanical pigments",
    "Reinforced double-stitched architectural seams",
  ]);
  const [material, setMaterial] = useState("Pure Chanderi Silk with Zari Border");
  const [dimensions, setDimensions] = useState("5.5m Saree with 0.8m Blouse Piece");
  const [weight, setWeight] = useState("480g");
  const [careInstructions, setCareInstructions] = useState("Dry clean only; store in unbleached muslin wrap");
  const [hsnCode, setHsnCode] = useState("5007");
  const [masterSku, setMasterSku] = useState("");
  const [tags, setTags] = useState("silk, festive, heritage, handloom, zari");

  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80",
  ]);

  const [variants, setVariants] = useState<ProductVariantItem[]>([
    {
      sku: "ATELIER-SILK-FREE-MINT",
      variantType: "COLOR",
      name: "Sage Green & Silver Zari",
      value: "Sage Green",
      hexCode: "#8a9a86",
      stock: 12,
      costINR: 1850,
      additionalPrice: 0,
    },
    {
      sku: "ATELIER-SILK-FREE-ROSE",
      variantType: "COLOR",
      name: "Vintage Gulab & Gold Zari",
      value: "Vintage Rose",
      hexCode: "#c48b8b",
      stock: 8,
      costINR: 1850,
      additionalPrice: 200,
    },
  ]);
  const [lowStockThreshold, setLowStockThreshold] = useState(4);

  const [priceMode, setPriceMode] = useState<GstPriceMode>("EXCLUSIVE");
  const [sellingPriceINR, setSellingPriceINR] = useState(4500);
  const [mrpBenchmarkINR, setMrpBenchmarkINR] = useState(6500);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxRatePercent, setTaxRatePercent] = useState(12.0);
  const [supplyType, setSupplyType] = useState<GstSupplyType>("INTRA_STATE");

  const [purchaseCostINR, setPurchaseCostINR] = useState(1200);
  const [manufacturingCostINR, setManufacturingCostINR] = useState(300);
  const [rawMaterialCostINR, setRawMaterialCostINR] = useState(200);
  const [labourCostINR, setLabourCostINR] = useState(150);

  const [packagingMaterialINR, setPackagingMaterialINR] = useState(80);
  const [labellingINR, setLabellingINR] = useState(20);
  const [handlingINR, setHandlingINR] = useState(30);
  const [qualityInspectionINR, setQualityInspectionINR] = useState(20);
  const [warehouseExpensesINR, setWarehouseExpensesINR] = useState(50);

  const [inwardTransportINR, setInwardTransportINR] = useState(60);
  const [supplierToWarehouseShippingINR, setSupplierToWarehouseShippingINR] = useState(40);
  const [outwardCourierCostINR, setOutwardCourierCostINR] = useState(140);
  const [transitInsuranceINR, setTransitInsuranceINR] = useState(20);
  const [shippingPaidBy, setShippingPaidBy] = useState<"SELLER" | "CUSTOMER">("SELLER");
  const [customerShippingFeeINR, setCustomerShippingFeeINR] = useState(0);

  const [marketingExpensesINR, setMarketingExpensesINR] = useState(100);
  const [photographyCostAllocationINR, setPhotographyCostAllocationINR] = useState(50);
  const [additionalOperatingExpensesINR, setAdditionalOperatingExpensesINR] = useState(50);
  const [customExpenses, setCustomExpenses] = useState<CustomExpenseRow[]>([
    { id: "c1", name: "Artisan Guild GI Registry Tag", amountINR: 40, allocation: "PER_UNIT" },
  ]);

  const [pickupPinCode, setPickupPinCode] = useState("302001");
  const [destPinCode, setDestPinCode] = useState("110001");
  const [packageWeightGrams, setPackageWeightGrams] = useState(600);

  const [draftManager, setDraftManager] = useState<AutoDraftManager | null>(null);
  const [autoDraftState, setAutoDraftState] = useState<AutoDraftState>({
    status: "IDLE",
    lastSavedAt: null,
    serverVersion: 1,
    clientVersion: 1,
    hasConflict: false,
  });
  const [hasPendingDraft, setHasPendingDraft] = useState(false);
  const [pendingDraftData, setPendingDraftData] = useState<any>(null);

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

    const manager = new AutoDraftManager("supplier_smart_product", null, (st) => {
      setAutoDraftState(st);
    });
    setDraftManager(manager);

    const local = manager.loadLocal();
    if (local && local.data && (local.data.title || local.data.description)) {
      setHasPendingDraft(true);
      setPendingDraftData(local.data);
    }
  }, []);

  useEffect(() => {
    if (!masterSku && title) {
      const prefix = brand ? brand.slice(0, 3).toUpperCase() : "NXU";
      const cleanSlug = title
        .slice(0, 8)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      const rand = Math.floor(100 + Math.random() * 900);
      setMasterSku(`${prefix}-${cleanSlug}-${rand}`);
    }
  }, [title, brand, masterSku]);

  const activeHsnRecord = useMemo(() => lookupHsn(hsnCode), [hsnCode]);

  useEffect(() => {
    if (hsnCode) {
      const suggestion = suggestGstRateForHsn(hsnCode, sellingPriceINR);
      if (suggestion.ratePercent) {
        setTaxRatePercent(suggestion.ratePercent);
      }
    }
  }, [hsnCode, sellingPriceINR]);

  const calculationResult: CostCalculationResult = useMemo(() => {
    const inputs: SupplierCostInputs = {
      purchaseCostINR,
      manufacturingCostINR,
      rawMaterialCostINR,
      labourCostINR,
      packagingMaterialINR,
      labellingINR,
      handlingINR,
      qualityInspectionINR,
      warehouseExpensesINR,
      inwardTransportINR,
      supplierToWarehouseShippingINR,
      outwardCourierCostINR,
      transitInsuranceINR,
      shippingPaidBy,
      customerShippingFeeINR,
      marketingExpensesINR,
      photographyCostAllocationINR,
      additionalOperatingExpensesINR,
      customExpenses,
      priceMode,
      sellingPriceINR,
      mrpBenchmarkINR,
      discountPercent,
      taxRatePercent,
      supplyType,
      hsnCode,
      platformCommissionPercent: 10.0,
      paymentProcessingPercent: 2.0,
    };
    return calculateSupplierProfitAndLoss(inputs);
  }, [
    purchaseCostINR,
    manufacturingCostINR,
    rawMaterialCostINR,
    labourCostINR,
    packagingMaterialINR,
    labellingINR,
    handlingINR,
    qualityInspectionINR,
    warehouseExpensesINR,
    inwardTransportINR,
    supplierToWarehouseShippingINR,
    outwardCourierCostINR,
    transitInsuranceINR,
    shippingPaidBy,
    customerShippingFeeINR,
    marketingExpensesINR,
    photographyCostAllocationINR,
    additionalOperatingExpensesINR,
    customExpenses,
    priceMode,
    sellingPriceINR,
    mrpBenchmarkINR,
    discountPercent,
    taxRatePercent,
    supplyType,
    hsnCode,
  ]);

  const totalStockUnits = useMemo(() => {
    if (variants.length === 0) return 10;
    return variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
  }, [variants]);

  const handleAddVariant = () => {
    const code = `${masterSku || "SKU"}-VAR-${variants.length + 1}`;
    setVariants([
      ...variants,
      {
        sku: code,
        variantType: "SIZE",
        name: "Standard Piece",
        value: "Free Size",
        stock: 5,
        costINR: Math.round(calculationResult.directProductCostPaise / 100),
        additionalPrice: 0,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariantItem, val: any) => {
    const copy = [...variants];
    copy[index] = { ...copy[index], [field]: val };
    setVariants(copy);
  };

  const handleAddCustomExpense = () => {
    setCustomExpenses([
      ...customExpenses,
      {
        id: `custom_${Date.now()}`,
        name: "Additional Direct Studio Cost",
        amountINR: 50,
        allocation: "PER_UNIT",
      },
    ]);
  };

  const handleRemoveCustomExpense = (id: string) => {
    setCustomExpenses(customExpenses.filter((c) => c.id !== id));
  };

  const handleSaveListing = async (action: "DRAFT" | "SUBMIT") => {
    setStatusMessage(null);

    if (!title.trim() || title.length < 3) {
      setStatusMessage({ type: "error", text: "Product title must be at least 3 characters long." });
      setCurrentStep(1);
      return;
    }
    if (images.length === 0) {
      setStatusMessage({ type: "error", text: "Please provide at least 1 showcase photograph in Step 2." });
      setCurrentStep(2);
      return;
    }
    if (sellingPriceINR <= 0) {
      setStatusMessage({ type: "error", text: "Selling price must be greater than zero." });
      setCurrentStep(4);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || `Authentic ${brand} release`,
      description: description.trim(),
      categoryId: categoryId || categories[0]?.id || "cat_apparel",
      basePrice: calculationResult.taxableSellingPricePaise / 100,
      compareAtPrice: mrpBenchmarkINR || undefined,
      stock: totalStockUnits,
      lowStockThreshold,
      action,
      brand: brand.trim(),
      sku: masterSku.trim(),
      productType: "Artisan Handcrafted",
      subcategory,
      searchKeywords: tags,
      dispatchEstimate: "Ships in 2-3 business days",
      taxRatePercent,
      material,
      dimensions,
      weight,
      careInstructions,
      images,
      variants: variants.map((v) => ({
        sku: v.sku,
        variantType: v.variantType,
        name: v.name,
        value: v.value,
        hexCode: v.hexCode,
        stock: v.stock,
        additionalPrice: v.additionalPrice,
      })),
      attributes: {
        hsnCode,
        priceMode,
        supplyType,
        procurementCostINR: purchaseCostINR + manufacturingCostINR + rawMaterialCostINR + labourCostINR,
        packagingCostINR: packagingMaterialINR + labellingINR + handlingINR + qualityInspectionINR + warehouseExpensesINR,
        shippingPaidBy,
        outwardCourierCostINR,
        estimatedContributionProfitPaise: calculationResult.estimatedContributionProfitPaise,
        profitMarginPercent: calculationResult.profitMarginPercent,
        breakEvenPricePaise: calculationResult.breakEvenPricePaise,
        directProductCostPaise: calculationResult.directProductCostPaise,
      },
    };

    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (draftManager) await draftManager.discard();
        setSubmissionModal({ isOpen: true, action });
      } else {
        const err = await res.json();
        setStatusMessage({ type: "error", text: err.error || "Unable to save product." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network connection error while transmitting listing." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F8F2E6] border border-[#B78B45]/30 text-[#B78B45] text-[10px] font-mono font-bold tracking-wider uppercase">
              Smart Listing & Costing Engine
            </span>
            <AutoDraftStatusBadge
              status={autoDraftState.status}
              lastSavedAt={autoDraftState.lastSavedAt}
              onRetrySync={() => {}}
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#171717]">
            List New Artisan Piece
          </h1>
          <p className="text-xs text-[#626262] mt-0.5">
            Configure specifications, calculate true production costs, preview official GST scenarios, and verify net earnings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveListing("DRAFT")}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] text-[#171717] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#B78B45]" />
            <span>Save Draft</span>
          </button>
          <Link
            href="/seller/products"
            className="px-3.5 py-2 rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] hover:bg-[#E8E8E4] text-[#626262] text-xs font-medium transition-colors"
          >
            Exit
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 shadow-2xs ${
            statusMessage.type === "success"
              ? "bg-[#EAF6F0] border-[#21866F]/30 text-[#21866F]"
              : statusMessage.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-[#F8F2E6] border-[#B78B45]/30 text-[#B78B45]"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="bg-white border border-[#E8E8E4] rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {WIZARD_STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#171717] text-white shadow-xs"
                    : isCompleted
                    ? "bg-[#EAF6F0] text-[#21866F] border border-[#21866F]/20 hover:bg-[#EAF6F0]/80"
                    : "bg-[#FAFAF8] text-[#767676] border border-[#E8E8E4] hover:bg-[#F5F6F4]"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#21866F]" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                    {step.id}
                  </span>
                )}
                <span className="truncate">{step.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {currentStep === 1 && (
          <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#E8E8E4] pb-4">
              <h2 className="text-base font-serif font-bold text-[#171717] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#B78B45]" />
                Step 1: Product Information & Specifications
              </h2>
              <p className="text-xs text-[#626262] mt-0.5">
                Define the piece&apos;s identity, heritage narrative, artisan studio, and statutory HSN classification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Product Name <span className="text-[#C94A4A]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Handloom Chanderi Silk Saree with Pure Gold Zari"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E8E4] bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B78B45]/20 focus:border-[#B78B45]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Artisan Studio / Brand <span className="text-[#C94A4A]">*</span>
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Veda Silk Guild"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E8E4] bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B78B45]/20 focus:border-[#B78B45]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Marketplace Category <span className="text-[#C94A4A]">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E8E4] bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B78B45]/20 focus:border-[#B78B45]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. Pure Silk Sarees"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E8E4] bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B78B45]/20 focus:border-[#B78B45]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Master SKU
                </label>
                <input
                  type="text"
                  value={masterSku}
                  onChange={(e) => setMasterSku(e.target.value.toUpperCase())}
                  placeholder="e.g. NXU-SILK-001"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E8E4] bg-white text-[#171717] font-mono focus:outline-none focus:ring-2 focus:ring-[#B78B45]/20 focus:border-[#B78B45]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Heritage Story & Narrative Description <span className="text-[#C94A4A]">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Narrate the craftsmanship, warp and weft counts, historical provenance, and tactile hand-feel..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E8E4] bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B78B45]/20 focus:border-[#B78B45]"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] space-y-4">
              <h3 className="text-xs font-bold font-mono text-[#171717] uppercase tracking-wider">
                Product Physical Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#626262] mb-1">Material</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#626262] mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#626262] mb-1">Weight</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#626262] mb-1">Care Instructions</label>
                  <input
                    type="text"
                    value={careInstructions}
                    onChange={(e) => setCareInstructions(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#E8E8E4] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#171717]">
                    Harmonized System of Nomenclature (HSN)
                  </label>
                  <span className="text-[10px] text-[#B78B45] font-mono font-bold">
                    Official CBIC Mapping
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value.trim())}
                    placeholder="e.g. 5007"
                    className="w-32 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#E8E8E4] bg-[#FAFAF8] text-[#171717]"
                  />
                  {activeHsnRecord && (
                    <span className="text-xs text-[#21866F] font-medium truncate">
                      ✓ {activeHsnRecord.category} ({activeHsnRecord.defaultRatePercent}% GST)
                    </span>
                  )}
                </div>
                {activeHsnRecord && (
                  <p className="text-[11px] text-[#626262] leading-tight">
                    {activeHsnRecord.description} — <em className="text-[#B78B45]">{activeHsnRecord.notificationRef}</em>
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-[#E8E8E4] bg-white space-y-2">
                <label className="block text-xs font-semibold text-[#171717]">
                  Product Search Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. silk, handloom, zari, heritage"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                />
                <p className="text-[11px] text-[#767676]">
                  Tags optimize discoverability in customer search queries and faceted category filters.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E8E8E4]">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border-2 border-[#171717] bg-white hover:bg-[#FAFAF8] text-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Showcase Imagery</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#E8E8E4] pb-4">
              <h2 className="text-base font-serif font-bold text-[#171717] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#B78B45]" />
                Step 2: Product Imagery & Visual Merchandising
              </h2>
              <p className="text-xs text-[#626262] mt-0.5">
                Upload up to 8 high-resolution showcase images. The first image serves as the primary catalog cover piece.
              </p>
            </div>

            <ProductImageUploader images={images} onChange={setImages} maxImages={8} />

            <div className="flex justify-between items-center pt-4 border-t border-[#E8E8E4]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] text-[#171717] text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Specifications</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl border-2 border-[#171717] bg-white hover:bg-[#FAFAF8] text-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Variants & Stock</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8E8E4] pb-4">
              <div>
                <h2 className="text-base font-serif font-bold text-[#171717] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#B78B45]" />
                  Step 3: Variant Matrix & Inventory Control
                </h2>
                <p className="text-xs text-[#626262] mt-0.5">
                  Configure sizes, colors, isolated SKU identifiers, individual unit costs, and ready stock.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3.5 py-1.5 rounded-xl border border-[#171717] bg-white hover:bg-[#FAFAF8] text-[#171717] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#B78B45]" />
                <span>Add Variant Line</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] text-xs">
              <div>
                <span className="text-[#767676] block">Total Variants:</span>
                <strong className="text-sm font-bold text-[#171717]">{variants.length} SKU lines</strong>
              </div>
              <div>
                <span className="text-[#767676] block">Total Available Stock:</span>
                <strong className="text-sm font-bold text-[#21866F]">{totalStockUnits} Units</strong>
              </div>
              <div>
                <span className="text-[#767676] block">Low-Stock Alert:</span>
                <input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 rounded border border-[#E8E8E4] bg-white text-xs font-mono font-bold"
                />
              </div>
              <div>
                <span className="text-[#767676] block">Inventory Status:</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-[#EAF6F0] text-[#21866F] font-bold text-[10px]">
                  ✓ ATELIER SYNC READY
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E8E8E4] bg-white hover:border-[#B78B45]/50 transition-colors shadow-2xs space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                        Type
                      </label>
                      <select
                        value={v.variantType}
                        onChange={(e) => handleUpdateVariant(idx, "variantType", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                      >
                        <option value="COLOR">Colorway</option>
                        <option value="SIZE">Size</option>
                        <option value="MATERIAL">Material</option>
                        <option value="STYLE">Style</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                        Variant Name
                      </label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleUpdateVariant(idx, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                        Value (e.g. M, L, Indigo)
                      </label>
                      <input
                        type="text"
                        value={v.value}
                        onChange={(e) => handleUpdateVariant(idx, "value", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => handleUpdateVariant(idx, "sku", e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#E8E8E4] bg-[#FAFAF8] text-[#171717]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                        Stock Units
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => handleUpdateVariant(idx, "stock", Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          + Price (INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={v.additionalPrice}
                          onChange={(e) => handleUpdateVariant(idx, "additionalPrice", Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="p-2 text-zinc-400 hover:text-[#C94A4A] transition-colors rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E8E8E4]">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] text-[#171717] text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Imagery</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl border-2 border-[#171717] bg-white hover:bg-[#FAFAF8] text-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Costing & Calculator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {(currentStep === 4 || currentStep === 5) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            <div className="lg:col-span-7 space-y-6">
              {currentStep === 4 && (
                <>
                  <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8E8E4] pb-3">
                      <h3 className="text-xs font-bold font-mono text-[#171717] uppercase tracking-wider flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-[#B78B45]" />
                        A. Product Procurement & Direct Production Cost
                      </h3>
                      <span className="text-xs font-mono font-bold text-[#171717]">
                        ₹{calculationResult.procurementSubtotalPaise / 100}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Purchase / Sourcing Cost (INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={purchaseCostINR}
                          onChange={(e) => setPurchaseCostINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Manufacturing / Weaving (INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={manufacturingCostINR}
                          onChange={(e) => setManufacturingCostINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Raw Materials & Fibers (INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={rawMaterialCostINR}
                          onChange={(e) => setRawMaterialCostINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Direct Artisan Labour (INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={labourCostINR}
                          onChange={(e) => setLabourCostINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8E8E4] pb-3">
                      <h3 className="text-xs font-bold font-mono text-[#171717] uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#B78B45]" />
                        B. Packaging, Labelling & Handling
                      </h3>
                      <span className="text-xs font-mono font-bold text-[#171717]">
                        ₹{calculationResult.packagingSubtotalPaise / 100}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Packaging Material
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={packagingMaterialINR}
                          onChange={(e) => setPackagingMaterialINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Labelling & Seals
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={labellingINR}
                          onChange={(e) => setLabellingINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Handling & QC
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={handlingINR + qualityInspectionINR}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setHandlingINR(Math.round(val / 2));
                            setQualityInspectionINR(val - Math.round(val / 2));
                          }}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8E8E4] pb-3">
                      <h3 className="text-xs font-bold font-mono text-[#171717] uppercase tracking-wider flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#B78B45]" />
                        C. Inward Logistics & Outward Courier
                      </h3>
                      <span className="text-xs font-mono font-bold text-[#171717]">
                        ₹{(calculationResult.inwardTransportSubtotalPaise + calculationResult.outwardCourierPaise) / 100}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Inward Raw Goods Freight (INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={inwardTransportINR}
                          onChange={(e) => setInwardTransportINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                        <span className="text-[10px] text-[#767676] mt-0.5 block">
                          Freight from weavers/mills to studio
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Outward Customer Courier (INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={outwardCourierCostINR}
                          onChange={(e) => setOutwardCourierCostINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                        <span className="text-[10px] text-[#767676] mt-0.5 block">
                          Standard express domestic courier
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-[#171717] block">Shipping Responsibility:</span>
                        <span className="text-[11px] text-[#626262]">
                          {shippingPaidBy === "SELLER"
                            ? "Complimentary customer delivery (Seller absorbs outward courier)"
                            : "Customer pays courier fee at checkout (Added to customer bill)"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShippingPaidBy("SELLER")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            shippingPaidBy === "SELLER"
                              ? "bg-[#171717] text-white shadow-2xs"
                              : "bg-white text-[#626262] border border-[#E8E8E4]"
                          }`}
                        >
                          Seller Absorbs (Free Delivery)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingPaidBy("CUSTOMER")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            shippingPaidBy === "CUSTOMER"
                              ? "bg-[#171717] text-white shadow-2xs"
                              : "bg-white text-[#626262] border border-[#E8E8E4]"
                          }`}
                        >
                          Customer Paid
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8E8E4] pb-3">
                      <h3 className="text-xs font-bold font-mono text-[#171717] uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#B78B45]" />
                        D. Other Direct Studio Costs & Custom Allocations
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddCustomExpense}
                        className="text-xs font-bold text-[#B78B45] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Expense Row</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Marketing Allocation (INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={marketingExpensesINR}
                          onChange={(e) => setMarketingExpensesINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Photography & Lookbook
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={photographyCostAllocationINR}
                          onChange={(e) => setPhotographyCostAllocationINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                          Operating Overhead
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={additionalOperatingExpensesINR}
                          onChange={(e) => setAdditionalOperatingExpensesINR(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                    </div>

                    {customExpenses.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E8E8E4] bg-[#FAFAF8] text-xs"
                      >
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => {
                            const updated = customExpenses.map((x) =>
                              x.id === c.id ? { ...x, name: e.target.value } : x
                            );
                            setCustomExpenses(updated);
                          }}
                          className="flex-1 px-2.5 py-1 text-xs rounded border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                        <input
                          type="number"
                          min="0"
                          value={c.amountINR}
                          onChange={(e) => {
                            const updated = customExpenses.map((x) =>
                              x.id === c.id ? { ...x, amountINR: Number(e.target.value) } : x
                            );
                            setCustomExpenses(updated);
                          }}
                          className="w-24 px-2.5 py-1 text-xs font-mono rounded border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomExpense(c.id)}
                          className="p-1 text-zinc-400 hover:text-[#C94A4A] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-4 py-2 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] text-[#171717] text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Variants</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="px-5 py-2.5 rounded-xl border-2 border-[#171717] bg-white hover:bg-[#FAFAF8] text-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Continue to GST & Tax Configuration</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {currentStep === 5 && (
                <>
                  <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 shadow-xs space-y-6">
                    <div className="border-b border-[#E8E8E4] pb-4">
                      <h2 className="text-base font-serif font-bold text-[#171717] flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-[#B78B45]" />
                        Step 5: Statutory GST & Logistics Configuration
                      </h2>
                      <p className="text-xs text-[#626262] mt-0.5">
                        Statutory GST rules under CBIC and Notification 13/2025-Central Tax (Rate). Output tax is never supplier revenue.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] space-y-3">
                      <span className="text-xs font-bold font-mono text-[#171717] uppercase tracking-wider block">
                        Commercial Pricing Mode
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPriceMode("EXCLUSIVE")}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            priceMode === "EXCLUSIVE"
                              ? "border-[#171717] bg-white ring-2 ring-[#B78B45]/20 shadow-xs"
                              : "border-[#E8E8E4] bg-white hover:bg-[#FAFAF8]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-xs font-bold text-[#171717]">MODE A: GST Exclusive</strong>
                            {priceMode === "EXCLUSIVE" && (
                              <span className="w-2 h-2 rounded-full bg-[#21866F]" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#626262]">
                            You enter the taxable supply price. GST is calculated and added on top at checkout.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPriceMode("INCLUSIVE")}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            priceMode === "INCLUSIVE"
                              ? "border-[#171717] bg-white ring-2 ring-[#B78B45]/20 shadow-xs"
                              : "border-[#E8E8E4] bg-white hover:bg-[#FAFAF8]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-xs font-bold text-[#171717]">MODE B: GST Inclusive</strong>
                            {priceMode === "INCLUSIVE" && (
                              <span className="w-2 h-2 rounded-full bg-[#21866F]" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#626262]">
                            You enter the final buyer price (MRP). The taxable value and GST are extracted automatically.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#171717] mb-1">
                          {priceMode === "EXCLUSIVE" ? "Taxable Price (INR)" : "Customer Price (INR)"}{" "}
                          <span className="text-[#C94A4A]">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={sellingPriceINR}
                          onChange={(e) => setSellingPriceINR(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#171717] mb-1">
                          Benchmark MRP (INR)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={mrpBenchmarkINR}
                          onChange={(e) => setMrpBenchmarkINR(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#171717] mb-1">
                          Seller Discount (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#E8E8E4] bg-white text-[#171717]"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#171717]">
                          Statutory GST Rate Scenario
                        </span>
                        <span className="text-[11px] text-[#626262]">
                          Current HSN: <strong className="text-[#171717]">{hsnCode}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[5, 12, 18].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setTaxRatePercent(rate)}
                            className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                              taxRatePercent === rate
                                ? "border-[#171717] bg-[#FAFAF8] text-[#171717] font-bold shadow-2xs ring-2 ring-[#B78B45]/20"
                                : "border-[#E8E8E4] bg-white text-[#626262] hover:bg-[#FAFAF8]"
                            }`}
                          >
                            <span className="text-sm font-bold block">{rate}% GST</span>
                            <span className="text-[10px] text-[#767676]">
                              {rate === 5 ? "Silk/Khadi" : rate === 12 ? "Apparel/Brass" : "Tech/Acoustic"}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 pt-2 text-xs">
                        <span className="text-[#626262]">Tax Jurisdiction Split:</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="supplyType"
                            checked={supplyType === "INTRA_STATE"}
                            onChange={() => setSupplyType("INTRA_STATE")}
                          />
                          <span>Intra-State (CGST 50% + SGST 50%)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="supplyType"
                            checked={supplyType === "INTER_STATE"}
                            onChange={() => setSupplyType("INTER_STATE")}
                          />
                          <span>Inter-State (IGST 100%)</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-[#B78B45]" />
                          Automated Shipping Cost Estimator
                        </span>
                        <span className="text-[10px] text-[#21866F] font-bold">
                          Standard Air Courier
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                            Studio Origin PIN
                          </label>
                          <input
                            type="text"
                            value={pickupPinCode}
                            onChange={(e) => setPickupPinCode(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                            Sample Delivery PIN
                          </label>
                          <input
                            type="text"
                            value={destPinCode}
                            onChange={(e) => setDestPinCode(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#626262] mb-1">
                            Gross Weight (Grams)
                          </label>
                          <input
                            type="number"
                            value={packageWeightGrams}
                            onChange={(e) => setPackageWeightGrams(Number(e.target.value))}
                            className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-[#E8E8E4] bg-white text-[#171717]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="px-4 py-2 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] text-[#171717] text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Direct Costing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(6)}
                      className="px-5 py-2.5 rounded-xl border-2 border-[#171717] bg-white hover:bg-[#FAFAF8] text-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Proceed to Final Review</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-5 sticky top-24 space-y-4">
              <div className="bg-white border-2 border-[#E8E8E4] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E8E8E4] pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B78B45]">
                      Real-Time Economics
                    </span>
                    <h3 className="text-sm font-serif font-bold text-[#171717]">
                      Live Financial Summary
                    </h3>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                      calculationResult.isLoss
                        ? "bg-rose-50 text-[#C94A4A] border border-rose-200"
                        : calculationResult.isLowMargin
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-[#EAF6F0] text-[#21866F] border border-[#21866F]/20"
                    }`}
                  >
                    {calculationResult.profitMarginPercent}% Margin
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4]">
                    <span className="text-[10px] text-[#767676] uppercase tracking-wider block font-mono">
                      Estimated Payout
                    </span>
                    <strong className="text-base sm:text-lg font-bold text-[#171717] font-mono">
                      ₹{(calculationResult.estimatedSellerPayoutPaise / 100).toFixed(2)}
                    </strong>
                    <span className="text-[10px] text-[#626262] block mt-0.5">
                      Net into seller bank
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      calculationResult.isLoss
                        ? "bg-rose-50/50 border-rose-200"
                        : "bg-[#EAF6F0]/40 border-[#21866F]/30"
                    }`}
                  >
                    <span className="text-[10px] text-[#767676] uppercase tracking-wider block font-mono">
                      Estimated Profit
                    </span>
                    <strong
                      className={`text-base sm:text-lg font-bold font-mono ${
                        calculationResult.isLoss ? "text-[#C94A4A]" : "text-[#21866F]"
                      }`}
                    >
                      {calculationResult.estimatedContributionProfitPaise < 0 ? "-" : "+"}₹
                      {Math.abs(calculationResult.estimatedContributionProfitPaise / 100).toFixed(2)}
                    </strong>
                    <span className="text-[10px] text-[#626262] block mt-0.5">
                      Per piece net contribution
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs divide-y divide-[#E8E8E4]/60">
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#626262]">Taxable Supply Price:</span>
                    <span className="font-mono font-bold text-[#171717]">
                      ₹{(calculationResult.taxableSellingPricePaise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-[#626262]">
                      Output GST ({taxRatePercent}%):
                    </span>
                    <span className="font-mono font-medium text-[#767676]">
                      ₹{(calculationResult.outputGstPaise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 bg-[#FAFAF8] px-2 rounded-lg font-bold">
                    <span className="text-[#171717]">Customer Final Price:</span>
                    <span className="font-mono text-[#171717]">
                      ₹{(calculationResult.customerFinalPricePaise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 text-zinc-500">
                    <span>Direct Product Cost:</span>
                    <span className="font-mono">
                      -₹{(calculationResult.directProductCostPaise / 100).toFixed(2)}
                    </span>
                  </div>

                  {calculationResult.sellerBorneShippingPaise > 0 && (
                    <div className="flex justify-between py-1.5 text-zinc-500">
                      <span>Seller Borne Courier:</span>
                      <span className="font-mono">
                        -₹{(calculationResult.sellerBorneShippingPaise / 100).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1.5 text-zinc-500">
                    <span>Platform Commission (10%):</span>
                    <span className="font-mono">
                      -₹{(calculationResult.platformCommissionPaise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 text-zinc-500">
                    <span>Payment Gateway Fee (2%):</span>
                    <span className="font-mono">
                      -₹{(calculationResult.paymentGatewayFeePaise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 pt-3 border-t-2 border-[#171717] font-bold">
                    <span className="text-[#171717]">Net Seller Contribution:</span>
                    <span
                      className={`font-mono text-sm ${
                        calculationResult.isLoss ? "text-[#C94A4A]" : "text-[#21866F]"
                      }`}
                    >
                      ₹{(calculationResult.estimatedContributionProfitPaise / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#626262]">Break-Even Price:</span>
                    <strong className="font-mono text-[#171717]">
                      ₹{(calculationResult.breakEvenPricePaise / 100).toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#626262]">Min Recommended Price:</span>
                    <strong className="font-mono text-[#21866F]">
                      ₹{(calculationResult.minRecommendedPricePaise / 100).toFixed(2)}
                    </strong>
                  </div>
                  <p className="text-[10px] text-[#767676] pt-1 border-t border-[#E8E8E4]">
                    Selling at or above recommended ensures at least a 15% net contribution buffer against customer returns and packaging drift.
                  </p>
                </div>

                {calculationResult.warnings.length > 0 && (
                  <div className="space-y-1.5">
                    {calculationResult.warnings.map((w, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
                          w.includes("CRITICAL")
                            ? "bg-rose-50 border-rose-200 text-rose-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#E8E8E4] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif font-bold text-[#171717] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#21866F]" />
                  Step 6: Listing Verification & Final Submission
                </h2>
                <p className="text-xs text-[#626262] mt-0.5">
                  Confirm visual layout, variant matrix, and financial breakdown before submitting to the Atelier moderation queue.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#EAF6F0] text-[#21866F] font-bold text-xs border border-[#21866F]/20">
                100% Quality Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#767676] block">
                  Storefront Card Preview
                </span>
                <div className="border border-[#E8E8E4] rounded-2xl overflow-hidden bg-white shadow-xs">
                  <div className="aspect-4/5 relative bg-[#FAFAF8] overflow-hidden">
                    {images[0] ? (
                      <img
                        src={images[0]}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        No Image
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#171717] border border-[#E8E8E4]">
                      {brand}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-bold text-[#171717] line-clamp-1">{title}</h4>
                    <p className="text-[11px] text-[#626262] line-clamp-2">{description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E8E4]">
                      <div>
                        <span className="text-sm font-bold font-mono text-[#171717]">
                          ₹{(calculationResult.customerFinalPricePaise / 100).toFixed(2)}
                        </span>
                        {mrpBenchmarkINR > sellingPriceINR && (
                          <span className="text-xs text-[#767676] line-through font-mono ml-2">
                            ₹{mrpBenchmarkINR}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#21866F] font-bold">
                        {totalStockUnits} Available
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E4] space-y-2 text-xs">
                  <h4 className="font-bold text-[#171717] uppercase tracking-wider font-mono">
                    Official Tax & Economics Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#626262]">HSN Classification:</span>
                      <strong className="block text-[#171717]">{hsnCode}</strong>
                    </div>
                    <div>
                      <span className="text-[#626262]">Applicable GST Rate:</span>
                      <strong className="block text-[#171717]">{taxRatePercent}% ({supplyType})</strong>
                    </div>
                    <div>
                      <span className="text-[#626262]">Direct Product Cost:</span>
                      <strong className="block text-[#171717]">₹{(calculationResult.directProductCostPaise / 100).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[#626262]">Net Seller Contribution:</span>
                      <strong className="block text-[#21866F]">
                        +₹{(calculationResult.estimatedContributionProfitPaise / 100).toFixed(2)} ({calculationResult.profitMarginPercent}%)
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#E8E8E4] space-y-2 text-xs">
                  <h4 className="font-bold text-[#171717]">Marketplace Policy Confirmation</h4>
                  <p className="text-[11px] text-[#626262] leading-relaxed">
                    By submitting this handcrafted piece, you verify that all stated material fibers, weaving techniques, and HSN classifications comply with the NEXU ATELIER Quality Charter and Indian GST laws. Submissions are reviewed by our curation desk before going live.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#E8E8E4]">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] text-[#171717] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to GST & Logistics</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSaveListing("DRAFT")}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] text-[#171717] text-xs font-bold transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveListing("SUBMIT")}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border-2 border-[#171717] bg-white hover:bg-[#FAFAF8] text-[#171717] hover:border-[#B78B45] hover:text-[#B78B45] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-[#B78B45]" />
                  <span>{isSubmitting ? "Transmitting..." : "Submit Piece for Review"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {submissionModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl border border-[#E7E7E7] transform scale-100 transition-all">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider inline-block ${
                submissionModal.action === "SUBMIT" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-800"
              }`}>
                {submissionModal.action === "SUBMIT" ? "Status: Pending Review" : "Status: Draft Preserved"}
              </span>
              <h2 className="text-xl font-bold text-[#111111] tracking-tight">
                {submissionModal.action === "SUBMIT"
                  ? "Product Submitted for Review"
                  : "Draft Preserved Successfully"}
              </h2>
              <p className="text-sm text-[#444444] leading-relaxed">
                {submissionModal.action === "SUBMIT"
                  ? "Your product has been submitted successfully. Our team will review it shortly."
                  : "Your product draft has been saved to your studio catalog and is not visible to public shoppers."}
              </p>
            </div>

            <p className="text-xs text-[#888888] leading-relaxed">
              {submissionModal.action === "SUBMIT"
                ? "Once approved by our curators, the piece will automatically become visible on the public marketplace and receive its permanent shareable URL."
                : "You can return to edit and submit this piece at any time from your products directory."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/seller/products")}
                className="flex-1 py-3 px-4 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Go to My Products
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmissionModal(null);
                  router.push("/seller/products/new");
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-[#E7E7E7] bg-white hover:bg-[#F7F7F7] text-xs font-bold text-[#111111] transition-all cursor-pointer"
              >
                Add Another Piece
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

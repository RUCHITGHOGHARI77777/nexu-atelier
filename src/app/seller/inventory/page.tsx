"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  History,
  FileSpreadsheet,
  Truck,
  IndianRupee,
  Layers,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
  Package,
  SlidersHorizontal,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Check,
} from "lucide-react";
import { InventoryOverview, InventoryItemView, InventoryStockStatus } from "@/lib/server/inventory-service";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export default function SellerInventoryPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "restock" | "movements" | "reports" | "csv">("catalog");

  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [items, setItems] = useState<InventoryItemView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("ALL");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("ALL");
  const [variantFilter, setVariantFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("updated_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkAdjustModalOpen, setIsBulkAdjustModalOpen] = useState(false);
  const [bulkAdjustmentValue, setBulkAdjustmentValue] = useState<number>(0);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState<"ADD" | "REDUCE" | "SET_EXACT">("SET_EXACT");

  const [adjustmentTarget, setAdjustmentTarget] = useState<InventoryItemView | null>(null);
  const [adjustType, setAdjustType] = useState<"ADD" | "REDUCE" | "SET_EXACT" | "RECEIVE" | "DAMAGED" | "LOST" | "CORRECTION">("ADD");
  const [adjustQuantity, setAdjustQuantity] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<string>("Fresh artisan workshop output");
  const [adjustNote, setAdjustNote] = useState<string>("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const [restockRecords, setRestockRecords] = useState<any[]>([]);
  const [isCreateRestockModalOpen, setIsCreateRestockModalOpen] = useState(false);
  const [restockTargetItem, setRestockTargetItem] = useState<InventoryItemView | null>(null);
  const [restockExpectedQty, setRestockExpectedQty] = useState<number>(20);
  const [restockSupplier, setRestockSupplier] = useState<string>("Surat Handloom Guild");
  const [restockDate, setRestockDate] = useState<string>("");
  const [restockUnitCost, setRestockUnitCost] = useState<string>("");
  const [restockNote, setRestockNote] = useState<string>("");
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  const [movements, setMovements] = useState<any[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("ALL");

  const [csvContent, setCsvContent] = useState("");
  const [csvImportResult, setCsvImportResult] = useState<any | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/inventory/overview");
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview || null);
      }
    } catch {
    }
  }, []);

  const loadInventoryItems = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (stockStatusFilter !== "ALL") params.set("stockStatus", stockStatusFilter);
      if (productStatusFilter !== "ALL") params.set("productStatus", productStatusFilter);
      if (variantFilter !== "ALL") params.set("hasVariants", variantFilter);
      if (sortBy) params.set("sort", sortBy);
      params.set("page", String(currentPage));
      params.set("limit", "25");

      const res = await fetch(`/api/seller/inventory/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setActionError("Failed to fetch inventory catalog.");
      }
      setLastSynced(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      setActionError("Network error querying inventory items.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, categoryFilter, stockStatusFilter, productStatusFilter, variantFilter, sortBy, currentPage]);

  const loadRestockRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/inventory/restock");
      if (res.ok) {
        const data = await res.json();
        setRestockRecords(data.restockRecords || []);
      }
    } catch {
    }
  }, []);

  const loadMovements = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (movementTypeFilter !== "ALL") params.set("type", movementTypeFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/seller/inventory/movements?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
        setMovementsTotal(data.total || 0);
      }
    } catch {
    }
  }, [movementTypeFilter]);

  useEffect(() => {
    loadOverview();
    loadInventoryItems();
  }, [loadOverview, loadInventoryItems]);

  useEffect(() => {
    if (activeTab === "restock") loadRestockRecords();
    if (activeTab === "movements") loadMovements();
  }, [activeTab, loadRestockRecords, loadMovements]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadOverview(), loadInventoryItems(), loadRestockRecords(), loadMovements()]);
    setActionSuccess("Inventory database records successfully synchronized.");
  };

  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentTarget) return;

    setIsSubmittingAdjust(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/seller/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustmentTarget.productId,
          variantId: adjustmentTarget.variantId || null,
          adjustmentType: adjustType,
          quantity: adjustQuantity,
          reason: adjustReason,
          note: adjustNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(`Stock updated for ${adjustmentTarget.sku}. New stock: ${data.updatedStock} units.`);
        setAdjustmentTarget(null);
        await Promise.all([loadOverview(), loadInventoryItems(), loadMovements()]);
      } else {
        setActionError(data.error || "Failed to update stock quantity.");
      }
    } catch {
      setActionError("Network error while submitting stock adjustment.");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleCreateRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTargetItem) return;

    setIsSubmittingRestock(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/seller/inventory/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: restockTargetItem.productId,
          variantId: restockTargetItem.variantId || null,
          quantityExpected: restockExpectedQty,
          supplierName: restockSupplier,
          expectedDeliveryDate: restockDate || undefined,
          unitCost: restockUnitCost ? parseFloat(restockUnitCost) : undefined,
          note: restockNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(`Inbound restock consignment scheduled for ${restockTargetItem.sku} (${restockExpectedQty} units).`);
        setIsCreateRestockModalOpen(false);
        setRestockTargetItem(null);
        await Promise.all([loadOverview(), loadRestockRecords()]);
      } else {
        setActionError(data.error || "Failed to schedule restock consignment.");
      }
    } catch {
      setActionError("Network error creating restock record.");
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  const handleReceiveRestock = async (recordId: string, expectedQty: number) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/seller/inventory/restock/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECEIVE", receivedQuantity: expectedQty }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess("Inbound parcel marked as received. Stock incremented.");
        await Promise.all([loadOverview(), loadInventoryItems(), loadRestockRecords(), loadMovements()]);
      } else {
        setActionError(data.error || "Failed to receive shipment.");
      }
    } catch {
      setActionError("Network error updating restock shipment.");
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExecuteBulkAdjust = async () => {
    if (selectedIds.size === 0) return;
    setActionError(null);
    setActionSuccess(null);

    const targetItems = items.filter((i) => selectedIds.has(i.id)).map((i) => ({
      productId: i.productId,
      variantId: i.variantId || null,
      quantity: bulkAdjustmentValue,
      adjustmentType: bulkAdjustmentType,
      reason: "Bulk inventory batch update",
    }));

    try {
      const res = await fetch("/api/seller/inventory/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: targetItems }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(`Bulk inventory updated for ${data.updatedCount} items.`);
        setIsBulkAdjustModalOpen(false);
        setSelectedIds(new Set());
        await Promise.all([loadOverview(), loadInventoryItems(), loadMovements()]);
      } else {
        setActionError(data.error || "Failed to execute bulk adjustment.");
      }
    } catch {
      setActionError("Network error during bulk inventory adjustment.");
    }
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) {
      setActionError("Please paste or upload CSV content.");
      return;
    }
    setIsImportingCsv(true);
    setActionError(null);
    try {
      const res = await fetch("/api/seller/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent }),
      });
      const data = await res.json();
      setCsvImportResult(data);
      if (data.successfulRows > 0) {
        setActionSuccess(`CSV import applied: ${data.successfulRows} SKUs updated.`);
        await Promise.all([loadOverview(), loadInventoryItems(), loadMovements()]);
      }
    } catch {
      setActionError("Network error parsing CSV import.");
    } finally {
      setIsImportingCsv(false);
    }
  };

  const adjustmentPreview = useMemo(() => {
    if (!adjustmentTarget) return { prev: 0, next: 0, delta: 0 };
    const prev = adjustmentTarget.currentStock;
    const qty = Math.abs(adjustQuantity);
    let delta = 0;
    if (adjustType === "ADD" || adjustType === "RECEIVE") delta = qty;
    if (adjustType === "REDUCE" || adjustType === "DAMAGED" || adjustType === "LOST") delta = -qty;
    if (adjustType === "SET_EXACT" || adjustType === "CORRECTION") delta = qty - prev;
    return { prev, next: prev + delta, delta };
  }, [adjustmentTarget, adjustType, adjustQuantity]);

  const renderStatusBadge = (status: InventoryStockStatus) => {
    switch (status) {
      case "IN_STOCK":
        return <Badge variant="success">In Stock</Badge>;
      case "LOW_STOCK":
        return <Badge variant="warning">Low Stock</Badge>;
      case "OUT_OF_STOCK":
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 text-rose-800">Out of Stock</span>;
      case "UNPUBLISHED":
        return <Badge variant="neutral">Unpublished</Badge>;
      case "PENDING_APPROVAL":
        return <Badge variant="neutral">Pending Review</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-8 font-sans text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-800 tracking-wider">
              Inventory Management
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Real-Time Stock Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1.5 font-sans">
            Artisan Stock Control &amp; Planning
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Real-time multi-variant inventory control, automated order deductions, low-stock threshold triggers, and inbound restock planning.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-slate-700 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-slate-900" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Sync Stock"}</span>
          </Button>

          <Link href="/seller/products/new">
            <Button size="sm" className="bg-slate-950 hover:bg-slate-800 text-white flex items-center gap-1.5 text-xs shadow-xs font-semibold">
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Piece</span>
            </Button>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 font-sans">
        <button
          type="button"
          onClick={() => {
            setStockStatusFilter("ALL");
            setVariantFilter("ALL");
            setActiveTab("catalog");
          }}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 text-left transition-all shadow-2xs space-y-1.5 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <span>Total Pieces</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-950 tracking-tight">{overview?.totalProducts || 0}</p>
          <span className="text-xs text-slate-500 block">Catalog master items</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setVariantFilter("YES");
            setActiveTab("catalog");
          }}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 text-left transition-all shadow-2xs space-y-1.5 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <span>Total SKUs</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-950 tracking-tight">{overview?.totalSkus || 0}</p>
          <span className="text-xs text-slate-500 block">Sellable Variants</span>
        </button>

        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Available Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-950 tracking-tight">{overview?.totalAvailableStock || 0} units</p>
          <span className="text-xs text-emerald-700 block font-medium">Ready on storefront</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <span>Reserved Stock</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{overview?.reservedStock || 0} units</p>
          <span className="text-xs text-slate-500 block">In open customer orders</span>
        </div>

        <button
          type="button"
          onClick={() => {
            setStockStatusFilter("LOW_STOCK");
            setActiveTab("catalog");
          }}
          className={`p-4 rounded-2xl border text-left transition-all shadow-2xs space-y-1.5 cursor-pointer ${
            stockStatusFilter === "LOW_STOCK" ? "bg-amber-100 border-amber-400" : "bg-amber-50/70 border-amber-200 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span>Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-950 tracking-tight">{overview?.lowStockCount || 0}</p>
          <span className="text-xs text-amber-700 block font-medium">At or below alert limit</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStockStatusFilter("OUT_OF_STOCK");
            setActiveTab("catalog");
          }}
          className={`p-4 rounded-2xl border text-left transition-all shadow-2xs space-y-1.5 cursor-pointer ${
            stockStatusFilter === "OUT_OF_STOCK" ? "bg-rose-100 border-rose-400" : "bg-rose-50/70 border-rose-200 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase tracking-wider">
            <span>Out of Stock</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-950 tracking-tight">{overview?.outOfStockCount || 0}</p>
          <span className="text-xs text-rose-700 block font-medium">Replenishment needed</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("restock")}
          className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-left transition-all shadow-2xs space-y-1.5 cursor-pointer"
        >
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider">
            <span>Incoming Stock</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-blue-950 tracking-tight">+{overview?.incomingStock || 0} units</p>
          <span className="text-xs text-blue-700 block font-medium">From restock shipments</span>
        </button>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <span>Retail Value</span>
            <IndianRupee className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
            {formatCurrency(overview?.inventoryValueAtSellingPrice || 0)}
          </p>
          <span className="text-xs text-slate-500 block">At catalog listing price</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <span>Cost Value</span>
            <IndianRupee className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(overview?.inventoryValueAtCost || 0)}
          </p>
          <span className="text-xs text-slate-500 block">Wholesale artisan base</span>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("movements")}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 text-left transition-all shadow-2xs space-y-1.5 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <span>Adjustments (30D)</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-950 tracking-tight">{overview?.adjustmentsThisMonth || 0}</p>
          <span className="text-xs text-slate-500 block">Audited stock movements</span>
        </button>
      </div>

      <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          {[
            { id: "catalog", label: `Stock Catalog (${totalCount})`, icon: Boxes },
            { id: "restock", label: `Restock Planning (${overview?.incomingStock || 0} Inbound)`, icon: Truck },
            { id: "movements", label: "Stock Movement Audit", icon: History },
            { id: "reports", label: "Inventory Reports", icon: FileSpreadsheet },
            { id: "csv", label: "Bulk CSV Import / Export", icon: Upload },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-slate-900 text-slate-950 font-bold bg-slate-50/80 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <Link href="/api/seller/inventory/export?type=CURRENT_STOCK" target="_blank">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs text-slate-700 shrink-0 mb-2">
            <Download className="w-3.5 h-3.5" />
            <span>Export Stock CSV</span>
          </Button>
        </Link>
      </div>

      {activeTab === "catalog" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search pieces, SKU, category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => {
                    setStockStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="IN_STOCK">In Stock (Healthy)</option>
                  <option value="LOW_STOCK">Low Stock (Alert)</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="UNPUBLISHED">Unpublished</option>
                  <option value="PENDING_APPROVAL">Pending Review</option>
                </select>
              </div>

              <div>
                <select
                  value={variantFilter}
                  onChange={(e) => {
                    setVariantFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="ALL">All Piece Types</option>
                  <option value="YES">Variants Only (Size/Color)</option>
                  <option value="NO">Master Pieces Only</option>
                </select>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="updated_desc">Recently Updated</option>
                  <option value="stock_asc">Stock: Lowest First</option>
                  <option value="stock_desc">Stock: Highest First</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="title_asc">Title: A to Z</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("ALL");
                    setStockStatusFilter("ALL");
                    setVariantFilter("ALL");
                    setProductStatusFilter("ALL");
                    setSortBy("updated_desc");
                    setCurrentPage(1);
                  }}
                  className="w-full py-1.5 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors font-medium text-center"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 text-white text-xs animate-in fade-in">
                <span className="font-mono">
                  {selectedIds.size} {selectedIds.size === 1 ? "item" : "items"} selected for bulk action
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsBulkAdjustModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1 px-3"
                  >
                    Bulk Stock Adjustment
                  </Button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-slate-400 hover:text-white font-bold px-2"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selectedIds.size === items.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0"
                      />
                    </th>
                    <th className="py-3 px-3">Piece / SKU</th>
                    <th className="py-3 px-3">Variant</th>
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-3 text-center">Physical Stock</th>
                    <th className="py-3 px-3 text-center">Reserved</th>
                    <th className="py-3 px-3 text-center">Available Stock</th>
                    <th className="py-3 px-3 text-center">Threshold</th>
                    <th className="py-3 px-3 text-center">Stock Status</th>
                    <th className="py-3 px-3 text-center">Velocity (30D)</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${isSelected ? "bg-slate-50/80" : ""}`}>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectItem(item.id)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-0"
                          />
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <ImageWithFallback
                                src={item.imageUrl}
                                alt={item.productTitle}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="truncate">
                              <Link
                                href={`/seller/products/${item.productId}`}
                                className="font-semibold text-slate-900 hover:text-slate-600 block truncate"
                              >
                                {item.productTitle}
                              </Link>
                              <span className="font-mono text-[10px] text-slate-400 block">{item.sku}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{item.categoryName}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 block w-fit">
                            {item.variantLabel}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-950">
                          {formatCurrency(item.sellingPrice)}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-950">
                          {item.currentStock}
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                          {item.reservedStock > 0 ? (
                            <span className="text-amber-700 font-bold">{item.reservedStock}</span>
                          ) : (
                            "0"
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs ${
                              item.availableStock <= 0
                                ? "bg-rose-100 text-rose-800"
                                : item.availableStock <= item.lowStockThreshold
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.availableStock} units
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {item.lowStockThreshold}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {renderStatusBadge(item.stockStatus)}
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                          {item.salesVelocity30D > 0 ? (
                            <div>
                              <span>{item.salesVelocity30D} / day</span>
                              <span className="text-[10px] text-slate-400 block">
                                ~{item.daysOfStockRemaining} days left
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Low velocity</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAdjustmentTarget(item);
                                setAdjustType("ADD");
                                setAdjustQuantity(5);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-800"
                            >
                              Adjust Stock
                            </Button>

                            <button
                              type="button"
                              onClick={() => {
                                setRestockTargetItem(item);
                                setIsCreateRestockModalOpen(true);
                              }}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                              title="Plan Restock Shipment"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {items.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-xs text-slate-500 font-mono">
                        No inventory records match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50/50 text-xs">
                <span className="text-slate-500 font-mono">
                  Showing {(currentPage - 1) * 25 + 1} to {Math.min(currentPage * 25, totalCount)} of {totalCount} items
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 font-mono text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "restock" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Inbound Restock & Replenishment Pipeline</h2>
              <p className="text-xs text-slate-500">
                Track pending atelier workshop shipments. Incoming stock becomes available only after physical verification.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setRestockTargetItem(items[0] || null);
                setIsCreateRestockModalOpen(true);
              }}
              className="bg-slate-900 text-white hover:bg-slate-800 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Inbound Restock</span>
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">Artisan Piece / SKU</th>
                    <th className="py-3 px-4">Workshop Supplier</th>
                    <th className="py-3 px-4 text-center">Expected Qty</th>
                    <th className="py-3 px-4 text-center">Received Qty</th>
                    <th className="py-3 px-4 text-center">Delivery ETA</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {restockRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <span>{r.productTitle}</span>
                        <span className="font-mono text-[10px] text-slate-400 block">{r.sku} • {r.variantLabel}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{r.supplierName || "Atelier Guild"}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{r.quantityExpected}</td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-700 font-bold">{r.quantityReceived}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {r.expectedDeliveryDate ? new Date(r.expectedDeliveryDate).toLocaleDateString("en-IN") : "Flexible"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            r.status === "RECEIVED" ? "success" : r.status === "CANCELLED" ? "accent" : "warning"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleReceiveRestock(r.id, r.quantityExpected)}
                              className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] px-2.5 py-1"
                            >
                              Mark Received
                            </Button>
                          </div>
                        )}
                        {r.status === "RECEIVED" && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Received {r.receivedAt ? new Date(r.receivedAt).toLocaleDateString("en-IN") : ""}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {restockRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-mono">
                        No inbound restock consignments scheduled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "movements" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Immutable Stock Movement Audit Log</h2>
              <p className="text-xs text-slate-500">
                Database-backed history of all inventory deductions, cancellations, returns, and manual adjustments.
              </p>
            </div>
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="py-1.5 px-3 text-xs border border-slate-200 rounded-lg bg-white font-mono text-slate-700"
            >
              <option value="ALL">All Movement Types</option>
              <option value="ORDER_DEDUCTION">Order Deductions</option>
              <option value="ORDER_CANCELLATION_RESTORE">Cancellation Restorations</option>
              <option value="RETURN_RESTORE">Return Inspection Restores</option>
              <option value="STOCK_RECEIVED">Stock Received (Inbound)</option>
              <option value="MANUAL_ADJUSTMENT">Manual Adjustments</option>
              <option value="DAMAGED">Damaged Goods</option>
              <option value="LOST">Lost Stock</option>
              <option value="CORRECTION">Discrepancy Corrections</option>
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Piece Description</th>
                    <th className="py-3 px-4">SKU / Variant</th>
                    <th className="py-3 px-4 text-center">Movement Type</th>
                    <th className="py-3 px-4 text-center">Quantity Delta</th>
                    <th className="py-3 px-4 text-center">Before → After</th>
                    <th className="py-3 px-4">Reference & Reason</th>
                    <th className="py-3 px-4">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">{m.productTitle}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{m.sku}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 font-bold">
                          {m.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={m.quantityDelta > 0 ? "text-emerald-700" : "text-rose-700"}>
                          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {m.previousStock} → <span className="font-bold text-slate-950">{m.updatedStock}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-mono text-[10px] text-slate-400 block">{m.referenceId || "DIRECT"}</span>
                        <span>{m.reason}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{m.performedBy}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-xs text-slate-400 font-mono">
                        No stock movement records found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Statutory Inventory Reports & CA Exports</h2>
            <p className="text-xs text-slate-500">
              Download certified inventory valuation, stock reconciliations, and write-off ledgers formatted for statutory taxation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Current Stock Reconciliation</h3>
              <p className="text-xs text-slate-500">
                Complete inventory catalog snapshot including reserved and available units per variant.
              </p>
              <Link href="/api/seller/inventory/export?type=CURRENT_STOCK" target="_blank" className="block pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs flex items-center justify-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </Button>
              </Link>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Low Stock & Reorder Alert List</h3>
              <p className="text-xs text-slate-500">
                Prioritized reorder recommendations based on lead times and 30-day sales velocity.
              </p>
              <Link href="/api/seller/inventory/export?type=LOW_STOCK" target="_blank" className="block pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs flex items-center justify-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </Button>
              </Link>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                <IndianRupee className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Balance Sheet Valuation (Cost & Retail)</h3>
              <p className="text-xs text-slate-500">
                Statutory inventory valuation comparison showing gross retail MRP vs artisan cost price.
              </p>
              <Link href="/api/seller/inventory/export?type=VALUATION" target="_blank" className="block pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs flex items-center justify-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </Button>
              </Link>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-800 flex items-center justify-center font-bold">
                <History className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Stock Movements Audit Ledger</h3>
              <p className="text-xs text-slate-500">
                Auditable transaction log of all historical inventory adjustments, deductions, and restorations.
              </p>
              <Link href="/api/seller/inventory/export?type=MOVEMENTS" target="_blank" className="block pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs flex items-center justify-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === "csv" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Bulk Inventory Spreadsheet Operations</h2>
              <p className="text-xs text-slate-500">
                Import stock updates via CSV with automatic SKU validation, duplicate detection, and delta audit logs.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const sampleCsv = `sku,quantity,mode\n${items.slice(0, 3).map((i) => `${i.sku},${i.currentStock},set`).join("\n")}`;
                const blob = new Blob([sampleCsv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "nexu-inventory-template.csv";
                a.click();
              }}
              className="text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Pre-filled Template (.CSV)</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4 shadow-2xs">
              <h3 className="font-bold text-sm text-slate-900">Paste or Upload Inventory CSV</h3>
              <p className="text-xs text-slate-500">
                Format required: <code>sku,quantity,mode</code> (where mode is either <code>set</code> or <code>adjust</code>).
              </p>

              <textarea
                rows={8}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={`sku,quantity,mode\n${items[0]?.sku || "SKU-SAMPLE-1"},25,set\n${items[1]?.sku || "SKU-SAMPLE-2"},5,adjust`}
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {csvContent.split("\n").filter((l) => l.trim().length > 0).length} lines detected
                </span>
                <Button
                  size="sm"
                  onClick={handleImportCsv}
                  disabled={isImportingCsv || !csvContent.trim()}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isImportingCsv ? "Validating & Applying..." : "Validate & Apply Updates"}</span>
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4 shadow-2xs">
              <h3 className="font-bold text-sm text-slate-900">Import Validation & Audit Summary</h3>
              {csvImportResult ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-mono block">Total Rows</span>
                      <span className="font-bold text-slate-950 font-mono text-base">{csvImportResult.totalRows}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-mono block">Updated</span>
                      <span className="font-bold text-emerald-900 font-mono text-base">{csvImportResult.successfulRows}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                      <span className="text-[10px] text-rose-700 font-mono block">Failed</span>
                      <span className="font-bold text-rose-900 font-mono text-base">{csvImportResult.failedRows}</span>
                    </div>
                  </div>

                  {csvImportResult.errors?.length > 0 && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1 text-rose-800 text-xs font-mono max-h-40 overflow-y-auto">
                      <span className="font-bold block">Validation Errors:</span>
                      {csvImportResult.errors.map((err: any, idx: number) => (
                        <p key={idx}>Row {err.row}: {err.error}</p>
                      ))}
                    </div>
                  )}

                  {csvImportResult.appliedChanges?.length > 0 && (
                    <div className="space-y-1 font-mono text-[11px] text-slate-600 max-h-40 overflow-y-auto">
                      <span className="font-bold block text-slate-900">Applied Modifications:</span>
                      {csvImportResult.appliedChanges.map((c: any, idx: number) => (
                        <p key={idx}>✓ {c.sku}: {c.previousStock} → {c.updatedStock} units</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 font-mono">
                  No CSV import executed in this session. Paste your spreadsheet rows to test validation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {adjustmentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Adjust Stock Quantity</h3>
                <p className="text-xs text-slate-500 font-mono">SKU: {adjustmentTarget.sku} • {adjustmentTarget.variantLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustmentTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Adjustment Operation Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white font-medium"
                >
                  <option value="ADD">Add Stock (+) — Workshop Restock / Finished Goods</option>
                  <option value="REDUCE">Reduce Stock (-) — Off-Marketplace Sale / Allocation</option>
                  <option value="SET_EXACT">Set Exact Stock (=) — Physical Inventory Count</option>
                  <option value="RECEIVE">Receive Inbound Goods (+) — Verified Consignment</option>
                  <option value="DAMAGED">Record Damaged Goods (-) — Write-off Unsellable Piece</option>
                  <option value="LOST">Record Lost Goods (-) — Inventory Discrepancy</option>
                  <option value="CORRECTION">Discrepancy Correction (=) — Audit Correction</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {adjustType === "SET_EXACT" || adjustType === "CORRECTION" ? "New Exact Stock Count" : "Quantity to Adjust"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  required
                  className="w-full p-2.5 font-mono border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Previous Stock:</span>
                  <span className="text-sm font-bold text-slate-700">{adjustmentPreview.prev} units</span>
                </div>
                <div className="text-center font-bold text-slate-400">→</div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Adjustment Delta:</span>
                  <span className={`text-sm font-bold ${adjustmentPreview.delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {adjustmentPreview.delta >= 0 ? `+${adjustmentPreview.delta}` : adjustmentPreview.delta}
                  </span>
                </div>
                <div className="text-center font-bold text-slate-400">→</div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Updated Available:</span>
                  <span className={`text-sm font-black ${adjustmentPreview.next < 0 ? "text-rose-600" : "text-slate-950"}`}>
                    {adjustmentPreview.next} units
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mandatory Business Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Completed loom batch, quality inspection defect..."
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Optional Internal Note</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Box #14, verified by Master Weaver"
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setAdjustmentTarget(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={isSubmittingAdjust || adjustmentPreview.next < 0}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isSubmittingAdjust ? "Applying..." : "Confirm & Save Stock"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateRestockModalOpen && restockTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Schedule Inbound Restock</h3>
                <p className="text-xs text-slate-500 font-mono">Piece: {restockTargetItem.productTitle} ({restockTargetItem.sku})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateRestockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRestock} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Expected Restock Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={restockExpectedQty}
                  onChange={(e) => setRestockExpectedQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  required
                  className="w-full p-2.5 font-mono border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Atelier / Workshop Supplier Name</label>
                <input
                  type="text"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  placeholder="e.g. Maheshwar Weaving Collective"
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={restockDate}
                    onChange={(e) => setRestockDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estimated Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={restockUnitCost}
                    onChange={(e) => setRestockUnitCost(e.target.value)}
                    placeholder="e.g. 2400"
                    className="w-full p-2.5 font-mono border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Restock Notes / Batch ID</label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="e.g. Batch #HW-2026-Q4 Silk Yarn"
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateRestockModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={isSubmittingRestock}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isSubmittingRestock ? "Scheduling..." : "Confirm & Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Bulk Stock Adjustment</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedIds.size} items selected</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bulk Action</label>
                <select
                  value={bulkAdjustmentType}
                  onChange={(e) => setBulkAdjustmentType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="SET_EXACT">Set Exact Stock Count for All Selected</option>
                  <option value="ADD">Add Quantity to All Selected (+)</option>
                  <option value="REDUCE">Reduce Quantity from All Selected (-)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Stock Value</label>
                <input
                  type="number"
                  min={0}
                  value={bulkAdjustmentValue}
                  onChange={(e) => setBulkAdjustmentValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full p-2.5 font-mono border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setIsBulkAdjustModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleExecuteBulkAdjust} className="bg-slate-900 text-white hover:bg-slate-800">
                  Apply to {selectedIds.size} Items
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

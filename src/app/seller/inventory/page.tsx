"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Minus,
  Save,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Product } from "@/types/marketplace";
import { InventoryBatchUpdateItem, CsvImportResult } from "@/types/seller";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

interface InventoryRow {
  productId: string;
  variantId?: string;
  variantSku?: string;
  productTitle: string;
  variantLabel: string;
  imageUrl: string;
  currentStock: number;
  editedStock: number;
  lowStockThreshold: number;
}

export default function SellerInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvInput, setCsvInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/seller/products?limit=100");
      if (res.ok) {
        const data = await res.json();
        const prods: Product[] = data.products || [];
        setProducts(prods);

        // Flatten products and variants into inventory rows
        const rows: InventoryRow[] = [];
        prods.forEach((p) => {
          const hasColors = p.availableColors && p.availableColors.length > 0;
          const hasSizes = p.availableSizes && p.availableSizes.length > 0;

          if (!hasColors && !hasSizes) {
            rows.push({
              productId: p.id,
              productTitle: p.title,
              variantLabel: "Standard Master Piece",
              imageUrl: p.images?.[0] || "",
              currentStock: p.stock,
              editedStock: p.stock,
              lowStockThreshold: 5,
            });
          } else {
            // Include color variants
            if (hasColors && p.availableColors) {
              p.availableColors.forEach((c, idx) => {
                rows.push({
                  productId: p.id,
                  variantSku: `SKU-${p.id.slice(-4)}-CLR-${idx + 1}`,
                  productTitle: p.title,
                  variantLabel: `Color: ${c.name}`,
                  imageUrl: p.images?.[0] || "",
                  currentStock: p.stock,
                  editedStock: p.stock,
                  lowStockThreshold: 5,
                });
              });
            }
            // Include size variants
            if (hasSizes && p.availableSizes) {
              p.availableSizes.forEach((s) => {
                rows.push({
                  productId: p.id,
                  variantSku: `SKU-${p.id.slice(-4)}-${s}`,
                  productTitle: p.title,
                  variantLabel: `Size: ${s}`,
                  imageUrl: p.images?.[0] || "",
                  currentStock: p.stock,
                  editedStock: p.stock,
                  lowStockThreshold: 5,
                });
              });
            }
          }
        });

        setInventoryRows(rows);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load studio inventory.");
      }
    } catch {
      setActionError("Network error while connecting to inventory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockChange = (index: number, newStock: number) => {
    const updated = [...inventoryRows];
    updated[index].editedStock = Math.max(0, newStock);
    setInventoryRows(updated);
  };

  const handleAdjustStep = (index: number, delta: number) => {
    const updated = [...inventoryRows];
    updated[index].editedStock = Math.max(0, updated[index].editedStock + delta);
    setInventoryRows(updated);
  };

  const pendingChangesCount = inventoryRows.filter(
    (r) => r.editedStock !== r.currentStock
  ).length;

  const handleSaveBatch = async () => {
    const changed = inventoryRows.filter((r) => r.editedStock !== r.currentStock);
    if (changed.length === 0) return;

    setIsSavingBatch(true);
    setActionError(null);
    setActionSuccess(null);

    const items: InventoryBatchUpdateItem[] = changed.map((r) => ({
      productId: r.productId,
      variantSku: r.variantSku,
      newStock: r.editedStock,
    }));

    try {
      const res = await fetch("/api/seller/inventory/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Successfully updated stock for ${changed.length} inventory lines.`);
        fetchInventory();
      } else {
        setActionError(data.error || "Failed to batch update inventory.");
      }
    } catch {
      setActionError("Network error while saving inventory changes.");
    } finally {
      setIsSavingBatch(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ["sku", "title", "variant", "stock", "lowStockThreshold"];
    const rows = inventoryRows.map((r) => [
      `"${r.variantSku || r.productId}"`,
      `"${r.productTitle.replace(/"/g, '""')}"`,
      `"${r.variantLabel.replace(/"/g, '""')}"`,
      r.currentStock,
      r.lowStockThreshold,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `atelier-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import execution
  const handleImportCsv = async () => {
    if (!csvInput.trim()) {
      setImportError("Please enter or paste valid CSV content.");
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await fetch("/api/seller/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: csvInput }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult(data.result);
        fetchInventory();
      } else {
        setImportError(data.error || "Failed to process CSV import.");
      }
    } catch {
      setImportError("Network error while importing inventory CSV.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const sample = `sku,stock,lowStockThreshold
SLS-INDIGO-S,15,5
SLS-INDIGO-M,25,5
SLS-INDIGO-L,10,5`;
    setCsvInput(sample);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Atelier Logistics
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Real-Time Inventory Ledger
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Maintain accurate SKU balances, execute atomic stock updates, or import batch counts via CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventory}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={inventoryRows.length === 0}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCsvModalOpen(true);
              setImportResult(null);
              setImportError(null);
            }}
            className="flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </Button>

          {pendingChangesCount > 0 && (
            <Button
              size="sm"
              onClick={handleSaveBatch}
              disabled={isSavingBatch}
              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium flex items-center gap-1.5 animate-pulse"
            >
              <Save className="w-3.5 h-3.5" />
              Save {pendingChangesCount} Changes
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Inventory Table */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading atelier inventory balances...</p>
        </div>
      ) : inventoryRows.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-800/50 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">No inventory lines found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              You haven&apos;t added any products or variants yet. Publish a piece to begin managing inventory.
            </p>
          </div>
          <Link href="/seller/products/new">
            <Button size="sm" className="mt-2 bg-zinc-100 text-zinc-900 hover:bg-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Publish First Piece
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">Item & Variant</th>
                  <th className="py-3 px-4">SKU / Identifier</th>
                  <th className="py-3 px-4">Current Balance</th>
                  <th className="py-3 px-4">Adjust Units</th>
                  <th className="py-3 px-4">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {inventoryRows.map((r, idx) => {
                  const isModified = r.editedStock !== r.currentStock;
                  const isOut = r.editedStock === 0;
                  const isLow = r.editedStock > 0 && r.editedStock <= r.lowStockThreshold;

                  return (
                    <tr
                      key={`${r.productId}-${r.variantSku || idx}`}
                      className={`hover:bg-zinc-900/30 transition-colors ${
                        isModified ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-zinc-900 rounded overflow-hidden relative shrink-0 border border-zinc-800">
                            <ImageWithFallback
                              src={r.imageUrl}
                              alt={r.productTitle}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-medium text-zinc-200 block">
                              {r.productTitle}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {r.variantLabel}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                        {r.variantSku || (
                          <span className="text-zinc-600 italic">Master Base Item</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="text-zinc-300 font-medium">
                          {r.currentStock} units
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustStep(idx, -1)}
                            disabled={r.editedStock <= 0}
                            className="p-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            min={0}
                            value={r.editedStock}
                            onChange={(e) => handleStockChange(idx, Number(e.target.value))}
                            className={`w-16 px-2 py-1 text-center font-mono text-xs rounded border transition-colors ${
                              isModified
                                ? "bg-amber-950/40 border-amber-500/50 text-amber-200 font-semibold"
                                : "bg-zinc-900 border-zinc-800 text-zinc-200"
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() => handleAdjustStep(idx, 1)}
                            className="p-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isOut ? (
                          <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[10px]">
                            Depleted
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="warning" className="text-[10px]">
                            Low Stock (≤{r.lowStockThreshold})
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Optimal Balance
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Import Atelier Inventory (CSV)
                </h3>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Paste standard CSV rows with columns <code className="text-zinc-200 font-mono">sku,stock,lowStockThreshold</code>.
              Existing variants matching the SKU will be updated atomically.
            </p>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono"
              >
                Load Sample Template into Box
              </button>
            </div>

            <textarea
              rows={8}
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder={`sku,stock,lowStockThreshold\nSLS-INDIGO-S,15,5\nSLS-INDIGO-M,25,5\nSLS-INDIGO-L,10,5`}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />

            {importError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importResult && (
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Total Rows: {importResult.totalRows}</span>
                  <span className="text-emerald-400">Applied: {importResult.successfulRows}</span>
                  <span className="text-rose-400">Failed: {importResult.failedRows}</span>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto pt-2 border-t border-zinc-800">
                    <span className="text-[10px] font-mono uppercase text-rose-400">Errors:</span>
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-[11px] text-rose-300 font-mono">
                        Row {err.row} {err.sku ? `(${err.sku})` : ""}: {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCsvModalOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleImportCsv}
                disabled={isImporting}
                className="bg-zinc-100 text-zinc-900 hover:bg-white flex items-center gap-1.5"
              >
                {isImporting ? (
                  <span>Processing CSV...</span>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Apply Inventory CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

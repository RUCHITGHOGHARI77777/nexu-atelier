"use client";

import React, { useState, useEffect } from "react";
import {
  TicketPercent,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  Tag,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { CouponView, CouponInput } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<number>(1000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(1000);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(500);
  const [perCustomerLimit, setPerCustomerLimit] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load coupons.");
      }
    } catch {
      setActionError("Network error while connecting to coupon service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (coupon: CouponView) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Coupon ${coupon.code} ${!coupon.isActive ? "activated" : "deactivated"}.`);
        fetchCoupons();
      } else {
        setActionError(data.error || "Failed to toggle coupon status.");
      }
    } catch {
      setActionError("Network error while updating coupon.");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setActionError("Coupon code is required.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    const payload: CouponInput = {
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      perCustomerLimit: Number(perCustomerLimit),
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Coupon "${payload.code}" created successfully.`);
        setIsModalOpen(false);
        setCode("");
        setDescription("");
        fetchCoupons();
      } else {
        setActionError(data.error || "Failed to create coupon.");
      }
    } catch {
      setActionError("Network error while saving coupon rule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Promotional Engine
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Coupons & Promotional Rules
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create, configure, and monitor platform promotional voucher codes with automated spend thresholds and limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCoupons}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-100 text-zinc-900 hover:bg-white flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Coupon Code
          </Button>
        </div>
      </div>

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

      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center text-xs text-zinc-500">
          No promotional coupons created yet.
        </div>
      ) : (
        <div className="border border-zinc-800 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount Benefit</th>
                  <th className="py-3 px-4">Minimum Spend</th>
                  <th className="py-3 px-4">Usage Performance</th>
                  <th className="py-3 px-4">Funding Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        <div>
                          <span className="font-mono font-semibold text-zinc-200 block text-xs">
                            {c.code}
                          </span>
                          {c.description && (
                            <span className="text-[10px] text-zinc-500 block truncate max-w-xs">
                              {c.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-400 font-medium">
                        {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `Flat ${formatCurrency(c.discountValue)} OFF`}
                      </span>
                      {c.maxDiscount && (
                        <span className="text-[10px] text-zinc-500 block">
                          Cap: {formatCurrency(c.maxDiscount)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {formatCurrency(c.minOrderValue)}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs">
                      <span className="text-zinc-200">{c.timesUsed}</span>
                      <span className="text-zinc-500"> / {c.usageLimit ? c.usageLimit : "∞"} redeemed</span>
                      <span className="text-[10px] text-zinc-500 block">
                        ({c.perCustomerLimit} per customer)
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant="neutral" className="text-[10px] font-mono">
                        {c.fundedBy}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      {c.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-zinc-500 border-zinc-700">Disabled</Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`text-xs font-mono transition-colors ${
                          c.isActive ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCoupon}
            className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Create Promotional Coupon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Voucher Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. LUXURY20"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-500 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed INR Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  Editorial Description / Terms
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Festive seasonal privilege: 20% off curated heritage attire"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    {discountType === "PERCENTAGE" ? "Value (%)" : "Value (₹)"} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={discountType === "PERCENTAGE" ? 90 : 100000}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Min Spend (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxDiscount || ""}
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Global Redemption Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit || ""}
                    onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Limit Per Customer
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={perCustomerLimit}
                    onChange={(e) => setPerCustomerLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-zinc-100 text-zinc-900 hover:bg-white"
              >
                {isSubmitting ? "Creating..." : "Save Coupon Rule"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

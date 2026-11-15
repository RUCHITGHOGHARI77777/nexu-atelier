"use client";

import React from "react";
import { X, Printer, Package, QrCode, CheckCircle2, Building2, MapPin, Phone, Sparkles } from "lucide-react";
import { StoreOrder, useStore } from "@/context/StoreContext";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

interface BrandedPackagingSlipModalProps {
  order: StoreOrder | null;
  onClose: () => void;
}

export function BrandedPackagingSlipModal({ order, onClose }: BrandedPackagingSlipModalProps) {
  const { whiteLabelConfig } = useStore();

  if (!order) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const invoiceNo = `INV-2026-${order.id.replace(/[^0-9]/g, "").slice(-6) || "948210"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/90 ring-1 ring-slate-900/10 bg-white shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
              OFFICIAL PACKAGING SLIP & DISPATCH LABEL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Slip (Ctrl+P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="printable-packaging-slip-content space-y-6 p-4 border border-slate-300 rounded-2xl bg-white text-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-900">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                CONSIGNMENT DISPATCH SLIP & TAX INVOICE
              </span>
              <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">
                {whiteLabelConfig.brandName}
              </h2>
              <p className="text-xs text-slate-600 font-mono">
                GSTIN: <strong className="text-slate-900">{whiteLabelConfig.gstinNumber}</strong> • Pickup Hub: Rajasthan Handloom Cluster
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs">
              <span className="text-[10px] text-slate-500 block uppercase">Invoice No</span>
              <span className="font-bold text-slate-950 block">{invoiceNo}</span>
              <span className="text-[10px] text-slate-500 block uppercase mt-1">Order Ref</span>
              <span className="font-bold text-slate-950 block">{order.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                SHIP TO (CONSIGNEE)
              </span>
              <p className="font-bold text-slate-950 text-sm">
                {order.customerName}
              </p>
              <p className="text-slate-700 leading-relaxed">
                {order.shippingAddress?.street}
                {order.shippingAddress?.apartment ? `, ${order.shippingAddress.apartment}` : ""}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                <strong className="text-slate-900 font-mono font-bold">{order.shippingAddress?.pincode}</strong>
              </p>
              <p className="text-slate-700 font-mono pt-1">
                Ph: <strong className="text-slate-950">{order.customerPhone}</strong>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                DISPATCH DETAILS & PAYMENT
              </span>
              <p className="text-slate-700">
                Payment Mode: <strong className="text-emerald-700 font-bold">PREPAID (Direct UPI)</strong>
              </p>
              <p className="text-slate-700 font-mono text-[11px]">
                UTR: <strong>{order.paymentDetails?.utrNumber || "UPI/2026/894201"}</strong>
              </p>
              <p className="text-slate-700 text-[11px]">
                Platform Fee: <strong className="text-emerald-700 font-bold">₹0 (100% Free Platform)</strong>
              </p>
              <div className="pt-2 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white border border-slate-300 inline-block font-mono text-[9px] text-center font-bold">
                  [SCANNABLE AWB QR]
                  <div className="text-[8px] text-slate-400 mt-0.5">{order.awbNumber || "BD-89472910IN"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 font-mono text-[10px] uppercase text-slate-600 bg-slate-100">
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Rate</th>
                  <th className="py-2 px-3 text-right">GST (18%)</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-950 block">{item.product.title}</span>
                      <span className="text-[11px] text-slate-500 font-mono">Category: {item.product.category}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatCurrency(item.product.price)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {formatCurrency(Math.round((item.product.price * item.quantity * 18) / 118))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-950">
                      {formatCurrency(item.product.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2 border-t-2 border-slate-900">
            <div className="w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (CGST 9% + SGST 9%):</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping:</span>
                <span className="text-emerald-700 font-bold">{order.shippingFee === 0 ? "FREE" : formatCurrency(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-slate-950 font-black text-sm pt-1 border-t border-slate-300">
                <span>Total Amount:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-700">
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
              <span>Direct Studio Commission • <strong>Powered by Nexu Atelier</strong></span>
            </div>
            <span className="font-mono text-[10px] text-zinc-800 bg-zinc-200/80 px-2 py-0.5 rounded font-semibold">
              0% Platform Commission Tier
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500 font-mono">
            <span>Declaration: Authentic Handcrafted Goods Packed & Inspected by Seller</span>
            <span className="text-slate-800 font-bold">Authorized Signatory / Seal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

